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
        if (p.lcmsSetId) {
          registerRefSet({
            lcmsSetId: p.lcmsSetId,
            title: p.title,
            subjectCd: p.lessonMeta?.subject,
            schoolLevelCd: p.lessonMeta?.schoolLevel,
            makeMethod:
              p.lessonMeta?.makeMethod !== undefined
                ? Number(p.lessonMeta.makeMethod)
                : 3,
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
