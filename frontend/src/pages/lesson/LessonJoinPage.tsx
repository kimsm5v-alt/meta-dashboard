import { useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import {
  LessonActivityJoinEmbed,
  useActivityEntryQuery,
  useStartParticipationQuery,
  type EmbedError,
  type EntryAvailability,
} from '@features/lesson';
import { PageLoading } from '@shared/ui/Loading';

const MessageScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 100vh;
  padding: 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const MessageDetail = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.disabled};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

function formatOpenAt(openAt: string): string {
  const date = new Date(openAt);
  if (Number.isNaN(date.getTime())) return openAt;
  return date.toLocaleString('ko-KR');
}

function getAvailabilityMessage(
  availability: EntryAvailability,
  openAt: string | null,
): { title: string; detail?: string } {
  switch (availability) {
    case 'NOT_STARTED':
      return {
        title: '아직 활동을 시작할 수 없습니다.',
        detail: openAt ? `활동 시작 시간: ${formatOpenAt(openAt)}` : undefined,
      };
    case 'CLOSED':
      return { title: '활동이 종료되었습니다.' };
    case 'NOT_AVAILABLE':
      return { title: '활동이 시작되지 않았습니다.' };
    default:
      return { title: '이 활동에 참여할 수 없습니다' };
  }
}

/**
 * 학생 수업 참여 풀스크린.
 * 라우트 `/student/lesson/:accessKey`
 * GET /entry → POST /participations → content.lcmsSetId embed
 */
export const LessonJoinPage = () => {
  const { accessKey: accessKeyParam } = useParams<{ accessKey: string }>();
  const navigate = useNavigate();
  const accessKey = accessKeyParam?.trim() || undefined;

  const entryQuery = useActivityEntryQuery(accessKey);
  const isOpen = entryQuery.data?.availability === 'OPEN';
  const participationQuery = useStartParticipationQuery(accessKey, {
    enabled: Boolean(accessKey) && isOpen,
  });

  const handleError = (error: EmbedError) => {
    console.warn('[LessonJoinPage] embed error', error.code, error.message);
  };

  if (!accessKey) {
    return <MessageScreen>활동 정보를 불러오지 못했습니다</MessageScreen>;
  }

  if (entryQuery.isPending) {
    return <PageLoading text='활동 정보를 불러오는 중...' />;
  }

  if (entryQuery.isError || !entryQuery.data) {
    return <MessageScreen>활동 정보를 불러오지 못했습니다</MessageScreen>;
  }

  const { availability, openAt } = entryQuery.data;

  if (availability !== 'OPEN') {
    const message = getAvailabilityMessage(availability, openAt);
    return (
      <MessageScreen>
        <span>{message.title}</span>
        {message.detail ? <MessageDetail>{message.detail}</MessageDetail> : null}
      </MessageScreen>
    );
  }

  if (participationQuery.isPending) {
    return <PageLoading text='활동 정보를 불러오는 중...' />;
  }

  if (participationQuery.isError || !participationQuery.data) {
    return <MessageScreen>활동 정보를 불러오지 못했습니다</MessageScreen>;
  }

  const lcmsSetId = participationQuery.data.content?.lcmsSetId?.trim();
  if (!lcmsSetId) {
    return <MessageScreen>활동 정보를 불러오지 못했습니다</MessageScreen>;
  }

  return (
    <LessonActivityJoinEmbed
      // everyCanvas activityId — 계약 확정 전까지 accessKey 전달
      activityId={accessKey}
      setId={lcmsSetId}
      onExitRequested={() => navigate(-1)}
      onError={handleError}
    />
  );
};

export default LessonJoinPage;
