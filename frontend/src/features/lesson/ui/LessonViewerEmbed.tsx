import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useAuth } from '@features/auth';
import { ENV } from '@shared/config/env';
import { PageLoading } from '@shared/ui/Loading';
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
  setId: string;
  onSlideChanged?: (payload: SlideChangedPayload) => void;
  onCompleted?: (payload: CompletedPayload) => void;
  onExitRequested?: (payload: { reason?: 'userClose' | 'done' }) => void;
  onError?: (error: EmbedError) => void;
  onReady?: () => void;
};

type EmbedUserRole = 'teacher' | 'student' | 'guest';

function mapRoleCodeToEmbedUserRole(roleCode: string): EmbedUserRole {
  return roleCode === 'STUDENT' ? 'student' : roleCode === 'TEACHER' ? 'teacher' : 'guest';
}

type LessonViewerEmbedReadyProps = LessonViewerEmbedProps & {
  userRole: EmbedUserRole;
};

/**
 * everyCanvas SlideViewer 래퍼 (SDK 1.5.0 — Viewer 계약 변경 없음).
 * getSsoToken / openSet 미사용.
 * 인증/roleCode가 준비되기 전에는 embed를 만들지 않는다.
 */
export const LessonViewerEmbed = (props: LessonViewerEmbedProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const roleCode = user?.roleCode?.trim();

  if (isLoading || !isAuthenticated) {
    return (
      <ViewerContainer>
        <PageLoading text='로딩 중...' />
      </ViewerContainer>
    );
  }

  return (
    <LessonViewerEmbedReady {...props} userRole={mapRoleCodeToEmbedUserRole(roleCode ?? '')} />
  );
};

const LessonViewerEmbedReady = ({
  setId,
  userRole,
  onSlideChanged,
  onCompleted,
  onExitRequested,
  onError,
  onReady,
}: LessonViewerEmbedReadyProps) => {
  const appTheme = useTheme();
  const embedTheme: ThemeTokens = {
    '--ec-color-accent': appTheme.colors.primary[500],
  };

  const containerRef = useEveryCanvasEmbed({
    options: {
      embedBaseUrl: ENV.EVERYCLASS_EMBED_BASE_URL,
      mode: 'viewer',
      slideId: setId,
      locale: 'ko-KR',
      theme: embedTheme,
      features: { userRole },
    },
    handlers: {
      slideChanged: (p) => onSlideChanged?.(p as SlideChangedPayload),
      completed: (p) => onCompleted?.(p as CompletedPayload),
      exitRequested: (p) => onExitRequested?.(p as { reason?: 'userClose' | 'done' }),
    },
    onReady,
    onError,
    identity: [ENV.EVERYCLASS_EMBED_BASE_URL, setId, userRole],
  });

  return (
    <ViewerContainer>
      <EmbedHost ref={containerRef} />
    </ViewerContainer>
  );
};
