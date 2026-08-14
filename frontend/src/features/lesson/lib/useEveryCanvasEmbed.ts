import { useEffect, useRef } from 'react';
import { loadEveryCanvasEmbedSdk } from './everyCanvasEmbedSdk';
import type { CreateEmbedOptions, EmbedError, EmbedHandle } from './everyCanvasEmbedSdk';

type EmbedEventHandlers = {
  slideChanged?: (payload: unknown) => void;
  completed?: (payload: unknown) => void;
  saved?: (payload: unknown) => void;
  exitRequested?: (payload: unknown) => void;
  startLesson?: (payload: unknown) => void;
};

type UseEveryCanvasEmbedParams = {
  options: CreateEmbedOptions;
  handlers?: EmbedEventHandlers;
  /**
   * Editor(SDK 1.5): ready 후 `handle.openSet(setId)` 호출.
   * CBS 세트지 id (= lcmsSetId). 없으면 신규(`/embed/editor/new` 경로).
   */
  openSetId?: string;
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
  'startLesson',
] as const;

/**
 * `@everycanvas/embed` createEmbed를 React에 마운트하는 얇은 훅.
 * `/sdk/react` 정적 import 대신 이 패턴을 사용한다 (소비팀 공지 3.2).
 */
export function useEveryCanvasEmbed({
  options,
  handlers = {},
  openSetId,
  onReady,
  onError,
  onResize,
  identity,
}: UseEveryCanvasEmbedParams) {
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef(options);
  const handlersRef = useRef(handlers);
  const openSetIdRef = useRef(openSetId);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onResizeRef = useRef(onResize);

  useEffect(() => {
    optionsRef.current = options;
    handlersRef.current = handlers;
    openSetIdRef.current = openSetId;
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
        // TOKEN_EXPIRED 재발급 시 최신 콜백을 쓰도록 래핑 (공식 React SDK와 동일)
        getToken: () => optionsRef.current.getToken?.() ?? Promise.resolve(''),
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
          if (setId && typeof handle?.openSet === 'function') {
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
