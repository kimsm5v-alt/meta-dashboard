import { create } from 'zustand';

interface CaptureMeta {
  w: number;
  h: number;
}

interface CaptureState {
  /** 전역 드래그-선택 오버레이가 열려 있는지 여부 */
  overlayOpen: boolean;
  /** AI Room 컴포저에 첨부 대기 중인 캡처 이미지(data URI). 턴 한정 데이터라 persist하지 않음 */
  pendingImage: string | null;
  pendingMeta: CaptureMeta | null;
  /**
   * AI Room 진입 시 새 대화방을 열어 캡처를 붙일지 여부.
   * 대시보드 등 /ai-room 밖에서 캡처한 뒤 이동할 때 true로 설정된다.
   * AI Room 안에서 캡처하면 현재 대화에 붙이므로 false.
   * 해제는 clearPendingImage/reset(전송·첨부 제거·로그아웃)에서만 한다 —
   * 방 생성 직후 끄면 미전송 캡처로 재진입 시 기존 첫 대화에 붙는 문제가 생긴다.
   */
  openInNewConversation: boolean;
  openOverlay: () => void;
  closeOverlay: () => void;
  setPendingImage: (
    dataUri: string,
    meta: CaptureMeta,
    options?: { openInNewConversation?: boolean },
  ) => void;
  clearPendingImage: () => void;
  /**
   * 현재 화면에서 우측 하단 코너를 이미 점유한 페이지 전용 FAB 개수
   * (예: 학생 대시보드의 DataHelperChatbot). 0보다 크면 전역 FloatingCaptureButton이
   * 겹치지 않도록 그 위로 올라가 세로로 쌓인다.
   */
  bottomRightFabCount: number;
  /** 페이지 FAB가 마운트될 때 호출(카운트 +1). */
  registerBottomRightFab: () => void;
  /** 페이지 FAB가 언마운트될 때 호출(카운트 -1, 음수 방지). */
  unregisterBottomRightFab: () => void;
  /** 로그아웃 등 계정 전환 시 호출 — 같은 브라우저를 다른 교사가 이어 쓸 때 이전 사용자의
   * 대기 중인 캡처 이미지가 새 세션으로 넘어가지 않도록 전부 초기화한다. */
  reset: () => void;
}

export const useCaptureStore = create<CaptureState>()((set) => ({
  overlayOpen: false,
  pendingImage: null,
  pendingMeta: null,
  openInNewConversation: false,
  bottomRightFabCount: 0,
  openOverlay: () => set({ overlayOpen: true }),
  closeOverlay: () => set({ overlayOpen: false }),
  setPendingImage: (dataUri, meta, options) =>
    set({
      pendingImage: dataUri,
      pendingMeta: meta,
      overlayOpen: false,
      openInNewConversation: options?.openInNewConversation ?? false,
    }),
  clearPendingImage: () =>
    set({ pendingImage: null, pendingMeta: null, openInNewConversation: false }),
  registerBottomRightFab: () =>
    set((s) => ({ bottomRightFabCount: s.bottomRightFabCount + 1 })),
  unregisterBottomRightFab: () =>
    set((s) => ({ bottomRightFabCount: Math.max(0, s.bottomRightFabCount - 1) })),
  reset: () =>
    set({
      overlayOpen: false,
      pendingImage: null,
      pendingMeta: null,
      openInNewConversation: false,
    }),
}));
