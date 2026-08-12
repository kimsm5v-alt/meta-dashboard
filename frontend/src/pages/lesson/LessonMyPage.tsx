import { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from '@shared/ui/Button/Button';
import { LessonEditorEmbed, LessonViewerEmbed } from '@features/lesson';

const Page = styled.section``;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const LessonMyPage = () => {
  const SLIDE_ID = 'slide_123';

  type Mode = 'idle' | 'editor' | 'viewer';
  const [mode, setMode] = useState<Mode>('idle');

  return (
    <Page>
      <Toolbar>
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
      </Toolbar>

      {mode === 'editor' && <LessonEditorEmbed />}
      {mode === 'viewer' && <LessonViewerEmbed slideId={SLIDE_ID} />}
    </Page>
  );
};

export default LessonMyPage;
