/**
 * 결과보기 - 위험군 현황
 *
 * 관심 필요 학생 수, 신뢰도 주의 학생 목록
 */

import { AlertTriangle, AlertCircle, ChevronRight } from 'lucide-react';
import type { RiskStudent } from '../types';

interface RiskStudentsListProps {
  students: RiskStudent[];
  onStudentClick: (studentId: string) => void;
}

export const RiskStudentsList: React.FC<RiskStudentsListProps> = ({
  students,
  onStudentClick,
}) => {
  const attentionStudents = students.filter((s) => s.type === 'attention');
  const reliabilityStudents = students.filter((s) => s.type === 'reliability');

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">위험군 현황</h3>

      <div className="space-y-4">
        {/* 관심 필요 학생 */}
        {attentionStudents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                관심 필요 ({attentionStudents.length}명)
              </span>
            </div>
            <div className="space-y-2">
              {attentionStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => onStudentClick(student.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-left"
                >
                  <span className="w-7 h-7 rounded-full bg-red-100 text-red-700 text-sm font-medium flex items-center justify-center">
                    {student.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900">{student.name}</span>
                    <p className="text-xs text-red-600 mt-0.5 truncate">{student.reason}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 신뢰도 주의 학생 */}
        {reliabilityStudents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                신뢰도 주의 ({reliabilityStudents.length}명)
              </span>
            </div>
            <div className="space-y-2">
              {reliabilityStudents.map((student) => (
                <button
                  key={student.id}
                  onClick={() => onStudentClick(student.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors text-left"
                >
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center justify-center">
                    {student.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900">{student.name}</span>
                    <p className="text-xs text-amber-600 mt-0.5 truncate">{student.reason}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 위험군 없음 */}
        {students.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-gray-500">관심이 필요한 학생이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskStudentsList;
