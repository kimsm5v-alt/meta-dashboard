/**
 * 학생 상담 - 전체 현황 - 반별 상담 현황 테이블
 *
 * 반별 관심 필요 학생 수, 우선순위 학생 미리보기
 */

import { ChevronRight } from 'lucide-react';

interface ClassCounselingStatus {
  classId: string;
  className: string;
  totalStudents: number;
  priorityCount: number;
  strengthCount: number;
  reliabilityCount: number;
  counseledThisMonth: number;
}

interface ClassCounselingStatusTableProps {
  classes: ClassCounselingStatus[];
  onClassClick?: (classId: string) => void;
}

export const ClassCounselingStatusTable: React.FC<ClassCounselingStatusTableProps> = ({
  classes,
  onClassClick,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">반별 상담 현황</h3>
        <p className="text-sm text-gray-500 mt-1">각 반의 상담 필요 학생을 확인하세요.</p>
      </div>

      {/* 테이블 */}
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              반
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              전체
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              상담 우선
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              신뢰도 확인
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              강점 활용
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              이번 달 상담
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {classes.map((cls) => (
            <tr
              key={cls.classId}
              className={`hover:bg-gray-50 transition-colors ${onClassClick ? 'cursor-pointer' : ''}`}
              onClick={() => onClassClick?.(cls.classId)}
            >
              <td className="px-6 py-4">
                <span className="font-semibold text-gray-900">{cls.className}</span>
              </td>
              <td className="px-4 py-4 text-center">
                <span className="text-gray-700 font-medium">{cls.totalStudents}명</span>
              </td>
              <td className="px-4 py-4 text-center">
                {cls.priorityCount > 0 ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                    {cls.priorityCount}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 text-center">
                {cls.reliabilityCount > 0 ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold text-sm">
                    {cls.reliabilityCount}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 text-center">
                {cls.strengthCount > 0 ? (
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                    {cls.strengthCount}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 text-center">
                <span className="text-gray-600">{cls.counseledThisMonth}회</span>
              </td>
              <td className="px-4 py-4 text-right">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {classes.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">담당 반이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default ClassCounselingStatusTable;
