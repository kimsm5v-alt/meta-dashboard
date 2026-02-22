import type { LPAProfileData } from '../types';
import {
  STUDENT_GROUPS,
  INTERVENTIONS,
  MEDIATION_PATHS,
  MODERATION_EFFECTS,
  getInterventionSummary,
} from './knowledgeGraph';

// 38개 요인 목록
export const FACTORS = [
  '자아존중감', '자기효능감', '성장마인드셋',
  '자기정서인식', '자기정서조절', '타인정서인식', '타인공감능력',
  '계획능력', '점검능력', '조절능력',
  '공부환경', '시간관리', '수업태도', '노트하기', '시험준비',
  '부모의사소통', '부모학업지지', '친구정서지지', '교사정서지지',
  '활기', '몰두', '의미감',
  '자율성', '유능성', '관계성',
  '성적부담', '공부부담', '수업부담',
  '스마트폰의존', '게임과몰입',
  '부모성적압력', '부모공부부담', '친구공부비교', '교사성적압력', '교사수업부담',
  '고갈', '무능감', '반감냉소',
] as const;

// 요인 카테고리
export const FACTOR_CATEGORIES = {
  긍정적자아: [0, 1, 2],
  대인관계능력: [3, 4, 5, 6],
  메타인지: [7, 8, 9],
  학습기술: [10, 11, 12, 13, 14],
  지지적관계: [15, 16, 17, 18],
  학업열의: [19, 20, 21],
  성장력: [22, 23, 24],
  학업스트레스: [25, 26, 27],
  학습방해물: [28, 29],
  학업관계스트레스: [30, 31, 32, 33, 34],
  학업소진: [35, 36, 37],
} as const;

// 11개 중분류
export const SUB_CATEGORIES = [
  '긍정적자아', '대인관계능력', '메타인지', '학습기술', '지지적관계',
  '학업열의', '성장력', '학업스트레스', '학습방해물', '학업관계스트레스', '학업소진',
] as const;

// 대분류별 색상
export const DOMAIN_COLORS: Record<string, string> = {
  자아강점: '#00D282',
  학습디딤돌: '#4BC1FF',
  긍정적공부마음: '#67A7FF',
  학습걸림돌: '#FF849F',
  부정적공부마음: '#FF87D4',
};

// 중분류별 색상 (대분류 색상 종속)
export const CATEGORY_COLORS: Record<string, string> = {
  // 자아강점
  긍정적자아: '#00D282',
  대인관계능력: '#00D282',
  // 학습디딤돌
  메타인지: '#4BC1FF',
  학습기술: '#4BC1FF',
  지지적관계: '#4BC1FF',
  // 긍정적공부마음
  학업열의: '#67A7FF',
  성장력: '#67A7FF',
  // 학습걸림돌
  학업스트레스: '#FF849F',
  학습방해물: '#FF849F',
  학업관계스트레스: '#FF849F',
  // 부정적공부마음
  학업소진: '#FF87D4',
};

// 대분류 아이콘
export const DOMAIN_ICONS: Record<string, string> = {
  '자아강점': '🌟',
  '학습디딤돌': '📚',
  '긍정적공부마음': '💚',
  '학습걸림돌': '⚠️',
  '부정적공부마음': '💔',
};

// 정적(긍정) 대분류 Set
export const POSITIVE_DOMAINS = new Set(['자아강점', '학습디딤돌', '긍정적공부마음']);

// LPA 프로파일 데이터
export const LPA_PROFILE_DATA: LPAProfileData = {
  factors: [...FACTORS],
  factorCategories: Object.fromEntries(
    Object.entries(FACTOR_CATEGORIES).map(([k, v]) => [k, [...v]])
  ) as Record<string, number[]>,
  
  '초등': {
    types: [
      {
        name: '자원소진형',
        color: '#F97316',
        colorName: 'orange',
        means: [
          38.14, 37.90, 37.23, 41.69, 42.93, 43.90, 41.06,
          45.10, 44.32, 44.49, 45.41, 46.20, 41.72, 45.68, 49.34,
          42.81, 42.46, 42.50, 43.11, 52.71, 52.01, 58.82,
          53.31, 59.82, 58.07, 56.97, 60.13, 63.02, 57.45, 41.53,
          49.96, 44.27, 42.98, 35.82, 38.66, 56.18, 58.68, 57.10,
        ],
        description: '심리·정서적 자원이 전반적으로 낮고, 스트레스가 높으며, 디지털 기기 의존 위험이 있습니다.',
        characteristics: [
          '자기효능감·정서조절 모두 낮아 내적 동기 부족',
          '부모·교사 기대와 비교로 부담·불안 증가',
          '스마트폰·게임 몰입 위험',
        ],
        interventions: [
          {
            x: '자기효능감', z: '자아존중감', y: '학업성취도',
            effectType: '긍정완충', beta: 0.173, source: 'KG' as const,
            interpretation: '효능감과 자존감을 동시에 높이면 심리적 부하가 과중되어 효과가 상쇄됨 (상호작용 β=-0.173)',
            strategies: [
              '순차적 개입: 작은 성공 경험 반복 제공 → 1주일 단위로 축적 후 정서적 지지',
              '과정 피드백: 결과가 아닌 노력 과정을 구체적으로 인정',
              '자기비교 유도: 또래 비교 대신 "한 달 전 나"와 비교',
            ],
          },
          {
            x: '자기효능감', z: '자아존중감', y: '성적만족도',
            effectType: '완전매개', beta: 0.220, source: 'KG' as const,
            interpretation: '할 수 있다는 신념이 나는 가치있는 사람이라는 평가로 확장될 때 성적만족 형성 (간접효과 β=0.220)',
            strategies: [
              '1단계: 쉬운 과제로 작은 성공 경험 축적 (1주일)',
              '2단계: 과정 피드백으로 노력 인정 → 존재 가치에 대한 정서적 지지 추가',
              '압박 없이 효능감이 안정적으로 상승하도록 순차적 자원 구축',
            ],
          },
          {
            x: '자기정서조절', z: null, y: '정서안정',
            effectType: '직접효과', source: 'KG_INTERVENTION' as const,
            interpretation: '정서조절 역량이 낮아 스트레스에 취약 — 정서 안정화가 학습 동기 회복의 전제 조건',
            strategies: [
              '"이번 문제는 어려웠는데 3번이나 다시 시도했구나" 등 구체적 과정 피드백 제공',
              '감정 일기: 하루 한 줄 "오늘 공부하면서 느낀 감정" 기록',
              '또래 비교 대신 자기 기준 사고 강화: "다른 사람이 어떻게 생각할까" → "나는 어떻게 생각해?"',
            ],
          },
        ],
      },
      {
        name: '안전균형형',
        color: '#14B8A6',
        colorName: 'teal',
        means: [
          52.01, 50.91, 50.68, 49.57, 47.60, 49.36, 46.98,
          46.77, 45.49, 47.50, 47.44, 46.13, 48.09, 47.11, 50.14,
          49.36, 50.02, 49.43, 49.19, 57.37, 54.99, 65.54,
          57.67, 70.11, 65.12, 47.91, 53.51, 54.57, 53.11, 34.94,
          38.35, 34.26, 30.90, 23.49, 28.90, 51.03, 48.01, 51.73,
        ],
        description: '전반적으로 균형이 잡혀 있으나, 점검(모니터링) 능력이 상대적으로 취약합니다.',
        characteristics: [
          '자기효능감·자아존중감 양호, 정서조절 안정적',
          '학습 동기 요인은 긍정적이지만 점검·모니터링 역량 약함',
          '디지털 유혹이나 스트레스 요인은 낮음',
        ],
        interventions: [
          {
            x: '시간관리', z: '계획능력', y: '학업성취도',
            effectType: '긍정강화', beta: 0.157, source: 'KG' as const,
            interpretation: '시간관리와 계획능력이 결합되면 실행력이 극대화됨 (상호작용 β=0.157)',
            strategies: [
              '플래너 활용: 주간 계획표에 "무엇을 + 언제" 기록',
              '시간 블록 설계: 구체적 활동별 시간 배분 안내',
              '성공 패턴 시각화: 잘 작동한 날의 패턴 분석 및 기록',
            ],
          },
          {
            x: '유능성', z: '성장마인드셋', y: '학업성취도',
            effectType: '완전매개', beta: 0.045, source: 'KG' as const,
            interpretation: '할 수 있다는 신념이 노력으로 발전한다는 신념으로 전환되어야 지속적 성취 (간접효과 β=0.045)',
            strategies: [
              '"이건 원래 어려운 거야, 그런데 네가 시도한 것 자체가 대단해" 성장 관점 피드백',
              '도전 과제 후 "무엇을 배웠는지" 회고 활동',
              '금요일 10분 계획 수립 → 월요일 실행 점검 루틴 정착',
            ],
          },
          {
            x: '점검능력', z: '조절능력', y: '학업성취도',
            effectType: '완전매개', beta: 0.117, source: 'KG' as const,
            interpretation: '점검능력이 조절능력으로 전환될 때 학업성취로 이어짐 — 점검이 실행으로 연결되어야 효과 발생 (β=0.117)',
            strategies: [
              '공부 후 "오늘 뭐가 잘 됐고, 뭐가 안 됐지?" 자기 점검 루틴',
              '점검 결과를 다음 행동으로 연결: "안 된 부분은 내일 이렇게 해보자"',
              '주간 학습 일지: 점검→조절→실행 사이클 기록',
            ],
          },
        ],
      },
      {
        name: '몰입자원풍부형',
        color: '#3B82F6',
        colorName: 'blue',
        means: [
          55.82, 56.08, 54.19, 53.78, 53.71, 54.81, 53.79,
          56.65, 56.86, 57.55, 57.49, 55.03, 56.25, 56.09, 52.95,
          53.93, 55.18, 54.47, 54.55, 66.39, 63.78, 74.88,
          62.64, 76.30, 68.36, 44.72, 47.30, 47.46, 47.14, 30.83,
          34.62, 29.20, 29.67, 22.97, 24.23, 45.50, 45.36, 43.15,
        ],
        description: '심리·정서적 자원이 전반적으로 높고, 학업 소진이 낮습니다. 시험 전략 보완이 필요합니다.',
        characteristics: [
          '내적 동기와 자기효능감이 높음',
          '메타인지·학습기술 전반적으로 우수',
          '시험준비 전략은 상대적으로 보완 필요',
        ],
        interventions: [
          {
            x: '시험준비', z: null, y: '학업성취도',
            effectType: '직접효과', source: 'INFERRED' as const,
            interpretation: '시험준비 전략이 상대적으로 낮으므로 명시적 지도 필요',
            strategies: [
              '시험 전략 명시적 지도: 시험준비(T=52.95)가 상대적으로 낮음',
              '도전과제 제공: 높은 내적 동기 활용, 심화 학습 기회',
              '자기주도 프로젝트: 관심 분야 탐구 기회 부여',
            ],
          },
          {
            x: '유능성', z: '성장마인드셋', y: '학업성취도',
            effectType: '완전매개', beta: 0.079, source: 'KG' as const,
            interpretation: '유능감이 더 어려운 것도 할 수 있다는 신념으로 확장될 때 성취 가속화 (간접효과 β=0.079)',
            strategies: [
              '실패를 학습 기회로 재해석: "이 방법이 안 됐다는 걸 알게 된 것도 발전"',
              '현재 수준보다 약간 높은 도전 과제 제공',
              '심화 학습 기회 및 관심 분야 탐구 프로젝트 부여',
            ],
          },
          {
            x: '자아존중감', z: null, y: '자기기준강화',
            effectType: '직접효과', source: 'KG_INTERVENTION' as const,
            interpretation: '타인 시선에 민감할 수 있어 자기 기준 중심 사고 강화 필요',
            strategies: [
              '"다른 사람이 어떻게 생각할까" → "나는 어떻게 생각해?" 질문 전환',
              '수업 중 "네 의견은?" 질문 자주 던지기',
              '자기 기준 목표 설정: 또래 비교 대신 자기 성장 측정',
            ],
          },
        ],
      },
    ],
    priors: {
      '자원소진형': 0.30552,
      '안전균형형': 0.35469,
      '몰입자원풍부형': 0.33979,
    },
  },
  
  '중등': {
    types: [
      {
        name: '무기력형',
        color: '#F97316',
        colorName: 'orange',
        means: [], // TODO: 실제 중심값 데이터 필요
        description: '자기효능감과 정서조절이 모두 낮아 내적 동기가 부족하고, 학업 부담과 디지털 기기 의존도가 높습니다.',
        characteristics: [
          '자기효능감과 정서조절이 모두 낮아 내적 동기 부족',
          '목표 설정·점검·조절 능력이 모두 취약해 전략 실행력 미흡',
          '스마트폰·게임 사용이 잦아 학습 몰입 저해',
        ],
        interventions: [
          {
            x: '성장마인드셋', z: '유능성', y: '학업성취도',
            effectType: '완전매개', beta: 0.053, source: 'KG' as const,
            interpretation: '노력하면 발전한다는 신념이 나는 할 수 있다는 유능감으로 전환되어야 성취로 이어짐 (간접효과 β=0.053)',
            strategies: [
              '정서지지 + 구체적 도움 결합: "괜찮아" + 즉시 실행 가능한 작은 과제 제시',
              '과제 미세 분할: 전체 과제를 작은 단위로 나누고 "오늘은 여기까지만" 경계 설정',
              '완료 시 즉시 인정: "이만큼 해냈네!" 과정 피드백 제공',
            ],
          },
          {
            x: '수업부담', z: '부모학업지지', y: '학업성취도',
            effectType: '촉진', beta: 0.199, source: 'KG' as const,
            interpretation: '수업부담이 높을 때 부모지지가 간섭으로 느껴져 역효과 가능 — 부모에게 압박 아닌 안전망 역할 안내 (상호작용 β=0.199)',
            strategies: [
              '부모에게 "압박 아닌 안전망 역할" 안내',
              '시간관리 루틴 강화: 작은 성공 축적',
              '디지털 기기 사용 시간 관리 지원',
            ],
          },
          {
            x: '시간관리', z: '공부부담', y: '성적만족도',
            effectType: '촉진', beta: 0.249, source: 'KG' as const,
            interpretation: '시간관리 능력이 높아지면 공부부담 상황에서도 성적만족도를 유지할 수 있음 (β=0.249)',
            strategies: [
              '시험 전 "위기 대응 시간 관리 플랜" 제공',
              '최소 목표 설정: "하루 30분만" 실행 가능한 수준으로',
              '핵심 과제 3개만 집중 → 30분 집중 + 10분 휴식 루틴',
            ],
          },
          {
            x: '수업부담', z: '교사정서지지', y: '학업성취도',
            effectType: '촉진', beta: 0.226, source: 'KG' as const,
            interpretation: '수업부담이 높을 때 교사의 정서적 지지가 학업성취 보호 요인으로 작용 (β=0.226)',
            strategies: [
              '수업 후 짧은 격려 멘트: "오늘 힘들었지? 그래도 끝까지 있었잖아"',
              '수업 난이도 조절: 단계별 과제 제공으로 부담 경감',
              '정서적 안전망 구축: 모르는 것 질문해도 괜찮다는 분위기 조성',
            ],
          },
        ],
      },
      {
        name: '정서조절취약형',
        color: '#14B8A6',
        colorName: 'teal',
        means: [], // TODO: 실제 중심값 데이터 필요
        description: '성적·부모·교사 압력에 따른 정서 스트레스가 높고, 정서조절이 부족하여 학습 만족과 몰입이 저하됩니다.',
        characteristics: [
          '성적·부모·교사 압력에 따른 정서 스트레스가 높음',
          '자기·타인 정서인식은 양호하나, 정서조절은 부족',
          '스마트폰 의존·냉소감 다소 높아 학습 만족과 몰입 저하',
        ],
        interventions: [
          {
            x: '수업태도/몰두/의미감', z: '노트하기', y: '학업성취도',
            effectType: '완전매개', beta: 0.092, source: 'KG' as const,
            interpretation: '집중/몰두/의미 인식이 노트 필기라는 구체적 행동으로 전환될 때 성취로 이어짐 (간접효과 β=0.049~0.092)',
            strategies: [
              '노트 필기 양식 제공: 핵심 개념 / 예시 / 질문 칸 구분',
              '실시간 안내: "이 부분은 꼭 기록하세요" 명시',
              '필기 후 즉시 확인 및 긍정 피드백 제공',
            ],
          },
          {
            x: '수업태도', z: '자기정서인식', y: '학업성취도',
            effectType: '긍정완충', beta: 0.320, source: 'KG' as const,
            interpretation: '수업태도 좋고 정서인식 높으면 "왜 성적이 안 나오지?" 자책 증폭 가능 (상호작용 β=-0.320)',
            strategies: [
              '정서인식→행동전환 훈련: "지금 내가 불안하네" 인식 → "그럼 뭘 할까?" 행동',
              '과정 피드백 강화: 결과가 아닌 노력 과정 인정',
              '오늘 이해 안 된 부분 1개만 질문해보기 등 작은 행동 유도',
            ],
          },
          {
            x: '성장마인드셋', z: '부모성적압력', y: '성적만족도',
            effectType: '촉진', beta: 0.444, source: 'KG' as const,
            interpretation: '성장마인드셋이 높으면 부모 성적압력 상황에서도 성적만족도를 유지할 수 있음 (β=0.444)',
            strategies: [
              '"노력하면 나아진다" 성장 관점 피드백 강화',
              '부모 상담 시 압력 대신 과정 격려 방법 안내',
              '학생에게 자기 성장 기록 공유: "한 달 전 나"와 비교하며 변화 인식',
            ],
          },
          {
            x: '수업태도', z: null, y: '학업성취도',
            effectType: '직접효과', source: 'INFERRED' as const,
            interpretation: '수업 참여 태도가 학업 성취에 직접 연결 — 학습 전략 점검을 통한 효율화',
            strategies: [
              '수업 중 핵심 키워드 3개 적기 미션 부여',
              '수업 후 1분 정리: "오늘 배운 가장 중요한 것" 공유',
              '학습 전략 점검: 현재 공부 방법의 효과 자기 평가',
            ],
          },
        ],
      },
      {
        name: '자기주도몰입형',
        color: '#3B82F6',
        colorName: 'blue',
        means: [], // TODO: 실제 중심값 데이터 필요
        description: '자원·전략·관계성이 모두 우수한 몰입형 학습자로, 심리적 회복탄력성이 높고 학습 몰입도와 성취 기대가 가장 높습니다.',
        characteristics: [
          '자원·전략·관계성이 모두 우수한 몰입형 학습자',
          '자기정서조절과 시간관리가 안정적',
          '부담과 소진이 낮아 심리적 회복탄력성 높음',
        ],
        interventions: [
          {
            x: '타인정서인식', z: '활기', y: '성적만족도',
            effectType: '긍정강화', beta: 0.479, source: 'KG' as const,
            interpretation: '타인의 감정을 잘 인식하는 능력과 학습 활기가 결합되면 성적만족도가 크게 상승 (β=0.479)',
            strategies: [
              '또래 감정 읽기 활동: 모둠 활동 시 친구의 기분을 관찰하고 공유하기',
              '학습 활기 유지: 흥미로운 도전 과제와 자기 선택 기회 제공',
              '"네가 친구의 기분을 잘 알아채는 게 팀 분위기를 좋게 만든다" 피드백',
            ],
          },
          {
            x: '관계성', z: '타인공감능력', y: '학업성취도',
            effectType: '긍정강화', beta: 0.379, source: 'KG' as const,
            interpretation: '또래 관계와 공감능력이 결합되면 학업성취로 직접 연결 (β=0.379)',
            strategies: [
              '협력 학습 구조 설계: 2-3명 학습 팀 구성',
              '서로 설명해주기, 함께 문제풀이 활동',
              '"우리" 프레임 활용: "네가 이걸 잘하면 같은 팀 친구들도 도움받을 거야"',
            ],
          },
          {
            x: '타인공감능력', z: null, y: '협력학습',
            effectType: '직접효과', source: 'KG_INTERVENTION' as const,
            interpretation: '높은 공감능력을 또래 멘토링으로 연결하면 본인과 동료 모두 성장',
            strategies: [
              '또래 멘토 역할 부여: 같은 반 친구에게 설명해주기 활동',
              '"우리" 프레임 활용: "내가 아니라 우리가 함께 성장"',
              '멘토링 활동 후 자기 성찰: "가르치면서 내가 배운 것" 기록',
            ],
          },
        ],
      },
    ],
    priors: { '무기력형': 0.354, '정서조절취약형': 0.380, '자기주도몰입형': 0.266 },
  },
};

// ============================================================================
// 지식그래프 연동 유틸리티 (추가 개입 전략 조회용)
// ============================================================================

/**
 * 지식그래프에서 유형별 개입 전략 요약 조회
 */
export const getKnowledgeGraphInterventions = (
  schoolLevel: '초등' | '중등',
  typeName: string
): string[] => {
  return getInterventionSummary(schoolLevel, typeName);
};

/**
 * 지식그래프에서 유형별 상세 특성 조회
 */
export const getKnowledgeGraphGroupInfo = (
  schoolLevel: '초등' | '중등',
  typeName: string
) => {
  const group = STUDENT_GROUPS.find(
    g => g.school === schoolLevel && g.label === typeName
  );
  return group?.properties || null;
};

/**
 * 지식그래프에서 유형별 상세 개입 전략 노드 조회
 */
export const getKnowledgeGraphInterventionNodes = (
  schoolLevel: '초등' | '중등',
  typeName: string
) => {
  return INTERVENTIONS.filter(
    int => int.school === schoolLevel && int.targetGroup === typeName
  );
};

/**
 * 지식그래프에서 유형별 매개경로 조회
 */
export const getKnowledgeGraphMediationPath = (
  schoolLevel: '초등' | '중등',
  typeName: string
) => {
  return MEDIATION_PATHS.find(
    path => path.school === schoolLevel && path.group === typeName
  );
};

/**
 * 지식그래프에서 조절효과 조회 (단일 — 하위 호환용)
 */
export const getKnowledgeGraphModerationEffect = (
  schoolLevel: '초등' | '중등',
  typeName: string
) => {
  const groupId = STUDENT_GROUPS.find(
    g => g.school === schoolLevel && g.label === typeName
  )?.id;
  return MODERATION_EFFECTS.find(effect => effect.source === groupId);
};

/**
 * 지식그래프에서 조절효과 전체 조회 (배열)
 */
export const getKnowledgeGraphModerationEffects = (
  schoolLevel: '초등' | '중등',
  typeName: string
) => {
  const groupId = STUDENT_GROUPS.find(
    g => g.school === schoolLevel && g.label === typeName
  )?.id;
  return MODERATION_EFFECTS.filter(effect => effect.source === groupId);
};

// 유형별 색상 클래스
export const TYPE_COLOR_CLASSES: Record<string, string> = {
  '자원소진형': 'bg-orange-50 text-orange-600 border-orange-200',
  '안전균형형': 'bg-teal-50 text-teal-600 border-teal-200',
  '몰입자원풍부형': 'bg-blue-50 text-blue-600 border-blue-200',
  '무기력형': 'bg-orange-50 text-orange-600 border-orange-200',
  '정서조절취약형': 'bg-teal-50 text-teal-600 border-teal-200',
  '자기주도몰입형': 'bg-blue-50 text-blue-600 border-blue-200',
};

// 유형별 색상 HEX
export const TYPE_COLORS: Record<string, string> = {
  '자원소진형': '#F97316',
  '안전균형형': '#14B8A6',
  '몰입자원풍부형': '#3B82F6',
  '무기력형': '#F97316',
  '정서조절취약형': '#14B8A6',
  '자기주도몰입형': '#3B82F6',
};

export default LPA_PROFILE_DATA;
