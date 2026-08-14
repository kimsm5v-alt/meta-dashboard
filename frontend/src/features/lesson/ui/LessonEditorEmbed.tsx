import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { ENV } from '@shared/config/env';
// import { fetchEmbedToken } from '../api/embedTokenService';
import { getSsoAccessToken } from '../lib/getSsoAccessToken';
import { useEveryCanvasEmbed } from '../lib/useEveryCanvasEmbed';
import type { SavedPayload, StartLessonPayload, ThemeTokens } from '../lib/everyCanvasEmbedSdk';

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
  /** 있으면 기존 슬라이드 편집, 없으면 신규(`/embed/editor/new`) */
  slideId?: string;
  onSaved?: (payload: SavedPayload) => void;
  onDirty?: (payload: { dirty: boolean }) => void;
  /**
   * 사용자가 '수업하기'를 조작할 때 호출 (SDK 1.2.0).
   * `features.showStartLesson`이 `true`일 때만 iframe 내 버튼이 노출됨 (SDK 1.3.0).
   * meta-dashboard 자체 Host UI 버튼과 중복되면 showStartLesson을 켜지 말 것.
   * everyCanvas는 수업을 실행하지 않고 값만 전달 — Host가 수업 화면을 직접 실행.
   */
  onStartLesson?: (payload: StartLessonPayload) => void;
  onExitRequested?: (payload: { reason?: 'userClose' | 'done' }) => void;
};

export const LessonEditorEmbed = ({
  slideId,
  onSaved,
  onDirty,
  onStartLesson,
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
      // showStartLesson·showExit는 기본 숨김(SDK default false).
      // Host UI에 자체 수업하기·닫기 버튼이 있으면 켜지 말 것 (plan §4.3.3).
      features: {
        showStartLesson: true,
        showExit: true,
      },
    },
    handlers: {
      saved: (p) => onSaved?.(p as SavedPayload),
      dirty: (p) => onDirty?.(p as { dirty: boolean }),
      startLesson: (p) => onStartLesson?.(p as StartLessonPayload),
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
