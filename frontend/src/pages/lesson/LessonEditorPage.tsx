import { useNavigate, useParams } from 'react-router-dom';
import { LessonEditorEmbed } from '@features/lesson';
import type { SavedPayload, StartLessonPayload } from '@features/lesson';

export const LessonEditorPage = () => {
  const { slideId } = useParams<{ slideId?: string }>();
  const navigate = useNavigate();

  return (
    <LessonEditorEmbed
      slideId={slideId}
      onSaved={(p: SavedPayload) => {
        if (!slideId && p.slideId) {
          navigate(`/lesson/editor/${p.slideId}`, { replace: true });
        }
      }}
      onStartLesson={(p: StartLessonPayload) => {
        console.log('[LessonEditorPage] onStartLesson', p);
      }}
      onExitRequested={() => navigate(-1)}
    />
  );
};

export default LessonEditorPage;
