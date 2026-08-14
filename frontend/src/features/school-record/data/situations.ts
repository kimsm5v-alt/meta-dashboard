import type { SchoolLevel } from '@shared/types';
import type { ContinuityOption, SituationOption } from '../types';

/** 관찰 상황 — prototype data.ts SITUATIONS 원문 그대로 */
export const SITUATIONS: SituationOption[] = [
  { code: 'CLASS_PARTICIPATION', label: '수업 참여' },
  { code: 'TASK_PREPARATION', label: '과제·학습 준비' },
  { code: 'GROUP_ACTIVITY', label: '모둠 활동' },
  { code: 'PRESENTATION_COMMUNICATION', label: '발표·의사소통' },
  { code: 'PEER_RELATIONSHIP', label: '친구 관계' },
  { code: 'CLASS_ROLE', label: '학급 역할' },
  { code: 'CHALLENGE', label: '어려운 과제·도전 상황' },
  { code: 'ETC', label: '기타' },
];

/** 상황별 관찰 행동 — prototype data.ts SITUATION_BEHAVIORS 원문 그대로 */
export const SITUATION_BEHAVIORS: Record<string, string[]> = {
  CLASS_PARTICIPATION: [
    '설명을 집중하여 들음',
    '궁금한 내용을 질문함',
    '자신의 의견을 적극적으로 발표함',
    '다른 사람의 발표를 경청함',
    '교사의 피드백을 반영함',
    '수업 활동에 꾸준히 참여함',
  ],
  TASK_PREPARATION: [
    '해야 할 일을 순서대로 정함',
    '준비물을 스스로 챙김',
    '정해진 시간 안에 과제를 마침',
    '결과물을 다시 확인함',
    '부족한 부분을 스스로 수정함',
    '계획에 맞게 학습을 진행함',
  ],
  GROUP_ACTIVITY: [
    '맡은 역할을 성실히 수행함',
    '친구의 의견을 끝까지 들음',
    '자신의 생각을 이해하기 쉽게 설명함',
    '서로 다른 의견을 조율함',
    '도움이 필요한 친구를 지원함',
    '모둠의 목표 달성에 기여함',
  ],
  PRESENTATION_COMMUNICATION: [
    '자신의 생각을 근거와 함께 설명함',
    '상대방의 질문에 적절히 답함',
    '다른 사람의 의견을 경청함',
    '이해하기 쉬운 표현을 사용함',
    '피드백을 반영하여 내용을 보완함',
    '발표 과정에서 맡은 역할을 수행함',
  ],
  PEER_RELATIONSHIP: [
    '친구의 감정을 이해하려고 함',
    '친구의 고민이나 이야기를 들어줌',
    '어려움을 겪는 친구를 도와줌',
    '갈등이 있을 때 상대의 입장을 살핌',
    '자신의 감정을 말로 표현함',
    '대화를 통해 관계를 회복함',
  ],
  CLASS_ROLE: [
    '맡은 역할을 잊지 않고 수행함',
    '공동으로 사용하는 물품을 정리함',
    '학급 활동 준비에 참여함',
    '필요한 일을 먼저 찾아 수행함',
    '다른 학생과 역할을 나누어 협력함',
    '정해진 약속과 규칙을 지키려고 노력함',
  ],
  CHALLENGE: [
    '쉽게 포기하지 않고 다시 시도함',
    '어려운 부분에 대해 도움을 요청함',
    '기존 방법이 효과적이지 않을 때 다른 방법을 찾음',
    '실수를 확인하고 수정함',
    '피드백을 받아 결과물을 개선함',
    '어려움이 있어도 끝까지 참여함',
  ],
  ETC: [],
};

/** 변화·지속 정도 — prototype data.ts CONTINUITY_OPTIONS 원문 그대로 */
export const CONTINUITY_OPTIONS: ContinuityOption[] = [
  { code: 'CONSISTENT', label: '꾸준히 보임' },
  { code: 'MORE_FREQUENT', label: '최근 더 자주 보임' },
  { code: 'IMPROVING', label: '점차 좋아지고 있음' },
  { code: 'WITH_SUPPORT', label: '도움을 받으면 수행함' },
  { code: 'SITUATIONAL', label: '특정 상황에서 두드러짐' },
];

/** 학교급별 구체적 장면 placeholder — prototype data.ts FREETEXT_PLACEHOLDER 원문 그대로 */
export const FREETEXT_PLACEHOLDER: Record<SchoolLevel, string> = {
  초등: '예) 쉬는 시간에 우는 친구에게 먼저 다가가 다독여주는 모습이 인상적이었음',
  중등: '예) 모둠 수학 프로젝트에서 어려워하는 친구에게 풀이 방법을 설명해 주는 모습이 인상적이었음',
  고등: '예) 물리 수행평가에서 실험 결과가 예상과 다르자, 변인을 재설정하여 실험을 재설계하는 탐구 자세를 보임',
};
