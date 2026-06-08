import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, ExternalLink, ArrowRight } from 'lucide-react';
import type { RiskStudent } from '../../hooks/useClassDetailData';

interface RiskStudentsSectionProps {
  criticalStudents: RiskStudent[];
  watchListStudents: RiskStudent[];
  classId: string;
  isCompare?: boolean;
  prevCriticalStudents?: RiskStudent[];
  prevWatchListStudents?: RiskStudent[];
}

type ChangeStatus = 'new' | 'persistent' | 'resolved' | 'escalated' | 'deescalated';

const DIRECTION_LABEL: Record<string, string> = {
  low: '낮음',
  high: '높음',
};

const CHANGE_BADGE: Record<ChangeStatus, { label: string; className: string }> = {
  new: { label: '신규', className: 'bg-red-100 text-red-700' },
  persistent: { label: '지속', className: 'bg-amber-100 text-amber-700' },
  resolved: { label: '해소', className: 'bg-emerald-100 text-emerald-700' },
  escalated: { label: '악화', className: 'bg-red-100 text-red-700' },
  deescalated: { label: '완화', className: 'bg-blue-100 text-blue-700' },
};

export const RiskStudentsSection: React.FC<RiskStudentsSectionProps> = ({
  criticalStudents,
  watchListStudents,
  classId,
  isCompare = false,
  prevCriticalStudents,
  prevWatchListStudents,
}) => {
  const navigate = useNavigate();

  // 1차 위험학생 ID → 수준 매핑
  const prevRiskMap = useMemo(() => {
    const map = new Map<string, 'critical' | 'watch'>();
    if (prevCriticalStudents) {
      for (const rs of prevCriticalStudents) map.set(rs.student.id, 'critical');
    }
    if (prevWatchListStudents) {
      for (const rs of prevWatchListStudents) map.set(rs.student.id, 'watch');
    }
    return map;
  }, [prevCriticalStudents, prevWatchListStudents]);

  const getChangeStatus = (studentId: string, currentLevel: 'critical' | 'watch'): ChangeStatus | null => {
    if (!isCompare) return null;
    const prevLevel = prevRiskMap.get(studentId);
    if (!prevLevel) return 'new';
    if (prevLevel === 'watch' && currentLevel === 'critical') return 'escalated';
    if (prevLevel === 'critical' && currentLevel === 'watch') return 'deescalated';
    return 'persistent';
  };

  // 1차에는 있었지만 2차에서 해소된 학생
  const resolvedStudents = useMemo(() => {
    if (!isCompare) return [];
    const current2Ids = new Set([
      ...criticalStudents.map((rs) => rs.student.id),
      ...watchListStudents.map((rs) => rs.student.id),
    ]);
    const resolved: Array<{ student: RiskStudent['student']; prevLevel: 'critical' | 'watch' }> = [];
    if (prevCriticalStudents) {
      for (const rs of prevCriticalStudents) {
        if (!current2Ids.has(rs.student.id)) {
          resolved.push({ student: rs.student, prevLevel: 'critical' });
        }
      }
    }
    if (prevWatchListStudents) {
      for (const rs of prevWatchListStudents) {
        if (!current2Ids.has(rs.student.id)) {
          resolved.push({ student: rs.student, prevLevel: 'watch' });
        }
      }
    }
    return resolved;
  }, [isCompare, criticalStudents, watchListStudents, prevCriticalStudents, prevWatchListStudents]);

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
    level: 'critical' | 'watch';
  }> = ({ students, accent, level }) => {
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
              {isCompare && <th className="p-3 text-left font-semibold text-gray-600 w-20">변화</th>}
              <th className="p-3 text-left font-semibold text-gray-600 w-24">상세</th>
            </tr>
          </thead>
          <tbody>
            {students.map((rs) => {
              const changeStatus = getChangeStatus(rs.student.id, level);
              return (
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
                  {isCompare && changeStatus && (
                    <td className="p-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${CHANGE_BADGE[changeStatus].className}`}>
                        {CHANGE_BADGE[changeStatus].label}
                      </span>
                    </td>
                  )}
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
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 변화 요약 (compare 모드) */}
      {isCompare && (
        <div className="flex items-center gap-3 p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg">
          <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0" />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              1차 위험군 <b>{(prevCriticalStudents?.length ?? 0) + (prevWatchListStudents?.length ?? 0)}</b>명
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600">
              2차 위험군 <b>{criticalStudents.length + watchListStudents.length}</b>명
            </span>
            {resolvedStudents.length > 0 && (
              <span className="text-emerald-600 font-semibold">
                (해소 {resolvedStudents.length}명)
              </span>
            )}
          </div>
        </div>
      )}

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
        <StudentTable students={criticalStudents} accent="red" level="critical" />
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
        <StudentTable students={watchListStudents} accent="amber" level="watch" />
      </div>

      {/* 해소된 학생 (compare 모드) */}
      {isCompare && resolvedStudents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 bg-emerald-50/50 border border-emerald-200 p-3 rounded-lg">
            <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <h3 className="font-bold text-emerald-700 text-sm">
                위험 해소 ({resolvedStudents.length}명)
              </h3>
              <p className="text-xs text-gray-500">
                1차에서 관심 필요였으나 2차에서 해소된 학생
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50/50">
                  <th className="p-3 text-left font-semibold text-gray-600 w-16">번호</th>
                  <th className="p-3 text-left font-semibold text-gray-600 w-24">이름</th>
                  <th className="p-3 text-left font-semibold text-gray-600 w-36">1차 상태</th>
                  <th className="p-3 text-left font-semibold text-gray-600">변화</th>
                  <th className="p-3 text-left font-semibold text-gray-600 w-24">상세</th>
                </tr>
              </thead>
              <tbody>
                {resolvedStudents.map((rs) => (
                  <tr key={rs.student.id} className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors">
                    <td className="p-3 text-gray-700">{rs.student.number}</td>
                    <td className="p-3 font-medium text-gray-800">{rs.student.name}</td>
                    <td className="p-3 text-xs text-gray-500">
                      {rs.prevLevel === 'critical' ? '긴급 관심' : '관찰 필요'}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${CHANGE_BADGE.resolved.className}`}>
                        {CHANGE_BADGE.resolved.label}
                      </span>
                    </td>
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
        </div>
      )}
    </div>
  );
};
