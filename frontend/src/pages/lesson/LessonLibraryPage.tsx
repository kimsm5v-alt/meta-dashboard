import styled from '@emotion/styled';
import { FilterPanel, useLibraryFilters } from '@features/lesson';
import { LessonLibraryContents } from '@widgets/lesson';

const Page = styled.section``;

const ContentsHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const Description = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const LessonLibraryPage = () => {
  const { filters, sort, onToggle, onClear, onSort } = useLibraryFilters();

  return (
    <Page>
      <ContentsHeader>
        <Title>전체 자료실</Title>
        <Description>검증 · 비검증 · 내외부 SEL 콘텐츠를 함께 탐색합니다.</Description>
      </ContentsHeader>
      <FilterPanel
        filters={filters}
        sort={sort}
        onToggle={onToggle}
        onClear={onClear}
        onSort={onSort}
      />
      <LessonLibraryContents filters={filters} sort={sort} />
    </Page>
  );
};

export default LessonLibraryPage;
