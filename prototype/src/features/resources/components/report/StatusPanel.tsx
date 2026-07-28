/**
 * 학습현황 패널 (목업 renderStatusPanel). ★기획서 7장 StatusPanel
 * KPI 4종(REPORT_SPEC_v2 화면1): 현재 진행 중 활동 · 이번 주 진행 활동 · 평균 참여율 · 미제출.
 * 부록A 스코프 분기:
 *  #2 타이틀        전체 "전체 학습현황" / 반 "{반} 학습현황"
 *  #3 scope-pill    "전체 반 기준" / "{반} 기준"
 *  #4 미제출 칩       반 선택 & 배포된(완료|진행중) 리포트 존재 시에만
 *  #5 KPI 미제출 값  배포 리포트 unsubmittedCount 합계 (신규 집계)
 */
import { TrendingUp } from 'lucide-react';
import { studentsOf, submitRate, unsubmittedCount } from '../../utils/aggregation';
import { scopedReports } from '../../utils/format';
import { useResources } from '../../store/ResourcesContext';

const Kpi = ({ label, value, unit, hl }: { label: string; value: number; unit: string; hl?: boolean }) => (
  <div className={`rounded-xl p-4 ${hl ? 'bg-primary-50' : 'bg-gray-50'}`}>
    <div className="text-xs font-semibold text-gray-500">{label}</div>
    <div className="mt-1 text-2xl font-extrabold text-gray-900">
      {value}
      <span className="ml-0.5 text-sm font-semibold text-gray-500">{unit}</span>
    </div>
  </div>
);

export const StatusPanel = () => {
  const { scope, isAll } = useResources();
  const rs = scopedReports(scope);

  const inProgress = rs.filter((r) => r.rstatus === '진행중').length;
  const deployed = rs.filter((r) => r.rstatus !== '진행예정'); // 진행중 + 완료
  const thisWeek = deployed.length;
  const avg = deployed.length
    ? Math.round(deployed.reduce((a, r) => a + submitRate(r), 0) / deployed.length)
    : 0;
  const missing = deployed.reduce((a, r) => a + unsubmittedCount(r), 0); // #5 신규 집계

  // #4 미제출 칩 (반 선택 & 배포 리포트 존재) — 배포 리포트의 statusCd=2 학생명(중복 제거)
  const showChips = !isAll && deployed.length > 0;
  const chipStudents = showChips
    ? Array.from(
        new Set(deployed.flatMap((r) => studentsOf(r).filter((s) => s.statusCd === 2).map((s) => s.studentName))),
      ).slice(0, 3)
    : [];

  return (
    <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-base font-extrabold tracking-tight text-gray-900">
          <TrendingUp className="h-4 w-4 text-primary-500" />
          {isAll ? '전체 학습현황' : `${scope} 학습현황`}
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
          {isAll ? '전체 반' : scope} 기준
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Kpi label="현재 진행 중인 활동" value={inProgress} unit="건" hl />
        <Kpi label="이번 주 진행한 활동" value={thisWeek} unit="건" />
        <Kpi label="평균 참여율" value={avg} unit="%" />
        <Kpi label="미제출" value={missing} unit="명" />
      </div>

      {showChips && (
        <div className="mt-4">
          <div className="mb-1.5 text-xs font-bold text-gray-600">미제출 학생</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {chipStudents.map((s) => (
              <span key={s} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
