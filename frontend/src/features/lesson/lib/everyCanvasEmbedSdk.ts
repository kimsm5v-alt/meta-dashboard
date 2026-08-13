import { ENV } from '@shared/config/env';

/** `--ec-*` CSS 변수 맵 (Frame 테마 오버라이드) */
export type ThemeTokens = Record<`--ec-${string}`, string>;

export type EmbedError = {
  source: 'local' | 'bridge';
  code: string;
  message: string;
  detail?: Record<string, unknown>;
};

export type SavedPayload = { slideId: string; thumbnail?: string };
export type SlideChangedPayload = {
  index: number;
  slideId: string;
  totalSlides: number;
};
export type CompletedPayload = {
  viewedSlideIds: string[];
  totalLearnTimeMs: number;
};

export type EmbedMode = 'viewer' | 'editor' | 'activity-join' | 'activity-report';

export type CreateEmbedOptions = {
  embedBaseUrl: string;
  mode: EmbedMode;
  getToken?: () => string | Promise<string>;
  getSsoToken?: () => string | Promise<string>;
  slideId?: string;
  activityId?: string;
  theme?: ThemeTokens;
  features?: Record<string, boolean | string | Record<string, boolean> | undefined>;
  locale?: string;
  title?: string;
};

export type EmbedHandle = {
  on: (event: string, listener: (payload: unknown) => void) => () => void;
  onError: (listener: (error: EmbedError) => void) => () => void;
  onReady: (listener: () => void) => () => void;
  onResize: (listener: (height: number) => void) => () => void;
  destroy: () => void;
  save?: () => Promise<unknown>;
  goToSlide?: (target: { index?: number; slideId?: string }) => Promise<unknown>;
};

export type EveryCanvasEmbedSdk = {
  createEmbed: (container: HTMLElement, options: CreateEmbedOptions) => EmbedHandle;
};

let sdkPromise: Promise<EveryCanvasEmbedSdk> | null = null;

/**
 * 정적 ESM `@everycanvas/embed` (`.../sdk/embed/index.js`) 1회 로드.
 * React 래퍼(`/sdk/react`)는 bare import(`react`) 때문에 URL 동적 import 불가 —
 * 소비팀 공지: createEmbed를 얇은 React 훅으로 감싸 사용.
 */
export function loadEveryCanvasEmbedSdk(): Promise<EveryCanvasEmbedSdk> {
  if (!sdkPromise) {
    const url = `${ENV.EVERYCLASS_EMBED_BASE_URL}/sdk/embed/index.js`;
    sdkPromise = import(/* @vite-ignore */ url) as Promise<EveryCanvasEmbedSdk>;
  }
  return sdkPromise;
}
