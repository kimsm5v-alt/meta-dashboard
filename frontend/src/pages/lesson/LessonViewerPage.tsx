import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonViewerEmbed } from '@features/lesson';

export const LessonViewerPage = () => {
  const { slideId } = useParams<{ slideId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slideId) {
      navigate(-1);
    }
  }, [slideId, navigate]);

  if (!slideId) {
    return null;
  }

  return (
    <LessonViewerEmbed
      slideId={slideId}
      onExitRequested={() => navigate(-1)}
    />
  );
};

export default LessonViewerPage;
