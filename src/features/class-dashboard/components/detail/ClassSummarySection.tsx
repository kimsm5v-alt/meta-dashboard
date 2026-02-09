import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import type { Class } from '@/shared/types';
import type { ClassDetailData } from '../../hooks/useClassDetailData';
import type { ClassProfile } from '../../hooks/useClassProfile';
import { callAI } from '@/shared/services/ai';
import { SUB_CATEGORY_SCRIPTS } from '@/shared/data/subCategoryScripts';

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

// ============================================================
// JSON 파싱
// ============================================================

function parseAIResponse(text: string): ClassSummaryResponse | null {
  // ```json ... ``` 감싸진 경우 추출
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  try {
    const parsed = JSON.parse(jsonText.trim());
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

/** 중분류 표시명 (SUB_CATEGORY_SCRIPTS.name 사용) */
function getCategoryDisplayName(category: string): string {
  return SUB_CATEGORY_SCRIPTS[category]?.name ?? category;
}

// ============================================================
// 컴포넌트
// ============================================================

export const ClassSummarySection: React.FC<ClassSummarySectionProps> = ({
  detailData,
  profile,
  classData,
  round,
}) => {
  const [result, setResult] = useState<ClassSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const generate = async () => {
      setLoading(true);
      setError(false);
      try {
        const userMessage = buildUserMessage(classData, detailData, round);

        const response = await callAI({
          feature: 'classAnalysis',
          messages: [{ role: 'user', content: userMessage }],
          maxTokens: 800,
          temperature: 0.3,
        });

        const parsed = parseAIResponse(response.content);
        if (parsed) {
          setResult(parsed);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [profile, detailData, classData, round]);

  return (
    <div className="space-y-5">
      {/* AI 총평 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-semibold text-gray-800">AI 학급 분석 총평</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
              <p className="text-sm text-gray-500">AI가 분석 중입니다...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              학급 분석을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>
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

      {/* 강점/약점 그리드 (useClassProfile 기반) */}
      {profile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-lg">
            <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-200 text-emerald-700 text-xs font-bold">
                +
              </span>
              주요 강점
            </h3>
            <ul className="space-y-3">
              {profile.strengths.map((item, idx) => (
                <li key={item.category} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-emerald-500 mt-0.5">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {getCategoryDisplayName(item.category)}
                      <span className="ml-1.5 text-xs font-normal text-emerald-600">
                        T {item.avgT}
                      </span>
                    </p>
                    {item.categoryScript && (
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.categoryScript}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-red-50/50 border border-red-200 p-5 rounded-lg">
            <h3 className="font-bold text-red-800 mb-3 flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-red-200 text-red-700 text-xs font-bold">
                !
              </span>
              관심 필요 영역
            </h3>
            <ul className="space-y-3">
              {profile.weaknesses.map((item, idx) => (
                <li key={item.category} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-red-500 mt-0.5">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {getCategoryDisplayName(item.category)}
                      <span className="ml-1.5 text-xs font-normal text-red-600">
                        T {item.avgT}
                      </span>
                    </p>
                    {item.categoryScript && (
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.categoryScript}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
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
