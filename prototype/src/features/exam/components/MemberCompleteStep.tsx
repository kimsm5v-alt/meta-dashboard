/**
 * 회원용 검사 완료 화면
 * 이메일 입력 없이 바로 완료 메시지 표시
 */

import { useNavigate } from 'react-router-dom';
import { CheckCircle2, BarChart3, ClipboardList } from 'lucide-react';

interface MemberCompleteStepProps {
  userName: string;
}

export const MemberCompleteStep: React.FC<MemberCompleteStepProps> = ({
  userName,
}) => {
  const navigate = useNavigate();

  const handleViewResult = () => {
    navigate('/student/result');
  };

  const handleBackToList = () => {
    navigate('/student/exams');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 완료 메시지 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">검사 완료!</h1>
          <p className="text-gray-600">
            {userName}님, 수고하셨습니다.
          </p>
        </div>

        {/* 안내 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">결과 확인 안내</h3>
              <p className="text-sm text-gray-600">
                검사가 종료되면 대시보드에서<br />
                결과를 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="space-y-3">
          <button
            onClick={handleBackToList}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <ClipboardList className="w-5 h-5" />
            검사 목록으로
          </button>
        </div>
      </div>
    </div>
  );
};
