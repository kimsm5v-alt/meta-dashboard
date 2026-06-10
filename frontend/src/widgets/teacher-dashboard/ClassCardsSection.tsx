import { useNavigate, useLocation } from 'react-router-dom';
import styled from '@emotion/styled';
import { Card } from '@shared/components';
import { TypeBadge } from '@shared/ui';
import { TYPE_COLORS } from '@shared/data/lpaProfiles';
import type { Class } from '@shared/types';

const TYPE_ORDER: Record<string, string[]> = {
  초등: ['자원소진형', '안전 균형형', '몰입자원 풍부형'],
  중등: ['냉소적 무기력형', '정서조절 취약형', '자기주도 몰입형'],
};

const getSortedTypeDistribution = (cls: Class) => {
  const dist = cls.stats?.typeDistribution;
  if (!dist) return [];
  const order = TYPE_ORDER[cls.schoolLevel] ?? [];
  console.log(dist, 'dist');
  console.log(order, 'order');
  return order
    .filter((t) => dist[t])
    .map((t) => [t, dist[t]] as [string, { count: number; percentage: number }]);
};

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const CardTitle = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const DetailButton = styled.button`
  padding: 0.25rem 0.75rem;
  background-color: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  cursor: pointer;
  transition: background-color 150ms ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const StudentCountSection = styled.div`
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const StudentCountText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StudentCountValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const AssessmentProgressSection = styled.div`
  margin-bottom: 1rem;
  background: linear-gradient(
    to bottom right,
    ${({ theme }) => theme.colors.gray[50]},
    ${({ theme }) => theme.colors.gray[100]}
  );
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.75rem;
`;

const AssessmentProgressTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.75rem;
`;

const AssessmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
`;

const RoundColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RoundHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RoundIconWrapper = styled.div<{ $status: 'completed' | 'in-progress' | 'not-started' }>`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: ${({ $status }) => {
    switch ($status) {
      case 'completed':
        return '#22c55e';
      case 'in-progress':
        return '#facc15';
      case 'not-started':
        return '#d1d5db';
    }
  }};
`;

const RoundIconText = styled.span`
  color: white;
  font-size: 10px;
  font-weight: bold;
`;

const RoundLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const RoundCount = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-left: 1.75rem;
`;

const StatusBadge = styled.span<{ $status: 'completed' | 'in-progress' | 'not-started' }>`
  padding: 0.125rem 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.sm};
  text-align: center;
  background-color: ${({ $status }) => {
    switch ($status) {
      case 'completed':
        return '#dcfce7';
      case 'in-progress':
        return '#fef9c3';
      case 'not-started':
        return '#f3f4f6';
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'completed':
        return '#15803d';
      case 'in-progress':
        return '#a16207';
      case 'not-started':
        return '#4b5563';
    }
  }};
`;

const TypeDistributionSection = styled.div`
  margin-bottom: 1rem;
`;

const TypeDistributionTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 0.5rem;
`;

const TypeDistributionBar = styled.div`
  display: flex;
  height: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.gray[100]};
`;

const TypeSegment = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${({ $width }) => `${$width}%`};
  background-color: ${({ $color }) => $color};
`;

const TypeBadgesWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

interface ClassCardsSectionProps {
  classes: Class[];
}

export const ClassCardsSection = ({ classes }: ClassCardsSectionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const testId = location.pathname.includes('/selfreg') ? 'selfreg' : 'comprehensive';

  return (
    <div>
      <SectionTitle>반별 현황</SectionTitle>
      <Grid>
        {classes.map((cls) => {
          const round1Count = cls.stats?.round1Completed ? cls.stats.assessedStudents : 0;
          const r2Status = cls.stats?.examStatus?.round2 ?? '시작전';
          const round2Count =
            r2Status === '진행중'
              ? (cls.stats?.round2SubmittedCount ?? 0)
              : cls.students.filter((s) => s.assessments.some((a) => a.round === 2)).length;
          const totalStudents = cls.stats?.totalStudents || 0;

          const getRound1Status = (): 'completed' | 'in-progress' | 'not-started' => {
            if (!cls.stats) return 'not-started';
            if (cls.stats.round1Completed) return 'completed';
            if (cls.stats.examStatus?.round1 === '진행중') return 'in-progress';
            return 'not-started';
          };

          const getRound2Status = (): 'completed' | 'in-progress' | 'not-started' => {
            if (r2Status === '종료') return 'completed';
            if (r2Status === '진행중') return 'in-progress';
            return 'not-started';
          };

          const sorted = getSortedTypeDistribution(cls);

          return (
            <Card key={cls.id} hoverable>
              {/* Header */}
              <CardHeader>
                <CardTitle>
                  {cls.grade}학년 {cls.classNumber}반
                </CardTitle>
                <DetailButton
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/${testId}/class/${cls.id}`);
                  }}
                >
                  상세보기
                </DetailButton>
              </CardHeader>

              {/* Student Count */}
              <StudentCountSection>
                <StudentCountText>
                  전체 학생 <StudentCountValue>{cls.stats?.totalStudents}명</StudentCountValue>
                </StudentCountText>
              </StudentCountSection>

              {/* Assessment Progress */}
              <AssessmentProgressSection>
                <AssessmentProgressTitle>검사 진행 현황</AssessmentProgressTitle>
                <AssessmentGrid>
                  {/* Round 1 */}
                  <RoundColumn>
                    <RoundHeader>
                      <RoundIconWrapper $status={getRound1Status()}>
                        {cls.stats?.round1Completed ? (
                          <svg
                            width='12'
                            height='12'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='white'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={3}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                        ) : (
                          <RoundIconText>!</RoundIconText>
                        )}
                      </RoundIconWrapper>
                      <RoundLabel>1차</RoundLabel>
                    </RoundHeader>
                    <RoundCount>
                      {round1Count}/{totalStudents}명
                    </RoundCount>
                    <StatusBadge $status={getRound1Status()}>
                      {cls.stats?.round1Completed
                        ? '완료'
                        : cls.stats?.examStatus?.round1 === '진행중'
                          ? '진행중'
                          : '시작전'}
                    </StatusBadge>
                  </RoundColumn>

                  {/* Round 2 */}
                  <RoundColumn>
                    <RoundHeader>
                      <RoundIconWrapper $status={getRound2Status()}>
                        {r2Status === '종료' ? (
                          <svg
                            width='12'
                            height='12'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='white'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={3}
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                        ) : r2Status === '진행중' ? (
                          <RoundIconText>!</RoundIconText>
                        ) : (
                          <svg
                            width='12'
                            height='12'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='#6b7280'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M6 18L18 6M6 6l12 12'
                            />
                          </svg>
                        )}
                      </RoundIconWrapper>
                      <RoundLabel>2차</RoundLabel>
                    </RoundHeader>
                    <RoundCount>
                      {r2Status === '진행중'
                        ? `${round2Count}/${totalStudents}명 제출`
                        : `${round2Count}/${totalStudents}명`}
                    </RoundCount>
                    <StatusBadge $status={getRound2Status()}>
                      {r2Status === '종료' ? '완료' : r2Status}
                    </StatusBadge>
                  </RoundColumn>
                </AssessmentGrid>
              </AssessmentProgressSection>

              {/* Type Distribution Bar */}
              <TypeDistributionSection>
                <TypeDistributionTitle>유형 분포</TypeDistributionTitle>
                {sorted.length > 0 && (
                  <>
                    <TypeDistributionBar>
                      {sorted.map(([type, data]) => (
                        <TypeSegment
                          key={type}
                          $width={data.percentage}
                          $color={TYPE_COLORS[type]}
                        />
                      ))}
                    </TypeDistributionBar>
                    <TypeBadgesWrapper>
                      {sorted.map(([type, data]) => (
                        <TypeBadge key={type} type={type} count={data.count} showSuffix={true} />
                      ))}
                    </TypeBadgesWrapper>
                  </>
                )}
              </TypeDistributionSection>
            </Card>
          );
        })}
      </Grid>
    </div>
  );
};
