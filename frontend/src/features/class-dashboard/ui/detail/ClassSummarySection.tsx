import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import type { Class } from '@shared/types';
import type { ClassDetailData } from '../../model/useClassDetailData';
import type { ClassProfile } from '../../model/useClassProfile';
import { callAI } from '@shared/services/ai';
import { ProfileCard } from '@features/class-dashboard/ui/detail/ProfileCard';
import {
  buildUserMessage,
  buildCompareUserMessage,
  parseAIResponse,
} from '@features/class-dashboard/lib/classSummaryPrompts';
import type { ClassSummaryResponse } from '@features/class-dashboard/lib/classSummaryPrompts';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Section = styled.div``;

const AIHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const AITitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 8rem;
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: ${({ theme }) => theme.radius.full};
  border-bottom: 2px solid #6366f1;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ErrorBox = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  text-align: center;
`;

const ErrorMessage = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ErrorDetail = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-top: 0.5rem;
`;

const ResultBox = styled.div`
  position: relative;
  background: linear-gradient(to bottom right, #eef2ff, #dbeafe, #f3e8ff);
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 1.5rem;
  border: 1px solid #c7d2fe;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const AIBadge = styled.div`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: #6366f1;
  border: 1px solid #c7d2fe;
`;

const ResultText = styled.p`
  color: ${({ theme }) => theme.colors.gray[800]};
  white-space: pre-line;
  line-height: 1.7;
  font-size: 15px;
  padding-right: 5rem;
`;

const ProfileRow = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const ProfileSection = styled.div`
  flex: 1;
`;

const ProfileTitle = styled.h3<{ $color: 'emerald' | 'red' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: ${({ $color }) => ($color === 'emerald' ? '#065f46' : '#991b1b')};
`;

const ProfileBadge = styled.span<{ $color: 'emerald' | 'red' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background: ${({ $color }) => ($color === 'emerald' ? '#a7f3d0' : '#fecaca')};
  color: ${({ $color }) => ($color === 'emerald' ? '#047857' : '#b91c1c')};
`;

const ProfileCards = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Divider = styled.div`
  width: 1px;
  background: ${({ theme }) => theme.colors.gray[200]};
  align-self: stretch;
`;

const KeyPointBox = styled.div`
  background: rgba(243, 232, 255, 0.5);
  border: 1px solid #e9d5ff;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const KeyPointText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.7;
`;

// ============================================================
// Props
// ============================================================

interface ClassSummarySectionProps {
  detailData: ClassDetailData;
  profile: ClassProfile | null;
  classData: Class;
  round: 1 | 2;
  isCompare?: boolean;
  prevProfile?: ClassProfile | null;
  prevDetailData?: ClassDetailData;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export const ClassSummarySection: React.FC<ClassSummarySectionProps> = ({
  detailData,
  profile,
  classData,
  round,
  isCompare = false,
  prevProfile,
  prevDetailData,
}) => {
  const [result, setResult] = useState<ClassSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const generate = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const userMessage =
          isCompare && prevDetailData
            ? buildCompareUserMessage(classData, detailData, prevDetailData)
            : buildUserMessage(classData, detailData, round);

        const response = await callAI({
          feature: 'classAnalysis',
          messages: [{ role: 'user', content: userMessage }],
          temperature: 0.3,
        });

        if (!response.success) {
          setErrorMsg(response.error || 'AI 호출 실패');
          return;
        }

        const parsed = parseAIResponse(response.content);
        if (parsed) {
          setResult(parsed);
        } else {
          setErrorMsg('응답 파싱 실패');
        }
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [profile, detailData, classData, round, isCompare, prevDetailData]);

  return (
    <Container>
      {/* AI 총평 */}
      <Section>
        <AIHeader>
          <Sparkles className='w-5 h-5 text-indigo-500' />
          <AITitle>{isCompare ? 'AI 학급 변화 분석' : 'AI 학급 분석 총평'}</AITitle>
        </AIHeader>
        {loading ? (
          <LoadingContainer>
            <LoadingContent>
              <Spinner />
              <LoadingText>AI가 분석 중입니다...</LoadingText>
            </LoadingContent>
          </LoadingContainer>
        ) : errorMsg ? (
          <ErrorBox>
            <ErrorMessage>
              학급 분석을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </ErrorMessage>
            <ErrorDetail>{errorMsg}</ErrorDetail>
          </ErrorBox>
        ) : result ? (
          <ResultBox>
            <AIBadge>
              <Sparkles className='w-3 h-3' />
              <span>AI Insight</span>
            </AIBadge>
            <ResultText>{result.overall.replace(/\. /g, '.\n')}</ResultText>
          </ResultBox>
        ) : null}
      </Section>

      {/* 강점/약점 가로 배치 */}
      {profile && (
        <ProfileRow>
          {/* 강점 */}
          <ProfileSection>
            <ProfileTitle $color='emerald'>
              <ProfileBadge $color='emerald'>+</ProfileBadge>
              {isCompare ? '주요 강점 (2차 기준)' : '주요 강점'}
            </ProfileTitle>
            <ProfileCards>
              {profile.strengths.map((item, idx) => (
                <ProfileCard
                  key={item.category}
                  item={item}
                  idx={idx}
                  accent='emerald'
                  prevItems={
                    isCompare && prevProfile
                      ? prevProfile.strengths.concat(prevProfile.weaknesses)
                      : undefined
                  }
                />
              ))}
            </ProfileCards>
          </ProfileSection>
          {/* 구분선 */}
          <Divider />
          {/* 약점 */}
          <ProfileSection>
            <ProfileTitle $color='red'>
              <ProfileBadge $color='red'>!</ProfileBadge>
              {isCompare ? '관심 필요 영역 (2차 기준)' : '관심 필요 영역'}
            </ProfileTitle>
            <ProfileCards>
              {profile.weaknesses.map((item, idx) => (
                <ProfileCard
                  key={item.category}
                  item={item}
                  idx={idx}
                  accent='red'
                  prevItems={
                    isCompare && prevProfile
                      ? prevProfile.strengths.concat(prevProfile.weaknesses)
                      : undefined
                  }
                />
              ))}
            </ProfileCards>
          </ProfileSection>
        </ProfileRow>
      )}

      {/* 운영 핵심 포인트 */}
      {result && !loading && (
        <KeyPointBox>
          <KeyPointText>💡 {result.keyPoint}</KeyPointText>
        </KeyPointBox>
      )}
    </Container>
  );
};
