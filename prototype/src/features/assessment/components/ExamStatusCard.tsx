/**
 * 검사관리 (반 전체) - 응시 현황 카드
 *
 * 응시율 %, 응시 완료/전체, 미응시 명단
 */

import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ExamStatus, StudentExamStatus } from '../types';
import { EXAM_STATUS_LABELS, EXAM_STATUS_STYLES } from '../types';

interface ExamStatusCardProps {
  className: string;
  round: 1 | 2;
  status: ExamStatus;
  submittedCount: number;
  totalCount: number;
  students: StudentExamStatus[];
  onStartExam: () => void;
  onEndExam: () => void;
  onCancelExam: () => void;
  onRestartExam: () => void;
}

/** 응시율 계산 */
const calculateRate = (submitted: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((submitted / total) * 100);
};

/** 미응시 학생 필터 */
const getNotSubmittedStudents = (students: StudentExamStatus[]): StudentExamStatus[] => {
  return students.filter((s) => !s.submitted);
};

export const ExamStatusCard: React.FC<ExamStatusCardProps> = ({
  className,
  round,
  status,
  submittedCount,
  totalCount,
  students,
  onStartExam,
  onEndExam,
  onCancelExam,
  onRestartExam,
}) => {
  const rate = calculateRate(submittedCount, totalCount);
  const notSubmittedStudents = getNotSubmittedStudents(students);
  const statusStyle = EXAM_STATUS_STYLES[status];

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{className}</h2>
          <span className="text-sm text-gray-500">{round}차 검사</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
            {EXAM_STATUS_LABELS[status]}
          </span>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2">
          {status === 'not_started' && (
            <button
              onClick={onStartExam}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              검사 시작
            </button>
          )}
          {status === 'in_progress' && (
            <>
              <button
                onClick={onEndExam}
                disabled={submittedCount === 0}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                검사 종료
              </button>
              <button
                onClick={onCancelExam}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                검사 취소
              </button>
            </>
          )}
          {status === 'completed' && (
            <button
              onClick={onRestartExam}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              재검사
            </button>
          )}
        </div>
      </div>

      {/* 응시 현황 */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 응시율 */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke={rate >= 80 ? '#10B981' : rate >= 50 ? '#F59E0B' : '#6B7280'}
                  strokeWidth="6"
                  strokeDasharray={`${(rate / 100) * 220} 220`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{rate}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">응시율</p>
              <p className="text-lg font-semibold text-gray-900">
                {submittedCount} / {totalCount}명
              </p>
            </div>
          </div>

          {/* 응시 완료 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">응시 완료</p>
              <p className="text-lg font-semibold text-gray-900">{submittedCount}명</p>
            </div>
          </div>

          {/* 미응시 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">미응시</p>
              <p className="text-lg font-semibold text-gray-900">{notSubmittedStudents.length}명</p>
            </div>
          </div>
        </div>

        {/* 미응시 학생 명단 */}
        {notSubmittedStudents.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">
                미응시 학생 ({notSubmittedStudents.length}명)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {notSubmittedStudents.map((student) => (
                <span
                  key={student.id}
                  className="px-3 py-1.5 bg-orange-50 text-orange-700 text-sm rounded-lg"
                >
                  {student.number}. {student.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamStatusCard;
