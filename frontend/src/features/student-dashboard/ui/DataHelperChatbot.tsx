import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  X,
  Sparkles,
  Eye,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';
import { DataHelperQuestions } from './DataHelperQuestions';
import { DataHelperAnswer } from './DataHelperAnswer';
import { getDataHelperAnswer, type StudentData, type QuestionId } from '../api/dataHelperService';
import type { PanelTab } from './RightPanel';
import type { StudentType, SchoolLevel, FactorDeviation } from '@shared/types';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SpeedDialContainer = styled.div<{ $panelOpen: boolean }>`
  position: fixed;
  bottom: 1.5rem;
  right: ${({ $panelOpen }) => ($panelOpen ? '344px' : '1.5rem')};
  z-index: 50;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 0.75rem;
  transition: right 0.3s ease;
`;

const FabButton = styled.button<{ $active: boolean }>`
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active }) =>
    $active
      ? '#4b5563'
      : 'linear-gradient(135deg, #8b5cf6, #7c3aed)'};
  border: none;
  cursor: pointer;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    background: ${({ $active }) => ($active ? '#374151' : 'linear-gradient(135deg, #7c3aed, #6d28d9)')};
  }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: -1;
`;

const SpeedDialItems = styled.div<{ $visible: boolean }>`
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 0.5rem;
  transition: all 0.2s ease;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: ${({ $visible }) => ($visible ? 'translateY(0)' : 'translateY(1rem)')};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
`;

const SpeedDialItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem 0.5rem 0.75rem;
  background: white;
  border: none;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  }
`;

const ItemDot = styled.span<{ $color: string }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
`;

const ItemLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const ChatPanel = styled.div`
  position: fixed;
  bottom: 6rem;
  right: 1.5rem;
  z-index: 50;
  width: 420px;
  height: 560px;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeInUp 0.2s ease-out;

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(1rem); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const PanelHeader = styled.div`
  padding: 1rem 1.25rem;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const PanelHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PanelTitle = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-size: 15px;
`;

const PanelCloseBtn = styled.button`
  padding: 0.375rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const QUESTION_LABELS: Record<string, string> = {
  'diagnosis-1': '총평 상세히 알려줘',
  'diagnosis-2': '11개 요인에 대해 자세히 알려줘',
  'diagnosis-3': '이 학생의 강점은?',
  'diagnosis-4': '이 학생의 보완점은?',
  'type-1': '전체 유형별 특징 알려줘',
  'type-2': '이 학생의 유형 세부특성 알려줘',
  'type-3': '개인별 특성은 어떻게 알 수 있어?',
};

const SPEED_DIAL_TOOLS: Array<{
  id: PanelTab | 'ai';
  label: string;
  icon: typeof Sparkles;
  color: string;
}> = [
  { id: 'ai', label: 'AI 챗봇', icon: Sparkles, color: '#9D53E1' },
  { id: 'observation', label: '관찰 메모', icon: Eye, color: '#3B82F6' },
  { id: 'counseling', label: '상담', icon: MessageSquare, color: '#10B981' },
  { id: 'schoolRecord', label: '생기부', icon: ClipboardList, color: '#F59E0B' },
];

interface DataHelperChatbotProps {
  tScores: number[];
  predictedType: StudentType;
  typeProbabilities: Record<string, number>;
  schoolLevel: SchoolLevel;
  deviations: FactorDeviation[];
  onOpenPanel: (tab: PanelTab) => void;
  isPanelOpen: boolean;
}

export const DataHelperChatbot: React.FC<DataHelperChatbotProps> = ({
  tScores,
  predictedType,
  typeProbabilities,
  schoolLevel,
  deviations,
  onOpenPanel,
  isPanelOpen,
}) => {
  const [isDialOpen, setIsDialOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // reset chat when student changes
  useEffect(() => {
    setAnswers({});
    setSelectedQuestion(null);
  }, [tScores, predictedType]);

  // close chat on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const fab = document.getElementById('data-helper-fab');
        if (fab && fab.contains(e.target as Node)) return;
        setIsChatOpen(false);
      }
    };
    if (isChatOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isChatOpen]);

  const handleFabClick = () => {
    if (isPanelOpen) {
      onOpenPanel(null);
    } else if (isChatOpen) {
      setIsChatOpen(false);
    } else {
      setIsDialOpen((prev) => !prev);
    }
  };

  const handleToolSelect = (id: PanelTab | 'ai') => {
    setIsDialOpen(false);
    if (id === 'ai') {
      setIsChatOpen(true);
    } else {
      onOpenPanel(id as PanelTab);
    }
  };

  const handleSelectQuestion = async (questionId: string) => {
    setSelectedQuestion(questionId);
    if (answers[questionId]) return;

    setLoading(true);
    try {
      const studentData: StudentData = { tScores, predictedType, typeProbabilities, schoolLevel, deviations };
      const result = await getDataHelperAnswer(questionId as QuestionId, studentData);
      setAnswers((prev) => ({ ...prev, [questionId]: result }));
    } catch {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: '답변을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const isActive = isPanelOpen || isChatOpen || isDialOpen;

  return (
    <SpeedDialContainer $panelOpen={isPanelOpen}>
      {/* backdrop when dial is open */}
      {isDialOpen && <Backdrop onClick={() => setIsDialOpen(false)} />}

      {/* FAB */}
      <FabButton
        id="data-helper-fab"
        onClick={handleFabClick}
        $active={isActive}
        title="빠른 작업"
      >
        {isActive ? (
          <X size={24} color="white" />
        ) : (
          <Sparkles size={24} color="white" />
        )}
      </FabButton>

      {/* speed dial items */}
      <SpeedDialItems $visible={isDialOpen}>
        {SPEED_DIAL_TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <SpeedDialItem
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              style={{
                transitionDelay: isDialOpen
                  ? `${(SPEED_DIAL_TOOLS.length - 1 - index) * 35}ms`
                  : '0ms',
              }}
            >
              <ItemDot $color={tool.color}>
                <Icon size={16} />
              </ItemDot>
              <ItemLabel>{tool.label}</ItemLabel>
            </SpeedDialItem>
          );
        })}
      </SpeedDialItems>

      {/* AI chat panel */}
      {isChatOpen && (
        <ChatPanel ref={panelRef}>
          <PanelHeader>
            <PanelHeaderLeft>
              <Sparkles size={18} color="white" style={{ animation: `${spin} 3s linear infinite` }} />
              <PanelTitle>데이터 해석 도우미</PanelTitle>
            </PanelHeaderLeft>
            <PanelCloseBtn onClick={() => setIsChatOpen(false)}>
              <X size={16} color="white" />
            </PanelCloseBtn>
          </PanelHeader>
          <PanelContent>
            {selectedQuestion ? (
              <DataHelperAnswer
                question={QUESTION_LABELS[selectedQuestion] || ''}
                answer={answers[selectedQuestion] || ''}
                loading={loading && !answers[selectedQuestion]}
                onBack={() => setSelectedQuestion(null)}
              />
            ) : (
              <DataHelperQuestions
                onSelect={handleSelectQuestion}
                answeredQuestions={Object.keys(answers)}
              />
            )}
          </PanelContent>
        </ChatPanel>
      )}
    </SpeedDialContainer>
  );
};
