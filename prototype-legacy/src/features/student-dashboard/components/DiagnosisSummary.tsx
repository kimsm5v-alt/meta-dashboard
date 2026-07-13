import type { StudentType } from '../../../shared/types';

interface DiagnosisSummaryProps {
  tScores: number[];
  studentType: StudentType;
}

// 목업 AI 총평 텍스트 (실제 구현 시 API 연동)
const MOCK_SUMMARIES: Record<StudentType, string> = {
  '소진형': '이 학생은 전반적으로 심리·정서적 에너지가 고갈된 상태입니다. 자아효능감과 자아존중감이 낮아 내적 동기가 부족하며, 스트레스 수준이 높고 정서 조절에 어려움을 겪고 있습니다. 부모나 교사의 기대에 대한 부담감이 높고, 스마트폰이나 게임에 과도하게 의존하는 경향이 보입니다. 학습 전략 활용이 미흡하여 학업 성취에도 영향을 받고 있으므로, 정서적 지지와 함께 작은 성공 경험을 쌓을 수 있도록 단계적 목표 설정이 필요합니다.',
  '균형형': '이 학생은 심리·정서적 자원이 전반적으로 균형 잡힌 상태입니다. 자아효능감, 자아존중감, 학습 동기 등이 또래 평균 수준이며, 학습 전략을 안정적으로 활용하고 있습니다. 스트레스 관리 능력도 적절한 편이고, 교우 관계와 교사·부모와의 관계도 원만합니다. 현재 상태를 유지하면서 본인의 강점 영역을 더 발전시키고, 약한 부분은 점진적으로 보완해 나가는 것이 좋겠습니다.',
  '몰입형': '이 학생은 심리·정서적 자원이 풍부하고 학습에 대한 몰입도가 높습니다. 높은 자아효능감과 자율성을 바탕으로 주도적인 학습을 하며, 내재적 동기가 강합니다. 스트레스 상황에서도 안정적으로 대처하고, 긍정적인 정서 상태를 유지합니다. 다양한 학습 전략을 효과적으로 활용하며, 메타인지 능력도 우수합니다. 도전적인 과제를 통해 더 큰 성장을 이끌어낼 수 있으며, 리더십 역할을 맡기면 좋을 것입니다.',
};

export const DiagnosisSummary: React.FC<DiagnosisSummaryProps> = ({
  studentType,
}) => {
  // 목업: 유형에 따른 고정 텍스트 (추후 API 연동)
  const summary = MOCK_SUMMARIES[studentType] || MOCK_SUMMARIES['균형형'];

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-50 border border-indigo-100/50 p-5">
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200/30 to-purple-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-200/30 to-blue-200/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex gap-4">
        {/* HSJ 스타일: 좌측 아이콘 */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg shadow-purple-200">
          ✨
        </div>

        {/* 우측 콘텐츠 */}
        <div className="flex-1 min-w-0">
          {/* 헤더 */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-bold text-gray-900">AI 분석 총평</h3>
          </div>

          {/* 본문 */}
          <p className="text-[15px] text-gray-700 leading-relaxed">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisSummary;
