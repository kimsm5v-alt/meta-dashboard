import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Sparkles } from 'lucide-react';
import { SELFREG_FACTOR_DEFINITIONS } from '@shared/data/selfregFactors';
import { generateSelfregAISummary } from '@shared/utils/selfregSummaryGenerator';

const InsightSection = styled.section``;

const InsightHeader = styled.div`
  margin-bottom: 0.75rem;

  > div {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.gray[900]};
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }

  p {
    margin: 0.25rem 0 0 2rem;
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: 0.75rem;
  }
`;

const InsightIcon = styled.span`
  display: inline-flex;
  width: 1.5rem;
  height: 1.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #14b8a6, #10b981);
  color: #fff;
`;

const InsightCard = styled.div`
  padding: 1.5rem;
  border: 1px solid #ccfbf1;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: linear-gradient(135deg, #f0fdfa, #ecfdf5);
`;

const InsightText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[700]};
  font-size: 0.9375rem;
  line-height: 1.7;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SummaryLoading = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 3rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 0.875rem;
`;

const Spinner = styled.span`
  width: 1rem;
  height: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.primary[200]};
  border-top-color: ${({ theme }) => theme.colors.primary[600]};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Tag = styled.span`
  padding: 0.25rem 0.625rem;
  border: 1px solid #99f6e4;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: #0f766e;
  font-size: 0.75rem;
  font-weight: 600;
`;

export const SelfregInsightSummary = ({ scores }: { scores: number[] }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const ranked = [...SELFREG_FACTOR_DEFINITIONS].sort(
    (a, b) => (scores[b.index] ?? 50) - (scores[a.index] ?? 50),
  );
  const strengths = ranked.slice(0, 2);
  const weaknesses = ranked.slice(-2).reverse();

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      setIsLoading(true);
      try {
        const result = await generateSelfregAISummary(scores);
        if (active) setSummary(result);
      } catch {
        if (active) setSummary('총평을 생성하는 중 오류가 발생했습니다.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadSummary();
    return () => {
      active = false;
    };
  }, [scores]);

  return (
    <InsightSection>
      <InsightHeader>
        <div>
          <InsightIcon>
            <Sparkles size={14} />
          </InsightIcon>
          <h2>AI 분석 총평</h2>
        </div>
        <p>AI가 분석한 학습 특성 요약입니다</p>
      </InsightHeader>
      <InsightCard>
        {isLoading ? (
          <SummaryLoading>
            <Spinner /> AI가 분석 중입니다...
          </SummaryLoading>
        ) : (
          <InsightText>{summary.replace(/\s+/g, ' ')}</InsightText>
        )}
        <Tags>
          {strengths.map((factor) => (
            <Tag key={factor.name}>#{factor.name} 강점</Tag>
          ))}
          {weaknesses.map((factor) => (
            <Tag key={factor.name}>#{factor.name} 보완</Tag>
          ))}
        </Tags>
      </InsightCard>
    </InsightSection>
  );
};

const StatusCard = styled.section`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.background.paper};
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 1.5rem 0;

  h3 {
    margin: 0;
    color: ${({ theme }) => theme.colors.gray[900]};
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  }
`;

const SurveyBadge = styled.span`
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 0.75rem;
  font-weight: 600;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 1.25rem 1.5rem 1.5rem;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StatusItem = styled.div`
  min-width: 0;
  padding: 0.875rem;
  border-radius: 0.625rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  text-align: center;

  span {
    display: block;
    margin-bottom: 0.375rem;
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: 0.75rem;
  }

  strong {
    color: ${({ theme }) => theme.colors.gray[700]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const LEVEL_LABELS = {
  'very-low': '매우 낮음',
  low: '낮음',
  mid: '보통',
  high: '높음',
  'very-high': '매우 높음',
} as const;
const MOTIVATION_LABELS = {
  interest: '공부가 재미있어서',
  future: '나의 미래를 위해서',
  college: '진학을 위해서',
  expectations: '주변의 기대 때문에',
  unknown: '잘 모르겠음',
} as const;
const TIME_LABELS = {
  none: '없음',
  under1h: '1시간 미만',
  '1-2h': '1시간 이상~2시간 미만',
  '2-3h': '2시간 이상~3시간 미만',
  over3h: '3시간 이상',
} as const;
const COUNSELOR_LABELS = {
  friend: '친구',
  teacher: '선생님',
  family: '가족',
  counselor: '상담 선생님',
  etc: '기타',
} as const;

interface SelfregLearningStatus {
  academicAchievement: keyof typeof LEVEL_LABELS | null;
  gradeSatisfaction: keyof typeof LEVEL_LABELS | null;
  learningMotivation: keyof typeof MOTIVATION_LABELS | null;
  selfStudyTime: keyof typeof TIME_LABELS | null;
  learningCounselor: keyof typeof COUNSELOR_LABELS | null;
}

export const SelfregLearningStatusCard = ({
  status,
  isLoading,
}: {
  status?: SelfregLearningStatus;
  isLoading?: boolean;
}) => {
  const values = [
    ['학업 성취도', status?.academicAchievement ? LEVEL_LABELS[status.academicAchievement] : null],
    ['성적 만족도', status?.gradeSatisfaction ? LEVEL_LABELS[status.gradeSatisfaction] : null],
    ['학습 동기', status?.learningMotivation ? MOTIVATION_LABELS[status.learningMotivation] : null],
    ['혼자 공부 시간', status?.selfStudyTime ? TIME_LABELS[status.selfStudyTime] : null],
    [
      '학습 고민 상담',
      status?.learningCounselor ? COUNSELOR_LABELS[status.learningCounselor] : null,
    ],
  ] as const;

  return (
    <StatusCard>
      <StatusHeader>
        <h3>개인 학습 현황</h3>
        <SurveyBadge>설문 응답</SurveyBadge>
      </StatusHeader>
      <StatusGrid>
        {values.map(([label, value]) => (
          <StatusItem key={label}>
            <span>{label}</span>
            <strong>{isLoading ? '불러오는 중...' : (value ?? '응답 정보 없음')}</strong>
          </StatusItem>
        ))}
      </StatusGrid>
    </StatusCard>
  );
};
