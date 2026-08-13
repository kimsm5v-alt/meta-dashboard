/**
 * 학생별 보기 — 좌 학생 리스트(번호·이름·점수·상태) / 우 학습요약 + 페이지별 응답 격자.
 * 페이지별 보기와 같은 ResponseGrid 를 쓴다 — 어느 축으로 들어와도 응답을 보는 방식은 하나.
 */
import { Clock } from 'lucide-react';
import { studentsOf, articlesOf, responseOf, studentSummary, hasGradedItems, participantCount } from '../../utils/aggregation';
import { pct } from '../../utils/format';
import { useResources, gradeKey } from '../../store/ResourcesContext';
import type { Report, StatusCd } from '../../types';
import { StatusBadge } from './badges';
import { ResponseGrid, type GridItem } from './detail/ResponseGrid';
import { responseCell, renderMode } from './detail/shared';

const SUBMITTED: StatusCd[] = [3, 4, 5];

export const StudentTab = ({ report }: { report: Report }) => {
  const { rdStu, selectStudent, rdSlide, grades, openCapture } = useResources();

  if (participantCount(report) === 0) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <Clock className="mx-auto h-8 w-8 text-gray-300" />
        <div className="mt-2 text-sm font-medium text-gray-500">아직 참여한 학생이 없습니다.</div>
      </div>
    );
  }

  const students = studentsOf(report);
  const arts = articlesOf(report);
  // 기본 선택은 끝까지 한 학생 우선 — 진행중(4) 학생이 걸리면 첫 화면이 '미제출'로만 채워진다
  const firstDone = students.find((s) => s.statusCd === 5 || s.statusCd === 3);
  const firstSubmitted = firstDone ?? students.find((s) => SUBMITTED.includes(s.statusCd));
  const curId =
    rdStu && students.some((s) => s.studentId === rdStu)
      ? rdStu
      : firstSubmitted?.studentId ?? students[0]?.studentId ?? '';
  const cur = students.find((s) => s.studentId === curId);

  const sum = studentSummary(report, curId);
  const graded = hasGradedItems(report);
  const submittedCount = students.filter((s) => SUBMITTED.includes(s.statusCd)).length;

  const items: GridItem[] = arts.map((a, i) => {
    const resp = responseOf(report, a.id, curId);
    return {
      key: a.id,
      primary: `${a.order}. ${a.title}`,
      nature: a.nature,
      mode: renderMode(a),
      cell: responseCell(a, resp, grades[gradeKey(a.id, curId)]),
      capture: resp?.captureImage,
      showNature: true,
      highlight: i === rdSlide,
      onOpen: () => openCapture(a.id, curId, 'article'),
    };
  });

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
      {/* 학생 리스트 */}
      <div className="flex max-h-[600px] flex-col gap-1 overflow-y-auto rounded-xl border border-gray-100 bg-white p-2">
        <div className="px-2 py-1.5 text-xs font-bold text-gray-500">
          참여 학생 <span className="font-semibold text-gray-400">({submittedCount}/{students.length})</span>
        </div>
        {students.map((s) => {
          const on = s.studentId === curId;
          return (
            <button
              key={s.studentId}
              onClick={() => selectStudent(s.studentId)}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-left transition-colors ${
                on ? 'bg-primary-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="w-5 flex-none text-right text-xs font-bold tabular-nums text-gray-400">{s.no}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-800">{s.studentName}</span>
              <span className="flex-none text-xs font-bold tabular-nums text-gray-400">
                {s.score != null ? `${s.score}점` : '–'}
              </span>
              <StatusBadge statusCd={s.statusCd} />
            </button>
          );
        })}
      </div>

      {/* 학생 상세 */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-base font-extrabold text-gray-900">
            <span className="text-gray-400">{cur?.no}.</span>
            {cur?.studentName}
            {cur && <StatusBadge statusCd={cur.statusCd} />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500">활동 페이지</div>
              <div className="mt-0.5 text-lg font-extrabold text-gray-900">
                {sum.submittedArticles}/{sum.totalArticles} p
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500">정답률 / 맞춘 문제</div>
              <div className="mt-0.5 text-lg font-extrabold text-gray-900">
                {graded ? `${pct(sum.correctN, sum.gradedN)}%` : '–'}
              </div>
              {graded && <div className="text-xs text-gray-500">{sum.correctN}/{sum.gradedN}개</div>}
            </div>
          </div>
        </div>

        {/* 페이지별 상세 — 캡처가 곧 응답 */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-2 text-sm font-bold text-gray-700">
            페이지별 상세 <span className="font-semibold text-gray-400">({items.length})</span>
          </div>
          {/* 제출 내용(작성 텍스트·정답 등)은 캡처 뷰어에서 — 여기서는 성격과 채점 상태만 */}
          <ResponseGrid items={items} showSummary={false} />
        </div>
      </div>
    </div>
  );
};
