import type React from 'react';
import styled from '@emotion/styled';
import { LikertScale } from './LikertScale';

interface QuestionRowProps {
  questionNo: number;
  questionText: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  isSaving?: boolean;
}

const Container = styled.div<{ $hasValue: boolean; $isSaving: boolean }>`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 0.75rem;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid
    ${({ $hasValue, theme }) => ($hasValue ? theme.colors.primary[200] : theme.colors.gray[100])};
  transition: all 0.15s ease;
  background-color: ${({ $hasValue, theme }) =>
    $hasValue ? 'rgba(139, 92, 246, 0.05)' : theme.colors.background.paper};
  opacity: ${({ $isSaving }) => ($isSaving ? 0.7 : 1)};

  @media (min-width: 768px) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const MobileLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};

  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

const QuestionNumber = styled.span<{ $size: 'small' | 'large' }>`
  flex-shrink: 0;
  width: ${({ $size }) => ($size === 'small' ? '2rem' : '2.5rem')};
  height: ${({ $size }) => ($size === 'small' ? '2rem' : '2.5rem')};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[100]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ $size, theme }) =>
    $size === 'small' ? theme.typography.fontSize.sm : theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const QuestionText = styled.p<{ $isDesktop?: boolean }>`
  color: ${({ theme }) => theme.colors.gray[800]};
  line-height: 1.625;
  ${({ $isDesktop }) => ($isDesktop ? 'flex: 1; min-width: 0;' : 'flex: 1;')}
  font-size: ${({ $isDesktop, theme }) =>
    $isDesktop ? theme.typography.fontSize.base : theme.typography.fontSize.sm};
`;

const DesktopLayout = styled.div`
  display: none;

  @media (min-width: 768px) {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const ScaleWrapper = styled.div`
  flex-shrink: 0;
`;

export const QuestionRow: React.FC<QuestionRowProps> = ({
  questionNo,
  questionText,
  selectedValue,
  onSelect,
  isSaving = false,
}) => {
  const questionId = `question-${questionNo}`;

  return (
    <Container $hasValue={!!selectedValue} $isSaving={isSaving}>
      {/* 모바일: 세로 레이아웃 */}
      <MobileLayout>
        <MobileHeader>
          <QuestionNumber $size='small'>{questionNo}</QuestionNumber>
          <QuestionText>{questionText}</QuestionText>
        </MobileHeader>
        <LikertScale
          questionId={`${questionId}-mobile`}
          selectedValue={selectedValue}
          onSelect={onSelect}
          disabled={isSaving}
        />
      </MobileLayout>

      {/* 데스크톱: 가로 레이아웃 */}
      <DesktopLayout>
        <QuestionNumber $size='large'>{questionNo}</QuestionNumber>
        <QuestionText $isDesktop>{questionText}</QuestionText>
        <ScaleWrapper>
          <LikertScale
            questionId={`${questionId}-desktop`}
            selectedValue={selectedValue}
            onSelect={onSelect}
            disabled={isSaving}
          />
        </ScaleWrapper>
      </DesktopLayout>
    </Container>
  );
};
