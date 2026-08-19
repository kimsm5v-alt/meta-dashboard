/**
 * 개별코칭 STEP2(강점 인정)·STEP3(맞춤 코칭) 콘텐츠.
 *
 * 백엔드 콘텐츠 API 연동 전 임시 데이터 — 프로토타입 mock(MOCK_STUDENT_COACHING_DATA,
 * studentId 'student-1', 자원소진형 예시)을 학생 이름만 실제 값으로 치환해 그대로 사용한다.
 * 학생의 실제 예측 유형과 무관하게 항상 이 콘텐츠를 반환한다(프로토타입에 다른 5개 유형
 * 예시가 없어 선택한 임시 방침). 실제 콘텐츠 API가 나오면 이 함수 내부만 교체하면 된다.
 */

export interface IndividualStrengthPraise {
  factor: string;
  area: string;
  observation: string;
  praiseLine: string;
  praiseQuestion: string;
}

export interface IndividualCoachingPathway {
  weakFactor: string;
  focusFactor: string;
  targetFactor: string;
  interpretation: string;
  coaching1Method: string;
  coaching1Line: string;
  coaching2Action: string;
  coaching2Line: string;
}

export function getIndividualCoachingContent(studentName: string): {
  strengthPraises: IndividualStrengthPraise[];
  coachingPathway: IndividualCoachingPathway;
} {
  return {
    strengthPraises: [
      {
        factor: '자아존중감',
        area: '정적요인 · 개인요인',
        observation: `자원소진형은 심리적 에너지가 많이 소모되면 자신의 능력과 가치를 부정적으로 바라보기 쉬울 수 있어요. 다행히 ${studentName}이는 자신의 능력과 가치를 전반적으로 긍정적으로 평가하고 자신을 존중하는 태도를 잘 유지하고 있습니다.`,
        praiseLine:
          '자신의 능력과 가치를 긍정적으로 바라보고 스스로를 소중히 여기는 마음이 참 멋지네.',
        praiseQuestion: '요즘 너 스스로가 마음에 든다고 느꼈던 순간은 언제였어?',
      },
      {
        factor: '타인정서인식',
        area: '정적요인 · 개인요인',
        observation: `자원소진형은 심리적 여유가 줄어들면 주변 사람의 표정이나 상황을 살피는 일이 어려울 수 있어요. 다행히 ${studentName}이는 상대방의 기분과 처한 상황에서 느끼는 감정을 잘 이해하는 편입니다.`,
        praiseLine: '친구의 기분과 상황을 살펴 그 마음을 이해하는 모습이 참 세심하네.',
        praiseQuestion: '친구 기분을 알아차렸을 때 어떤 일이 있었는지 궁금해.',
      },
    ],
    coachingPathway: {
      weakFactor: '게임 과몰입',
      focusFactor: '수업태도',
      targetFactor: '학업성취도',
      interpretation: `${studentName}이는 인터넷 게임에 깊이 빠져드는 정도가 아직 조절되지 않은 상태일 수 있습니다. 이 부분은 학업과 특히 관련이 깊은 지점으로 나타난 만큼, 이 부분을 채워가는 과정에서 수업에 집중하고 필요한 준비를 챙기는 습관도 함께 살펴봐 주세요.`,
      coaching1Method: '게임을 시작하면 스스로 멈추기 어려워지는 순간이 언제인지 물어봐 주세요',
      coaching1Line: '게임하다 보면 어느 순간에 그만두기가 제일 힘들어?',
      coaching2Action: '게임 시간을 줄이는 방법 하나를 직접 고르게 하고, 오늘 실천해보게 해주세요',
      coaching2Line:
        '알람 맞추기, 정해진 시간만 하기, 부모님께 잠깐 맡기기 중 하나를 직접 고르게 하고, 오늘 하루만 실천해보는 작은 약속으로 다시 시도하게 해주세요.',
    },
  };
}
