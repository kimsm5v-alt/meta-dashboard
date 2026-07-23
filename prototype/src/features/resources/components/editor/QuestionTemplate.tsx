/**
 * 문항 템플릿 (목업 questionTemplateHTML). 5지선다 + 힌트/해설 (더미 placeholder).
 */
export const QuestionTemplate = ({ n }: { n: number }) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">{n}</span>
      <span className="text-gray-400">발문을 입력합니다.</span>
    </div>
    <div className="flex flex-col gap-2">
      {['①', '②', '③', '④', '⑤'].map((oc, i) => (
        <div key={oc} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-500">
          <span className="font-bold text-gray-600">{oc}</span> 선택지를 입력합니다.
          {i === 4 && (
            <span className="ml-auto flex gap-1 text-gray-400">
              <b className="cursor-default rounded bg-gray-100 px-1.5">＋</b>
              <b className="cursor-default rounded bg-gray-100 px-1.5">－</b>
            </span>
          )}
        </div>
      ))}
    </div>
    <div className="flex items-start gap-2">
      <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">힌트</span>
      <div className="text-sm text-gray-400">힌트를 입력합니다.</div>
    </div>
    <div className="flex items-start gap-2">
      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">해설</span>
      <div className="text-sm text-gray-400">해설을 입력합니다.</div>
    </div>
  </div>
);
