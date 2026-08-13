import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ENV } from '@shared/config/env';
// import { fetchEmbedToken } from '../api/embedTokenService';
import { getSsoAccessToken } from '../lib/getSsoAccessToken';
import { useEveryCanvasEmbed } from '../lib/useEveryCanvasEmbed';
import type { SavedPayload, ThemeTokens } from '../lib/everyCanvasEmbedSdk';

const EditorContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: ${({ theme }) => theme.colors.background.paper};
`;

const EmbedHost = styled.div`
  width: 100%;
  height: 100%;
`;

export type LessonEditorEmbedProps = {
  /** 있으면 기존 슬라이드 편집, 없으면 신규(`/embed/editor/new`) */
  slideId?: string;
  onSaved?: (payload: SavedPayload) => void;
  onDirty?: (payload: { dirty: boolean }) => void;
  onExitRequested?: (payload: { reason?: 'userClose' | 'done' }) => void;
};

export const LessonEditorEmbed = ({
  slideId,
  onSaved,
  onDirty,
  onExitRequested,
}: LessonEditorEmbedProps) => {
  const appTheme = useTheme();
  const embedTheme: ThemeTokens = {
    '--ec-color-accent': appTheme.colors.primary[500],
  };

  const containerRef = useEveryCanvasEmbed({
    options: {
      embedBaseUrl: ENV.EVERYCLASS_EMBED_BASE_URL,
      mode: 'editor',
      ...(slideId ? { slideId } : {}),
      // getToken: () => fetchEmbedToken({ scope: 'editor', slideId }),
      getSsoToken: getSsoAccessToken,
      locale: 'ko-KR',
      theme: embedTheme,
    },
    handlers: {
      saved: (p) => onSaved?.(p as SavedPayload),
      dirty: (p) => onDirty?.(p as { dirty: boolean }),
      exitRequested: (p) => onExitRequested?.(p as { reason?: 'userClose' | 'done' }),
    },
    identity: [ENV.EVERYCLASS_EMBED_BASE_URL, slideId ?? '__new__'],
  });

  return (
    <EditorContainer>
      <EmbedHost ref={containerRef} />
    </EditorContainer>
  );
};
