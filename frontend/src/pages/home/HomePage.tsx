// frontend/src/pages/home/HomePage.tsx
import { useState } from 'react';
import styled from '@emotion/styled';
import {
  HomeGreetingBand,
  ActiveExamsCard,
  InProgressLessonCard,
  QuickLinksCard,
  ExamKpiSection,
  ExamStatusSection,
  LearningCharacteristicsSection,
  TypeDistributionSection,
  LessonStatusSection,
  SELCompetencyMatrixSection,
} from '@widgets/home';

type HomeTab = 'exam' | 'lesson';

const PageWrapper = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const TopCardsRow = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  max-width: 1280px;
  margin: -46px auto 0;
  padding: 0 ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.xl};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr 300px;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.xl};
`;

const TabNav = styled.div`
  width: fit-content;
  display: inline-flex;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 6px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 10px 24px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme, $active }) => ($active ? 'white' : theme.colors.gray[600])};
  background: ${({ theme, $active }) => ($active ? theme.colors.primary[500] : 'transparent')};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme, $active }) => ($active ? 'white' : theme.colors.text.primary)};
    background: ${({ theme, $active }) =>
      $active ? theme.colors.primary[600] : theme.colors.gray[50]};
  }
`;

export const HomePage = () => {
  const [activeTab, setActiveTab] = useState<HomeTab>('exam');

  const scrollToExamStatus = () => {
    setActiveTab('exam');
    setTimeout(() => {
      document.getElementById('exam-status-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <PageWrapper>
      <HomeGreetingBand />

      <TopCardsRow>
        <ActiveExamsCard onViewAll={scrollToExamStatus} />
        <InProgressLessonCard />
        <QuickLinksCard />
      </TopCardsRow>

      <Content>
        <TabNav role='tablist' aria-label='홈 대시보드 탭'>
          <TabButton
            role='tab'
            aria-selected={activeTab === 'exam'}
            $active={activeTab === 'exam'}
            onClick={() => setActiveTab('exam')}
          >
            검사
          </TabButton>
          <TabButton
            role='tab'
            aria-selected={activeTab === 'lesson'}
            $active={activeTab === 'lesson'}
            onClick={() => setActiveTab('lesson')}
          >
            수업
          </TabButton>
        </TabNav>

        {activeTab === 'exam' && (
          <>
            <ExamKpiSection />
            <div id='exam-status-section'>
              <ExamStatusSection />
            </div>
            <LearningCharacteristicsSection />
            <TypeDistributionSection />
          </>
        )}

        {activeTab === 'lesson' && (
          <>
            <LessonStatusSection />
            <SELCompetencyMatrixSection />
          </>
        )}
      </Content>
    </PageWrapper>
  );
};

export default HomePage;
