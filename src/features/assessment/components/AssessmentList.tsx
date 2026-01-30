import { Eye, Users, Calendar, Clock } from 'lucide-react';
import type { ManagedAssessment } from '@/shared/types';

interface AssessmentListProps {
  assessments: ManagedAssessment[];
  onViewCode: (assessment: ManagedAssessment) => void;
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const getStatusBadge = (assessment: ManagedAssessment) => {
  const now = new Date();
  const endDate = new Date(assessment.endDate);
  const startDate = new Date(assessment.startDate);

  if (now > endDate) {
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
            <button
              onClick={() => onViewCode(assessment)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              코드 보기
            </button>
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
              {formatDate(assessment.startDate)} ~ {formatDate(assessment.endDate)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
