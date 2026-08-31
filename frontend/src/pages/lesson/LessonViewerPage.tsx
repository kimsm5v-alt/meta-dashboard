import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonViewerEmbed, type EmbedError } from '@features/lesson';

export const LessonViewerPage = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!setId) {
      navigate(-1);
    }
  }, [setId, navigate]);

  if (!setId) {
    return null;
  }

  const handleError = (error: EmbedError) => {
    // if (import.meta.env.DEV) {
    console.warn('[LessonViewerPage] embed error', error.code, error.message);
    // }
  };

  return (
    <LessonViewerEmbed setId={setId} onExitRequested={() => navigate(-1)} onError={handleError} />
  );
};

export default LessonViewerPage;
