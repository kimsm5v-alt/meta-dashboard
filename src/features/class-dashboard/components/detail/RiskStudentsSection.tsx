import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, ExternalLink } from 'lucide-react';
import type { RiskStudent } from '../../hooks/useClassDetailData';

interface RiskStudentsSectionProps {
  criticalStudents: RiskStudent[];
  watchListStudents: RiskStudent[];
  classId: string;
}

const DIRECTION_LABEL: Record<string, string> = {
  low: '낮음',
  high: '높음',
};

export const RiskStudentsSection: React.FC<RiskStudentsSectionProps> = ({
  criticalStudents,
  watchListStudents,
  classId,
}) => {
  const navigate = useNavigate();

  const goToStudent = (studentId: string) => {
    navigate(`/dashboard/class/${classId}/student/${studentId}`);
  };

  const renderReasons = (rs: RiskStudent) => {
    return rs.reasons.map((r, i) => (
      <span key={i} className="inline-block text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mr-1 mb-1">
        {r.category} {DIRECTION_LABEL[r.direction]}
      </span>
    ));
  };

  const renderSevereFactors = (rs: RiskStudent) => {
    if (rs.severeFactors.length === 0) return <span className="text-xs text-gray-400">-</span>;
    return rs.severeFactors.map((f, i) => (
      <span key={i} className="inline-block text-xs bg-red-50 text-red-600 font-semibold px-1.5 py-0.5 rounded mr-1 mb-1">
        {f.name} T={f.score}
      </span>
    ));
  };

  const StudentTable: React.FC<{
    students: RiskStudent[];
    accent: 'red' | 'amber';
  }> = ({ students, accent }) => {
    if (students.length === 0) {
      return (
        <p className="text-sm text-gray-400 py-4 text-center">해당하는 학생이 없습니다.</p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-50/50">
              <th className="p-3 text-left font-semibold text-gray-600 w-16">번호</th>
              <th className="p-3 text-left font-semibold text-gray-600 w-24">이름</th>
              <th className="p-3 text-left font-semibold text-gray-600 w-36">유형</th>
              <th className="p-3 text-left font-semibold text-gray-600">관심 사유</th>
              <th className="p-3 text-left font-semibold text-gray-600">심각 요인</th>
              <th className="p-3 text-left font-semibold text-gray-600 w-24">상세</th>
            </tr>
          </thead>
          <tbody>
            {students.map((rs) => (
              <tr
                key={rs.student.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  accent === 'red' ? 'hover:bg-red-50/30' : 'hover:bg-amber-50/30'
                }`}
              >
                <td className="p-3 text-gray-700">{rs.student.number}</td>
                <td className="p-3 font-medium text-gray-800">{rs.student.name}</td>
                <td className="p-3 text-gray-600 text-xs">{rs.assessment.predictedType}</td>
                <td className="p-3">{renderReasons(rs)}</td>
                <td className="p-3">{renderSevereFactors(rs)}</td>
                <td className="p-3">
                  <button
                    onClick={() => goToStudent(rs.student.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors whitespace-nowrap"
                  >
                    보기
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 긴급 관심 */}
      <div>
        <div className="flex items-center gap-2 mb-3 bg-red-50/50 border border-red-200 p-3 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <div>
            <h3 className="font-bold text-red-700 text-sm">
              긴급 관심 필요 ({criticalStudents.length}명)
            </h3>
            <p className="text-xs text-gray-500">
              복합 위험 요인 보유 또는 극단적 T점수 (부적 ≥70 / 정적 ≤29)
            </p>
          </div>
        </div>
        <StudentTable students={criticalStudents} accent="red" />
      </div>

      {/* 관찰 필요 */}
      <div>
        <div className="flex items-center gap-2 mb-3 bg-amber-50/50 border border-amber-200 p-3 rounded-lg">
          <Eye className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-bold text-amber-700 text-sm">
              관찰 필요 ({watchListStudents.length}명)
            </h3>
            <p className="text-xs text-gray-500">
              단일 영역 관심 필요 학생
            </p>
          </div>
        </div>
        <StudentTable students={watchListStudents} accent="amber" />
      </div>
    </div>
  );
};
