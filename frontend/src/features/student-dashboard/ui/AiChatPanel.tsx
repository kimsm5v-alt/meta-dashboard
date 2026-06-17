import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Sparkles, Send } from 'lucide-react';
import {
  getDataHelperAnswer,
  getDataHelperFreeAnswer,
  type StudentData,
  type QuestionId,
} from '../api/dataHelperService';
import { renderMarkdown } from './DataHelperAnswer';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 50vh;
`;

const AiBubbleRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  animation: ${fadeIn} 0.2s ease;
`;

const AiAvatar = styled.div`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
`;

const AiBubbleContent = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0 0.75rem 0.75rem 0.75rem;
  padding: 0.625rem 0.875rem;
  max-width: calc(100% - 2.25rem);
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
`;

const UserBubbleRow = styled.div`
  display: flex;
  justify-content: flex-end;
  animation: ${fadeIn} 0.2s ease;
`;

const UserBubbleContent = styled.div`
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border-radius: 0.75rem 0.75rem 0 0.75rem;
  padding: 0.625rem 0.875rem;
  max-width: 80%;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.6;
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem 0;
`;

const Dot = styled.div<{ $delay: number }>`
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.gray[400]};
  animation: ${bounce} 1.4s ease-in-out ${({ $delay }) => $delay}s infinite;
`;

const ChipsArea = styled.div`
  padding: 0.625rem 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

const Chip = styled.button`
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[700]};
  font-size: 0.75rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1.4;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[100]};
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InputRow = styled.div`
  padding: 0.75rem 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  gap: 0.5rem;
  background: ${({ theme }) => theme.colors.background.paper};
  flex-shrink: 0;
`;

const TextInput = styled.input`
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[800]};
  background: ${({ theme }) => theme.colors.gray[50]};
  outline: none;
  transition: border-color 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[400]};
    background: ${({ theme }) => theme.colors.background.paper};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const SendButton = styled.button`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QUESTION_CHIPS: Array<{ id: QuestionId; label: string }> = [
  { id: 'diagnosis-1', label: '총평 상세히 알려줘' },
  { id: 'diagnosis-2', label: '11개 요인에 대해 자세히 알려줘' },
  { id: 'diagnosis-3', label: '이 학생의 강점은?' },
  { id: 'diagnosis-4', label: '이 학생의 보완점은?' },
  { id: 'type-1', label: '전체 유형별 특징 알려줘' },
  { id: 'type-2', label: '이 학생의 유형 세부특성 알려줘' },
  { id: 'type-3', label: '개인별 특성은 어떻게 알 수 있어?' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
}

interface AiChatPanelProps {
  data: StudentData;
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ data }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 학생 변경 시 대화 초기화
  useEffect(() => {
    setMessages([]);
    setInputValue('');
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.predictedType, data.tScores.join(',')]);

  // 메시지 추가 시 하단으로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (userText: string, questionId?: QuestionId) => {
    if (isLoading || !userText.trim()) return;

    const msgId = Date.now().toString();
    const loadingId = `loading-${msgId}`;

    setMessages((prev) => [
      ...prev,
      { id: msgId, role: 'user', content: userText },
      { id: loadingId, role: 'ai', content: '', loading: true },
    ]);
    setIsLoading(true);

    try {
      const answer = questionId
        ? await getDataHelperAnswer(questionId, data)
        : await getDataHelperFreeAnswer(userText, data);

      setMessages((prev) =>
        prev.map((m) => (m.id === loadingId ? { ...m, content: answer, loading: false } : m)),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                content: '답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
                loading: false,
              }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (chip: { id: QuestionId; label: string }) => {
    void sendMessage(chip.label, chip.id);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    void sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Container>
      <MessagesArea>
        {/* 인사말 버블 */}
        <AiBubbleRow>
          <AiAvatar>
            <Sparkles size={14} color='white' />
          </AiAvatar>
          <AiBubbleContent>
            안녕하세요! 데이터 해석 도우미입니다.
            <br />
            학생 데이터를 기반으로 궁금한 점에 답변해 드립니다.
          </AiBubbleContent>
        </AiBubbleRow>

        {/* 대화 메시지 */}
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <UserBubbleRow key={msg.id}>
              <UserBubbleContent>{msg.content}</UserBubbleContent>
            </UserBubbleRow>
          ) : (
            <AiBubbleRow key={msg.id}>
              <AiAvatar>
                <Sparkles size={14} color='white' />
              </AiAvatar>
              {msg.loading ? (
                <AiBubbleContent>
                  <LoadingDots>
                    <Dot $delay={0} />
                    <Dot $delay={0.2} />
                    <Dot $delay={0.4} />
                  </LoadingDots>
                </AiBubbleContent>
              ) : (
                <AiBubbleContent>{renderMarkdown(msg.content)}</AiBubbleContent>
              )}
            </AiBubbleRow>
          ),
        )}
        <div ref={messagesEndRef} />
      </MessagesArea>

      {/* 추천 질문 칩 */}
      <ChipsArea>
        {QUESTION_CHIPS.map((chip) => (
          <Chip key={chip.id} onClick={() => handleChipClick(chip)} disabled={isLoading}>
            {chip.label}
          </Chip>
        ))}
      </ChipsArea>

      {/* 직접 입력 */}
      <InputRow>
        <TextInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='이 학생에 대해 질문해보세요...'
          disabled={isLoading}
        />
        <SendButton onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
          <Send size={14} />
        </SendButton>
      </InputRow>
    </Container>
  );
};
