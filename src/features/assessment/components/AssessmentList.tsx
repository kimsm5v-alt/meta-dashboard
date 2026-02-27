import { Eye, Users, Calendar, Clock, StopCircle, Trash2 } from 'lucide-react';
import type { ManagedAssessment } from '@/shared/types';

interface AssessmentListProps {
  assessments: ManagedAssessment[];
  onViewCode: (assessment: ManagedAssessment) => void;
  onEndExam?: (assessment: ManagedAssessment) => void;
  onCancelExam?: (assessment: ManagedAssessment) => void;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const getStatusBadge = (assessment: ManagedAssessment) => {
  // isActive 필드가 있으면 우선 사용 (API 응답 기준)
  if (assessment.isActive === false) {
    return (
      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
        종료됨
      </span>
    );
  }
  if (assessment.isActive === true) {
    return (
      <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
        진행중
      </span>
    );
  }

  // isActive가 없으면 날짜로 판단 (레거시)
  const now = new Date();
  const endDate = assessment.endDate ? new Date(assessment.endDate) : null;
  const startDate = new Date(assessment.startDate);

  if (endDate && now > endDate) {
    return (
      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
        종료됨
      </span>
    );
  }
  if (now < startDate) {
    return (
      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
        예정
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
      진행중
    </span>
  );
};

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  onViewCode,
  onEndExam,
  onCancelExam,
}) => {
  return (
    <div className="divide-y divide-gray-100">
      {assessments.map((assessment) => (
        <div
          key={assessment.id}
          className="p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h5 className="font-medium text-gray-900">{assessment.name}</h5>
              {getStatusBadge(assessment)}
              <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full">
                {assessment.round}차
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewCode(assessment)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                코드 보기
              </button>
              {assessment.isActive && onEndExam && (
                <button
                  onClick={() => onEndExam(assessment)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  <StopCircle className="w-4 h-4" />
                  종료
                </button>
              )}
              {onCancelExam && (
                <button
                  onClick={() => onCancelExam(assessment)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  취소
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {assessment.grade}학년 {assessment.classNumber}반
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {assessment.completedCount}/{assessment.studentCount}명 완료
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(assessment.startDate)}
              {assessment.endDate ? ` ~ ${formatDate(assessment.endDate)}` : ' ~'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
