import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { LessonActivityJoinEmbed, type EmbedError } from '@features/lesson';
import { PageLoading } from '@shared/ui/Loading';

type JoinViewState =
  | { kind: 'loading' }
  | { kind: 'not_allowed' }
  | { kind: 'error' }
  | { kind: 'ready'; activityId: string; setId: string };

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

function resolveJoinViewState(activityId: string | undefined): JoinViewState {
  const trimmedId = activityId?.trim();
  if (!trimmedId) {
    return { kind: 'error' };
  }

  // Phase A: 참여 가능·setId API 미연동 — 허용 후 setId=activityId(임시)
  // Phase B: getActivityJoinEligibility / getActivityJoinSetId 결과로 분기
  return {
    kind: 'ready',
    activityId: trimmedId,
    // 임시 — activityId→setId 조회 API 응답으로 교체
    setId: trimmedId,
  };
}

/**
 * 학생 수업 참여 풀스크린.
 * 라우트 `/student/lesson/:activityId`
 */
export const LessonJoinPage = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const viewState = useMemo(() => resolveJoinViewState(activityId), [activityId]);

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
      activityId={viewState.activityId}
      setId={viewState.setId}
      onExitRequested={() => navigate(-1)}
      onError={handleError}
    />
  );
};

export default LessonJoinPage;
