import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ENV } from '@shared/config/env';
import { getSsoAccessToken } from '../lib/getSsoAccessToken';
import { useEveryCanvasEmbed } from '../lib/useEveryCanvasEmbed';
import type {
  EmbedError,
  SavedPayload,
  StartLessonPayload,
  ThemeTokens,
} from '../lib/everyCanvasEmbedSdk';

const EditorContainer = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.background.paper};
`;

const EmbedHost = styled.div`
  width: 100%;
  height: 100%;
`;

export type LessonEditorEmbedProps = {
  /**
   * CBS 세트지 id (= LMS `lcmsSetId` / CMS `setId`).
   * 있으면 ready 후 `openSet(setId)`. 없으면 신규(`/embed/editor/new`).
   */
  setId?: string;
  onSaved?: (payload: SavedPayload) => void;
  onStartLesson?: (payload: StartLessonPayload) => void;
  onExitRequested?: (payload: { reason?: 'userClose' | 'done' }) => void;
  onError?: (error: EmbedError) => void;
  onReady?: () => void;
};

/**
 * everyCanvas SlideEditor 래퍼 (SDK 1.5.0 · setId -> openSet).
 * Host는 `onSaved`로 LMS 등록 등을 처리한다.
 */
export const LessonEditorEmbed = ({
  setId,
  onSaved,
  onStartLesson,
  onExitRequested,
  onError,
  onReady,
}: LessonEditorEmbedProps) => {
  const appTheme = useTheme();
  const embedTheme: ThemeTokens = {
    '--ec-color-accent': appTheme.colors.primary[500],
  };

  const containerRef = useEveryCanvasEmbed({
    options: {
      embedBaseUrl: ENV.EVERYCLASS_EMBED_BASE_URL,
      mode: 'editor',
      // getToken: () => fetchEmbedToken({ scope: 'editor' }),
      getSsoToken: getSsoAccessToken,
      locale: 'ko-KR',
      theme: embedTheme,
      features: {
        showStartLesson: true,
        showExit: true,
      },
    },
    setId: setId,
    handlers: {
      saved: (p) => onSaved?.(p as SavedPayload),
      startLesson: (p) => onStartLesson?.(p as StartLessonPayload),
      exitRequested: (p) => onExitRequested?.(p as { reason?: 'userClose' | 'done' }),
    },
    onReady,
    onError,
    identity: [ENV.EVERYCLASS_EMBED_BASE_URL, setId ?? '__new__'],
  });

  return (
    <EditorContainer>
      <EmbedHost ref={containerRef} />
    </EditorContainer>
  );
};
