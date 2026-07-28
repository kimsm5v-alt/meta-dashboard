/**
 * 학생별 보기 상단 정오 요약 표 (R8, 레퍼런스 이미지2식).
 * 열 = 페이지(번호+성격색), 행 = [반 평균, 이 학생].
 * 셀: 문항→O/X(ErrataBadge) · 개념→조회(●/○) · 활동→제출(●/○). 열 클릭 → 하단 상세 강조.
 */
import { articlesOf, responseOf } from '../../../utils/aggregation';
import type { Report, Nature } from '../../../types';
import { ErrataBadge } from '../badges';

const NATURE_DOT: Record<Nature, string> = {
  개념: 'bg-gray-400',
  활동: 'bg-emerald-500',
  문항: 'bg-primary-500',
};

/** 봄/제출 여부 도트 */
const Dot = ({ on }: { on: boolean }) =>
  on ? (
    <span className="mx-auto block h-2.5 w-2.5 rounded-full bg-gray-500" />
  ) : (
    <span className="mx-auto block h-2.5 w-2.5 rounded-full border border-gray-300" />
  );

export const ErrataSummaryTable = ({
  report,
  studentId,
  selectedIndex,
  onSelect,
}: {
  report: Report;
  studentId: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) => {
  const arts = articlesOf(report);
  if (!arts.length) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-3 text-sm font-bold text-gray-700">페이지별 정오 요약</div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-semibold text-gray-400">페이지</th>
              {arts.map((a, i) => (
                <th key={a.id} className="px-2 py-2">
                  <button
                    onClick={() => onSelect(i)}
                    className={`mx-auto flex flex-col items-center gap-1 rounded-md px-2 py-1 transition-colors ${
                      i === selectedIndex ? 'bg-primary-50' : 'hover:bg-gray-50'
                    }`}
                    title={a.title}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${NATURE_DOT[a.nature]}`} />
                    <span className="font-bold text-gray-600">{a.order}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 이 학생 */}
            <tr className="border-t border-gray-100">
              <td className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-semibold text-gray-800">내 결과</td>
              {arts.map((a, i) => {
                const resp = responseOf(report, a.id, studentId);
                const on = i === selectedIndex;
                return (
                  <td key={a.id} className={`px-2 py-2 ${on ? 'bg-primary-50/40' : ''}`}>
                    {a.nature === '문항' && a.correctAnswer != null ? (
                      resp ? (
                        <span className="inline-flex justify-center">
                          <ErrataBadge errata={resp.errata} />
                        </span>
                      ) : (
                        <span className="text-gray-300">–</span>
                      )
                    ) : (
                      <Dot on={resp != null} />
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
