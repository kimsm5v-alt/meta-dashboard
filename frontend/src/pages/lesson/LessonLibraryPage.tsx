import styled from '@emotion/styled';
import { LessonLibraryContents, LessonLibraryHeader } from '@widgets/lesson';

const Page = styled.section``;

export const LessonLibraryPage = () => {
  return (
    <Page>
      <LessonLibraryHeader />
      <LessonLibraryContents />
    </Page>
  );
};

export default LessonLibraryPage;
