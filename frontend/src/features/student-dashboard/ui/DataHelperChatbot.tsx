import type React from 'react';
import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { X, Sparkles, Eye, MessageSquare, ClipboardList } from 'lucide-react';
import { useCaptureStore } from '@shared/store/useCaptureStore';
import type { PanelTab } from './RightPanel';

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
    $active ? '#4b5563' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)'};
  border: none;
  cursor: pointer;

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    background: ${({ $active }) =>
      $active ? '#374151' : 'linear-gradient(135deg, #7c3aed, #6d28d9)'};
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

const SPEED_DIAL_TOOLS: Array<{
  id: PanelTab;
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
  onOpenPanel: (tab: PanelTab) => void;
  isPanelOpen: boolean;
}

export const DataHelperChatbot: React.FC<DataHelperChatbotProps> = ({
  onOpenPanel,
  isPanelOpen,
}) => {
  const [isDialOpen, setIsDialOpen] = useState(false);

  // 우측 하단 코너 점유를 전역 스토어에 등록 — 전역 FloatingCaptureButton이
  // 겹치지 않고 이 FAB 위로 쌓이도록 한다(마운트 시 +1, 언마운트 시 -1).
  useEffect(() => {
    const { registerBottomRightFab, unregisterBottomRightFab } = useCaptureStore.getState();
    registerBottomRightFab();
    return () => unregisterBottomRightFab();
  }, []);

  const handleFabClick = () => {
    if (isPanelOpen) {
      onOpenPanel(null);
    } else {
      setIsDialOpen((prev) => !prev);
    }
  };

  const handleToolSelect = (id: PanelTab) => {
    setIsDialOpen(false);
    onOpenPanel(id);
  };

  const isActive = isPanelOpen || isDialOpen;

  return (
    <SpeedDialContainer $panelOpen={isPanelOpen}>
      {isDialOpen && <Backdrop onClick={() => setIsDialOpen(false)} />}

      <FabButton id='data-helper-fab' onClick={handleFabClick} $active={isActive} title='빠른 작업'>
        {isActive ? <X size={24} color='white' /> : <Sparkles size={24} color='white' />}
      </FabButton>

      <SpeedDialItems $visible={isDialOpen}>
        {SPEED_DIAL_TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <SpeedDialItem
              key={String(tool.id)}
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
    </SpeedDialContainer>
  );
};
