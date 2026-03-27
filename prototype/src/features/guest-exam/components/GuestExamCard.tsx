/**
 * 게스트용 검사 카드 컴포넌트
 * 학생용 ExamCard를 심플하게 변형
 */

import { ClipboardList, Play, RotateCcw, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components';
import type { StudentExamListItem } from '@/features/student-exam/types';
import { getStatusLabel, getStatusColor } from '../services/guestExamService';

interface GuestExamCardProps {
  exam: StudentExamListItem;
  onStartExam: (exam: StudentExamListItem) => void;
  onResumeExam: (exam: StudentExamListItem) => void;
  onRestartExam: (exam: StudentExamListItem) => void;
}

export const GuestExamCard: React.FC<GuestExamCardProps> = ({
  exam,
  onStartExam,
  onResumeExam,
  onRestartExam,
}) => {
  const statusColor = getStatusColor(exam.status);
  const statusLabel = getStatusLabel(exam.status);

  const renderStatusIcon = () => {
    switch (exam.status) {
      case 'waiting':
        return <Clock className="w-3.5 h-3.5" />;
      case 'in_progress':
        return <RotateCcw className="w-3.5 h-3.5" />;
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const renderActionButton = () => {
    switch (exam.status) {
      case 'waiting':
        return (
          <button
            onClick={() => onStartExam(exam)}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Play className="w-5 h-5" />
            검사 시작
          </button>
        );
      case 'in_progress':
        return (
          <div className="flex gap-3">
            <button
              onClick={() => onResumeExam(exam)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              이어하기
            </button>
            <button
              onClick={() => onRestartExam(exam)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              새로하기
            </button>
          </div>
        );
      case 'completed':
        return (
          <div className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-100 text-green-700 font-medium rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
            검사 완료
          </div>
        );
      default:
        return null;
    }
  };

  const renderStatusMessage = () => {
    switch (exam.status) {
      case 'waiting':
        return (
          <p className="text-sm text-blue-600">
            검사를 시작해주세요.
          </p>
        );
      case 'in_progress':
        return (
          <p className="text-sm text-amber-600">
            검사가 중단되었어요. 이어서 진행해주세요.
          </p>
        );
      case 'completed':
        return (
          <p className="text-sm text-green-600">
            검사가 완료되었습니다. 결과는 이메일로 발송됩니다.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-start gap-4 mb-4">
        {/* 아이콘 */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          exam.status === 'completed' ? 'bg-green-100' :
          exam.status === 'in_progress' ? 'bg-amber-100' : 'bg-primary-100'
        }`}>
          <ClipboardList className={`w-7 h-7 ${
            exam.status === 'completed' ? 'text-green-600' :
            exam.status === 'in_progress' ? 'text-amber-600' : 'text-primary-600'
          }`} />
        </div>

        {/* 내용 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{exam.name}</h3>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
            {renderStatusIcon()}
            {statusLabel}
          </span>
        </div>
      </div>

      {/* 상태 메시지 */}
      <div className="mb-4">
        {renderStatusMessage()}
      </div>

      {/* 액션 버튼 */}
      {renderActionButton()}
    </div>
  );
};
