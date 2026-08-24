import { useEffect, useRef } from 'react';
import { CMS_BRAND_ID } from '../model/constants';
import { loadEveryCanvasEmbedSdk } from './everyCanvasEmbedSdk';
import type { CreateEmbedOptions, EmbedError, EmbedHandle } from './everyCanvasEmbedSdk';

type EmbedEventHandlers = {
  slideChanged?: (payload: unknown) => void;
  completed?: (payload: unknown) => void;
  saved?: (payload: unknown) => void;
  exitRequested?: (payload: unknown) => void;
  startLessonRequested?: (payload: unknown) => void;
  submitted?: (payload: unknown) => void;
  phaseChanged?: (payload: unknown) => void;
  progress?: (payload: unknown) => void;
};

type UseEveryCanvasEmbedParams = {
  options: CreateEmbedOptions;
  handlers?: EmbedEventHandlers;
  /**
   * Editor(SDK 1.5): ready 후 `handle.openSet(setId)` 호출.
   * CBS 세트지 id (= lcmsSetId). 없으면 신규(`/embed/editor/new` 경로).
   */
  setId?: string;
  onReady?: () => void;
  onError?: (error: EmbedError) => void;
  onResize?: (payload: { height: number }) => void;
  /** 마운트 identity — 값이 바뀌면 destroy 후 재생성 (React SDK와 동일) */
  identity: ReadonlyArray<string | number | boolean | null | undefined>;
};

const KNOWN_EVENTS = [
  'slideChanged',
  'completed',
  'saved',
  'exitRequested',
  'startLessonRequested',
  'submitted',
  'phaseChanged',
  'progress',
] as const;

/**
 * `@everycanvas/embed` createEmbed를 React에 마운트하는 얇은 훅.
 * `/sdk/react` 정적 import 대신 이 패턴을 사용한다 (소비팀 공지 3.2).
 */
export function useEveryCanvasEmbed({
  options,
  handlers = {},
  setId,
  onReady,
  onError,
  onResize,
  identity,
}: UseEveryCanvasEmbedParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef(options);
  const handlersRef = useRef(handlers);
  const openSetIdRef = useRef(setId);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onResizeRef = useRef(onResize);

  useEffect(() => {
    optionsRef.current = options;
    handlersRef.current = handlers;
    openSetIdRef.current = setId;
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
    onResizeRef.current = onResize;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let handle: EmbedHandle | null = null;
    const unsubscribers: Array<() => void> = [];

    const run = async () => {
      const { createEmbed } = await loadEveryCanvasEmbedSdk();
      if (cancelled || !containerRef.current) return;

      handle = createEmbed(containerRef.current, {
        ...optionsRef.current,
        brandId: optionsRef.current.brandId ?? CMS_BRAND_ID,
        getSsoToken: () => optionsRef.current.getSsoToken?.() ?? Promise.resolve(''),
      });

      for (const event of KNOWN_EVENTS) {
        unsubscribers.push(
          handle.on(event, (payload) => {
            handlersRef.current[event]?.(payload);
          }),
        );
      }

      unsubscribers.push(handle.onError((error) => onErrorRef.current?.(error)));
      unsubscribers.push(
        handle.onReady(() => {
          onReadyRef.current?.();
          const setId = openSetIdRef.current;
          console.log('[useEveryCanvasEmbed] onReady] ', setId, handle?.openSet);
          const mode = optionsRef.current.mode;
          if (mode === 'editor' && setId && typeof handle?.openSet === 'function') {
            void handle.openSet(setId);
          }
        }),
      );
      unsubscribers.push(handle.onResize((height) => onResizeRef.current?.({ height })));
    };

    void run();

    return () => {
      cancelled = true;
      for (const off of unsubscribers) off();
      handle?.destroy();
    };
    // identity 항목이 바뀔 때만 재마운트 (공식 React SDK useEmbed와 동일)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, identity);

  return containerRef;
}
