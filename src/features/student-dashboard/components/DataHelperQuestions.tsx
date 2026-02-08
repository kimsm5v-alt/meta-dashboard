import { useNavigate } from 'react-router-dom';
import { Search, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';

interface DataHelperQuestionsProps {
  onSelect: (questionId: string) => void;
  answeredQuestions: string[];
}

const QUESTION_GROUPS = [
  {
    id: 'diagnosis',
    label: '진단 해석',
    icon: Search,
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    questions: [
      { id: 'diagnosis-1', label: '총평 상세히 알려줘' },
      { id: 'diagnosis-2', label: '11개 요인에 대해 자세히 알려줘' },
      { id: 'diagnosis-3', label: '이 학생의 강점은?' },
      { id: 'diagnosis-4', label: '이 학생의 보완점은?' },
    ],
  },
  {
    id: 'type',
    label: '유형 해석',
    icon: BarChart3,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    questions: [
      { id: 'type-1', label: '전체 유형별 특징 알려줘' },
      { id: 'type-2', label: '이 학생의 유형 세부특성 알려줘' },
      { id: 'type-3', label: '개인별 특성은 어떻게 알 수 있어?' },
    ],
  },
];

export const DataHelperQuestions: React.FC<DataHelperQuestionsProps> = ({
  onSelect,
  answeredQuestions,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 leading-relaxed">
        궁금한 질문을 선택하면 AI가 이 학생의 데이터를 기반으로 답변해 드려요.
      </p>

      {QUESTION_GROUPS.map(group => {
        const Icon = group.icon;
        return (
          <div key={group.id}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${group.color} flex items-center justify-center`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">{group.label}</h3>
            </div>
            <div className="space-y-2">
              {group.questions.map(q => {
                const isAnswered = answeredQuestions.includes(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => onSelect(q.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all group ${
                      isAnswered
                        ? `${group.bgColor} ${group.borderColor}`
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        isAnswered ? group.textColor : 'text-gray-700 group-hover:text-indigo-700'
                      }`}>
                        {q.label}
                      </span>
                      {isAnswered && (
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${group.textColor}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* AI 어시스턴트 이동 */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 leading-relaxed mb-3">
          더 깊은 분석이 필요하다면 AI 어시스턴트와 자유롭게 대화해 보세요.
        </p>
        <button
          onClick={() => navigate('/ai-room')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
        >
          AI 어시스턴트로 이동하기
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
