import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ENV } from '@shared/config/env';
// import { fetchEmbedToken } from '../api/embedTokenService';
import { useEveryCanvasEmbed } from '../lib/useEveryCanvasEmbed';
import type {
  CompletedPayload,
  SlideChangedPayload,
  ThemeTokens,
} from '../lib/everyCanvasEmbedSdk';

const ViewerContainer = styled.div`
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.background.paper};
`;

const EmbedHost = styled.div`
  width: 100%;
  height: 100%;
`;

export type LessonViewerEmbedProps = {
  slideId: string;
  onSlideChanged?: (payload: SlideChangedPayload) => void;
  onCompleted?: (payload: CompletedPayload) => void;
  onExitRequested?: (payload: { reason?: 'userClose' | 'done' }) => void;
};

export const LessonViewerEmbed = ({
  slideId,
  onSlideChanged,
  onCompleted,
  onExitRequested,
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
    identity: [ENV.EVERYCLASS_EMBED_BASE_URL, slideId],
  });

  return (
    <ViewerContainer>
      <EmbedHost ref={containerRef} />
    </ViewerContainer>
  );
};
