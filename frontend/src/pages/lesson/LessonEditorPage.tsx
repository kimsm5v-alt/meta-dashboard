import { useNavigate, useParams } from 'react-router-dom';
import { LessonEditorEmbed, useRegisterRefSetMutation } from '@features/lesson';
import type { EmbedError, SavedPayload, StartLessonPayload } from '@features/lesson';

/**
 * 수업 저작 풀스크린.
 * 라우트 `/lesson/editor` = 신규, `/lesson/editor/:setId` = CBS 세트 openSet.
 */
export const LessonEditorPage = () => {
  const { setId } = useParams<{ setId?: string }>();
  const navigate = useNavigate();
  const { mutate: registerRefSet } = useRegisterRefSetMutation();

  const handleSaved = (p: SavedPayload) => {
    console.log('LessonEditorPage handleSaved', p);
    if (p.lcmsSetId && p.title) {
      registerRefSet({
        lcmsSetId: p.lcmsSetId,
        makeMethod: p.lessonMeta?.makeMethod !== undefined ? Number(p.lessonMeta.makeMethod) : 3,
        options: {
          title: p.title,
          ...(p.thumbnail ? { thumbnailUrl: p.thumbnail } : {}),
        },
      });
    }
    if (!setId && p.lcmsSetId) {
      navigate(`/lesson/editor/${p.lcmsSetId}`, { replace: true });
    } else if (!setId && p.slideId) {
      navigate(`/lesson/editor/${p.slideId}`, { replace: true });
    }
  };

  const handleStartLesson = (p: StartLessonPayload) => {
    // TODO: Host 수업 화면 실행 (Viewer/Deploy). openSet setId ≠ Platform slideId.
    if (import.meta.env.DEV) {
      console.log('[LessonEditorPage] onStartLesson', p);
    }
  };

  const handleError = (error: EmbedError) => {
    // if (import.meta.env.DEV) {
    console.warn('[LessonEditorPage] embed error', error.code, error.message);
    // }
  };

  return (
    <LessonEditorEmbed
      setId={setId}
      onSaved={handleSaved}
      onStartLesson={handleStartLesson}
      onExitRequested={() => navigate(-1)}
      onError={handleError}
    />
  );
};

export default LessonEditorPage;
