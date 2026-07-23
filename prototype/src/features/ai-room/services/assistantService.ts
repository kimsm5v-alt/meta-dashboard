import type { BotResponse, RecordToneType, SuggestedQuestion } from '../types';

/**
 * AI 어시스턴트 서비스 (프로토타입 mock)
 *
 * 실제 API 연동 시 아래 함수 시그니처만 유지하면 UI 수정 없이 교체 가능.
 * 봇 응답은 항상 { content: 마크다운, isReference } 형태로 반환한다.
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 간단한 결정적 유사난수 (Math.random 미사용, 문자열 → 0~n) */
const pick = <T,>(seed: string, arr: T[]): T => {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
};

const OPENERS = [
  '질문 주신 내용을 검사 데이터 기준으로 정리했습니다.',
  '요청하신 관점에서 결과를 살펴봤습니다.',
  '아래와 같이 핵심만 짚어 드릴게요.',
];

/**
 * 대화 응답 생성 (mock)
 * @param question 사용자 질문
 * @param context  대상/화면 등 부가 컨텍스트 (표기용)
 */
export async function askAssistant(question: string, context?: string): Promise<BotResponse> {
  await delay(700 + (question.length % 5) * 120);

  const opener = pick(question, OPENERS);
  const scope = context ? `**대상**: ${context}\n\n` : '';

  const content = `${scope}${opener}

- **핵심 요약**: "${question}" 에 대해, 검사 결과의 5대 영역 중 **자아강점**과 **학습디딤돌**을 먼저 살펴보는 것을 권합니다.
- **근거**: T점수 분포상 평균(50) 대비 편차가 큰 요인이 해석의 출발점이 됩니다.
- **다음 단계**:
  1. 강점 영역을 먼저 확인해 대화의 물꼬를 트기
  2. 보완이 필요한 요인은 **성장 관점**으로 제시
  3. 필요 시 개별 코칭 전략으로 연결

> 검사 결과는 **상대평가가 아닌 참고 자료**입니다. 학생의 실제 맥락과 함께 해석해 주세요.`;

  return { content, isReference: true };
}

const RECORD_TONE_INTRO: Record<RecordToneType, string> = {
  종합: '전반적인 학습심리정서 특성을 균형 있게 서술한 초안입니다.',
  '강점 중심': '두드러진 강점을 앞세워 서술한 초안입니다.',
  '행동·태도': '수업·학습 장면에서의 행동과 태도 중심으로 서술한 초안입니다.',
};

/**
 * 생활기록부 문구 초안 생성 (mock)
 * - 문어체(~함/~음), 강점 우선 서술
 */
export async function generateSchoolRecord(
  studentName: string,
  tone: RecordToneType,
): Promise<string> {
  await delay(900);

  const strengthSentences = [
    '수업 중 궁금한 점을 스스로 정리해 질문하는 태도가 돋보임.',
    '과제를 계획적으로 나누어 꾸준히 수행하는 성실함이 두드러짐.',
    '모둠 활동에서 친구의 의견을 경청하고 조율하는 협력적 태도를 보임.',
  ];
  const growthSentences = [
    '새로운 과제에 대한 부담을 성장의 계기로 삼도록 지속적인 격려가 도움이 될 것으로 보임.',
    '결과를 스스로 점검하는 습관을 더한다면 학습의 완성도가 한층 높아질 것으로 기대됨.',
  ];

  const s1 = pick(studentName + tone, strengthSentences);
  const s2 = pick(studentName + tone + '2', strengthSentences.filter((s) => s !== s1));
  const g1 = pick(studentName + tone, growthSentences);

  const body =
    tone === '강점 중심'
      ? `${s1} ${s2}`
      : tone === '행동·태도'
        ? `${s1} 학습 상황에서 자신의 감정을 조절하며 과제에 집중하는 모습을 보임.`
        : `${s1} ${g1}`;

  return `${RECORD_TONE_INTRO[tone]}\n\n${body}`;
}

/**
 * 어시스턴트 페이지 - 선택 대상에 따른 동적 추천 질문 (B-3)
 */
export function getTargetQuestions(selectedStudentNames: string[], isWholeClass: boolean): SuggestedQuestion[] {
  if (isWholeClass || selectedStudentNames.length === 0) {
    return [
      { emoji: '📊', text: '우리 반 전체 경향을 요약해줘' },
      { emoji: '🔔', text: '관심이 필요한 학생은 누구인가요?' },
      { emoji: '🏅', text: '우리 반 강점 TOP 3는 무엇인가요?' },
    ];
  }
  if (selectedStudentNames.length === 1) {
    const name = selectedStudentNames[0];
    return [
      { emoji: '🧠', text: `${name} 결과를 종합적으로 해석해줘` },
      { emoji: '🎯', text: `${name}에게 맞는 코칭 전략은?` },
      { emoji: '👨‍👩‍👧', text: `${name} 학부모 상담 화법을 제안해줘` },
    ];
  }
  return [
    { emoji: '🔗', text: '선택한 학생들의 공통 관심 영역은?' },
    { emoji: '👥', text: '이 학생들을 위한 그룹 지도 전략은?' },
    { emoji: '📊', text: '선택한 학생들의 강점을 비교해줘' },
  ];
}
