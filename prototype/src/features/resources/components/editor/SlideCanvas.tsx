/**
 * 에디터 캔버스 (목업 renderEdCanvas). 문항형 → 템플릿, 빈 슬라이드 → 담기 안내.
 */
import { QuestionTemplate } from './QuestionTemplate';
import type { EditorSlide } from './EditorOverlay';

const TOOLBAR = ['🖼️', '🎬', '🎵', '▦', '✏️', '⧉', '🔗', '⛶', '☰'];

export const SlideCanvas = ({ slide, active, onAddContent }: { slide: EditorSlide; active: number; onAddContent: () => void }) => (
  <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white">
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 px-3 py-2 text-lg">
      {TOOLBAR.map((t, i) => (
        <button key={i} className="rounded px-1.5 py-0.5 hover:bg-gray-100" title={t}>{t}</button>
      ))}
      <span className="mx-1 h-5 w-px bg-gray-200" />
      <button onClick={onAddContent} title="템플릿 추가하기" className="rounded bg-primary-50 px-2 py-0.5 font-bold text-primary-600 hover:bg-primary-100">＋</button>
    </div>
    <div className="p-8">
      {slide.type === 'page' && slide.src ? (
        <div className="mx-auto aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <img src={slide.src} alt={`슬라이드 ${active}`} className="h-full w-full object-contain" />
        </div>
      ) : slide.type === 'q' ? (
        <QuestionTemplate n={active} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <button onClick={onAddContent} className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600">
            ＋ 템플릿 추가하기
          </button>
          <div className="text-4xl">🧩</div>
          <div className="text-base font-bold text-gray-800">빈 슬라이드예요</div>
          <div className="text-sm text-gray-500">완성형 콘텐츠·템플릿을 담아 이 슬라이드를 채워보세요.</div>
        </div>
      )}
    </div>
  </div>
);
