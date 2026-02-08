/**
 * 생활기록부 예시 문장 데이터
 *
 * 학습심리정서검사 11개 중분류 기반
 * - 정적 요인 7개: 높을수록 강점
 * - 부적 요인 4개: 낮을수록 강점
 *
 * 총 99개 문장 (11개 중분류 × 3 학교급 × 3 문장)
 */

// ============================================================
// 타입 정의
// ============================================================

export type SubCategory =
  // 정적 요인 (높을수록 강점)
  | '긍정적자아'
  | '대인관계능력'
  | '메타인지'
  | '학습기술'
  | '지지적관계'
  | '학업열의'
  | '성장력'
  // 부적 요인 (낮을수록 강점)
  | '학업스트레스'
  | '학업관계스트레스'
  | '학습방해물'
  | '학업소진';

export type SchoolLevelKr = '초등' | '중등' | '고등';

export type FactorType = 'positive' | 'negative';

export interface ExampleSentence {
  id: string;
  subCategory: SubCategory;
  schoolLevel: SchoolLevelKr;
  text: string;
  factorType: FactorType;
}

// ============================================================
// 상수 정의
// ============================================================

/** 정적 요인 (높을수록 강점) */
export const POSITIVE_SUB_CATEGORIES: SubCategory[] = [
  '긍정적자아',
  '대인관계능력',
  '메타인지',
  '학습기술',
  '지지적관계',
  '학업열의',
  '성장력',
];

/** 부적 요인 (낮을수록 강점) */
export const NEGATIVE_SUB_CATEGORIES: SubCategory[] = [
  '학업스트레스',
  '학업관계스트레스',
  '학습방해물',
  '학업소진',
];

/** 모든 중분류 */
export const ALL_SUB_CATEGORIES: SubCategory[] = [
  ...POSITIVE_SUB_CATEGORIES,
  ...NEGATIVE_SUB_CATEGORIES,
];

// ============================================================
// 예시 문장 데이터 (99개)
// ============================================================

export const EXAMPLE_SENTENCES: ExampleSentence[] = [
  // ============================================================
  // 1. 긍정적자아 (9개) - 정적 요인
  // ============================================================

  // 초등
  {
    id: 'positive_self_elem_1',
    subCategory: '긍정적자아',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '자신의 장점을 잘 알고 자신감을 보임',
  },
  {
    id: 'positive_self_elem_2',
    subCategory: '긍정적자아',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '스스로를 소중히 여기는 마음이 강함',
  },
  {
    id: 'positive_self_elem_3',
    subCategory: '긍정적자아',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '어려운 일에도 포기하지 않고 노력함',
  },

  // 중등
  {
    id: 'positive_self_middle_1',
    subCategory: '긍정적자아',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '긍정적 자아상을 바탕으로 자신감 있게 행동함',
  },
  {
    id: 'positive_self_middle_2',
    subCategory: '긍정적자아',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '자신의 능력을 신뢰하며 도전적 과제에 임함',
  },
  {
    id: 'positive_self_middle_3',
    subCategory: '긍정적자아',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '능력은 노력으로 향상될 수 있다는 성장 마인드를 지님',
  },

  // 고등
  {
    id: 'positive_self_high_1',
    subCategory: '긍정적자아',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '명확한 자아정체성을 바탕으로 자신감 있게 행동함',
  },
  {
    id: 'positive_self_high_2',
    subCategory: '긍정적자아',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '높은 자기효능감을 바탕으로 학업 목표를 달성함',
  },
  {
    id: 'positive_self_high_3',
    subCategory: '긍정적자아',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '성장 마인드셋을 바탕으로 지속적 발전을 추구함',
  },

  // ============================================================
  // 2. 대인관계능력 (9개) - 정적 요인
  // ============================================================

  // 초등
  {
    id: 'interpersonal_elem_1',
    subCategory: '대인관계능력',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '친구의 감정을 헤아리고 배려함',
  },
  {
    id: 'interpersonal_elem_2',
    subCategory: '대인관계능력',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '자신의 감정을 적절히 표현하고 조절함',
  },
  {
    id: 'interpersonal_elem_3',
    subCategory: '대인관계능력',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '친구들과 사이좋게 협력하며 지냄',
  },

  // 중등
  {
    id: 'interpersonal_middle_1',
    subCategory: '대인관계능력',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '자신과 타인의 감정을 잘 인식하고 공감함',
  },
  {
    id: 'interpersonal_middle_2',
    subCategory: '대인관계능력',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '원만한 대인관계를 형성하며 조화롭게 생활함',
  },
  {
    id: 'interpersonal_middle_3',
    subCategory: '대인관계능력',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '갈등을 합리적으로 해결하는 성숙한 태도를 보임',
  },

  // 고등
  {
    id: 'interpersonal_high_1',
    subCategory: '대인관계능력',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '타인의 감정을 깊이 이해하고 공감하는 성숙함을 보임',
  },
  {
    id: 'interpersonal_high_2',
    subCategory: '대인관계능력',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '협업 능력이 우수하여 팀 프로젝트를 성공적으로 수행함',
  },
  {
    id: 'interpersonal_high_3',
    subCategory: '대인관계능력',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '공동체 의식이 강하며 조화로운 관계를 형성함',
  },

  // ============================================================
  // 3. 메타인지 (9개) - 정적 요인
  // ============================================================

  // 초등
  {
    id: 'metacognition_elem_1',
    subCategory: '메타인지',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '스스로 공부 계획을 세우고 실천함',
  },
  {
    id: 'metacognition_elem_2',
    subCategory: '메타인지',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '무엇을 알고 모르는지 잘 파악함',
  },
  {
    id: 'metacognition_elem_3',
    subCategory: '메타인지',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '학습 방법을 상황에 맞게 바꿀 수 있음',
  },

  // 중등
  {
    id: 'metacognition_middle_1',
    subCategory: '메타인지',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '학습 계획을 체계적으로 수립하고 실천함',
  },
  {
    id: 'metacognition_middle_2',
    subCategory: '메타인지',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '자신의 이해 수준을 파악하여 학습 전략을 조정함',
  },
  {
    id: 'metacognition_middle_3',
    subCategory: '메타인지',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '학습 과정을 꾸준히 점검하는 능력이 뛰어남',
  },

  // 고등
  {
    id: 'metacognition_high_1',
    subCategory: '메타인지',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '자기주도적 학습 능력이 뛰어남',
  },
  {
    id: 'metacognition_high_2',
    subCategory: '메타인지',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '학습 전략을 효과적으로 조절하며 성취도를 높임',
  },
  {
    id: 'metacognition_high_3',
    subCategory: '메타인지',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '메타인지적 조절 능력으로 학습 효율을 극대화함',
  },

  // ============================================================
  // 4. 학습기술 (9개) - 정적 요인
  // ============================================================

  // 초등
  {
    id: 'study_skills_elem_1',
    subCategory: '학습기술',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '수업에 집중하며 적극적으로 참여함',
  },
  {
    id: 'study_skills_elem_2',
    subCategory: '학습기술',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '중요한 내용을 꼼꼼히 정리하는 습관이 있음',
  },
  {
    id: 'study_skills_elem_3',
    subCategory: '학습기술',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '시간을 잘 지키며 규칙적으로 학습함',
  },

  // 중등
  {
    id: 'study_skills_middle_1',
    subCategory: '학습기술',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '수업 내용을 효과적으로 정리하는 능력이 뛰어남',
  },
  {
    id: 'study_skills_middle_2',
    subCategory: '학습기술',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '시간 관리 능력이 우수하여 효율적으로 학습함',
  },
  {
    id: 'study_skills_middle_3',
    subCategory: '학습기술',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '오답을 분석하며 취약점을 보완함',
  },

  // 고등
  {
    id: 'study_skills_high_1',
    subCategory: '학습기술',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '체계적 필기로 학습 내용을 효과적으로 정리함',
  },
  {
    id: 'study_skills_high_2',
    subCategory: '학습기술',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '효율적 시간 관리로 학업 성취를 이룸',
  },
  {
    id: 'study_skills_high_3',
    subCategory: '학습기술',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '과목별 특성에 맞는 학습 전략을 적용함',
  },

  // ============================================================
  // 5. 지지적관계 (9개) - 정적 요인
  // ============================================================

  // 초등
  {
    id: 'supportive_elem_1',
    subCategory: '지지적관계',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '선생님과 친구들의 도움을 잘 받아들임',
  },
  {
    id: 'supportive_elem_2',
    subCategory: '지지적관계',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '어려울 때 적극적으로 도움을 요청함',
  },
  {
    id: 'supportive_elem_3',
    subCategory: '지지적관계',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '친구들과 서로 가르쳐주며 함께 성장함',
  },

  // 중등
  {
    id: 'supportive_middle_1',
    subCategory: '지지적관계',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '교사 및 또래와 신뢰로운 관계를 형성함',
  },
  {
    id: 'supportive_middle_2',
    subCategory: '지지적관계',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '어려움이 있을 때 적극적으로 도움을 구함',
  },
  {
    id: 'supportive_middle_3',
    subCategory: '지지적관계',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '또래와 협력하며 함께 성장함',
  },

  // 고등
  {
    id: 'supportive_high_1',
    subCategory: '지지적관계',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '교사·또래와의 협력적 관계를 통해 성장함',
  },
  {
    id: 'supportive_high_2',
    subCategory: '지지적관계',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '건설적 피드백을 수용하고 발전함',
  },
  {
    id: 'supportive_high_3',
    subCategory: '지지적관계',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '학습 공동체 의식이 강함',
  },

  // ============================================================
  // 6. 학업열의 (9개) - 정적 요인
  // ============================================================

  // 초등
  {
    id: 'engagement_elem_1',
    subCategory: '학업열의',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '배우는 것을 즐거워하며 질문을 많이 함',
  },
  {
    id: 'engagement_elem_2',
    subCategory: '학업열의',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '새로운 것을 배우는 데 흥미가 높음',
  },
  {
    id: 'engagement_elem_3',
    subCategory: '학업열의',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '수업 시간 내내 집중하며 몰입함',
  },

  // 중등
  {
    id: 'engagement_middle_1',
    subCategory: '학업열의',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '학습에 대한 열정과 몰입도가 높음',
  },
  {
    id: 'engagement_middle_2',
    subCategory: '학업열의',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '수업에 활기차게 참여하며 집중함',
  },
  {
    id: 'engagement_middle_3',
    subCategory: '학업열의',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '질문과 토론에 적극적으로 참여함',
  },

  // 고등
  {
    id: 'engagement_high_1',
    subCategory: '학업열의',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '학업에 대한 열의가 높고 몰입도가 뛰어남',
  },
  {
    id: 'engagement_high_2',
    subCategory: '학업열의',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '능동적 수업 참여로 학습 효과를 극대화함',
  },
  {
    id: 'engagement_high_3',
    subCategory: '학업열의',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '배움 그 자체에서 기쁨을 느낌',
  },

  // ============================================================
  // 7. 성장력 (9개) - 정적 요인
  // ============================================================

  // 초등
  {
    id: 'growth_elem_1',
    subCategory: '성장력',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '스스로 공부하는 습관이 형성되어 있음',
  },
  {
    id: 'growth_elem_2',
    subCategory: '성장력',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '배우고 싶어서 공부하는 내적 동기가 있음',
  },
  {
    id: 'growth_elem_3',
    subCategory: '성장력',
    schoolLevel: '초등',
    factorType: 'positive',
    text: '공부를 잘 할 수 있다는 자신감이 있음',
  },

  // 중등
  {
    id: 'growth_middle_1',
    subCategory: '성장력',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '내재적 학습 동기가 강함',
  },
  {
    id: 'growth_middle_2',
    subCategory: '성장력',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '자율적으로 학습을 계획하고 실행함',
  },
  {
    id: 'growth_middle_3',
    subCategory: '성장력',
    schoolLevel: '중등',
    factorType: 'positive',
    text: '학습의 내적 가치를 중요하게 여김',
  },

  // 고등
  {
    id: 'growth_high_1',
    subCategory: '성장력',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '강한 내재적 동기를 바탕으로 자기주도적 학습을 함',
  },
  {
    id: 'growth_high_2',
    subCategory: '성장력',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '학습의 본질적 가치를 추구함',
  },
  {
    id: 'growth_high_3',
    subCategory: '성장력',
    schoolLevel: '고등',
    factorType: 'positive',
    text: '자율성을 바탕으로 학업 목표를 달성함',
  },

  // ============================================================
  // 8. 학업스트레스 (9개) - 부적 요인 (낮을수록 강점)
  // ============================================================

  // 초등
  {
    id: 'stress_elem_1',
    subCategory: '학업스트레스',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '학업 부담을 건강하게 관리하는 방법을 알고 있음',
  },
  {
    id: 'stress_elem_2',
    subCategory: '학업스트레스',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '시험이나 과제에 대한 부담이 적고 긍정적으로 접근함',
  },
  {
    id: 'stress_elem_3',
    subCategory: '학업스트레스',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '공부에 대한 심리적 부담 없이 즐겁게 학습함',
  },

  // 중등
  {
    id: 'stress_middle_1',
    subCategory: '학업스트레스',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '학업 스트레스를 효과적으로 관리함',
  },
  {
    id: 'stress_middle_2',
    subCategory: '학업스트레스',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '적절한 수준의 학업 부담을 유지하며 안정적으로 학습함',
  },
  {
    id: 'stress_middle_3',
    subCategory: '학업스트레스',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '학업과 휴식의 균형을 잘 맞추며 건강하게 생활함',
  },

  // 고등
  {
    id: 'stress_high_1',
    subCategory: '학업스트레스',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '학업 스트레스를 건강하게 조절하는 능력이 뛰어남',
  },
  {
    id: 'stress_high_2',
    subCategory: '학업스트레스',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '학업 부담을 합리적으로 관리하며 안정적인 학습 태도를 유지함',
  },
  {
    id: 'stress_high_3',
    subCategory: '학업스트레스',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '압박 상황에서도 침착하게 대처하는 자기관리 능력이 있음',
  },

  // ============================================================
  // 9. 학업관계스트레스 (9개) - 부적 요인 (낮을수록 강점)
  // ============================================================

  // 초등
  {
    id: 'relation_stress_elem_1',
    subCategory: '학업관계스트레스',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '부모님과 선생님의 기대를 긍정적으로 받아들임',
  },
  {
    id: 'relation_stress_elem_2',
    subCategory: '학업관계스트레스',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '성적에 대한 부담 없이 자신의 페이스로 학습함',
  },
  {
    id: 'relation_stress_elem_3',
    subCategory: '학업관계스트레스',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '주변의 관심을 격려로 받아들이며 긍정적으로 성장함',
  },

  // 중등
  {
    id: 'relation_stress_middle_1',
    subCategory: '학업관계스트레스',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '부모·교사의 기대를 성장의 동력으로 받아들임',
  },
  {
    id: 'relation_stress_middle_2',
    subCategory: '학업관계스트레스',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '또래와의 비교에 흔들리지 않고 자신의 길을 감',
  },
  {
    id: 'relation_stress_middle_3',
    subCategory: '학업관계스트레스',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '주변의 지지를 긍정적으로 수용하며 안정감을 느낌',
  },

  // 고등
  {
    id: 'relation_stress_high_1',
    subCategory: '학업관계스트레스',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '타인의 기대를 건강하게 관리하며 자율성을 유지함',
  },
  {
    id: 'relation_stress_high_2',
    subCategory: '학업관계스트레스',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '외부 압력에 흔들리지 않는 내적 안정성을 지님',
  },
  {
    id: 'relation_stress_high_3',
    subCategory: '학업관계스트레스',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '관계 속에서도 자기주도성을 잃지 않음',
  },

  // ============================================================
  // 10. 학습방해물 (9개) - 부적 요인 (낮을수록 강점)
  // ============================================================

  // 초등
  {
    id: 'disturbance_elem_1',
    subCategory: '학습방해물',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '디지털 기기를 절제하며 공부 시간을 잘 지킴',
  },
  {
    id: 'disturbance_elem_2',
    subCategory: '학습방해물',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '스마트폰이나 게임보다 공부를 우선시함',
  },
  {
    id: 'disturbance_elem_3',
    subCategory: '학습방해물',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '학습에 방해되는 것들을 스스로 조절할 수 있음',
  },

  // 중등
  {
    id: 'disturbance_middle_1',
    subCategory: '학습방해물',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '디지털 기기 사용을 자제하며 학습에 집중함',
  },
  {
    id: 'disturbance_middle_2',
    subCategory: '학습방해물',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '스마트폰 사용 시간을 스스로 관리하는 자제력이 있음',
  },
  {
    id: 'disturbance_middle_3',
    subCategory: '학습방해물',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '학습 환경에서 방해 요소를 효과적으로 제거함',
  },

  // 고등
  {
    id: 'disturbance_high_1',
    subCategory: '학습방해물',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '디지털 기기를 학습 도구로 활용하며 절제함',
  },
  {
    id: 'disturbance_high_2',
    subCategory: '학습방해물',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '자기조절 능력으로 학습 방해 요소를 통제함',
  },
  {
    id: 'disturbance_high_3',
    subCategory: '학습방해물',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '학업 집중을 위한 환경 관리 능력이 뛰어남',
  },

  // ============================================================
  // 11. 학업소진 (9개) - 부적 요인 (낮을수록 강점)
  // ============================================================

  // 초등
  {
    id: 'burnout_elem_1',
    subCategory: '학업소진',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '공부에 대한 열정과 에너지가 넘침',
  },
  {
    id: 'burnout_elem_2',
    subCategory: '학업소진',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '학교생활에 활기차게 참여하며 지치지 않음',
  },
  {
    id: 'burnout_elem_3',
    subCategory: '학업소진',
    schoolLevel: '초등',
    factorType: 'negative',
    text: '학습에 대한 의욕이 높고 긍정적인 태도를 유지함',
  },

  // 중등
  {
    id: 'burnout_middle_1',
    subCategory: '학업소진',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '학업에 대한 피로도가 낮고 지속적으로 활력을 유지함',
  },
  {
    id: 'burnout_middle_2',
    subCategory: '학업소진',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '공부에 대한 열의를 잃지 않고 꾸준히 노력함',
  },
  {
    id: 'burnout_middle_3',
    subCategory: '학업소진',
    schoolLevel: '중등',
    factorType: 'negative',
    text: '학습 과정에서 에너지를 얻고 성취감을 느낌',
  },

  // 고등
  {
    id: 'burnout_high_1',
    subCategory: '학업소진',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '학업 소진 없이 지속적인 열정을 유지함',
  },
  {
    id: 'burnout_high_2',
    subCategory: '학업소진',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '장기적 학습에도 에너지와 동기를 잃지 않음',
  },
  {
    id: 'burnout_high_3',
    subCategory: '학업소진',
    schoolLevel: '고등',
    factorType: 'negative',
    text: '학업에 대한 긍정적 태도와 활력을 지속적으로 유지함',
  },
];

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 학교급에 해당하는 문장만 필터링
 */
export const getSentencesBySchoolLevel = (schoolLevel: SchoolLevelKr): ExampleSentence[] => {
  return EXAMPLE_SENTENCES.filter((s) => s.schoolLevel === schoolLevel);
};

/**
 * 중분류에 해당하는 문장만 필터링
 */
export const getSentencesBySubCategory = (subCategory: SubCategory): ExampleSentence[] => {
  return EXAMPLE_SENTENCES.filter((s) => s.subCategory === subCategory);
};

/**
 * 학교급 + 중분류로 문장 필터링
 */
export const getSentences = (
  schoolLevel: SchoolLevelKr,
  subCategory: SubCategory
): ExampleSentence[] => {
  return EXAMPLE_SENTENCES.filter(
    (s) => s.schoolLevel === schoolLevel && s.subCategory === subCategory
  );
};

/**
 * 요인 유형이 정적인지 확인
 */
export const isPositiveFactor = (subCategory: SubCategory): boolean => {
  return POSITIVE_SUB_CATEGORIES.includes(subCategory);
};

/**
 * 요인 유형이 부적인지 확인
 */
export const isNegativeFactor = (subCategory: SubCategory): boolean => {
  return NEGATIVE_SUB_CATEGORIES.includes(subCategory);
};
