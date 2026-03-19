/**
 * 데이터 해석 도우미 AI 서비스
 *
 * L3 학생 대시보드의 플로팅 챗봇에서 사용하는 질문별 AI 호출 서비스
 * 7개 사전 정의 질문에 대해 학생 데이터 기반 맞춤 답변 생성
 *
 * 호출 흐름:
 * DataHelperChatbot → getDataHelperAnswer(questionId, data)
 *   → buildPromptForQuestion() → 질문별 프롬프트 생성
 *   → callAI() → Gemini API
 */

import { callAI } from '@/shared/services/ai';
import { SYSTEM_PROMPT_DATA_HELPER } from '@/shared/data/aiPrompts';
import { getSubCategoryResults, type SubCategoryResult } from '@/shared/utils/summaryGenerator';
import { getTypeInfo } from '@/shared/utils/lpaClassifier';
import { LPA_PROFILE_DATA } from '@/shared/data/lpaProfiles';
import type { SchoolLevel, StudentType, FactorDeviation } from '@/shared/types';

// ============================================================
// 타입 정의
// ============================================================

export interface StudentData {
  tScores: number[];
  predictedType: StudentType;
  typeProbabilities: Record<string, number>;
  schoolLevel: SchoolLevel;
  deviations: FactorDeviation[];
}

export type QuestionId =
  | 'diagnosis-1'
  | 'diagnosis-2'
  | 'diagnosis-3'
  | 'diagnosis-4'
  | 'type-1'
  | 'type-2'
  | 'type-3';

// 시스템 프롬프트: aiPrompts.ts에서 중앙 관리 (SYSTEM_PROMPT_DATA_HELPER)

// ============================================================
// 컨텍스트 빌더 유틸리티
// ============================================================

/** 11개 중분류 결과를 프롬프트용 텍스트로 변환 */
const formatSubCategories = (results: SubCategoryResult[]): string => {
  return results.map(r => {
    const direction = r.isPositive ? '정적' : '부적';
    const alertTag = r.isAlert ? ' ⚠️주의' : '';
    return `- ${r.displayName}(${direction}): T=${r.avgTScore.toFixed(0)}, ${r.level}${alertTag} → ${r.script}`;
  }).join('\n');
};

/** 강점 중분류 필터링 (정적 높음/매우높음, 부적 낮음/매우낮음) */
const filterStrengths = (results: SubCategoryResult[]): SubCategoryResult[] => {
  return results.filter(r =>
    r.isPositive
      ? r.level === '높음' || r.level === '매우높음'
      : r.level === '낮음' || r.level === '매우낮음'
  );
};

/** 약점 중분류 필터링 (정적 낮음/매우낮음, 부적 높음/매우높음) */
const filterWeaknesses = (results: SubCategoryResult[]): SubCategoryResult[] => {
  return results.filter(r =>
    r.isPositive
      ? r.level === '낮음' || r.level === '매우낮음'
      : r.level === '높음' || r.level === '매우높음'
  );
};

/** 중분류 리스트를 간단 텍스트로 포맷 */
const formatResultList = (results: SubCategoryResult[], fallback: string): string => {
  if (results.length === 0) return `- ${fallback}`;
  return results.map(r => `- ${r.displayName}: T=${r.avgTScore.toFixed(0)} (${r.level})`).join('\n');
};

// ============================================================
// 질문별 프롬프트 빌더
// ============================================================

const buildDiagnosisOverview = (subContext: string, data: StudentData): string =>
  `아래는 학습심리검사 중분류 11개 결과입니다.

${subContext}

분류된 유형: ${data.predictedType} (확률 ${Math.round(data.typeProbabilities[data.predictedType] || 0)}%)

위 결과를 바탕으로 **상세한 총평**을 작성해 주세요.
- 전반적인 학습심리정서 상태를 종합적으로 설명
- 5대 영역(자아강점, 학습디딤돌, 긍정적공부마음, 학습걸림돌, 부정적공부마음) 기준으로 정리
- 각 영역별 핵심 포인트 1~2줄씩
- 마지막에 종합 의견 2~3줄`;

const buildDiagnosisFactors = (subContext: string): string =>
  `아래는 학생의 학습심리검사 중분류 11개 결과입니다.

${subContext}

**11개 중분류 각각에 대해 자세히 설명**해 주세요.
- 각 중분류별로 소제목(###)을 사용
- T점수와 수준을 명시
- 해당 중분류가 의미하는 바를 구체적으로 설명
- 정적/부적 요인 해석 방향 반영
- 교사가 참고할 수 있는 한줄 코멘트 추가`;

const buildDiagnosisStrengths = (subResults: SubCategoryResult[], subContext: string): string => {
  const strengths = filterStrengths(subResults);
  const strengthContext = formatResultList(strengths, '뚜렷한 강점 영역이 없음 (모두 보통 수준)');

  return `아래는 검사 결과 중 강점 영역입니다.

### 강점 중분류
${strengthContext}

### 전체 11개 중분류 (참고)
${subContext}

**강점을 구체적으로 분석**해 주세요.
- 각 강점 영역별 의미와 장점 설명
- 강점이 학교생활에서 어떻게 발휘될 수 있는지
- 강점을 더 키울 수 있는 교사의 지원 방법
- 강점 영역이 없으면 "보통 수준 중 상대적 강점"을 찾아서 설명`;
};

const buildDiagnosisWeaknesses = (subResults: SubCategoryResult[], subContext: string): string => {
  const weaknesses = filterWeaknesses(subResults);
  const weaknessContext = formatResultList(weaknesses, '뚜렷한 보완 영역이 없음 (모두 보통 이상)');

  return `아래는 검사 결과 중 보완이 필요한 영역입니다.

### 보완 필요 중분류
${weaknessContext}

### 전체 11개 중분류 (참고)
${subContext}

**보완점을 구체적으로 분석**해 주세요.
- 각 보완 영역별 의미와 현재 상태 설명
- 약점이 학교생활에 미칠 수 있는 영향
- 교사가 교실에서 실천할 수 있는 구체적 지원 방법 (3가지 이상)
- 부정적으로 표현하지 말고, "~을 더 키워주면 좋겠어요" 식으로 표현
- 보완 영역이 없으면 "전반적으로 양호하며, 상대적으로 더 키울 수 있는 영역"을 안내`;
};

const buildTypeOverview = (data: StudentData): string => {
  const schoolData = LPA_PROFILE_DATA[data.schoolLevel];
  const typesInfo = schoolData.types.map(t => {
    const prob = Math.round(schoolData.priors[t.name] * 100);
    return `### ${t.name} (전체 ${prob}%)
- 설명: ${t.description}
- 특성: ${t.characteristics.join(', ')}`;
  }).join('\n\n');

  return `학교급은 ${data.schoolLevel}입니다. 해당 학교급의 3가지 학습 유형에 대해 설명해 주세요.

${typesInfo}

**위 3가지 유형 전체의 특징을 비교하며 설명**해 주세요.
- 각 유형별 핵심 특성 요약
- 유형 간 차이점 비교
- 각 유형에 효과적인 교사 접근법
- 분류된 유형(${data.predictedType})은 어떤 위치인지 마지막에 언급`;
};

const buildTypeDetail = (data: StudentData): string => {
  const typeInfo = getTypeInfo(data.predictedType, data.schoolLevel);
  const typeDesc = typeInfo
    ? `유형: ${typeInfo.name}\n설명: ${typeInfo.description}\n특성: ${typeInfo.characteristics.join(', ')}`
    : `유형: ${data.predictedType}`;
  const typeProb = Math.round(data.typeProbabilities[data.predictedType] || 0);

  return `분류 결과는 다음과 같습니다.

${typeDesc}
유형 확률: ${typeProb}%

전체 유형 확률 분포:
${Object.entries(data.typeProbabilities).map(([t, p]) => `- ${t}: ${Math.round(p)}%`).join('\n')}

**유형 세부특성을 상세히 설명**해 주세요.
- 유형의 전반적 특징 설명
- 이 유형의 일반적인 학교생활 패턴
- 교사가 주의해야 할 점
- 이 유형에 효과적인 교육적 개입 전략 3가지
- 유형 확률이 편중/분산되어 있는 경우 그 의미도 설명`;
};

const buildTypeIndividual = (data: StudentData, subContext: string): string => {
  const deviationContext = data.deviations.map(d => {
    const sign = d.diff > 0 ? '+' : '';
    const dirLabel = d.direction === 'positive' ? '긍정' : '부정';
    return `- ${d.factor}: 학생 T=${d.studentScore}, 유형 평균 T=${d.typeMean}, 차이=${sign}${d.diff} (${dirLabel})`;
  }).join('\n');

  return `분류된 유형은 ${data.predictedType}이며, 유형 평균 대비 개인 특이점은 다음과 같습니다.

### 유형 평균 대비 편차 (상위 항목)
${deviationContext}

### 전체 중분류 결과
${subContext}

**개인별 특성을 분석**해 주세요.
- 같은 유형 내에서도 개인차가 있다는 점을 설명
- 유형 평균 대비 높은 요인과 낮은 요인의 의미
- 고유한 프로필 특징
- 유형 해석 + 개인 편차를 종합한 맞춤형 지도 포인트`;
};

/** 질문 ID에 맞는 사용자 프롬프트 생성 */
const buildPromptForQuestion = (questionId: QuestionId, data: StudentData): string => {
  const subResults = getSubCategoryResults(data.tScores);
  const subContext = formatSubCategories(subResults);

  const builders: Record<QuestionId, () => string> = {
    'diagnosis-1': () => buildDiagnosisOverview(subContext, data),
    'diagnosis-2': () => buildDiagnosisFactors(subContext),
    'diagnosis-3': () => buildDiagnosisStrengths(subResults, subContext),
    'diagnosis-4': () => buildDiagnosisWeaknesses(subResults, subContext),
    'type-1': () => buildTypeOverview(data),
    'type-2': () => buildTypeDetail(data),
    'type-3': () => buildTypeIndividual(data, subContext),
  };

  return builders[questionId]();
};

// ============================================================
// 메인 함수
// ============================================================

/**
 * 질문 ID에 맞는 AI 답변 생성
 *
 * @param questionId - 7개 사전 정의 질문 중 하나
 * @param data - 학생의 검사 데이터 (tScores, 유형, 편차 등)
 * @returns AI 생성 답변 텍스트
 * @throws 답변 생성 실패 시 에러
 */
export const getDataHelperAnswer = async (
  questionId: QuestionId,
  data: StudentData
): Promise<string> => {
  const userMessage = buildPromptForQuestion(questionId, data);

  const response = await callAI({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_DATA_HELPER },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.4,
    maskPII: false,
  });

  if (!response.success) {
    throw new Error(response.error || '답변 생성에 실패했습니다.');
  }

  return response.content;
};
