/**
 * 에디터 좌측 슬라이드 레일 (목업 paintSlides / edSelectSlide / edAddSlide).
 */
import type { EditorSlide } from './EditorOverlay';

export const SlideStrip = ({
  slides,
  active,
  onSelect,
  onAdd,
}: {
  slides: EditorSlide[];
  active: number;
  onSelect: (n: number) => void;
  onAdd: () => void;
}) => (
  <div className="flex w-40 flex-none flex-col gap-2 overflow-y-auto border-r border-gray-200 bg-gray-50 p-3">
    {slides.map((s, i) => {
      const n = i + 1;
      const on = n === active;
      return (
        <button
          key={n}
          onClick={() => onSelect(n)}
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-3 text-left text-xs font-semibold transition-colors ${
            on ? 'border-primary-500 bg-white text-primary-600 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
          }`}
        >
          <span className={`flex h-5 w-5 flex-none items-center justify-center rounded text-[11px] ${on ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{n}</span>
          {s.type === 'q' ? '문항' : '빈 슬라이드'}
        </button>
      );
    })}
    <button onClick={onAdd} className="rounded-lg border border-dashed border-gray-300 px-2.5 py-2.5 text-xs font-semibold text-gray-500 hover:bg-white">
      ＋ 슬라이드 추가
    </button>
  </div>
);
