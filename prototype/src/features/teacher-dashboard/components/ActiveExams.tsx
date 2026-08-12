/**
 * 홈 > Section 2: 진행 중 검사 현황
 *
 * 검사관리 > 전체의 검사 현황 테이블 (1차/2차 구분)
 */

import { useNavigate } from 'react-router-dom';
import { useLayoutContext } from '@/app/LayoutV2';

interface ExamRoundData {
  status: 'not_started' | 'in_progress' | 'completed';
  submittedCount: number;
  totalCount: number;
  submissionRate: number;
}

interface ClassExam {
  className: string;
  round1: ExamRoundData;
  round2: ExamRoundData;
}

interface ActiveExamsProps {
  exams: ClassExam[];
}

const STATUS_LABELS = {
  not_started: '시작 전',
  in_progress: '진행 중',
  completed: '완료',
};

const STATUS_STYLES = {
  not_started: { bg: 'bg-gray-100', text: 'text-gray-500' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

const StatusBadge: React.FC<{ status: ExamRoundData['status'] }> = ({ status }) => {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center justify-center w-14 px-1.5 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
      {STATUS_LABELS[status]}
    </span>
  );
};

const RoundProgressBar: React.FC<{ data: ExamRoundData }> = ({ data }) => {
  const getBarColor = () => {
    if (data.status === 'not_started') return 'bg-gray-200';
    if (data.status === 'completed') return 'bg-gray-400';
    return 'bg-blue-500';
  };

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={data.status} />
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getBarColor()}`}
          style={{ width: `${data.submissionRate}%` }}
        />
      </div>
      <span className="w-24 text-xs text-gray-600 text-right whitespace-nowrap">
        {data.submissionRate}% ({data.submittedCount}/{data.totalCount})
      </span>
    </div>
  );
};

export const ActiveExams: React.FC<ActiveExamsProps> = ({ exams }) => {
  const navigate = useNavigate();
  const { setScope } = useLayoutContext();

  const handleManagement = (className: string) => {
    setScope(className);
    navigate('/exam/management');
  };

  const handleResult = (className: string) => {
    setScope(className);
    navigate('/exam/result');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">검사 현황</h3>
      </div>

      <div className="overflow-x-auto px-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                반
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                1차 응시율
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                2차 응시율
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-64">
                바로가기
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams.map((exam, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900">{exam.className}</span>
                </td>
                <td className="px-4 py-4">
                  <RoundProgressBar data={exam.round1} />
                </td>
                <td className="px-4 py-4">
                  <RoundProgressBar data={exam.round2} />
                </td>
                <td className="px-4 py-4">
                  {(() => {
                    const hasCompleted = exam.round1.status === 'completed' || exam.round2.status === 'completed';
                    const isInProgress = exam.round1.status === 'in_progress' || exam.round2.status === 'in_progress';

                    return (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleResult(exam.className)}
                          disabled={!hasCompleted}
                          className={`w-16 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                            hasCompleted
                              ? 'text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300'
                              : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          결과보기
                        </button>
                        <button
                          onClick={() => handleManagement(exam.className)}
                          className="w-16 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded transition-colors"
                        >
                          검사관리
                        </button>
                        <button
                          onClick={() => isInProgress && alert(`${exam.className} 미제출 학생에게 알림을 전송합니다.`)}
                          disabled={!isInProgress}
                          className={`w-16 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                            isInProgress
                              ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300'
                              : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          독려알림
                        </button>
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActiveExams;
