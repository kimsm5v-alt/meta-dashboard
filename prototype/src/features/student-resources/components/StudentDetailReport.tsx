/**
 * 학생 리포트 5-2 상세 — 요약 + 페이지별 내 캡처 + 정오 + 내 답 vs 정답.
 * 캡처는 placeholder, 그리기/녹음/녹화 다시보기는 토스트.
 */
import { ChevronLeft, Image as ImageIcon, Play } from 'lucide-react';
import { STUDENT_REPORT_DETAILS } from '../mock-data';
import { useStudentResource } from '../store/StudentResourceContext';
import { NatureBadge, ErrataBadge } from './badges';

const fmt = (sec: number) => `${Math.floor(sec / 60)}분 ${String(sec % 60).padStart(2, '0')}초`;

export const StudentDetailReport = ({ id, onBack }: { id: string; onBack: () => void }) => {
  const { toast } = useStudentResource();
  const d = STUDENT_REPORT_DETAILS[id];
  if (!d) return null;

  const graded = d.summary.gradedN > 0;
  const rate = graded ? Math.round((d.summary.correctN / d.summary.gradedN) * 100) : null;

  const tiles: { lbl: string; val: string; sub?: string }[] = [
    { lbl: '활동 페이지', val: `${d.summary.pages}/${d.summary.totalPages} p` },
  ];
  if (graded) tiles.push({ lbl: '정답률 / 맞춘 문제', val: `${rate}%`, sub: `${d.summary.correctN}/${d.summary.gradedN}개` });
  tiles.push({ lbl: '활동 시간 / 제출', val: fmt(d.summary.durationSec), sub: d.summary.submittedAt ?? '미제출' });

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
      >
        <ChevronLeft className="h-4 w-4" /> 나의 수업 결과로 돌아가기
      </button>

      {/* 요약 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="text-lg font-extrabold tracking-tight text-gray-900">{d.title}</div>
        <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0,1fr))` }}>
          {tiles.map((t) => (
            <div key={t.lbl} className="rounded-xl bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500">{t.lbl}</div>
              <div className="mt-0.5 text-lg font-extrabold text-gray-900">{t.val}</div>
              {t.sub && <div className="text-xs text-gray-500">{t.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 페이지별 내 활동 */}
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-2 text-sm font-bold text-gray-700">페이지별 내 활동</div>
        <div className="flex flex-col gap-2">
          {d.articles.map((a) => {
            const resp = d.responses.find((r) => r.articleId === a.id);
            const isQuestion = a.nature === '문항';
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
                <div className="flex h-10 w-14 flex-none items-center justify-center rounded-md bg-gray-200 text-gray-400">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500">{a.order}</span>
                    <NatureBadge nature={a.nature} />
                    <span className="truncate text-sm font-semibold text-gray-800">{a.title}</span>
                  </div>
                  {isQuestion && resp ? (
                    <div className="mt-0.5 text-xs text-gray-500">
                      내 답 <b className="text-gray-800">{resp.submitAnswer || '—'}</b>
                      {a.correctAnswer && (
                        <>
                          {' · '}정답 <b className="text-blue-600">{a.correctAnswer}</b>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-xs text-gray-500">
                      {a.nature === '개념' ? '조회함' : resp?.submitAnswer || '제출함'}
                    </div>
                  )}
                </div>
                <div className="flex flex-none items-center gap-1.5">
                  {/* 정오 슬롯 (문항만 활성, 그 외 비활성) */}
                  {isQuestion && a.correctAnswer != null && resp ? (
                    <ErrataBadge errata={resp.errata} />
                  ) : (
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-50 text-xs font-bold text-gray-300"
                      title="정오 대상 아님"
                    >
                      –
                    </span>
                  )}
                  {/* 보기 슬롯 — 제출(캡처 저장) 시 활성 */}
                  {resp ? (
                    <button
                      onClick={() => toast(`${a.title} 캡처 보기 (목업)`)}
                      className="inline-flex items-center gap-1 rounded border border-gray-200 px-1.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      <Play className="h-3 w-3" /> 보기
                    </button>
                  ) : (
                    <button
                      disabled
                      className="inline-flex cursor-not-allowed items-center gap-1 rounded border border-gray-100 px-1.5 py-1 text-xs font-semibold text-gray-300"
                    >
                      <Play className="h-3 w-3" /> 보기
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
