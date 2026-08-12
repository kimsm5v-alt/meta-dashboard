/**
 * 학습현황 패널 (목업 renderStatusPanel). ★기획서 7장 StatusPanel
 *
 * 구성: 숫자 타일 3개(전폭 균등) + 하단 미제출 학생 나열.
 * "무엇을 안 냈는지"는 글자로 쓰지 않고 **학생을 누르면 아래 카드에 테두리**로 표시한다
 * — 활동이 여러 개여도 요약이 목록으로 부풀지 않고, 활동명을 중복 표기하지 않아도 된다.
 * 부록A #2 타이틀: 전체 "전체 학습현황" / 반 "{반} 학습현황"
 */
import { TrendingUp } from 'lucide-react';
import { studentsOf } from '../../utils/aggregation';
import { scopedReports } from '../../utils/format';
import { useResources } from '../../store/ResourcesContext';

const Stat = ({ label, value, unit, hl }: { label: string; value: number; unit: string; hl?: boolean }) => (
  <div className={`rounded-xl px-4 py-3.5 ${hl ? 'bg-primary-50' : 'bg-gray-50'}`}>
    <div className="text-xs font-semibold text-gray-500">{label}</div>
    <div className={`mt-1 text-3xl font-extrabold leading-none ${hl ? 'text-primary-700' : 'text-gray-900'}`}>
      {value}
      <span className="ml-1 text-sm font-semibold text-gray-400">{unit}</span>
    </div>
  </div>
);

interface StatusPanelProps {
  /** 선택된 미제출 학생 — 아래 카드 그리드 강조에 쓰인다 */
  selected: string | null;
  onSelect: (name: string | null) => void;
}

export const StatusPanel = ({ selected, onSelect }: StatusPanelProps) => {
  const { scope, isAll, setRsFilter } = useResources();
  const rs = scopedReports(scope);

  const running = rs.filter((r) => r.rstatus === '진행중');
  const thisWeek = rs.filter((r) => r.rstatus !== '진행예정').length; // 진행중 + 완료

  // 진행 중인 활동 기준 미제출 — 학생별로 몇 건인지 모은다
  const counts = new Map<string, number>();
  running.forEach((r) => {
    studentsOf(r)
      .filter((s) => s.statusCd === 2)
      .forEach((s) => counts.set(s.studentName, (counts.get(s.studentName) ?? 0) + 1));
  });
  const students = [...counts.entries()]
    .map(([name, n]) => ({ name, n }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));

  /** 미제출 '건수' = 활동 × 학생 조합 수 (사람 수와 다른 값) */
  const missingCount = students.reduce((a, s) => a + s.n, 0);

  return (
    <div className="mt-5 rounded-2xl border border-gray-200 bg-white px-5 py-4">
      <div className="mb-3 flex items-center gap-1.5 text-sm font-extrabold tracking-tight text-gray-900">
        <TrendingUp className="h-4 w-4 text-primary-500" />
        {isAll ? '전체 학습현황' : `${scope} 학습현황`}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="이번 주 진행" value={thisWeek} unit="건" />
        <Stat label="진행 중 활동" value={running.length} unit="건" hl />
        <Stat label="미제출" value={missingCount} unit="건" />
      </div>

      {/* 미제출 학생 — 높이 고정, 넘치면 내부 스크롤 */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <div className="mb-1.5 flex items-baseline gap-1.5">
          <span className="text-[11px] font-bold text-gray-600">미제출 학생</span>
          {students.length > 0 && (
            <>
              <span className="text-xs font-extrabold text-amber-600">{students.length}명</span>
              <span className="text-[11px] font-semibold text-gray-500">· 진행 중인 활동 기준</span>
              <span className="text-[11px] font-medium text-gray-400">
                이름을 누르면 진행중 목록에서 해당 활동이 표시됩니다
              </span>
            </>
          )}
        </div>

        <div className="flex h-[58px] flex-wrap content-start gap-1.5 overflow-y-auto pr-1">
          {running.length === 0 ? (
            <span className="text-sm text-gray-400">진행 중인 활동이 없습니다.</span>
          ) : students.length === 0 ? (
            <span className="text-sm font-medium text-emerald-600">진행 중인 활동을 모두 제출했어요.</span>
          ) : (
            students.map((s) => {
              const on = selected === s.name;
              return (
                <button
                  key={s.name}
                  onClick={() => {
                    if (on) {
                      onSelect(null);
                      return;
                    }
                    onSelect(s.name);
                    // 미제출은 진행 중인 활동 기준이라, 다른 상태 필터가 걸려 있으면
                    // 강조된 카드가 화면에 없다 → 진행중으로 맞춰준다.
                    setRsFilter('진행중');
                  }}
                  className={`h-fit flex-none rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    on
                      ? 'bg-amber-500 text-white ring-2 ring-amber-200'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  {s.name}
                  {s.n > 1 && (
                    <span className={`ml-1 text-[10px] font-bold ${on ? 'text-white/80' : 'text-amber-600'}`}>
                      {s.n}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
