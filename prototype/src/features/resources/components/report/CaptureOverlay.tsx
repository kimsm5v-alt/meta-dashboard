/**
 * 제출 결과 뷰어 캡처 오버레이 — 개별 슬라이드를 크게 보고 그 자리에서 채점한다.
 *
 * 엑셀 시트2 기준 '활동' 유형은 전부 errata=4(교사 수동 채점)라, 목록에서 O/X 를 볼 수 없다.
 * 교사가 실제로 하는 일은 "제출물을 열어 보고 → 판단하고 → 다음 학생"이므로
 * 순회 축을 진입 지점에 맞춘다.
 *   페이지별 보기에서 열면 axis='student' — 같은 페이지를 학생 순으로 (연속 채점)
 *   학생별 보기에서 열면 axis='article' — 그 학생의 페이지 순으로 (한 명 훑어보기)
 *
 * 풀스크린 오버레이라 ResourcesContext 의 히스토리 연동을 그대로 타고, 브라우저 뒤로가기로 닫힌다.
 */
import { useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';
import { REPORTS } from '../../mock-data';
import { articlesOf, studentsOf, responsesOf, responseOf } from '../../utils/aggregation';
import { fmtDuration, fmtDateTime } from '../../utils/format';
import { useResources, gradeKey } from '../../store/ResourcesContext';
import type { Errata } from '../../types';
import { NatureBadge, ErrataBadge, StatusBadge } from './badges';

const GRADE_BTN: { errata: Errata; label: string; on: string }[] = [
  { errata: 1, label: 'O 잘함', on: 'border-blue-500 bg-blue-50 text-blue-700' },
  { errata: 3, label: '△ 보통', on: 'border-amber-500 bg-amber-50 text-amber-700' },
  { errata: 2, label: 'X 미흡', on: 'border-red-500 bg-red-50 text-red-700' },
];

export const CaptureOverlay = () => {
  const { overlay, rdReport, closeOverlay, openCapture, grades, setGrade, toast } = useResources();

  const report = REPORTS.find((r) => r.id === rdReport);
  const axis = overlay?.axis ?? 'student';
  const articleId = overlay?.articleId ?? '';
  const studentId = overlay?.studentId ?? '';

  const article = report && articlesOf(report).find((a) => a.id === articleId);
  const student = report && studentsOf(report).find((s) => s.studentId === studentId);
  const resp = report ? responseOf(report, articleId, studentId) : undefined;

  /** 순회 목록 — 제출한 것만 (미제출은 볼 캡처가 없다) */
  const siblings = (() => {
    if (!report) return [] as { articleId: string; studentId: string; label: string }[];
    const all = responsesOf(report);
    if (axis === 'student') {
      return studentsOf(report)
        .filter((s) => all.some((x) => x.articleId === articleId && x.studentId === s.studentId))
        .map((s) => ({ articleId, studentId: s.studentId, label: s.studentName }));
    }
    return articlesOf(report)
      .filter((a) => all.some((x) => x.articleId === a.id && x.studentId === studentId))
      .map((a) => ({ articleId: a.id, studentId, label: `${a.order}. ${a.title}` }));
  })();

  const idx = siblings.findIndex((x) => x.articleId === articleId && x.studentId === studentId);

  const go = useCallback(
    (delta: number) => {
      const next = siblings[idx + delta];
      if (next) openCapture(next.articleId, next.studentId, axis);
    },
    [siblings, idx, openCapture, axis],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Escape') closeOverlay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, closeOverlay]);

  // 리포트가 닫힌 뒤(스코프 전환 등) 남아 있으면 스스로 정리
  if (!report || !article || !student) return null;

  const grade = grades[gradeKey(article.id, student.studentId)];
  const manual = article.nature === '활동' && article.gradingType === 2 && resp != null;
  const auto = article.nature === '문항' && article.correctAnswer != null;

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-gray-900">
      {/* 헤더 */}
      <div className="flex flex-none items-center gap-3 border-b border-gray-800 px-4 py-2.5">
        <button onClick={closeOverlay} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800" aria-label="닫기">
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 truncate text-sm font-bold text-white">
          {report.title}
          <span className="ml-2 font-semibold text-gray-500">
            {axis === 'student' ? `${article.order}. ${article.title}` : student.studentName}
          </span>
        </div>
        <div className="flex flex-none items-center gap-1">
          <span className="mr-1 text-xs font-semibold tabular-nums text-gray-400">
            {idx + 1} / {siblings.length}
          </span>
          <button
            onClick={() => go(-1)}
            disabled={idx <= 0}
            className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-700"
            aria-label="이전"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            disabled={idx < 0 || idx >= siblings.length - 1}
            className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-700"
            aria-label="다음"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 좌: 캡처 크게 */}
        <div className="flex min-h-0 flex-1 items-center justify-center p-4 lg:p-8">
          {resp?.captureImage ? (
            <img
              src={resp.captureImage}
              alt={`${student.studentName} 제출 캡처`}
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
            />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-700 px-16 py-24 text-center text-sm font-medium text-gray-500">
              제출 캡처가 없습니다.
            </div>
          )}
        </div>

        {/* 우: 응답 · 채점 */}
        <aside className="flex w-full flex-none flex-col gap-4 overflow-y-auto border-t border-gray-800 bg-white p-5 lg:w-[340px] lg:border-l lg:border-t-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-gray-900">{student.studentName}</span>
              <StatusBadge statusCd={student.statusCd} />
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {student.duration != null && <>활동 {fmtDuration(student.duration)}</>}
              {student.submittedAt && <> · 제출 {fmtDateTime(student.submittedAt)}</>}
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900">
                {article.order}. {article.title}
              </span>
              <NatureBadge nature={article.nature} />
              {article.selFactor && (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                  {article.selFactor}
                </span>
              )}
            </div>
          </div>

          {/* 제출 답안 */}
          <div>
            <div className="mb-1.5 text-xs font-bold text-gray-500">제출 답안</div>
            {resp == null ? (
              <div className="text-sm text-gray-400">미제출</div>
            ) : resp.mediaSec != null ? (
              <button
                onClick={() => toast(`${student.studentName} · ${article.title} 재생 (목업)`)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Play className="h-4 w-4" />
                재생 · {fmtDuration(resp.mediaSec)}
              </button>
            ) : resp.submitAnswer ? (
              <p className="whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-800">
                {resp.submitAnswer}
              </p>
            ) : (
              <div className="text-sm text-gray-500">{article.nature === '개념' ? '조회함' : '제출함 (캡처 참고)'}</div>
            )}

            {auto && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-500">정답</span>
                <b className="text-blue-600">{article.correctAnswer}</b>
                {resp && (
                  <>
                    <span className="text-gray-300">·</span>
                    <ErrataBadge errata={resp.errata} />
                    <span className="text-xs font-semibold text-gray-400">자동 채점</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 교사 수동 채점 */}
          {manual && (
            <div className="mt-auto border-t border-gray-100 pt-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-gray-500">
                교사 채점
                {grade == null && (
                  <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">대기</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {GRADE_BTN.map((b) => (
                  <button
                    key={b.errata}
                    onClick={() => setGrade(article.id, student.studentId, b.errata)}
                    className={`rounded-lg border-2 py-2 text-sm font-bold transition-colors ${
                      grade === b.errata ? b.on : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {grade != null && (
                <button
                  onClick={() => setGrade(article.id, student.studentId, null)}
                  className="mt-2 w-full text-xs font-semibold text-gray-400 hover:text-gray-600 hover:underline"
                >
                  채점 해제
                </button>
              )}
              <div className="mt-2 text-[11px] text-gray-400">← → 키로 다음 제출물로 넘어갈 수 있어요.</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
