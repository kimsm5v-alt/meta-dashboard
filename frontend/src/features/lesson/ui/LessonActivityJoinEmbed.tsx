import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ENV } from '@shared/config/env';
import { useEveryCanvasEmbed } from '../lib/useEveryCanvasEmbed';
import type { EmbedError, ThemeTokens } from '../lib/everyCanvasEmbedSdk';

const JoinContainer = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.background.paper};
`;

const EmbedHost = styled.div`
  width: 100%;
  height: 100%;
`;

export type LessonActivityJoinEmbedProps = {
  activityId: string;
  /** POST /participations → data.content.lcmsSetId. embed slideId */
  setId: string;
  onExitRequested?: (payload: { reason?: 'userClose' | 'done' }) => void;
  onSubmitted?: (payload: unknown) => void;
  onError?: (error: EmbedError) => void;
  onReady?: () => void;
};

/**
 * everyCanvas activity-join 래퍼.
 * 학생 QR/링크 진입 전용 — SlideViewer(`LessonViewerEmbed`)와 분리.
 */
export const LessonActivityJoinEmbed = ({
  activityId,
  setId,
  onExitRequested,
  onSubmitted,
  onError,
  onReady,
}: LessonActivityJoinEmbedProps) => {
  const appTheme = useTheme();
  const embedTheme: ThemeTokens = {
    '--ec-color-accent': appTheme.colors.primary[500],
  };

  const containerRef = useEveryCanvasEmbed({
    options: {
      embedBaseUrl: ENV.EVERYCLASS_EMBED_BASE_URL,
      mode: 'activity-join',
      activityId,
      slideId: setId,
      locale: 'ko-KR',
      theme: embedTheme,
    },
    handlers: {
      exitRequested: (p) => onExitRequested?.(p as { reason?: 'userClose' | 'done' }),
      submitted: (p) => onSubmitted?.(p),
      slideChanged: (p) => console.log('slideChanged', p),
      phaseChanged: (p) => console.log('phaseChanged', p),
      progress: (p) => console.log('progress', p),
    },
    onReady,
    onError,
    identity: [ENV.EVERYCLASS_EMBED_BASE_URL, activityId, setId],
  });

  return (
    <JoinContainer>
      <EmbedHost ref={containerRef} />
    </JoinContainer>
  );
};
