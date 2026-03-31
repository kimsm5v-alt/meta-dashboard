/**
 * 검사 카드 컴포넌트
 */

import { ClipboardList, Play, RotateCcw, BarChart3, Clock, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, Button } from '@/shared/components';
import type { StudentExamListItem } from '../types';
import { getStatusLabel, getStatusColor } from '../services/studentExamService';

interface ExamCardProps {
  exam: StudentExamListItem;
  onStartExam: (exam: StudentExamListItem) => void;
  onResumeExam: (exam: StudentExamListItem) => void;
  onRestartExam: (exam: StudentExamListItem) => void;
  onViewResult: (exam: StudentExamListItem) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onStartExam,
  onResumeExam,
  onRestartExam,
  onViewResult,
}) => {
  const statusColor = getStatusColor(exam.status);
  const statusLabel = getStatusLabel(exam.status);

  /** 제출날짜 포맷 (yyyy. mm. dd.) */
  const formatSubmitDate = (dateStr: string | null): string => {
    if (!dateStr) return '미제출';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}. ${month}. ${day}.`;
  };

  /** 상태별 안내 메시지 */
  const renderStatusMessage = () => {
    switch (exam.status) {
      case 'waiting':
        return (
          <p className="text-sm text-blue-600 bg-blue-50 rounded-lg p-3 mt-3">
            시작하기 버튼을 누르면 검사를 진행할 수 있어요.
          </p>
        );
      case 'in_progress':
        return (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mt-3">
            검사가 중단되었어요. 검사를 다시 시도해 주세요.
          </p>
        );
      case 'completed':
        return (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-3">
            검사가 종료되었습니다! 우리 반 친구가 모두 완료하면 결과를 확인할 수 있어요.
            <br />
            <span className="text-gray-500">제출날짜: {formatSubmitDate(exam.submittedAt)}</span>
          </p>
        );
      case 'result_ready':
        return (
          <p className="text-sm text-green-600 bg-green-50 rounded-lg p-3 mt-3">
            검사가 종료되었습니다! 결과를 확인해보세요.
            <br />
            <span className="text-gray-500">제출날짜: {formatSubmitDate(exam.submittedAt)}</span>
          </p>
        );
      case 'not_submitted':
        return (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mt-3">
            검사 기간에 답변을 제출하지 않았어요.
            <br />
            <span className="text-gray-500">제출날짜: 미제출</span>
          </p>
        );
      default:
        return null;
    }
  };

  const renderActionButton = () => {
    switch (exam.status) {
      case 'waiting':
        return (
          <Button onClick={() => onStartExam(exam)} className="w-full justify-center">
            <Play className="w-4 h-4 mr-2" />
            시작하기
          </Button>
        );
      case 'in_progress':
        return (
          <div className="flex gap-2">
            <Button onClick={() => onResumeExam(exam)} className="flex-1 justify-center">
              <RotateCcw className="w-4 h-4 mr-2" />
              이어하기
            </Button>
            <Button variant="secondary" onClick={() => onRestartExam(exam)} className="flex-1 justify-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              새로하기
            </Button>
          </div>
        );
      case 'completed':
        return (
          <Button variant="secondary" disabled className="w-full justify-center">
            <Clock className="w-4 h-4 mr-2" />
            결과대기
          </Button>
        );
      case 'result_ready':
        return (
          <Button variant="secondary" onClick={() => onViewResult(exam)} className="w-full justify-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            결과 보기
          </Button>
        );
      case 'not_submitted':
        return (
          <Button variant="secondary" disabled className="w-full justify-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            검사 미응시
          </Button>
        );
      default:
        return null;
    }
  };

  const renderStatusIcon = () => {
    switch (exam.status) {
      case 'waiting':
        return <Clock className="w-3.5 h-3.5" />;
      case 'in_progress':
        return <RotateCcw className="w-3.5 h-3.5" />;
      case 'completed':
        return <Clock className="w-3.5 h-3.5" />;
      case 'result_ready':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'not_submitted':
        return <AlertCircle className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* 아이콘 */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          exam.status === 'result_ready' ? 'bg-green-100' :
          exam.status === 'in_progress' ? 'bg-amber-100' :
          exam.status === 'completed' ? 'bg-gray-100' :
          exam.status === 'not_submitted' ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          <ClipboardList className={`w-6 h-6 ${
            exam.status === 'result_ready' ? 'text-green-600' :
            exam.status === 'in_progress' ? 'text-amber-600' :
            exam.status === 'completed' ? 'text-gray-600' :
            exam.status === 'not_submitted' ? 'text-red-600' : 'text-blue-600'
          }`} />
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{exam.name}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
              {renderStatusIcon()}
              {statusLabel}
            </span>
          </div>

          {/* 상태별 안내 메시지 */}
          {renderStatusMessage()}

          {/* 액션 버튼 */}
          <div className="mt-4">
            {renderActionButton()}
          </div>
        </div>
      </div>
    </Card>
  );
};
