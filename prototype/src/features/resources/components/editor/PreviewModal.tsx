/**
 * 콘텐츠 미리보기 (목업 ovPreview). 제목·요약·슬라이드 미리보기(더미) + 바로 사용.
 */
export const PreviewModal = ({
  title,
  sub,
  emoji,
  onUse,
  onClose,
}: {
  title: string;
  sub: string;
  emoji: string;
  onUse: () => void;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-6">
    <div className="w-[520px] max-w-full overflow-hidden rounded-2xl bg-white shadow-xl">
      <div className="border-b border-gray-100 p-5">
        <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
        {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
      </div>
      <div className="p-5">
        <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl bg-gray-50">
          <div className="text-5xl">{emoji}</div>
          <div className="text-sm text-gray-500">슬라이드 구성 미리보기 (더미)</div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
        <button onClick={onClose} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">닫기</button>
        <button onClick={onUse} className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600">바로 사용</button>
      </div>
    </div>
  </div>
);
