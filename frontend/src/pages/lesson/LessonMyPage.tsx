import { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from '@shared/ui/Button/Button';
import { LessonEditorEmbed } from './LessonEditorEmbed';
import { LessonViewerEmbed } from './LessonViewerEmbed';

const Page = styled.section`
  /* padding: ${({ theme }) => theme.spacing.md} 20px 0; */
`;

export const LessonMyPage = () => {
  const SLIDE_ID = 'slide_123';

  type Mode = 'idle' | 'editor' | 'viewer';
  const [mode, setMode] = useState<Mode>('idle');

  return (
    <Page>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Button
          variant={mode === 'editor' ? 'primary' : 'outline'}
          size='md'
          onClick={() => setMode('editor')}
          type='button'
        >
          슬라이드 저작
        </Button>

        <Button
          variant={mode === 'viewer' ? 'primary' : 'outline'}
          size='md'
          onClick={() => setMode('viewer')}
          type='button'
        >
          수업하기
        </Button>
      </div>

      {mode === 'editor' && <LessonEditorEmbed /*slideId={SLIDE_ID}*/ />}
      {mode === 'viewer' && <LessonViewerEmbed slideId={SLIDE_ID} />}
    </Page>
  );
};

export default LessonMyPage;
