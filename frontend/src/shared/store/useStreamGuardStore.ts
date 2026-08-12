import { create } from 'zustand';

interface StreamGuardState {
  /** AI 응답 스트리밍 진행 여부. 스트리밍 중인 화면(FloatingAssistant 등)이 자신의
   * isLoading을 이 값에 동기화한다. */
  isStreaming: boolean;
  setStreaming: (value: boolean) => void;
  /** 스트리밍 중 이동을 시도했을 때 보류된 이동 액션. 이 값이 있으면 다이얼로그가 뜬다. */
  pendingAction: (() => void) | null;
  /** 이동을 감싸는 진입점 — 스트리밍 중이 아니면 즉시 실행, 스트리밍 중이면 보류 후 다이얼로그 노출 */
  guardedNavigate: (action: () => void) => void;
  confirmPending: () => void;
  cancelPending: () => void;
}

export const useStreamGuardStore = create<StreamGuardState>()((set, get) => ({
  isStreaming: false,
  setStreaming: (value) => set({ isStreaming: value }),
  pendingAction: null,
  guardedNavigate: (action) => {
    if (get().isStreaming) {
      set({ pendingAction: action });
    } else {
      action();
    }
  },
  confirmPending: () => {
    const action = get().pendingAction;
    set({ pendingAction: null });
    action?.();
  },
  cancelPending: () => set({ pendingAction: null }),
}));
