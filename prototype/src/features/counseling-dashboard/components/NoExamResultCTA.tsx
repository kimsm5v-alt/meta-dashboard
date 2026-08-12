/**
 * 검사 미완료 학생 안내 CTA 컴포넌트
 *
 * 개별 코칭에서 검사 결과가 없는 학생 선택 시 표시
 * 미니멀한 디자인으로 핵심 메시지와 액션에 집중
 */

import { FileSearch, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NoExamResultCTAProps {
  studentName: string;
  className?: string;
}

export const NoExamResultCTA: React.FC<NoExamResultCTAProps> = ({
  studentName,
}) => {
  const navigate = useNavigate();

  const handleGoToExamManagement = () => {
    navigate('/exam/management');
  };

  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* 아이콘 */}
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
        <FileSearch className="w-8 h-8 text-gray-400" />
      </div>

      {/* 메시지 */}
      <p className="text-gray-400 text-sm mb-1">검사 결과 없음</p>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        {studentName} 학생은 아직 검사를 완료하지 않았습니다
      </h2>
      <p className="text-gray-500 text-sm text-center max-w-sm mb-8">
        검사 완료 후 맞춤형 코칭 전략을 확인할 수 있습니다
      </p>

      {/* 액션 버튼 */}
      <button
        onClick={handleGoToExamManagement}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
      >
        검사 관리로 이동
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default NoExamResultCTA;
