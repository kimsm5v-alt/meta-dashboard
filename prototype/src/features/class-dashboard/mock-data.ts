/**
 * 결과보기 Feature - Mock 데이터
 *
 * 개발/테스트용 가상 데이터
 */

import type { ClassResultSummary, StudentResult, LPAType } from './types';

// ============================================================
// 반 전체 결과 Mock (화면 3번)
// ============================================================

export const MOCK_CLASS_RESULT: ClassResultSummary = {
  className: '2-3반',
  round: 1,
  assessedCount: 26,
  totalCount: 26,
  avgTScore: 52.4,
  lpaDistribution: [
    { type: '몰입자원 풍부형', count: 12, percentage: 46, color: '#10B981' },
    { type: '안전 균형형', count: 10, percentage: 38, color: '#F59E0B' },
    { type: '자원소진형', count: 4, percentage: 16, color: '#EF4444' },
  ],
  factorAverages: [
    // 자아강점 (Depth 1) - 긍정적 자아, 대인관계능력 (Depth 2)
    { name: '긍정적 자아', category: '자아강점', avgScore: 55, level: '보통' },
    { name: '대인관계능력', category: '자아강점', avgScore: 58, level: '보통' },
    // 학습디딤돌 (Depth 1) - 메타인지, 학습기술, 지지적 관계 (Depth 2)
    { name: '메타인지', category: '학습디딤돌', avgScore: 52, level: '보통' },
    { name: '학습기술', category: '학습디딤돌', avgScore: 48, level: '보통' },
    { name: '지지적 관계', category: '학습디딤돌', avgScore: 54, level: '보통' },
    // 긍정적공부마음 (Depth 1) - 학업열의, 성장력 (Depth 2)
    { name: '학업열의', category: '긍정적공부마음', avgScore: 51, level: '보통' },
    { name: '성장력', category: '긍정적공부마음', avgScore: 56, level: '보통' },
    // 학습걸림돌 (Depth 1) - 학업스트레스, 학습방해물, 학업관계스트레스 (Depth 2)
    { name: '학업스트레스', category: '학습걸림돌', avgScore: 45, level: '보통' },
    { name: '학습방해물', category: '학습걸림돌', avgScore: 48, level: '보통' },
    { name: '학업관계스트레스', category: '학습걸림돌', avgScore: 46, level: '보통' },
    // 부정적공부마음 (Depth 1) - 학업소진 (Depth 2)
    { name: '학업소진', category: '부정적공부마음', avgScore: 42, level: '보통' },
  ],
  riskStudents: [
    { id: 's4', number: 4, name: '최수아', reason: '학업소진 T점수 35 이하', type: 'attention' },
    { id: 's7', number: 7, name: '조민서', reason: '자아존중감 T점수 32', type: 'attention' },
    { id: 's10', number: 10, name: '임지아', reason: '응답 일관성 부족', type: 'reliability' },
    { id: 's21', number: 21, name: '허지후', reason: '학업스트레스 T점수 75 이상', type: 'attention' },
  ],
  strengths: [
    {
      parentCategory: '자아강점',
      factorName: '자기효능감',
      avgT: 62,
      definition: '자신이 어떤 일을 성공적으로 수행할 수 있는 능력이 있다고 믿는 기대와 신념',
      isPositive: true,
    },
    {
      parentCategory: '자아강점',
      factorName: '성장마인드셋',
      avgT: 59,
      definition: '지능이나 능력이 노력을 통해 변화하고 성장할 수 있다고 생각하는 정도',
      isPositive: true,
    },
    {
      parentCategory: '학습디딤돌',
      factorName: '계획능력',
      avgT: 57,
      definition: '공부 목표를 세우고, 목표에 따라 순차적으로 학습을 계획하는 능력',
      isPositive: true,
    },
  ],
  weaknesses: [
    {
      parentCategory: '부정적공부마음',
      factorName: '고갈',
      avgT: 62,
      definition: '공부 때문에 지쳐서 아무 즐거움이나 흥미가 없는 피로 상태',
      isPositive: false,
    },
    {
      parentCategory: '부정적공부마음',
      factorName: '무능감',
      avgT: 58,
      definition: '노력해도 성적이 만족스럽지 않고, 노력한만큼 좋은 결과가 나오지 않아 실망감을 느끼는 상태',
      isPositive: false,
    },
    {
      parentCategory: '학습걸림돌',
      factorName: '성적부담',
      avgT: 56,
      definition: '기대와 목표에 비해 성적이 낮게 나올 수 있다는 부담을 느끼는 정도',
      isPositive: false,
    },
  ],
};

// ============================================================
// 학생 개인 결과 Mock (화면 4번)
// ============================================================

const createFactorScores = (baseScore: number): StudentResult['factorScores'] => {
  const factors = [
    { name: '자아존중감', category: '자아강점', isPositive: true },
    { name: '자아효능감', category: '자아강점', isPositive: true },
    { name: '자기결정성', category: '자아강점', isPositive: true },
    { name: '회복탄력성', category: '자아강점', isPositive: true },
    { name: '메타인지', category: '학습디딤돌', isPositive: true },
    { name: '계획능력', category: '학습디딤돌', isPositive: true },
    { name: '학습기술', category: '학습디딤돌', isPositive: true },
    { name: '학습동기', category: '학습디딤돌', isPositive: true },
    { name: '학업열의', category: '긍정적공부마음', isPositive: true },
    { name: '성장마인드셋', category: '긍정적공부마음', isPositive: true },
    { name: '학업스트레스', category: '학습걸림돌', isPositive: false },
    { name: '주의산만', category: '학습걸림돌', isPositive: false },
    { name: '학업소진', category: '부정적공부마음', isPositive: false },
    { name: '시험불안', category: '부정적공부마음', isPositive: false },
  ];

  const getLevel = (score: number): '매우낮음' | '낮음' | '보통' | '높음' | '매우높음' => {
    if (score >= 70) return '매우높음';
    if (score >= 60) return '높음';
    if (score >= 40) return '보통';
    if (score >= 30) return '낮음';
    return '매우낮음';
  };

  return factors.map((f, i) => {
    const variance = Math.floor(Math.random() * 20) - 10;
    const score = Math.max(20, Math.min(80, baseScore + variance));
    return {
      index: i,
      name: f.name,
      category: f.category,
      score,
      level: getLevel(score),
      isPositive: f.isPositive,
    };
  });
};

export const MOCK_STUDENTS: StudentResult[] = [
  {
    id: 's1',
    number: 1,
    name: '김민준',
    lpaType: '몰입자원 풍부형' as LPAType,
    assessedAt: new Date('2026-07-01 09:30'),
    round: 1,
    tScores: Array(38).fill(0).map(() => 50 + Math.floor(Math.random() * 20) - 10),
    avgTScore: 58,
    factorScores: createFactorScores(58),
    typeDescription: '높은 자아 자원과 학습 동기를 바탕으로 자기주도적으로 학습하는 유형입니다.',
    typeCharacteristics: [
      '스스로 목표를 설정하고 달성하려는 의지가 강함',
      '어려움에 처해도 쉽게 포기하지 않음',
      '학습에 대한 내적 동기가 높음',
    ],
    aiSummary: '김민준 학생은 전반적으로 긍정적인 학습 심리 상태를 보이고 있습니다. 특히 자아효능감과 학습동기가 높아 자기주도적 학습이 가능한 상태입니다. 다만 시험불안 영역에서 약간의 관심이 필요하며, 시험 전 적절한 이완 활동을 권장합니다.',
    strengths: createFactorScores(58).filter(f => f.score >= 60).slice(0, 3),
    weaknesses: createFactorScores(58).filter(f => f.score < 45).slice(0, 3),
    needsAttention: false,
    reliabilityWarnings: [],
  },
  {
    id: 's2',
    number: 2,
    name: '이서연',
    lpaType: '안전 균형형' as LPAType,
    assessedAt: new Date('2026-07-01 09:35'),
    round: 1,
    tScores: Array(38).fill(0).map(() => 50 + Math.floor(Math.random() * 10) - 5),
    avgTScore: 52,
    factorScores: createFactorScores(52),
    typeDescription: '전반적으로 안정적인 심리 상태를 보이며, 균형 잡힌 학습 태도를 가진 유형입니다.',
    typeCharacteristics: [
      '안정적인 자아존중감을 유지함',
      '학습에 대한 적절한 동기와 관심을 보임',
      '스트레스 수준이 적정 범위 내에 있음',
    ],
    aiSummary: '이서연 학생은 안정적인 학습 심리 상태를 유지하고 있습니다. 특별히 우려되는 영역은 없으며, 현재의 학습 패턴을 유지하면서 강점 영역을 더욱 발전시킬 수 있도록 격려해 주세요.',
    strengths: createFactorScores(52).filter(f => f.score >= 55).slice(0, 3),
    weaknesses: createFactorScores(52).filter(f => f.score < 48).slice(0, 3),
    needsAttention: false,
    reliabilityWarnings: [],
  },
  {
    id: 's4',
    number: 4,
    name: '최수아',
    lpaType: '자원소진형' as LPAType,
    assessedAt: new Date('2026-07-01 09:40'),
    round: 1,
    tScores: Array(38).fill(0).map(() => 40 + Math.floor(Math.random() * 15) - 10),
    avgTScore: 38,
    factorScores: createFactorScores(38),
    typeDescription: '심리적 에너지가 고갈된 상태로, 회복을 위한 지원이 필요한 유형입니다.',
    typeCharacteristics: [
      '학습에 대한 의욕이 저하된 상태',
      '스트레스와 피로감을 많이 느낌',
      '자신감이 낮아져 있을 수 있음',
    ],
    aiSummary: '최수아 학생은 현재 학업 소진 상태에 있는 것으로 보입니다. 학업스트레스와 학업소진 점수가 높아 즉각적인 관심이 필요합니다. 먼저 학생의 현재 상태를 공감하고, 충분한 휴식과 함께 작은 성취 경험을 통해 자신감을 회복할 수 있도록 도와주세요.',
    strengths: createFactorScores(38).filter(f => f.score >= 45).slice(0, 3),
    weaknesses: createFactorScores(38).filter(f => f.score < 40).slice(0, 3),
    needsAttention: true,
    reliabilityWarnings: [],
  },
];

// 학생 ID로 조회
export const getStudentById = (id: string): StudentResult | undefined => {
  return MOCK_STUDENTS.find(s => s.id === id);
};

// 학생 목록 (간략)
export const MOCK_STUDENT_LIST = MOCK_STUDENTS.map(s => ({
  id: s.id,
  number: s.number,
  name: s.name,
  lpaType: s.lpaType,
  avgTScore: s.avgTScore,
  needsAttention: s.needsAttention,
}));
