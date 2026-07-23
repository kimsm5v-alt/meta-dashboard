/**
 * 콘텐츠 선택하기 (목업 openContentPick / cpTab / cpPick / cpConfirm).
 * 완성형 콘텐츠 불러오기 / 템플릿 불러오기 탭.
 */
import { useState } from 'react';
import { CP_CONTENT, CP_TEMPLATE } from '../../mock-data';
import { useResources } from '../../store/ResourcesContext';
import type { ContentPickItem } from '../../types';

type CpMode = 'content' | 'template';

export const ContentPickModal = ({ onConfirm, onClose }: { onConfirm: (item: ContentPickItem) => void; onClose: () => void }) => {
  const { toast } = useResources();
  const [mode, setMode] = useState<CpMode>('content');
  const [selId, setSelId] = useState<string | null>(null);
  const list = mode === 'content' ? CP_CONTENT : CP_TEMPLATE;
  const sel = list.find((x) => x.id === selId) || null;

  const tab = (m: CpMode) => {
    setMode(m);
    setSelId(null);
  };
  const confirm = () => {
    if (!sel) {
      toast('항목을 선택해 주세요');
      return;
    }
    onConfirm(sel);
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-6">
      <div className="flex max-h-[85vh] w-[640px] max-w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="relative border-b border-gray-100 p-5">
          <h3 className="text-lg font-extrabold text-gray-900">콘텐츠 선택하기</h3>
          <p className="mt-0.5 text-sm text-gray-500">슬라이드에 담을 콘텐츠나 템플릿을 선택해 주세요.</p>
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex gap-2 px-5 pt-4">
          {(['content', 'template'] as CpMode[]).map((m) => (
            <button
              key={m}
              onClick={() => tab(m)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                mode === m ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {m === 'content' ? '완성형 콘텐츠 불러오기' : '템플릿 불러오기'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto p-5">
          {list.map((x) => (
            <button
              key={x.id}
              onClick={() => setSelId(x.id)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                selId === x.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg text-xl text-white" style={{ background: x.bg }}>{x.ic}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-gray-900">{x.t}</span>
                <span className="block text-xs text-gray-500">{x.d}</span>
              </span>
              <span className="text-gray-400">→</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 p-4">
          <div className="text-sm text-gray-500">선택한 항목: <b className="text-gray-800">{sel ? sel.t : '없음'}</b></div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">취소</button>
            <button onClick={confirm} className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600">선택 완료</button>
          </div>
        </div>
      </div>
    </div>
  );
};
