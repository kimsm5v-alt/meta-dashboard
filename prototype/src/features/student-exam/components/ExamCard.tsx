/**
 * 검사 카드 컴포넌트
 */

import { ClipboardList, Play, RotateCcw, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import { Card, Button } from '@/shared/components';
import type { StudentExamListItem } from '../types';
import { getStatusLabel, getStatusColor } from '../services/studentExamService';

interface ExamCardProps {
  exam: StudentExamListItem;
  onStartExam: (exam: StudentExamListItem) => void;
  onResumeExam: (exam: StudentExamListItem) => void;
  onViewResult: (exam: StudentExamListItem) => void;
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onStartExam,
  onResumeExam,
  onViewResult,
}) => {
  const statusColor = getStatusColor(exam.status);
  const statusLabel = getStatusLabel(exam.status);

  const renderActionButton = () => {
    switch (exam.status) {
      case 'waiting':
        return (
          <Button onClick={() => onStartExam(exam)} className="w-full justify-center">
            <Play className="w-4 h-4 mr-2" />
            응시하기
          </Button>
        );
      case 'in_progress':
        return (
          <Button onClick={() => onResumeExam(exam)} className="w-full justify-center">
            <RotateCcw className="w-4 h-4 mr-2" />
            이어하기
          </Button>
        );
      case 'completed':
        return (
          <Button variant="secondary" disabled className="w-full justify-center">
            <Clock className="w-4 h-4 mr-2" />
            결과 준비중
          </Button>
        );
      case 'result_ready':
        return (
          <Button variant="secondary" onClick={() => onViewResult(exam)} className="w-full justify-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            결과보기
          </Button>
        );
      default:
        return null;
    }
  };

  const renderStatusIcon = () => {
    switch (exam.status) {
      case 'waiting':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'in_progress':
        return <RotateCcw className="w-5 h-5 text-amber-500" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      case 'result_ready':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
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
          exam.status === 'completed' ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <ClipboardList className={`w-6 h-6 ${
            exam.status === 'result_ready' ? 'text-green-600' :
            exam.status === 'in_progress' ? 'text-amber-600' :
            exam.status === 'completed' ? 'text-blue-600' : 'text-gray-500'
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

          {/* 진행률 (진행중일 때만) */}
          {exam.status === 'in_progress' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-500">진행률</span>
                <span className="font-medium text-gray-700">
                  {exam.answeredCount}/{exam.totalQuestions} ({exam.progress}%)
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${exam.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 완료일 (완료/결과 준비 상태일 때) */}
          {exam.submittedAt && (exam.status === 'completed' || exam.status === 'result_ready') && (
            <p className="text-sm text-gray-500 mt-2">
              완료일: {exam.submittedAt}
            </p>
          )}

          {/* 액션 버튼 */}
          <div className="mt-4">
            {renderActionButton()}
          </div>
        </div>
      </div>
    </Card>
  );
};
