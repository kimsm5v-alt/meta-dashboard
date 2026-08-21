import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { LessonActivityJoinEmbed, type EmbedError } from '@features/lesson';
import { PageLoading } from '@shared/ui/Loading';

type JoinViewState =
  | { kind: 'loading' }
  | { kind: 'not_allowed' }
  | { kind: 'error' }
  | { kind: 'ready'; accessKey: string; setId: string };

const MessageScreen = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

function resolveJoinViewState(
  accessKey: string | undefined,
  setIdFromUrl: string | undefined,
): JoinViewState {
  const trimmedKey = accessKey?.trim();
  if (!trimmedKey) {
    return { kind: 'error' };
  }

  const trimmedSetId = setIdFromUrl?.trim();

  // Phase A: 참여 가능 API 미연동 — 허용 후 embed
  // 임시: URL /student/lesson/:accessKey/:setId 에서 setId 전달 (Phase B 전 확인용)
  // Phase B: GET /entry/{accessKey} + GET /activities/{activityId} → lcmsSetId
  return {
    kind: 'ready',
    accessKey: trimmedKey,
    setId: trimmedSetId || trimmedKey,
  };
}

/**
 * 학생 수업 참여 풀스크린.
 * 라우트 `/student/lesson/:accessKey` · 임시 `/student/lesson/:accessKey/:setId`
 */
export const LessonJoinPage = () => {
  const { accessKey, setId: setIdParam } = useParams<{ accessKey: string; setId?: string }>();
  const navigate = useNavigate();
  const viewState = useMemo(
    () => resolveJoinViewState(accessKey, setIdParam),
    [accessKey, setIdParam],
  );

  const handleError = (error: EmbedError) => {
    console.warn('[LessonJoinPage] embed error', error.code, error.message);
  };

  if (viewState.kind === 'loading') {
    return <PageLoading text='활동 정보를 불러오는 중...' />;
  }

  if (viewState.kind === 'not_allowed') {
    return <MessageScreen>이 활동에 참여할 수 없습니다</MessageScreen>;
  }

  if (viewState.kind === 'error') {
    return <MessageScreen>활동 정보를 불러오지 못했습니다</MessageScreen>;
  }

  return (
    <LessonActivityJoinEmbed
      // 임시: URL accessKey를 embed activityId로 전달. Phase B에서 LMS/everyCanvas 계약에 맞게 교체
      activityId={viewState.accessKey}
      setId={viewState.setId}
      onExitRequested={() => navigate(-1)}
      onError={handleError}
    />
  );
};

export default LessonJoinPage;
