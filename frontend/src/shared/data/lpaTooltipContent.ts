export const LPA_TOOLTIP_TITLE = '학생유형 분포 비교';

export const LPA_TOOLTIP_LINES = [
  '비상교육은 학생을 단순한 점수로 구분하지 않고, 학습 특성이 함께 나타나는 패턴을 분석하기 위해 LPA 기반 학습유형 분석을 도입했습니다.',
  'LPA는 최근 교육·심리·사회과학 연구에서 활용되는 통계 분석 기법으로, 학생의 학습 부담, 심리·정서적 자원, 학습 몰입을 종합적으로 살펴 유사한 학습 상태를 유형화합니다.',
  '이를 통해 선생님께서는 학생의 현재 상태를 더 입체적으로 이해하고, 유형별로 필요한 지원 방향을 확인할 수 있습니다.',
] as const;

export const LPA_TYPE_DESCRIPTIONS_ELEMENTARY: Record<string, string> = {
  자원소진형:
    '학습에 필요한 심리·정서적 자원이 상대적으로 낮고, 기대나 부담은 크게 느끼는 유형입니다. 먼저 부담을 낮추고 작은 성공 경험을 통해 학습 회복감을 키워주세요.',
  '안전 균형형':
    '전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다. 계획·점검 습관을 함께 길러주세요.',
  '몰입자원 풍부형':
    '긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 강점을 유지하면서 도전 목표와 깊이 있는 학습 경험으로 확장해주세요.',
};

export const LPA_TYPE_DESCRIPTIONS_MIDDLE: Record<string, string> = {
  '냉소적 무기력형':
    '심리·정서적 자원이 상대적으로 낮고, 성적과 공부 부담을 크게 느끼는 유형입니다. 먼저 부담을 낮추고 정서적 회복감과 작은 성취 경험을 만들어주세요.',
  '정서조절 취약형':
    '학습 자원은 일정 수준 있으나, 성적 압박과 소진을 크게 느끼는 유형입니다. 학습 전략뿐 아니라 감정 조절과 부담 관리 방법을 함께 지원해주세요.',
  '자기주도 몰입형':
    '심리·정서적 자원이 풍부하고 자기주도적 몰입 가능성이 높은 유형입니다. 현재의 강점을 유지하면서 도전 목표와 심화 학습 기회를 제공해주세요.',
};

export const getLpaTypeDescriptions = (schoolLevel: string): Record<string, string> =>
  schoolLevel === '중등' || schoolLevel === 'middle'
    ? LPA_TYPE_DESCRIPTIONS_MIDDLE
    : LPA_TYPE_DESCRIPTIONS_ELEMENTARY;
