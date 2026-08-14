import { useNavigate, useParams } from 'react-router-dom';
import { LessonEditorEmbed } from '@features/lesson';
import type { SavedPayload, StartLessonPayload } from '@features/lesson';
import { useRegisterRefSetMutation } from '@features/lesson';

export const LessonEditorPage = () => {
  const { slideId } = useParams<{ slideId?: string }>();
  const navigate = useNavigate();
  const { mutate: registerRefSet } = useRegisterRefSetMutation();

  return (
    <LessonEditorEmbed
      slideId={slideId}
      onSaved={(p: SavedPayload) => {
        if (p.lcmsSetId && p.title) {
          registerRefSet({
            lcmsSetId: p.lcmsSetId,
            makeMethod:
              p.lessonMeta?.makeMethod !== undefined ? Number(p.lessonMeta.makeMethod) : 3,
            options: {
              title: p.title,
              ...(p.thumbnail ? { thumbnailUrl: p.thumbnail } : {}),
            },
          });
        }
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
