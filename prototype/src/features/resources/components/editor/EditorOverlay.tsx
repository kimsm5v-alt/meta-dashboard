/**
 * 저작툴 풀스크린 오버레이 (목업 fsEditor + openEditor/edInit/editorSave/editorExit/editorDeploy).
 * 상태 소유: 슬라이드 목록·선택·제목·노트·속성 패널·모달.
 */
import { useState } from 'react';
import { MY, LESSON_DECKS } from '../../mock-data';
import { findContent } from '../../utils/format';
import { useResources } from '../../store/ResourcesContext';
import type { ContentPickItem } from '../../types';
import { SlideStrip } from './SlideStrip';
import { SlideCanvas } from './SlideCanvas';
import { ContentPickModal } from './ContentPickModal';
import { PreviewModal } from './PreviewModal';

export interface EditorSlide {
  type: 'q' | 'empty' | 'page';
  /** type==='page' 일 때 콘텐츠 페이지 이미지 (LESSON_DECKS) */
  src?: string;
}

const PROP_TOGGLES = ['지문 보이기', '보기 보이기', '힌트 보이기', '모범 답안 보이기', '해설 보이기'];

export const EditorOverlay = () => {
  const { overlay, closeOverlay, toast, setTab, openOverlay } = useResources();
  const contentId = overlay?.contentId ?? null;
  const item = contentId ? MY.find((x) => x.id === contentId) || findContent(contentId) : null;

  // 실제 콘텐츠(PDF 활동지)면 페이지를 그대로 슬라이드로 펼쳐 연다. 없으면 빈 문항 1장.
  const deck = contentId ? LESSON_DECKS[contentId] : undefined;

  const [title, setTitle] = useState(item?.title ?? '제목 없는 활동');
  const [slides, setSlides] = useState<EditorSlide[]>(
    deck?.length ? deck.map((src) => ({ type: 'page' as const, src })) : [{ type: 'q' }],
  );
  const [active, setActive] = useState(1);
  const [notes, setNotes] = useState('');
  const [pickOpen, setPickOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toggles, setToggles] = useState<boolean[]>([false, false, true, false, true]);
  const [qType, setQType] = useState(0);
  const [styleIdx, setStyleIdx] = useState(0);

  const addSlide = () => {
    setSlides((s) => [...s, { type: 'empty' }]);
    setActive(slides.length + 1);
  };
  const confirmContent = (picked: ContentPickItem) => {
    setPickOpen(false);
    setSlides((prev) => {
      const cur = prev[active - 1];
      if (cur && cur.type === 'empty') {
        const next = [...prev];
        next[active - 1] = { type: 'q' };
        return next;
      }
      return [...prev, { type: 'q' }];
    });
    setActive((a) => (slides[a - 1]?.type === 'empty' ? a : slides.length + 1));
    toast(`'${picked.t}'을(를) 슬라이드에 담았어요`);
  };
  const goMyData = () => {
    setSavedOpen(false);
    closeOverlay();
    setTab('myData');
  };
  const exit = () => {
    toast('자동 저장되었습니다');
    closeOverlay();
  };
  // 배포 화면으로 이동 (from:'editor' → 배포 헤더에서 저작툴로 복귀 가능)
  const deploy = () => openOverlay({ kind: 'deploy', contentId, from: 'editor' });

  const cur = slides[active - 1] ?? { type: 'q' };

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-gray-100">
      {/* 상단 바 */}
      <div className="flex flex-none items-center gap-4 border-b border-gray-200 bg-white px-4 py-2.5">
        <button
          onClick={goMyData}
          title="수업 › 나의 자료로 이동"
          className="flex items-baseline gap-1.5 rounded-lg px-2 py-1 -ml-2 transition-colors hover:bg-gray-100"
        >
          <span className="text-sm font-extrabold text-gray-900">학습심리정서검사</span>
          <span className="text-xs font-semibold text-gray-400">저작툴</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">제목 :</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-800 focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-600">☁ 저장됨</span>
          <button onClick={() => setPreviewOpen(true)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">👁 미리보기</button>
          <button onClick={() => setSavedOpen(true)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">저장하기</button>
          <button onClick={deploy} className="rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-600">▶ 시작하기</button>
          <button onClick={exit} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-100">나가기 →</button>
        </div>
      </div>

      {/* 본문 3단 */}
      <div className="flex min-h-0 flex-1">
        <SlideStrip slides={slides} active={active} onSelect={setActive} onAdd={addSlide} />

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <SlideCanvas slide={cur} active={active} onAddContent={() => setPickOpen(true)} />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="여기에 발표자 노트의 내용을 입력하세요."
            className="h-20 flex-none resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>

        {/* 속성 패널 */}
        <div className="w-64 flex-none overflow-y-auto border-l border-gray-200 bg-white p-4">
          <div className="text-sm font-extrabold text-gray-900">템플릿</div>
          <div className="mb-3 text-xs text-gray-500">단일 선택형 문항 정보</div>
          {PROP_TOGGLES.map((label, i) => (
            <div key={label} className="flex items-center justify-between py-1.5 text-sm text-gray-700">
              {label}
              <button
                onClick={() => setToggles((t) => t.map((v, k) => (k === i ? !v : v)))}
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${toggles[i] ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}
              >
                {toggles[i] ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
          <div className="mt-3 flex gap-2">
            {['단일선택형', '다중선택형'].map((t, i) => (
              <button
                key={t}
                onClick={() => setQType(i)}
                className={`flex-1 rounded-xl border-2 px-2 py-3 text-xs font-bold ${qType === i ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-200 text-gray-500'}`}
              >
                <div className="mb-1 text-lg">{i === 0 ? '☰' : '☑'}</div>
                {t}
              </button>
            ))}
          </div>
          <div className="mb-1 mt-3 text-xs text-gray-500">선택지 스타일</div>
          <div className="flex gap-2">
            {['≣', '≡', '⋮', '⁙', '⊞'].map((s, i) => (
              <button
                key={i}
                onClick={() => setStyleIdx(i)}
                className={`flex h-10 flex-1 items-center justify-center rounded-lg border-2 text-base ${styleIdx === i ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-gray-200 text-gray-400'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">정답</span>
            <input placeholder="정답을 입력하세요" className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-primary-400 focus:outline-none" />
          </div>
        </div>
      </div>

      {/* 하단 바 */}
      <div className="flex flex-none items-center gap-2 border-t border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
        <span className="font-semibold">✎ 발표자 노트</span>
        <span className="flex-1" />
        <span className="text-xs">− ▮▮▮ + <b className="text-gray-700">77%</b></span>
      </div>

      {pickOpen && <ContentPickModal onConfirm={confirmContent} onClose={() => setPickOpen(false)} />}
      {previewOpen && (
        <PreviewModal
          title={title}
          sub={`${slides.length}개 슬라이드 · 저작툴 미리보기`}
          emoji={item?.em ?? '🧩'}
          onUse={() => setPreviewOpen(false)}
          onClose={() => setPreviewOpen(false)}
        />
      )}
      {savedOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-6">
          <div className="w-[380px] max-w-full rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-extrabold text-gray-900">저장되었습니다 ✅</h3>
            <p className="mt-1 text-sm text-gray-500">작업 내용이 저장되었어요. 계속 편집하거나 나의 자료로 이동할 수 있어요.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setSavedOpen(false)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">계속 수정</button>
              <button onClick={goMyData} className="rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-600">나의 자료로 이동</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
