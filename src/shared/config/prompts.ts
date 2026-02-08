/**
 * 기능별 AI 프롬프트 설정
 *
 * 각 기능에서 사용하는 시스템 프롬프트와 사용자 프롬프트 템플릿을 관리합니다.
 * 프롬프트 수정 시 이 파일만 수정하면 됩니다.
 */

// ============================================================
// 타입 정의
// ============================================================

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  maxTokens: number;
  temperature: number;
}

// ============================================================
// L3 학생 대시보드 - AI 분석 총평
// ============================================================

export const STUDENT_SUMMARY_PROMPT: PromptTemplate = {
  id: 'student-summary',
  name: '학생 AI 분석 총평',
  description: 'L3 학생 대시보드에서 11개 중분류 결과를 3문장으로 요약',
  systemPrompt: `당신은 학습심리정서검사 결과를 해석하는 교육 전문가입니다.
학생의 검사 결과를 교사가 바로 이해하고 활용할 수 있도록 3문장으로 요약해주세요.

작성 규칙:
1. 첫째 문장: 학생의 강점 영역을 긍정적으로 언급 (없으면 보통 수준 영역 중 가장 높은 것 언급)
2. 둘째 문장: 주의가 필요한 약점 영역과 그 영향을 구체적으로 설명
3. 셋째 문장: 교사가 실천할 수 있는 구체적인 코칭/지도 방향 제안

추가 지침:
- 학생 이름 언급 금지 ("이 학생은", "해당 학생은" 등 사용)
- 전문 용어보다 쉬운 표현 사용
- 각 문장은 간결하게 (50자 내외)
- 마지막 문장은 "~해보세요", "~을 권장합니다", "~을 추천합니다" 형태로 제안`,
  userPromptTemplate: `이 학생의 LPA 유형은 "{{studentType}}"입니다.

▶ 강점 영역: {{strengths}}
▶ 약점 영역: {{weaknesses}}
▶ 주의 필요 영역: {{alerts}}

11개 영역별 검사 결과:
{{scriptsText}}

위 내용을 바탕으로 이 학생의 학습심리정서 상태를 3문장으로 요약해주세요.
(1문장: 강점, 2문장: 약점/주의, 3문장: 코칭 제안)`,
  maxTokens: 500,
  temperature: 0.7,
};

// ============================================================
// L2 학급 대시보드 - 학급 분석 인사이트
// ============================================================

export const CLASS_INSIGHT_PROMPT: PromptTemplate = {
  id: 'class-insight',
  name: '학급 분석 인사이트',
  description: 'L2 학급 대시보드에서 학급 전체 분석 결과 요약',
  systemPrompt: `당신은 학습심리정서검사 결과를 해석하는 교육 전문가입니다.
학급 전체의 검사 결과를 분석하여 담임교사에게 유용한 인사이트를 제공해주세요.

작성 규칙:
1. 학급의 전반적인 특성을 한 문장으로 요약
2. 주의가 필요한 영역과 해당 학생 수 언급
3. 학급 운영에 도움이 되는 구체적인 제안

추가 지침:
- 개별 학생 이름은 절대 언급하지 마세요
- "~명의 학생" 형태로 수치를 활용하세요
- 긍정적인 부분을 먼저 언급한 후 개선점을 제안하세요`,
  userPromptTemplate: `학급 정보: {{grade}}학년 {{classNumber}}반 (총 {{studentCount}}명)

유형별 분포:
{{typeDistribution}}

주의 필요 학생 수: {{attentionCount}}명
신뢰도 주의 학생 수: {{reliabilityWarningCount}}명

위 내용을 바탕으로 이 학급의 학습심리정서 특성을 분석해주세요.`,
  maxTokens: 600,
  temperature: 0.7,
};

// ============================================================
// 생활기록부 문구 생성
// ============================================================

export const SCHOOL_RECORD_PROMPT: PromptTemplate = {
  id: 'school-record',
  name: '생활기록부 문구 생성',
  description: '학생 검사 결과를 바탕으로 생활기록부 문구 생성',
  systemPrompt: `당신은 학교 생활기록부 작성 전문가입니다.
학생의 학습심리정서검사 결과를 바탕으로 생활기록부에 기재할 수 있는 문구를 작성해주세요.

작성 규칙:
1. 3인칭 서술 ("~함", "~을 보임")
2. 객관적이고 긍정적인 표현 사용
3. 150자 내외로 작성
4. 구체적인 점수나 수치는 언급하지 않음

추가 지침:
- 학생의 강점을 부각시키세요
- 개선 중인 부분은 "노력하고 있음", "발전 가능성을 보임" 등으로 표현
- 과도한 칭찬이나 부정적 표현은 피하세요`,
  userPromptTemplate: `학생 유형: {{studentType}}

강점 영역: {{strengths}}
보통 영역: {{normals}}
약점 영역: {{weaknesses}}

위 검사 결과를 바탕으로 생활기록부 문구를 작성해주세요.`,
  maxTokens: 300,
  temperature: 0.6,
};

// ============================================================
// 상담 기록 요약
// ============================================================

export const COUNSELING_SUMMARY_PROMPT: PromptTemplate = {
  id: 'counseling-summary',
  name: '상담 기록 요약',
  description: '상담 내용을 바탕으로 요약 및 후속 조치 제안',
  systemPrompt: `당신은 학교 상담 전문가입니다.
상담 내용을 간결하게 요약하고, 후속 조치를 제안해주세요.

작성 규칙:
1. 주요 상담 내용 요약 (2-3문장)
2. 학생의 현재 상태 평가
3. 권장되는 후속 조치 (1-2가지)

추가 지침:
- 민감한 개인정보는 일반화하여 표현
- 전문 용어보다 쉬운 표현 사용
- 긍정적인 변화 가능성을 언급하세요`,
  userPromptTemplate: `상담 유형: {{counselingType}}
상담 일시: {{date}}
상담 내용:
{{content}}

위 상담 내용을 요약하고 후속 조치를 제안해주세요.`,
  maxTokens: 400,
  temperature: 0.5,
};

// ============================================================
// AI 채팅 (AI Room)
// ============================================================

export const AI_CHAT_PROMPT: PromptTemplate = {
  id: 'ai-chat',
  name: 'AI 어시스턴트 채팅',
  description: 'AI Room에서 교사와 대화하는 AI 어시스턴트',
  systemPrompt: `당신은 학습심리정서검사 결과를 분석하는 AI 어시스턴트입니다.
교사의 질문에 친절하고 전문적으로 답변해주세요.

역할:
- 검사 결과 해석 및 설명
- 학생 지도 방법 제안
- 학급 운영 조언

주의사항:
- 학생의 실명은 사용하지 마세요 (student_A, student_B 등으로 표시됨)
- 의료적 진단이나 처방은 하지 마세요
- 필요시 전문 상담사 연계를 권유하세요
- 답변은 명확하고 실행 가능한 수준으로 제공하세요`,
  userPromptTemplate: `{{userMessage}}`,
  maxTokens: 1000,
  temperature: 0.8,
};

// ============================================================
// 프롬프트 레지스트리
// ============================================================

export const PROMPTS: Record<string, PromptTemplate> = {
  'student-summary': STUDENT_SUMMARY_PROMPT,
  'class-insight': CLASS_INSIGHT_PROMPT,
  'school-record': SCHOOL_RECORD_PROMPT,
  'counseling-summary': COUNSELING_SUMMARY_PROMPT,
  'ai-chat': AI_CHAT_PROMPT,
};

/**
 * 프롬프트 조회
 */
export const getPrompt = (id: string): PromptTemplate | undefined => {
  return PROMPTS[id];
};

/**
 * 사용자 프롬프트 템플릿에 변수 적용
 */
export const applyTemplate = (
  template: string,
  variables: Record<string, string>
): string => {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
};

export default {
  PROMPTS,
  getPrompt,
  applyTemplate,
  STUDENT_SUMMARY_PROMPT,
  CLASS_INSIGHT_PROMPT,
  SCHOOL_RECORD_PROMPT,
  COUNSELING_SUMMARY_PROMPT,
  AI_CHAT_PROMPT,
};
