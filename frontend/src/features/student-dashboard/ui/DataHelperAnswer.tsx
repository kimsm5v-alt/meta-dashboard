import styled from '@emotion/styled';
import { ArrowLeft, Sparkles } from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  flex-shrink: 0;
`;

const BackButton = styled.button`
  padding: 0.25rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 0.125rem;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const Question = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[800]};
  line-height: 1.375;
`;

const AnswerArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-top: 0.75rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 0.75rem;
`;

const Spinner = styled.div`
  animation: spin 1s linear infinite;
  border-radius: ${({ theme }) => theme.radius.full};
  height: 2rem;
  width: 2rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary[500]};

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const AnswerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
`;

const AILabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary[500]};
`;

const MarkdownContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

// Markdown elements
const Spacer = styled.div`
  height: 0.5rem;
`;

const H4 = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-top: 0.75rem;
  margin-bottom: 0.25rem;
`;

const H3 = styled.h3`
  font-size: 15px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-top: 1rem;
  margin-bottom: 0.375rem;
`;

const NumberedListItem = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: 0.25rem;
  margin-top: 0.125rem;
  margin-bottom: 0.125rem;
`;

const NumberBullet = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary[500]};
  margin-top: 0.125rem;
  flex-shrink: 0;
  width: 1rem;
  text-align: right;
`;

const ListItemText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.625;
`;

const BulletListItem = styled.div<{ $level: number }>`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.125rem;
  margin-bottom: 0.125rem;
  margin-left: ${({ $level }) => $level * 12}px;
`;

const Bullet = styled.span`
  margin-top: 0.375rem;
  flex-shrink: 0;
  width: 0.375rem;
  height: 0.375rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[400]};
`;

const Paragraph = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.625;
  margin-top: 0.125rem;
  margin-bottom: 0.125rem;
`;

const Bold = styled.strong`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

interface DataHelperAnswerProps {
  question: string;
  answer: string;
  loading: boolean;
  onBack: () => void;
}

/**
 * 간단한 마크다운 렌더러
 * 볼드(**), 리스트(-), 소제목(###), 줄바꿈 처리
 */
export const renderMarkdown = (content: string): React.ReactNode => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let keyIdx = 0;

  const formatInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <Bold key={i}>{part.slice(2, -2)}</Bold>;
      }
      return part;
    });
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const key = keyIdx++;

    if (!trimmed) {
      elements.push(<Spacer key={key} />);
      continue;
    }

    // ### 소제목
    if (trimmed.startsWith('### ')) {
      elements.push(<H4 key={key}>{formatInline(trimmed.slice(4))}</H4>);
      continue;
    }

    // ## 소제목
    if (trimmed.startsWith('## ')) {
      elements.push(<H3 key={key}>{formatInline(trimmed.slice(3))}</H3>);
      continue;
    }

    // 숫자 리스트 (1. 2. 3.)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <NumberedListItem key={key}>
          <NumberBullet>{numMatch[1]}.</NumberBullet>
          <ListItemText>{formatInline(numMatch[2])}</ListItemText>
        </NumberedListItem>,
      );
      continue;
    }

    // 불릿 리스트
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const indent = line.search(/\S/);
      const level = Math.floor(indent / 2);
      const text = trimmed.slice(2);
      elements.push(
        <BulletListItem key={key} $level={level}>
          <Bullet />
          <ListItemText>{formatInline(text)}</ListItemText>
        </BulletListItem>,
      );
      continue;
    }

    // 일반 텍스트
    elements.push(<Paragraph key={key}>{formatInline(trimmed)}</Paragraph>);
  }

  return elements;
};

export const DataHelperAnswer: React.FC<DataHelperAnswerProps> = ({
  question,
  answer,
  loading,
  onBack,
}) => {
  return (
    <Container>
      {/* 질문 헤더 */}
      <Header>
        <BackButton onClick={onBack}>
          <ArrowLeft className='w-4 h-4 text-gray-500' />
        </BackButton>
        <Question>{question}</Question>
      </Header>

      {/* 답변 영역 */}
      <AnswerArea>
        {loading ? (
          <LoadingContainer>
            <Spinner />
            <LoadingText>AI가 분석 중입니다...</LoadingText>
          </LoadingContainer>
        ) : (
          <div>
            <AnswerHeader>
              <Sparkles className='w-3.5 h-3.5 text-primary-500' />
              <AILabel>AI 분석</AILabel>
            </AnswerHeader>
            <MarkdownContainer>{renderMarkdown(answer)}</MarkdownContainer>
          </div>
        )}
      </AnswerArea>
    </Container>
  );
};
