import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  LessonViewerEmbed,
  closeActivity,
  LmsHttpError,
  type EmbedError,
  type LessonViewerPageLocationState,
} from '@features/lesson';

export const LessonViewerPage = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!setId) {
      navigate(-1);
    }
  }, [setId, navigate]);

  const goToResult = useCallback(() => {
    navigate(`/lesson/result${location.search}`);
  }, [navigate, location.search]);

  const handleExitRequested = useCallback(async () => {
    const activityId = (location.state as LessonViewerPageLocationState | null)?.activityId?.trim();

    if (!activityId) {
      toast.message('활동 정보를 찾을 수 없습니다');
      goToResult();
      return;
    }

    try {
      await closeActivity(activityId);
      goToResult();
    } catch (error) {
      if (error instanceof LmsHttpError) {
        if (error.errorCode === 'NOT_FOUND') {
          toast.message('활동을 찾을 수 없습니다');
        } else if (error.errorCode === 'ACTIVITY_NOT_PUBLISHED') {
          toast.message('아직 발행되지 않은 활동입니다');
        } else {
          toast.message('수업을 마감하지 못했습니다');
        }
      } else {
        toast.message('수업을 마감하지 못했습니다');
      }
      goToResult();
    }
  }, [location.state, goToResult]);

  const handleError = (error: EmbedError) => {
    console.warn('[LessonViewerPage] embed error', error.code, error.message);
  };

  if (!setId) {
    return null;
  }

  return (
    <LessonViewerEmbed setId={setId} onExitRequested={handleExitRequested} onError={handleError} />
  );
};

export default LessonViewerPage;
