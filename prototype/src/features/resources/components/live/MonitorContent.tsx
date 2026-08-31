/**
 * 모니터링 본문 — 발표자 노트 + 실시간 제출·정오 표 (결정적 mock).
 * ★부록A #8: liveClassName 학생 사용.
 *
 * 팝업 창에 포털로 렌더되므로 **측정을 하지 않는 순수 표시 컴포넌트**로 유지한다.
 * (포털 안에서 document.*·innerWidth·getBoundingClientRect 는 조용히 부모 창을 가리킨다)
 */
import { STUDENTS } from '../../mock-data';
import { hashKey } from '../../utils/hash';

interface MonitorContentProps {
  className: string;
  classSlide: number;
  notes: string;
  onNotesChange?: (v: string) => void;
}

export const MonitorContent = ({ className, classSlide, notes, onNotesChange }: MonitorContentProps) => {
  const studs = STUDENTS[className] || [];
  const isQuestion = classSlide > 1;

  let done = 0;
  const rows = studs.map((s) => {
    const submitted = hashKey(s + classSlide) % 10 < 7; // ~70% 제출
    const correct = submitted && hashKey(s + 'c' + classSlide) % 10 < 6; // 제출 중 ~60% 정답
    if (submitted) done++;
    return { s, submitted, correct };
  });
  const pct = studs.length ? Math.round((done / studs.length) * 100) : 0;

  return (
    <>
      <div className="rounded-xl bg-gray-800 p-3">
        <div className="mb-1 text-xs font-bold text-gray-300">📝 발표자 노트</div>
        {onNotesChange ? (
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            placeholder="이 페이지에서 짚어줄 내용을 적어두세요."
            className="w-full resize-none rounded-lg bg-gray-900 p-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        ) : (
          <div className="text-sm text-gray-200">{notes.trim() || '메모가 없습니다.'}</div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-gray-800 p-3">
        <div className="mb-1 flex items-center justify-between text-xs font-bold text-gray-300">
          <span>👥 실시간 제출 · 정오</span>
          <span className="text-gray-400">{done}/{studs.length} 제출</span>
        </div>
        <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-gray-700">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400">
                <th className="py-1 text-left font-semibold">학생</th>
                <th className="py-1 text-center font-semibold">제출</th>
                <th className="py-1 text-center font-semibold">정오</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, submitted, correct }) => (
                <tr key={s} className="border-t border-gray-700/50">
                  <td className="py-1.5 text-gray-200">{s}</td>
                  <td className="py-1.5 text-center">{submitted ? <span className="text-emerald-400">✓</span> : <span className="text-gray-500">–</span>}</td>
                  <td className="py-1.5 text-center">
                    {!isQuestion || !submitted ? <span className="text-gray-500">–</span> : correct ? <span className="text-emerald-400">O</span> : <span className="text-red-400">X</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
