import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ENV } from '@shared/config/env';
import { useEveryCanvasEmbed } from '../lib/useEveryCanvasEmbed';
import type { EmbedError, ThemeTokens } from '../lib/everyCanvasEmbedSdk';
import { getSsoAccessToken } from '../lib/getSsoAccessToken';

const ReportContainer = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.background.paper};
`;

const EmbedHost = styled.div`
  width: 100%;
  height: 100%;
`;

export type LessonActivityReportEmbedProps = {
  activityId: string;
  onExitRequested?: (payload: { reason?: 'userClose' | 'done' }) => void;
  onReportLoaded?: (payload: { resultCount?: number }) => void;
  onError?: (error: EmbedError) => void;
  onReady?: () => void;
};

/**
 * everyCanvas activity-report 래퍼.
 * Join/Editor/Viewer와 분리 — Result 조회 embed 전용.
 */
export const LessonActivityReportEmbed = ({
  activityId,
  onExitRequested,
  onReportLoaded,
  onError,
  onReady,
}: LessonActivityReportEmbedProps) => {
  const appTheme = useTheme();
  const embedTheme: ThemeTokens = {
    '--ec-color-accent': appTheme.colors.primary[500],
  };

  const containerRef = useEveryCanvasEmbed({
    options: {
      embedBaseUrl: ENV.EVERYCLASS_EMBED_BASE_URL,
      mode: 'activity-report',
      activityId,
      getSsoToken: getSsoAccessToken,
      locale: 'ko-KR',
      theme: embedTheme,
    },
    handlers: {
      exitRequested: (p) => onExitRequested?.(p as { reason?: 'userClose' | 'done' }),
      progress: (p) => {
        const payload = p as { resultCount?: number };
        if (payload.resultCount != null) {
          onReportLoaded?.({ resultCount: payload.resultCount });
        }
      },
    },
    onReady,
    onError,
    identity: [ENV.EVERYCLASS_EMBED_BASE_URL, activityId],
  });

  return (
    <ReportContainer>
      <EmbedHost ref={containerRef} />
    </ReportContainer>
  );
};
