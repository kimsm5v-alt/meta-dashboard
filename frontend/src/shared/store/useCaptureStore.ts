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
  openOverlay: () => void;
  closeOverlay: () => void;
  setPendingImage: (dataUri: string, meta: CaptureMeta) => void;
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
  bottomRightFabCount: 0,
  openOverlay: () => set({ overlayOpen: true }),
  closeOverlay: () => set({ overlayOpen: false }),
  setPendingImage: (dataUri, meta) =>
    set({ pendingImage: dataUri, pendingMeta: meta, overlayOpen: false }),
  clearPendingImage: () => set({ pendingImage: null, pendingMeta: null }),
  registerBottomRightFab: () =>
    set((s) => ({ bottomRightFabCount: s.bottomRightFabCount + 1 })),
  unregisterBottomRightFab: () =>
    set((s) => ({ bottomRightFabCount: Math.max(0, s.bottomRightFabCount - 1) })),
  reset: () => set({ overlayOpen: false, pendingImage: null, pendingMeta: null }),
}));
