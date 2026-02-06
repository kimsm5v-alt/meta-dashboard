/**
 * 학습심리 잠재프로파일(LPA) 기반 지식그래프
 *
 * 이 데이터는 META 학습종합검사 결과를 기반으로 한 개입 경로 및 전략을 정의합니다.
 * - 매개경로: X → Z → Y (독립변수 → 매개변수 → 결과변수)
 * - 조절효과: 특정 조건에서 효과가 강화되거나 약화됨
 * - 개입전략: 유형별 구체적인 코칭 방법
 *
 * 원본: docs/meta-test/10_지식그래프.json
 */

import type { SchoolLevel } from '../types';

// ============================================================================
// 타입 정의
// ============================================================================

export type StudentGroupId =
  | 'elem_group1' | 'elem_group2' | 'elem_group3'
  | 'mid_group1' | 'mid_group2' | 'mid_group3';

export type MediatorId =
  | 'growth_mindset' | 'self_esteem' | 'meaning' | 'note_taking'
  | 'competence' | 'regulation_ability' | 'monitoring_ability' | 'parent_support';

export type OutcomeId = 'achievement' | 'satisfaction';

export type NodeType = '학생집단' | '매개변수' | '결과변수' | '개입전략';

export type RelationType =
  | 'needs_mediation'      // 매개 필요
  | 'mediates_to'          // 매개 경로
  | 'requires_intervention' // 개입 필요
  | 'has_strength'         // 강점 보유
  | 'moderated_effect';    // 조절 효과

export type ModeratorType = '긍정강화' | '긍정완충' | '촉진' | '억제';

export type PsychologicalState = '소진' | '안정' | '몰입' | '무기력' | '불안정' | '최적';

export type ResourceLevel = '매우 낮음' | '낮음' | '중간' | '높음' | '매우 높음';

// 학생집단 노드
export interface StudentGroupNode {
  id: StudentGroupId;
  type: '학생집단';
  school: SchoolLevel;
  label: string;
  properties: {
    비율: number;
    인원: number;
    핵심특성: string[];
    우선개입: string;
    심리상태: PsychologicalState;
    자원수준: ResourceLevel;
  };
}

// 매개변수 노드
export interface MediatorNode {
  id: MediatorId;
  type: '매개변수';
  label: string;
  properties: {
    정의: string;
    중요도: string;
    측정?: string;
    이론?: string;
    기능?: string[];
  };
}

// 결과변수 노드
export interface OutcomeNode {
  id: OutcomeId;
  type: '결과변수';
  label: string;
  properties: {
    정의: string;
    측정: string;
    차원: string;
  };
}

// 개입전략 노드
export interface InterventionNode {
  id: string;
  type: '개입전략';
  school: SchoolLevel;
  targetGroup: string;
  label: string;
  properties: {
    방법?: string;
    단계?: string[];
    핵심?: string;
    예시?: string;
    원칙?: string;
    도구?: string;
    기록내용?: string;
    루틴?: string;
    피드백?: string;
    질문?: string;
    목적?: string;
    효과?: string;
    경계설정?: string;
    구조?: string;
    실시간?: string;
    구성?: string;
    활동?: string;
    메시지?: string;
    프레임?: string;
    사후?: string;
  };
}

// 매개경로 통계
export interface MediationStats {
  경로: string;
  a경로_β: number;
  a경로_p: string;
  b경로_β: number;
  b경로_p: string | number;
  간접효과_β: number;
  간접효과_CI: [number, number];
  직접효과_β?: number;
  직접효과_p?: string | number;
  총효과_β?: number;
  해석: string;
}

// 조절효과 통계
export interface ModerationStats {
  독립변수: string;
  조절변수: string;
  상호작용_β: number;
  상호작용_p: string;
  해석: string;
  개입전략: string;
}

// 엣지 (관계)
export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: RelationType;
  mediationType?: '완전매개' | '부분매개';
  moderatorType?: ModeratorType;
  school?: SchoolLevel;
  group?: string;
  properties: MediationStats | ModerationStats | Record<string, unknown>;
}

// ============================================================================
// 데이터
// ============================================================================

// 학생집단 노드
export const STUDENT_GROUPS: StudentGroupNode[] = [
  {
    id: 'elem_group1',
    type: '학생집단',
    school: '초등',
    label: '자원소진형',
    properties: {
      비율: 30.5,
      인원: 205,
      핵심특성: [
        '자기효능감·정서조절 모두 낮아 내적 동기 부족',
        '학습 목표 설정·전략 실행력 미흡',
        '학습 의지는 있으나 시간관리 효율성 낮음',
        '부모·교사 기대와 비교로 부담·불안 증가',
        '스마트폰·게임 몰입 위험, 정서적 균형 회복 필요',
      ],
      우선개입: '학습 동기 강화와 시간관리 전략',
      심리상태: '소진',
      자원수준: '낮음',
    },
  },
  {
    id: 'elem_group2',
    type: '학생집단',
    school: '초등',
    label: '안전균형형',
    properties: {
      비율: 35.4,
      인원: 238,
      핵심특성: [
        '자기효능감·자아존중감 양호, 정서조절 안정적',
        '학습 동기 요인은 긍정적이지만 점검·모니터링 역량 약함',
        '전략 실행의 완결성이 떨어져 세밀한 피드백 필요',
        '학습 태도는 성실하나 시간관리의 어려움 존재',
        '디지털 유혹이나 스트레스 요인은 낮음',
      ],
      우선개입: '메타인지 전략 지원',
      심리상태: '안정',
      자원수준: '중간',
    },
  },
  {
    id: 'elem_group3',
    type: '학생집단',
    school: '초등',
    label: '몰입자원풍부형',
    properties: {
      비율: 34.1,
      인원: 229,
      핵심특성: [
        '자기효능감, 자아존중감, 의미감 등 내적 동기 모두 높음',
        '정서 안정과 협력·몰입형 학습태도',
        '계획·점검·조절(메타인지) 우수',
        '반감·냉소 수준이 낮아 학습 만족도와 몰입도 우수',
        '시험전략 체계화 전략 보완 필요',
      ],
      우선개입: '시험 준비 기술 보완',
      심리상태: '몰입',
      자원수준: '높음',
    },
  },
  {
    id: 'mid_group1',
    type: '학생집단',
    school: '중등',
    label: '무기력형',
    properties: {
      비율: 35.4,
      인원: 137,
      핵심특성: [
        '자기효능감과 정서조절이 모두 낮아 내적 동기 부족',
        '목표 설정·점검·조절 능력이 모두 취약해 전략 실행력 미흡',
        '학업 부담이 높고 부담 과잉',
        '스마트폰·게임 사용이 잦아 학습 몰입 저해',
        '시간관리 루틴 강화가 필요',
      ],
      우선개입: '시간관리 루틴 강화 및 기본 효능감 구축',
      심리상태: '무기력',
      자원수준: '매우 낮음',
    },
  },
  {
    id: 'mid_group2',
    type: '학생집단',
    school: '중등',
    label: '정서조절취약형',
    properties: {
      비율: 38.0,
      인원: 147,
      핵심특성: [
        '성적·부모·교사 압력에 따른 정서 스트레스가 높음',
        '자기·타인 정서인식은 양호하나, 정서조절은 부족',
        '메타인지 전략은 평균 수준',
        '스마트폰 의존·냉소감 다소 높아 학습 만족과 몰입 저하',
        '정서 압력 완화 및 부모·교사 협력 개입 필요',
      ],
      우선개입: '정서조절 전략 및 압력 완화',
      심리상태: '불안정',
      자원수준: '중간',
    },
  },
  {
    id: 'mid_group3',
    type: '학생집단',
    school: '중등',
    label: '자기주도몰입형',
    properties: {
      비율: 26.6,
      인원: 103,
      핵심특성: [
        '자원·전략·관계성이 모두 우수한 몰입형 학습자',
        '자기정서조절과 시간관리가 안정적',
        '부담과 소진이 낮아 심리적 회복탄력성 높음',
        '학습 몰입도와 성취 기대 가장 높음',
      ],
      우선개입: '도전 과제 제공 및 리더십 역할',
      심리상태: '최적',
      자원수준: '매우 높음',
    },
  },
];

// 매개변수 노드
export const MEDIATORS: MediatorNode[] = [
  {
    id: 'growth_mindset',
    type: '매개변수',
    label: '성장마인드셋',
    properties: {
      정의: '능력이 노력을 통해 개발될 수 있다고 믿는 신념',
      중요도: '매우 높음',
      측정: '5점 척도',
      이론: 'Dweck (2006)',
    },
  },
  {
    id: 'self_esteem',
    type: '매개변수',
    label: '자아존중감',
    properties: {
      정의: '자신의 능력과 가치에 대한 전반적인 평가',
      중요도: '높음',
    },
  },
  {
    id: 'meaning',
    type: '매개변수',
    label: '의미감',
    properties: {
      정의: '공부하는 의미와 목적을 알고 보람을 느끼는 정도',
      중요도: '높음',
    },
  },
  {
    id: 'note_taking',
    type: '매개변수',
    label: '노트하기',
    properties: {
      정의: '학습한 핵심 내용을 정리하여 기록하고 활용하는 습관',
      중요도: '중등에서 매우 높음',
      기능: ['주의 고정', '인지부하 외부화', '가시적 성과물'],
    },
  },
  {
    id: 'competence',
    type: '매개변수',
    label: '유능성',
    properties: {
      정의: '어떤 일을 남들보다 잘하는 능력이 있다고 느끼는 정도',
      중요도: '높음',
    },
  },
  {
    id: 'regulation_ability',
    type: '매개변수',
    label: '조절능력',
    properties: {
      정의: '학습 효과를 높이기 위해 더 나은 공부 방법을 찾아 조정하는 능력',
      중요도: '중간',
    },
  },
  {
    id: 'monitoring_ability',
    type: '매개변수',
    label: '점검능력',
    properties: {
      정의: '공부 목표와 방법이 적절했는지 파악하는 능력',
      중요도: '중간',
    },
  },
  {
    id: 'parent_support',
    type: '매개변수',
    label: '부모학업지지',
    properties: {
      정의: '부모님이 공부와 관련하여 의견과 노력을 지지한다고 생각하는 정도',
      중요도: '높음',
    },
  },
];

// 결과변수 노드
export const OUTCOMES: OutcomeNode[] = [
  {
    id: 'achievement',
    type: '결과변수',
    label: '학업성취도',
    properties: {
      정의: '학습 경험 전반에 대한 주관적 성취감',
      측정: '5점 척도',
      차원: '성과(performance)',
    },
  },
  {
    id: 'satisfaction',
    type: '결과변수',
    label: '성적만족도',
    properties: {
      정의: '현재 성적 수준에 대한 정서적 만족도',
      측정: '5점 척도',
      차원: '안녕감(well-being)',
    },
  },
];

// 개입전략 노드
export const INTERVENTIONS: InterventionNode[] = [
  // 초등 자원소진형
  {
    id: 'int_elem_g1_1',
    type: '개입전략',
    school: '초등',
    targetGroup: '자원소진형',
    label: '순차적 자원 구축',
    properties: {
      방법: '효능감과 자존감을 동시에 높이지 말고 순차적으로',
      단계: [
        '1단계: 쉬운 과제로 작은 성공 경험 축적 (1주일)',
        '2단계: 과정 피드백으로 노력 인정',
        '3단계: 존재 가치에 대한 정서적 지지 추가',
      ],
      핵심: '압박 없이 효능감이 안정적으로 상승하도록',
    },
  },
  {
    id: 'int_elem_g1_2',
    type: '개입전략',
    school: '초등',
    targetGroup: '자원소진형',
    label: '과정 피드백 중심',
    properties: {
      예시: '이번 문제는 어려웠는데 3번이나 다시 시도했구나. 포기하지 않은 네가 자랑스럽다',
      원칙: '결과(점수)가 아닌 노력 과정을 구체적으로 인정',
    },
  },
  // 초등 안전균형형
  {
    id: 'int_elem_g2_1',
    type: '개입전략',
    school: '초등',
    targetGroup: '안전균형형',
    label: '플래너 활용 전략',
    properties: {
      도구: '주간 학습 계획표',
      기록내용: '무엇을(과제) + 언제(시간)',
      루틴: '금요일 10분 계획 수립, 월요일 실행 점검',
    },
  },
  {
    id: 'int_elem_g2_2',
    type: '개입전략',
    school: '초등',
    targetGroup: '안전균형형',
    label: '시간 설계 코칭',
    properties: {
      방법: '구체적 활동별 시간 배분 안내',
      예시: '숙제 30분 + 복습 15분 + 쉬는 시간 10분',
      사후: '실행 후 피드백 제공',
    },
  },
  // 초등 몰입자원풍부형
  {
    id: 'int_elem_g3_1',
    type: '개입전략',
    school: '초등',
    targetGroup: '몰입자원풍부형',
    label: '도전 과제 제공',
    properties: {
      방법: '현재 수준보다 약간 높은 과제',
      피드백: '실패를 학습 기회로 재해석',
      예시: '이 방법이 안 됐다는 걸 알게 된 것도 발전',
    },
  },
  {
    id: 'int_elem_g3_2',
    type: '개입전략',
    school: '초등',
    targetGroup: '몰입자원풍부형',
    label: '타인 시선 분리 연습',
    properties: {
      질문: '다른 사람이 어떻게 생각할까 → 나는 어떻게 생각해?',
      목적: '자기 기준 중심 사고 강화',
      방법: '수업 중 네 의견은? 질문 자주 던지기',
    },
  },
  // 중등 무기력형
  {
    id: 'int_mid_g1_1',
    type: '개입전략',
    school: '중등',
    targetGroup: '무기력형',
    label: '정서지지 + 구체적 도움 결합',
    properties: {
      방법: '괜찮아 + 즉시 실행 가능한 도움',
      예시: '이 문제가 어렵다면, 이 부분만 먼저 해보자. 나머지는 내일 같이',
      효과: '정서 지지가 실질적 해결책으로 이어짐',
    },
  },
  {
    id: 'int_mid_g1_2',
    type: '개입전략',
    school: '중등',
    targetGroup: '무기력형',
    label: '과제 미세 분할',
    properties: {
      방법: '전체 과제를 작은 단위로 분할',
      경계설정: '오늘은 여기까지만',
      피드백: '완료 시 이만큼 해냈네! 인정',
    },
  },
  // 중등 정서조절취약형
  {
    id: 'int_mid_g2_1',
    type: '개입전략',
    school: '중등',
    targetGroup: '정서조절취약형',
    label: '노트 필기 양식 제공',
    properties: {
      구조: '핵심 개념 / 예시 / 질문 칸 구분',
      실시간: '이 부분은 꼭 기록하세요 명시',
      피드백: '필기 후 즉시 확인 및 긍정 피드백',
    },
  },
  {
    id: 'int_mid_g2_2',
    type: '개입전략',
    school: '중등',
    targetGroup: '정서조절취약형',
    label: '정서인식→행동전환 훈련',
    properties: {
      방법: '지금 내가 불안하네 인식 → 그럼 뭘 할까? 행동',
      예시: '오늘 이해 안 된 부분 1개만 질문해보기',
      목적: '정서 인식이 자책이 아닌 문제해결로',
    },
  },
  // 중등 자기주도몰입형
  {
    id: 'int_mid_g3_1',
    type: '개입전략',
    school: '중등',
    targetGroup: '자기주도몰입형',
    label: '협력 학습 구조 설계',
    properties: {
      구성: '2-3명 학습 팀',
      활동: '서로 설명해주기, 함께 문제풀이',
      효과: '관계성과 공감능력이 학업성취로 직접 연결',
    },
  },
  {
    id: 'int_mid_g3_2',
    type: '개입전략',
    school: '중등',
    targetGroup: '자기주도몰입형',
    label: '관계 기반 동기 부여',
    properties: {
      메시지: '네가 이걸 잘하면 같은 팀 친구들도 도움받을 거야',
      프레임: '내가 아니라 우리',
    },
  },
];

// 매개경로 (통계적 근거 포함)
export const MEDIATION_PATHS: KnowledgeGraphEdge[] = [
  // 초등 자원소진형: 자기효능감 → 자아존중감 → 성적만족도
  {
    id: 'edge_med1_outcome1',
    source: 'self_esteem',
    target: 'satisfaction',
    relation: 'mediates_to',
    mediationType: '완전매개',
    school: '초등',
    group: '자원소진형',
    properties: {
      경로: '자기효능감 → 자아존중감 → 성적만족도',
      a경로_β: 0.591,
      a경로_p: '< .001',
      b경로_β: 0.375,
      b경로_p: '< .001',
      간접효과_β: 0.220,
      간접효과_CI: [0.08, 0.38],
      직접효과_β: 0.051,
      직접효과_p: 0.685,
      총효과_β: 0.272,
      해석: '할 수 있다는 신념이 나는 가치있는 사람이라는 평가로 확장될 때 성적만족 형성',
    },
  },
  // 초등 안전균형형: 유능성 → 성장마인드셋 → 학업성취도
  {
    id: 'edge_med2_outcome2',
    source: 'growth_mindset',
    target: 'achievement',
    relation: 'mediates_to',
    mediationType: '완전매개',
    school: '초등',
    group: '안전균형형',
    properties: {
      경로: '유능성 → 성장마인드셋 → 학업성취도',
      a경로_β: 0.220,
      a경로_p: '< .001',
      b경로_β: 0.201,
      b경로_p: 0.022,
      간접효과_β: 0.045,
      간접효과_CI: [0.01, 0.10],
      직접효과_β: 0.114,
      직접효과_p: 0.137,
      해석: '할 수 있다는 신념이 노력으로 발전한다는 신념으로 전환되어야 지속적 성취',
    },
  },
  // 초등 몰입자원풍부형: 유능성 → 성장마인드셋 → 학업성취도
  {
    id: 'edge_med3_outcome3',
    source: 'growth_mindset',
    target: 'achievement',
    relation: 'mediates_to',
    mediationType: '완전매개',
    school: '초등',
    group: '몰입자원풍부형',
    properties: {
      경로: '유능성 → 성장마인드셋 → 학업성취도',
      a경로_β: 0.261,
      a경로_p: '< .001',
      b경로_β: 0.304,
      b경로_p: 0.001,
      간접효과_β: 0.079,
      간접효과_CI: [0.02, 0.15],
      해석: '유능감이 더 어려운 것도 할 수 있다는 신념으로 확장될 때 성취 가속화',
    },
  },
  // 중등 무기력형: 성장마인드셋 → 유능성 → 학업성취도
  {
    id: 'edge_med4_outcome4',
    source: 'competence',
    target: 'achievement',
    relation: 'mediates_to',
    mediationType: '완전매개',
    school: '중등',
    group: '무기력형',
    properties: {
      경로: '성장마인드셋 → 유능성 → 학업성취도',
      a경로_β: 0.266,
      a경로_p: '< .001',
      b경로_β: 0.202,
      b경로_p: 0.046,
      간접효과_β: 0.053,
      간접효과_CI: [0.00, 0.12],
      해석: '노력하면 발전한다는 신념이 나는 할 수 있다는 유능감으로',
    },
  },
  // 중등 정서조절취약형: 수업태도/몰두/의미감 → 노트하기 → 학업성취도
  {
    id: 'edge_med5_outcome5',
    source: 'note_taking',
    target: 'achievement',
    relation: 'mediates_to',
    mediationType: '완전매개',
    school: '중등',
    group: '정서조절취약형',
    properties: {
      경로: '수업태도/몰두/의미감 → 노트하기 → 학업성취도',
      a경로_β: 0.092, // 수업태도 기준
      a경로_p: '< .05',
      b경로_β: 0.061, // 몰두 기준
      b경로_p: '< .05',
      간접효과_β: 0.049, // 의미감 기준
      간접효과_CI: [0.00, 0.11],
      해석: '집중/몰두/의미 인식이 노트 필기라는 구체적 행동으로 전환될 때 성취',
    },
  },
];

// 조절효과
export const MODERATION_EFFECTS: KnowledgeGraphEdge[] = [
  // 초등 자원소진형: 긍정완충 (효능감 × 자존감)
  {
    id: 'edge_mod_elem_g1_1',
    source: 'elem_group1',
    target: 'achievement',
    relation: 'moderated_effect',
    moderatorType: '긍정완충',
    properties: {
      독립변수: '자기효능감',
      조절변수: '자아존중감',
      상호작용_β: -0.173,
      상호작용_p: '< .05',
      해석: '효능감과 자존감을 동시에 높이면 압박 증가로 효과 상쇄',
      개입전략: '순차적 개입 필요',
    },
  },
  // 초등 안전균형형: 긍정강화 (시간관리 × 계획능력)
  {
    id: 'edge_mod_elem_g2_1',
    source: 'elem_group2',
    target: 'achievement',
    relation: 'moderated_effect',
    moderatorType: '긍정강화',
    properties: {
      독립변수: '시간관리',
      조절변수: '계획능력',
      상호작용_β: 0.157,
      상호작용_p: '< .01',
      해석: '시간관리 × 계획능력 결합 시 실행력 극대화',
      개입전략: '플래너로 무엇+언제 결합',
    },
  },
  // 중등 무기력형: 촉진 (수업부담 × 부모학업지지)
  {
    id: 'edge_mod_mid_g1_1',
    source: 'mid_group1',
    target: 'achievement',
    relation: 'moderated_effect',
    moderatorType: '촉진',
    properties: {
      독립변수: '수업부담',
      조절변수: '부모학업지지',
      상호작용_β: 0.199,
      상호작용_p: '< .05',
      해석: '수업부담 높을 때 부모지지가 간섭으로 느껴져 역효과 가능',
      개입전략: '부모에게 압박 아닌 안전망 역할 안내',
    },
  },
  // 중등 정서조절취약형: 긍정완충 (수업태도 × 자기정서인식)
  {
    id: 'edge_mod_mid_g2_1',
    source: 'mid_group2',
    target: 'achievement',
    relation: 'moderated_effect',
    moderatorType: '긍정완충',
    properties: {
      독립변수: '수업태도',
      조절변수: '자기정서인식',
      상호작용_β: -0.320,
      상호작용_p: '< .05',
      해석: '수업태도 좋고 정서인식 높으면 왜 성적이 안 나오지? 자책 증폭',
      개입전략: '과정 피드백 + 정서를 행동으로 전환',
    },
  },
];

// 개입 요약 (유형별 빠른 참조용)
export const INTERVENTION_SUMMARY: Record<string, string[]> = {
  '초등_자원소진형': [
    '순차적 자원 구축 (효능감→자존감)',
    '과정 피드백 중심',
    '자기비교 유도 (또래 비교 회피)',
  ],
  '초등_안전균형형': [
    '플래너 활용 (무엇+언제)',
    '시간 설계 코칭',
    '성공 패턴 시각화',
  ],
  '초등_몰입자원풍부형': [
    '도전 과제 제공',
    '실패→학습기회 재해석',
    '타인 시선 분리 연습',
  ],
  '중등_무기력형': [
    '정서지지 + 구체적 도움 결합',
    '과제 미세 분할',
    '작은 성공 축적',
  ],
  '중등_정서조절취약형': [
    '노트 필기 양식 제공',
    '정서인식→행동전환 훈련',
    '학습 전략 점검',
  ],
  '중등_자기주도몰입형': [
    '협력 학습 구조',
    '관계 기반 동기 부여',
    '교사-학생 관계 강화',
  ],
};

// 핵심 발견 사항
export const KEY_FINDINGS = {
  학교급별_차이: {
    초등: '정서·자아 자원 형성 우선 (성장마인드셋, 자아존중감, 의미감)',
    중등: '정서+환경+전략 통합 (노트하기, 유능성, 정서조절)',
  },
  매개경로_패턴: {
    학업성취도: '인지·전략 경로 (성장마인드셋, 노트하기, 메타인지)',
    성적만족도: '정서·자아 경로 (자아존중감, 의미감, 관계성)',
  },
  조절효과_유형: {
    긍정강화: '긍정 요인 결합 시 효과 증폭',
    긍정완충: '긍정 요인 과도 시 효과 감소',
    촉진: '조절변수 수준에 따라 독립변수 효과 강화',
    억제: '조절변수가 독립변수 부정효과 약화',
  },
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 학생 유형에 따른 개입 전략 조회
 */
export function getInterventionsForType(
  schoolLevel: SchoolLevel,
  typeName: string
): InterventionNode[] {
  return INTERVENTIONS.filter(
    (int) => int.school === schoolLevel && int.targetGroup === typeName
  );
}

/**
 * 학생 유형에 따른 매개경로 조회
 */
export function getMediationPathForType(
  schoolLevel: SchoolLevel,
  typeName: string
): KnowledgeGraphEdge | undefined {
  return MEDIATION_PATHS.find(
    (path) => path.school === schoolLevel && path.group === typeName
  );
}

/**
 * 학생 유형에 따른 조절효과 조회
 */
export function getModerationEffectForType(
  schoolLevel: SchoolLevel,
  typeName: string
): KnowledgeGraphEdge | undefined {
  const groupId = STUDENT_GROUPS.find(
    (g) => g.school === schoolLevel && g.label === typeName
  )?.id;

  return MODERATION_EFFECTS.find((effect) => effect.source === groupId);
}

/**
 * 학생 유형에 따른 개입 요약 조회
 */
export function getInterventionSummary(
  schoolLevel: SchoolLevel,
  typeName: string
): string[] {
  const key = `${schoolLevel}_${typeName}`;
  return INTERVENTION_SUMMARY[key] || [];
}

/**
 * 학생집단 노드 조회
 */
export function getStudentGroup(
  schoolLevel: SchoolLevel,
  typeName: string
): StudentGroupNode | undefined {
  return STUDENT_GROUPS.find(
    (g) => g.school === schoolLevel && g.label === typeName
  );
}

export default {
  STUDENT_GROUPS,
  MEDIATORS,
  OUTCOMES,
  INTERVENTIONS,
  MEDIATION_PATHS,
  MODERATION_EFFECTS,
  INTERVENTION_SUMMARY,
  KEY_FINDINGS,
  getInterventionsForType,
  getMediationPathForType,
  getModerationEffectForType,
  getInterventionSummary,
  getStudentGroup,
};
