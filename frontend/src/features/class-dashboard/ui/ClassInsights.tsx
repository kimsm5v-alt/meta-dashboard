import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { ArrowRight, Lightbulb, BookOpen } from 'lucide-react';
import type { Class } from '@shared/types';
import { useClassProfile } from '../model/useClassProfile';
import type { ClassProfileItem } from '../model/useClassProfile';
import { SUB_CATEGORY_SCRIPTS } from '@shared/data/subCategoryScripts';
import { DOMAIN_COLORS } from '@shared/data/lpaProfiles';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_ACTIVITIES_BY_PROFILE } from '@shared/data/apiDefinitions';

// ============================================================
// Styled Components
// ============================================================

const Container = styled.div`
  background-color: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 2px;
`;

const DetailButton = styled.button`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.background.paper};
  background-color: ${({ theme }) => theme.colors.primary[600]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[700]};
  }

  svg {
    color: rgba(255, 255, 255, 0.7);
    transition: color ${({ theme }) => theme.transitions.fast};
  }

  &:hover svg {
    color: ${({ theme }) => theme.colors.background.paper};
  }
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const RoundSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RoundButton = styled.button<{ $isActive: boolean }>`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background-color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.gray[800] : theme.colors.gray[100]};
  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.background.paper : theme.colors.gray[500]};

  &:hover {
    background-color: ${({ theme, $isActive }) =>
      $isActive ? theme.colors.gray[800] : theme.colors.gray[200]};
  }
`;

const SectionTitle = styled.h3<{ $accent: 'emerald' | 'red' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ $accent }) => ($accent === 'emerald' ? '#065f46' : '#991b1b')};
`;

const SectionBadge = styled.span<{ $accent: 'emerald' | 'red' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background-color: ${({ $accent }) => ($accent === 'emerald' ? '#d1fae5' : '#fecaca')};
  color: ${({ $accent }) => ($accent === 'emerald' ? '#047857' : '#b91c1c')};
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const ProfileItemCard = styled.div<{ $accent: 'emerald' | 'red' }>`
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ $accent }) => ($accent === 'emerald' ? '#a7f3d0' : '#fecaca')};
  background-color: ${({ $accent }) =>
    $accent === 'emerald' ? 'rgba(209, 250, 229, 0.5)' : 'rgba(254, 226, 226, 0.5)'};
`;

const ParentCategoryTag = styled.span`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 4px;
  display: inline-block;
`;

const ProfileItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
`;

const ProfileRank = styled.span<{ $accent: 'emerald' | 'red' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $accent }) => ($accent === 'emerald' ? '#10b981' : '#ef4444')};
`;

const ProfileName = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ProfileDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const Divider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const RecommendedSection = styled.div``;

const RecommendedHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const RecommendedTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ActivityCard = styled.div`
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  background-color: rgba(250, 245, 255, 0.5);
`;

const ActivityTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[800]};
  line-height: 1.4;
`;

const ActivityDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 4px;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const ViewResourcesButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background-color: ${({ theme }) => theme.colors.primary[600]};
  color: ${({ theme }) => theme.colors.background.paper};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  border: none;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[700]};
  }

  svg {
    color: rgba(255, 255, 255, 0.7);
    transition: color ${({ theme }) => theme.transitions.fast};
  }

  &:hover svg {
    color: ${({ theme }) => theme.colors.background.paper};
  }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

// ============================================================
// Interfaces & Types
// ============================================================

interface ClassInsightsProps {
  classData: Class;
}

// ============================================================
// Utilities
// ============================================================

/** 중분류 표시명 (SUB_CATEGORY_SCRIPTS.name 사용) */
function getCategoryDisplayName(category: string): string {
  return SUB_CATEGORY_SCRIPTS[category]?.name ?? category;
}

// ============================================================
// Sub-Components
// ============================================================

/** 프로파일 아이템 렌더링 (컴팩트, 중분류명 + summary) */
const ProfileItem: React.FC<{
  item: ClassProfileItem;
  rank: number;
  accent: 'emerald' | 'red';
}> = ({ item, rank, accent }) => {
  return (
    <ProfileItemCard $accent={accent}>
      {item.parentCategory && (
        <ParentCategoryTag style={{ color: DOMAIN_COLORS[item.parentCategory] ?? '#9CA3AF' }}>
          #{item.parentCategory}
        </ParentCategoryTag>
      )}
      <ProfileItemHeader>
        <ProfileRank $accent={accent}>{rank}</ProfileRank>
        <ProfileName>{getCategoryDisplayName(item.category)}</ProfileName>
      </ProfileItemHeader>
      {item.categoryScript && <ProfileDescription>{item.categoryScript}</ProfileDescription>}
    </ProfileItemCard>
  );
};

/** 추천 학급 활동 데이터 */
const RECOMMENDED_ACTIVITIES = [
  { title: '감정 온도계 활동', desc: '매일 아침 자신의 감정 상태를 체크하고 공유하는 활동' },
  { title: '또래 학습 멘토링', desc: '학습 강점이 다른 학생끼리 짝을 이루어 서로 가르치는 활동' },
  { title: '메타인지 학습일지', desc: '매주 학습 과정을 돌아보고 다음 주 계획을 세우는 활동' },
];

// ============================================================
// Main Component
// ============================================================

export const ClassInsights: React.FC<ClassInsightsProps> = ({ classData }) => {
  const navigate = useNavigate();
  const hasRound2 = classData.students.some((s) => s.assessments.some((a) => a.round === 2));
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);

  const profile = useClassProfile(classData, selectedRound);

  return (
    <Container>
      {/* 제목 + 상세보기 버튼 */}
      <Header>
        <div>
          <Title>학급 특성 분석</Title>
          <Subtitle>우리 반 학생들의 학습 특성을 영역별로 분석했어요.</Subtitle>
        </div>
        <DetailButton onClick={() => navigate(`/dashboard/class/${classData.id}/analysis`)}>
          <span>상세 분석</span>
          <ArrowRight size={16} />
        </DetailButton>
      </Header>

      {/* 강점/약점 영역 */}
      {profile ? (
        <ContentWrapper>
          {/* 차수 선택 */}
          <RoundSelector>
            <RoundButton $isActive={selectedRound === 1} onClick={() => setSelectedRound(1)}>
              1차
            </RoundButton>
            {hasRound2 && (
              <RoundButton $isActive={selectedRound === 2} onClick={() => setSelectedRound(2)}>
                2차
              </RoundButton>
            )}
          </RoundSelector>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 강점 TOP 3 — 가로 배치 */}
            <div>
              <SectionTitle $accent='emerald'>
                <SectionBadge $accent='emerald'>+</SectionBadge>
                강점 TOP 3
              </SectionTitle>
              <ProfileGrid>
                {profile.strengths.map((item, idx) => (
                  <ProfileItem key={item.category} item={item} rank={idx + 1} accent='emerald' />
                ))}
              </ProfileGrid>
            </div>

            {/* 약점 TOP 3 — 가로 배치 */}
            <div>
              <SectionTitle $accent='red'>
                <SectionBadge $accent='red'>!</SectionBadge>
                약점 TOP 3
              </SectionTitle>
              <ProfileGrid>
                {profile.weaknesses.map((item, idx) => (
                  <ProfileItem key={item.category} item={item} rank={idx + 1} accent='red' />
                ))}
              </ProfileGrid>
            </div>

            {/* 구분선 */}
            <Divider />

            {/* 추천 학급 활동 */}
            <RecommendedSection>
              <RecommendedHeader>
                <Lightbulb size={20} color='#8b5cf6' />
                <ApiTooltip {...API_ACTIVITIES_BY_PROFILE} position='top-right'>
                  <RecommendedTitle>추천 학급 활동</RecommendedTitle>
                </ApiTooltip>
              </RecommendedHeader>
              <ProfileGrid>
                {RECOMMENDED_ACTIVITIES.map((activity) => (
                  <ActivityCard key={activity.title}>
                    <ActivityTitle>{activity.title}</ActivityTitle>
                    <ActivityDesc>{activity.desc}</ActivityDesc>
                  </ActivityCard>
                ))}
              </ProfileGrid>
            </RecommendedSection>

            {/* 추천 활동 자료 보기 버튼 */}
            <ViewResourcesButton onClick={() => alert('추천 활동 자료 페이지는 구현 예정입니다.')}>
              <BookOpen size={16} />
              추천 활동 자료 보기
              <ArrowRight size={16} />
            </ViewResourcesButton>
          </div>
        </ContentWrapper>
      ) : (
        <EmptyState>해당 차수의 검사 데이터가 없습니다.</EmptyState>
      )}
    </Container>
  );
};
