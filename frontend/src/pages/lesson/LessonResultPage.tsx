import { useState } from 'react';
import styled from '@emotion/styled';
import { StatusPanel, ReportFilterChips, ReportCardList } from '@widgets/lesson';
import type { RsFilter } from '@widgets/lesson';

const Page = styled.section`
  /* padding: ${({ theme }) => theme.spacing.md} 20px 0; */
`;

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

export const LessonResultPage = () => {
  const [highlightStudent, setHighlightStudent] = useState<string | null>(null);
  const [rsFilter, setRsFilter] = useState<RsFilter>('전체');

  const handleSelectStudent = (name: string | null) => {
    setHighlightStudent(name);
    if (name !== null) setRsFilter('진행중');
  };

  return (
    <Page>
      <ContentsHeader>
        <Title>수업 결과보기</Title>
        <Description>
          배포한 활동의 참여 현황을 한눈에 보고, 활동별 리포트로 상세 결과를 확인하세요.
        </Description>
      </ContentsHeader>

      <StatusPanel selected={highlightStudent} onSelect={handleSelectStudent} />
      <ReportFilterChips filter={rsFilter} onFilterChange={setRsFilter} />
      <ReportCardList filter={rsFilter} highlightStudent={highlightStudent} />
    </Page>
  );
};

export default LessonResultPage;
