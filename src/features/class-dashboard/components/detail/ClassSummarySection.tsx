import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import type { Class } from '@/shared/types';
import type { ClassDetailData } from '../../hooks/useClassDetailData';
import type { ClassProfile, ClassProfileItem } from '../../hooks/useClassProfile';
import { callAI } from '@/shared/services/ai';
import { SUB_CATEGORY_SCRIPTS } from '@/shared/data/subCategoryScripts';
import { DOMAIN_COLORS } from '@/shared/data/lpaProfiles';

// ============================================================
// AI 응답 타입
// ============================================================

interface ClassSummaryResponse {
  overall: string;
  keyPoint: string;
}

// ============================================================
// Props
// ============================================================

interface ClassSummarySectionProps {
  detailData: ClassDetailData;
  profile: ClassProfile | null;
  classData: Class;
  round: 1 | 2;
  isCompare?: boolean;
  prevProfile?: ClassProfile | null;
  prevDetailData?: ClassDetailData;
}

// ============================================================
// 프롬프트 빌더
// ============================================================

function buildUserMessage(
  classData: Class,
  detailData: ClassDetailData,
  round: 1 | 2,
): string {
  const { grade, classNumber } = classData;

  // 11개 중분류 평균
  const subCategories = detailData.domainData.flatMap((d) => d.subCategories);
  const middleCategoriesText = subCategories
    .map(
      (sc) =>
        `- ${sc.displayName}: T ${sc.avgTScore} (${sc.level})\n  ${sc.isPositive ? '[정적 요인 - 높을수록 좋음]' : '[부적 요인 - 낮을수록 좋음]'}`,
    )
    .join('\n');

  // 주요 소분류 점수 (T=50에서 가장 멀리 떨어진 순)
  const sortedFactors = [...detailData.factorAvgs].sort(
    (a, b) => Math.abs(b.avgTScore - 50) - Math.abs(a.avgTScore - 50),
  );
  const topSubFactors = sortedFactors.slice(0, 10);
  const subFactorsText = topSubFactors
    .map(
      (f) => {
        const scriptData = SUB_CATEGORY_SCRIPTS[f.subCategory];
        const displayName = scriptData?.name ?? f.subCategory;
        return `- ${displayName} > ${f.name}: T ${f.avgTScore} (${f.level})`;
      },
    )
    .join('\n');

  // 유형 분포 (해당 라운드 검사가 있는 학생 대상)
  const studentsWithAssessment = classData.students.filter((s) =>
    s.assessments.some((a) => a.round === round),
  );
  const typeCount: Record<string, number> = {};
  for (const student of studentsWithAssessment) {
    const assessment = student.assessments.find((a) => a.round === round);
    if (assessment) {
      const t = assessment.predictedType;
      typeCount[t] = (typeCount[t] || 0) + 1;
    }
  }
  const total = studentsWithAssessment.length;
  const typeDistText =
    total > 0
      ? Object.entries(typeCount)
          .map(
            ([type, count]) =>
              `- ${type}: ${((count / total) * 100).toFixed(1)}% (${count}명)`,
          )
          .join('\n')
      : '';

  return `# 학급 정보
- 학년: ${grade}학년
- 반: ${classNumber}반
- 학생 수: ${detailData.totalStudentCount}명 (유효 ${detailData.validStudentCount}명)
- 검사 차수: ${round}차

## 11개 중분류 평균 (T점수)
${middleCategoriesText}

## 주요 소분류 점수
${subFactorsText}

## 위험군 학생
- 긴급 개입 필요: ${detailData.criticalStudents.length}명
- 주의 관찰 필요: ${detailData.watchListStudents.length}명
${typeDistText ? `\n## 유형 분포\n${typeDistText}` : ''}

위 데이터를 분석하여 JSON 형식으로 응답해주세요.`;
}

function buildCompareUserMessage(
  classData: Class,
  detailData: ClassDetailData,
  prevDetailData: ClassDetailData,
): string {
  const { grade, classNumber } = classData;

  const subCategories2 = detailData.domainData.flatMap((d) => d.subCategories);
  const subCategories1 = prevDetailData.domainData.flatMap((d) => d.subCategories);

  const prevMap: Record<string, number> = {};
  for (const sc of subCategories1) {
    prevMap[sc.name] = sc.avgTScore;
  }

  const changeLines = subCategories2
    .map((sc) => {
      const prev = prevMap[sc.name];
      if (prev == null) return null;
      const delta = Math.round((sc.avgTScore - prev) * 10) / 10;
      const sign = delta > 0 ? '+' : '';
      const arrow = delta > 0.5 ? '▲' : delta < -0.5 ? '▼' : '→';
      return `- ${sc.displayName}: T ${prev} → ${sc.avgTScore} (${sign}${delta}) ${arrow}\n  ${sc.isPositive ? '[정적 요인]' : '[부적 요인]'}`;
    })
    .filter(Boolean)
    .join('\n');

  return `# 학급 정보
- 학년: ${grade}학년
- 반: ${classNumber}반
- 학생 수: ${detailData.totalStudentCount}명

## 1→2차 중분류 변화
${changeLines}

## 위험군 변화
- 1차: 긴급 ${prevDetailData.criticalStudents.length}명, 관찰 ${prevDetailData.watchListStudents.length}명
- 2차: 긴급 ${detailData.criticalStudents.length}명, 관찰 ${detailData.watchListStudents.length}명

위 1차→2차 변화 데이터를 분석하여, 학급의 전반적 변화 추이와 핵심 포인트를 JSON 형식({ "overall": "...", "keyPoint": "..." })으로 응답해주세요.
- overall: 주요 개선점과 악화점을 중심으로 변화를 종합 분석 (3~4문장)
- keyPoint: 교사에게 가장 중요한 조치 포인트 (1~2문장)`;
}

// ============================================================
// JSON 파싱
// ============================================================

function parseAIResponse(text: string): ClassSummaryResponse | null {
  if (!text) return null;

  // 1. ```json ... ``` 블록 추출
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    const result = tryParseJSON(jsonBlockMatch[1]);
    if (result) return result;
  }

  // 2. ``` ... ``` 블록 추출 (언어 태그 없는 경우)
  const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    const result = tryParseJSON(codeBlockMatch[1]);
    if (result) return result;
  }

  // 3. { ... } 직접 추출
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    const result = tryParseJSON(braceMatch[0]);
    if (result) return result;
  }

  // 4. Fallback: JSON 파싱 실패 시 원본 텍스트를 overall로 사용
  return {
    overall: text.trim(),
    keyPoint: '강점/약점 카드를 참고하여 학급 운영 전략을 수립해 보세요.',
  };
}

function tryParseJSON(text: string): ClassSummaryResponse | null {
  try {
    const parsed = JSON.parse(text.trim());
    if (parsed.overall && parsed.keyPoint) {
      return parsed as ClassSummaryResponse;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// 유틸리티
// ============================================================

function getCategoryDisplayName(category: string): string {
  return SUB_CATEGORY_SCRIPTS[category]?.name ?? category;
}

// ============================================================
// 서브 컴포넌트: 강점/약점 카드
// ============================================================

const ACCENT_STYLES = {
  emerald: {
    card: 'bg-emerald-50/50 border-emerald-200',
    rank: 'text-emerald-500',
    score: 'text-emerald-600',
  },
  red: {
    card: 'bg-red-50/50 border-red-200',
    rank: 'text-red-500',
    score: 'text-red-600',
  },
} as const;

const ProfileCard: React.FC<{
  item: ClassProfileItem;
  idx: number;
  accent: 'emerald' | 'red';
  prevItems?: ClassProfileItem[];
}> = ({ item, idx, accent, prevItems }) => {
  const s = ACCENT_STYLES[accent];
  const prevMap: Record<string, number> = {};
  if (prevItems) {
    for (const p of prevItems) {
      prevMap[p.category] = p.avgT;
    }
  }
  const prevT = prevMap[item.category];
  const hasPrev = prevT != null;
  const delta = hasPrev ? Math.round((item.avgT - prevT) * 10) / 10 : 0;

  return (
    <div className={`flex-1 p-3 rounded-lg border ${s.card}`}>
      {item.parentCategory && (
        <span
          className="text-[11px] font-semibold mb-1 inline-block"
          style={{ color: DOMAIN_COLORS[item.parentCategory] ?? '#9CA3AF' }}
        >
          #{item.parentCategory}
        </span>
      )}
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`text-xs font-bold ${s.rank}`}>{idx + 1}</span>
        <p className="text-sm font-semibold text-gray-800">
          {getCategoryDisplayName(item.category)}
        </p>
      </div>
      {hasPrev ? (
        <p className="text-xs text-gray-500 mb-1">
          T {prevT} → {item.avgT}
          {delta !== 0 && (
            <span className={`ml-1 font-semibold ${delta > 0 ? (item.isPositive ? 'text-emerald-600' : 'text-red-500') : (item.isPositive ? 'text-red-500' : 'text-emerald-600')}`}>
              ({delta > 0 ? '+' : ''}{delta})
            </span>
          )}
        </p>
      ) : (
        <p className={`text-xs mb-1 ${s.score}`}>T {item.avgT}</p>
      )}
      {item.categoryScript && (
        <p className="text-xs text-gray-500 leading-relaxed">{item.categoryScript}</p>
      )}
    </div>
  );
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export const ClassSummarySection: React.FC<ClassSummarySectionProps> = ({
  detailData,
  profile,
  classData,
  round,
  isCompare = false,
  prevProfile,
  prevDetailData,
}) => {
  const [result, setResult] = useState<ClassSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const generate = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const userMessage = isCompare && prevDetailData
          ? buildCompareUserMessage(classData, detailData, prevDetailData)
          : buildUserMessage(classData, detailData, round);

        const response = await callAI({
          feature: 'classAnalysis',
          messages: [{ role: 'user', content: userMessage }],
          temperature: 0.3,
        });

        if (!response.success) {
          setErrorMsg(response.error || 'AI 호출 실패');
          return;
        }

        const parsed = parseAIResponse(response.content);
        if (parsed) {
          setResult(parsed);
        } else {
          setErrorMsg('응답 파싱 실패');
        }
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [profile, detailData, classData, round, isCompare, prevDetailData]);

  return (
    <div className="space-y-5">
      {/* AI 총평 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            {isCompare ? 'AI 학급 변화 분석' : 'AI 학급 분석 총평'}
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
              <p className="text-sm text-gray-500">AI가 분석 중입니다...</p>
            </div>
          </div>
        ) : errorMsg ? (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              학급 분석을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>
            <p className="text-xs text-gray-400 mt-2">{errorMsg}</p>
          </div>
        ) : result ? (
          <div className="relative bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-indigo-600 border border-indigo-200">
                <Sparkles className="w-3 h-3" />
                <span>AI Insight</span>
              </div>
            </div>
            <p className="text-gray-800 whitespace-pre-line leading-relaxed text-[15px] pr-20">
              {result.overall.replace(/\. /g, '.\n')}
            </p>
          </div>
        ) : null}
      </div>

      {/* 강점/약점 가로 배치 */}
      {profile && (
        <div className="flex gap-6">
          {/* 강점 */}
          <div className="flex-1">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5 text-emerald-800">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold bg-emerald-200 text-emerald-700">+</span>
              {isCompare ? '주요 강점 (2차 기준)' : '주요 강점'}
            </h3>
            <div className="flex gap-2">
              {profile.strengths.map((item, idx) => (
                <ProfileCard key={item.category} item={item} idx={idx} accent="emerald" prevItems={isCompare && prevProfile ? prevProfile.strengths.concat(prevProfile.weaknesses) : undefined} />
              ))}
            </div>
          </div>
          {/* 구분선 */}
          <div className="w-px bg-gray-200 self-stretch" />
          {/* 약점 */}
          <div className="flex-1">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5 text-red-800">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold bg-red-200 text-red-700">!</span>
              {isCompare ? '관심 필요 영역 (2차 기준)' : '관심 필요 영역'}
            </h3>
            <div className="flex gap-2">
              {profile.weaknesses.map((item, idx) => (
                <ProfileCard key={item.category} item={item} idx={idx} accent="red" prevItems={isCompare && prevProfile ? prevProfile.strengths.concat(prevProfile.weaknesses) : undefined} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 운영 핵심 포인트 */}
      {result && !loading && (
        <div className="bg-purple-50/50 border border-purple-200 p-4 rounded-lg">
          <p className="text-sm text-gray-700 leading-relaxed">
            💡 {result.keyPoint}
          </p>
        </div>
      )}
    </div>
  );
};
