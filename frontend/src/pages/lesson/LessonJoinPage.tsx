import { useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { toast } from 'sonner';
import {
  LessonActivityJoinEmbed,
  LmsHttpError,
  submitParticipation,
  useActivityEntryQuery,
  useParticipationAutosave,
  useStartParticipationQuery,
  type EmbedError,
  type EntryAvailability,
  type ParticipationDetail,
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

interface LessonJoinSessionProps {
  accessKey: string;
  participation: ParticipationDetail;
  lcmsSetId: string;
}

const LessonJoinSession = ({ accessKey, participation, lcmsSetId }: LessonJoinSessionProps) => {
  const navigate = useNavigate();
  const submitKeyRef = useRef(crypto.randomUUID());
  const { participationId, content } = participation;

  const handleFatalAutosaveError = useCallback(
    (error: LmsHttpError) => {
      if (error.errorCode === 'ACTIVITY_CLOSED') {
        toast.message('활동이 종료되었습니다.');
        navigate(-1);
        return;
      }
      if (error.errorCode === 'ALREADY_SUBMITTED') {
        toast.message('이미 제출한 활동입니다.');
        navigate('/student/lesson/result');
      }
    },
    [navigate],
  );

  const autosave = useParticipationAutosave({
    participationId,
    contentItems: content.items,
    gradingPolicy: content.gradingPolicy,
    onFatalError: handleFatalAutosaveError,
  });

  const handleError = (error: EmbedError) => {
    console.warn('[LessonJoinPage] embed error', error.code, error.message);
  };

  const handleExit = async () => {
    await autosave.flush();
    navigate(-1);
  };

  const handleSubmitted = async () => {
    await autosave.flush();
    try {
      await submitParticipation(participationId, submitKeyRef.current);
      toast.success('제출되었습니다');
      navigate('/student/lesson/result');
    } catch (error) {
      if (error instanceof LmsHttpError) {
        if (error.errorCode === 'ALREADY_SUBMITTED') {
          toast.message('이미 제출한 활동입니다.');
          navigate('/student/lesson/result');
          return;
        }
        if (error.errorCode === 'ACTIVITY_CLOSED') {
          toast.message('활동이 종료되었습니다.');
          navigate(-1);
          return;
        }
      }
      toast.message('제출하지 못했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <LessonActivityJoinEmbed
      accessKey={accessKey}
      setId={lcmsSetId}
      onAnswerSaved={autosave.enqueue}
      onExitRequested={handleExit}
      onSubmitted={handleSubmitted}
      onError={handleError}
    />
  );
};

/**
 * 학생 수업 참여 풀스크린.
 * 라우트 `/student/lesson/:accessKey`
 * GET /entry → POST /participations → content.lcmsSetId embed
 */
export const LessonJoinPage = () => {
  const { accessKey: accessKeyParam } = useParams<{ accessKey: string }>();
  const accessKey = accessKeyParam?.trim() || undefined;

  const entryQuery = useActivityEntryQuery(accessKey);
  const isOpen = entryQuery.data?.availability === 'OPEN';
  const participationQuery = useStartParticipationQuery(accessKey, {
    enabled: Boolean(accessKey) && isOpen,
  });

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
    <LessonJoinSession
      accessKey={accessKey}
      participation={participationQuery.data}
      lcmsSetId={lcmsSetId}
    />
  );
};

export default LessonJoinPage;
