// frontend/src/pages/home/HomePage.tsx
import styled from '@emotion/styled';
import {
  ActiveExamsCard,
  QuickLinksCard,
  ExamOverviewSection,
  LearningCharacteristicsSection,
  TypeDistributionSection,
} from '@widgets/home';

const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const TopCardsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 2fr 1fr;
  }
`;

export const HomePage = () => (
  <PageContainer>
    <TopCardsRow>
      <ActiveExamsCard />
      <QuickLinksCard />
    </TopCardsRow>
    <ExamOverviewSection />
    <LearningCharacteristicsSection />
    <TypeDistributionSection />
  </PageContainer>
);

export default HomePage;
