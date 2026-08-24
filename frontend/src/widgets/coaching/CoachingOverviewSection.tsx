import styled from '@emotion/styled';
import { ArrowLeft, ChevronRight, Lightbulb, Link2, Sparkles, User, Users } from 'lucide-react';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Hero = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  color: white;
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%);
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const HeroTitle = styled.h1`
  margin: 0 0 12px;
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const HeroSubtitle = styled.p`
  margin: 0;
  max-width: 640px;
  color: rgba(255, 255, 255, 0.9);
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const ColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const InfoCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const IconBadge = styled.div<{ $tone: 'amber' | 'blue' | 'green' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $tone }) =>
    $tone === 'amber' ? '#FEF3C7' : $tone === 'blue' ? '#DBEAFE' : '#D1FAE5'};
  color: ${({ $tone }) =>
    $tone === 'amber' ? '#D97706' : $tone === 'blue' ? '#2563EB' : '#059669'};
`;

const InfoCardLabel = styled.span<{ $tone: 'amber' | 'blue' | 'green' }>`
  display: block;
  color: ${({ $tone }) =>
    $tone === 'amber' ? '#D97706' : $tone === 'blue' ? '#2563EB' : '#059669'};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
`;

const InfoCardTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InfoItem = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.6;

  &::before {
    content: '•';
    flex-shrink: 0;
    color: ${({ theme }) => theme.colors.gray[400]};
    font-weight: bold;
  }
`;

const GuideCard = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const GuideTitle = styled.h3`
  margin: 0 0 16px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const GuideGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const GuideBlock = styled.div<{ $tone: 'violet' | 'blue' }>`
  padding: 20px;
  background: ${({ $tone }) => ($tone === 'violet' ? '#F5F3FF' : '#EFF6FF')};
  border: 1px solid ${({ $tone }) => ($tone === 'violet' ? '#DDD6FE' : '#BFDBFE')};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const GuideBlockHeader = styled.div<{ $tone: 'violet' | 'blue' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: ${({ $tone }) => ($tone === 'violet' ? '#5B21B6' : '#1D4ED8')};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const GuideDescription = styled.p`
  margin: 0 0 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const GuideBullets = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GuideBullet = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const StartNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const StartIcon = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: ${({ theme }) => theme.colors.primary[600]};
  background: ${({ theme }) => theme.colors.primary[50]};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const StartTitle = styled.h4`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const StartText = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const CoachingOverviewSection = () => {
  return (
    <Wrapper>
      <Hero>
        <HeroTitle>학습심리정서검사, 코칭으로 완성하다</HeroTitle>
        <HeroSubtitle>성적이 아닌 마음의 자원에 접근하는, 비상교육의 코칭 철학</HeroSubtitle>
      </Hero>

      <ColumnGrid>
        <InfoCard>
          <InfoCardHeader>
            <IconBadge $tone='amber'>
              <Lightbulb size={20} />
            </IconBadge>
            <div>
              <InfoCardLabel $tone='amber'>WHY</InfoCardLabel>
              <InfoCardTitle>왜 코칭인가</InfoCardTitle>
            </div>
          </InfoCardHeader>
          <InfoList>
            <InfoItem>
              학습심리정서검사는 진단에서 끝나지 않고, 코칭까지 이어지도록 설계되었습니다.
            </InfoItem>
            <InfoItem>성적이나 공부법이 아닌, '마음의 자원'에 접근하는 새로운 관점입니다.</InfoItem>
            <InfoItem>교사가 교실에서 직접 활용할 수 있는 멘트와 전략을 제공합니다.</InfoItem>
          </InfoList>
        </InfoCard>

        <InfoCard>
          <InfoCardHeader>
            <IconBadge $tone='blue'>
              <Link2 size={20} />
            </IconBadge>
            <div>
              <InfoCardLabel $tone='blue'>WHAT</InfoCardLabel>
              <InfoCardTitle>무엇과 연결되는가</InfoCardTitle>
            </div>
          </InfoCardHeader>
          <InfoList>
            <InfoItem>검사 결과의 LPA 학습유형과 코칭 전략이 직접 연결됩니다.</InfoItem>
            <InfoItem>심리·정서 지표를 기반으로 맞춤 피드백을 제공합니다.</InfoItem>
            <InfoItem>학생의 학습 태도, 정서, 자기효능감 패턴을 분석합니다.</InfoItem>
          </InfoList>
        </InfoCard>

        <InfoCard>
          <InfoCardHeader>
            <IconBadge $tone='green'>
              <Sparkles size={20} />
            </IconBadge>
            <div>
              <InfoCardLabel $tone='green'>HOW</InfoCardLabel>
              <InfoCardTitle>어떤 변화를 기대하는가</InfoCardTitle>
            </div>
          </InfoCardHeader>
          <InfoList>
            <InfoItem>학생: 자기 이해 심화, 자기효능감 회복, 학습 회복탄력성 강화</InfoItem>
            <InfoItem>교사: 진단에서 실행까지 원스톱 지원, 상담 시간 효율화</InfoItem>
            <InfoItem>교실에서 바로 사용 가능한 칭찬 멘트와 코칭 스크립트 제공</InfoItem>
          </InfoList>
        </InfoCard>
      </ColumnGrid>

      <GuideCard>
        <GuideTitle>코칭 활용 가이드</GuideTitle>
        <GuideGrid>
          <GuideBlock $tone='violet'>
            <GuideBlockHeader $tone='violet'>
              <Users size={18} />
              학급 코칭
            </GuideBlockHeader>
            <GuideDescription>
              반 전체 학생의 학습유형 분포와 특성을 파악하고, 학급 단위 코칭 전략을 확인합니다.
            </GuideDescription>
            <GuideBullets>
              <GuideBullet>
                <ChevronRight size={14} /> 학급 전체 유형 분포 확인
              </GuideBullet>
              <GuideBullet>
                <ChevronRight size={14} /> 유형별 학생 그룹 파악
              </GuideBullet>
              <GuideBullet>
                <ChevronRight size={14} /> 학급 운영에 활용할 코칭 포인트 확인
              </GuideBullet>
            </GuideBullets>
          </GuideBlock>

          <GuideBlock $tone='blue'>
            <GuideBlockHeader $tone='blue'>
              <User size={18} />
              개별 코칭
            </GuideBlockHeader>
            <GuideDescription>
              학생 개인의 검사 결과를 바탕으로 맞춤형 칭찬 포인트와 코칭 방법을 확인합니다.
            </GuideDescription>
            <GuideBullets>
              <GuideBullet>
                <ChevronRight size={14} /> 학생의 학습유형과 특성 이해
              </GuideBullet>
              <GuideBullet>
                <ChevronRight size={14} /> 강점 기반 칭찬 멘트 활용
              </GuideBullet>
              <GuideBullet>
                <ChevronRight size={14} /> 취약 요인에 맞는 코칭 스크립트 적용
              </GuideBullet>
            </GuideBullets>
          </GuideBlock>
        </GuideGrid>
      </GuideCard>

      <StartNotice>
        <StartIcon>
          <ArrowLeft size={20} />
        </StartIcon>
        <div>
          <StartTitle>코칭을 시작하려면</StartTitle>
          <StartText>좌측 메뉴에서 반을 선택하면 학급 코칭을 확인할 수 있습니다.</StartText>
        </div>
      </StartNotice>
    </Wrapper>
  );
};

export default CoachingOverviewSection;
