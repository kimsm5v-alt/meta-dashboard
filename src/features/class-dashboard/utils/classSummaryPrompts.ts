import type { Class } from '@/shared/types';
import type { ClassDetailData } from '../hooks/useClassDetailData';
import { SUB_CATEGORY_SCRIPTS } from '@/shared/data/subCategoryScripts';

// ============================================================
// AI 응답 타입
// ============================================================

export interface ClassSummaryResponse {
  overall: string;
  keyPoint: string;
}

// ============================================================
// 프롬프트 빌더
// ============================================================

export function buildUserMessage(
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
              `- ${type}: ${((count / total) * 100).toFixed(0)}% (${count}명)`,
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

export function buildCompareUserMessage(
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
      const delta = Math.round(sc.avgTScore - prev);
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

export function parseAIResponse(text: string): ClassSummaryResponse | null {
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

export function tryParseJSON(text: string): ClassSummaryResponse | null {
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
