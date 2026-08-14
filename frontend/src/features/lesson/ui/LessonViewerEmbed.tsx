import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ENV } from '@shared/config/env';
import { useEveryCanvasEmbed } from '../lib/useEveryCanvasEmbed';
import type {
  CompletedPayload,
  EmbedError,
  SlideChangedPayload,
  ThemeTokens,
} from '../lib/everyCanvasEmbedSdk';

const ViewerContainer = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.background.paper};
`;

const EmbedHost = styled.div`
  width: 100%;
  height: 100%;
`;

export type LessonViewerEmbedProps = {
  /** Platform slideId (Viewer 전용 — Editor openSet/CBS setId와 다름) */
  slideId: string;
  onSlideChanged?: (payload: SlideChangedPayload) => void;
  onCompleted?: (payload: CompletedPayload) => void;
  onExitRequested?: (payload: { reason?: 'userClose' | 'done' }) => void;
  onError?: (error: EmbedError) => void;
  onReady?: () => void;
};

/**
 * everyCanvas SlideViewer 래퍼 (SDK 1.5.0 — Viewer 계약 변경 없음).
 * getSsoToken / openSet 미사용.
 */
export const LessonViewerEmbed = ({
  slideId,
  onSlideChanged,
  onCompleted,
  onExitRequested,
  onError,
  onReady,
}: LessonViewerEmbedProps) => {
  const appTheme = useTheme();
  const embedTheme: ThemeTokens = {
    '--ec-color-accent': appTheme.colors.primary[500],
  };

  const containerRef = useEveryCanvasEmbed({
    options: {
      embedBaseUrl: ENV.EVERYCLASS_EMBED_BASE_URL,
      mode: 'viewer',
      slideId,
      // getToken: () => fetchEmbedToken({ scope: 'viewer', slideId }),
      locale: 'ko-KR',
      theme: embedTheme,
    },
    handlers: {
      slideChanged: (p) => onSlideChanged?.(p as SlideChangedPayload),
      completed: (p) => onCompleted?.(p as CompletedPayload),
      exitRequested: (p) => onExitRequested?.(p as { reason?: 'userClose' | 'done' }),
    },
    onReady,
    onError,
    identity: [ENV.EVERYCLASS_EMBED_BASE_URL, slideId],
  });

  return (
    <ViewerContainer>
      <EmbedHost ref={containerRef} />
    </ViewerContainer>
  );
};
