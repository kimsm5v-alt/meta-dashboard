import styled from '@emotion/styled';
import { Scissors } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCaptureStore } from '@shared/store/useCaptureStore';

const Button = styled.button<{ $raised: boolean }>`
  position: fixed;
  /* 페이지 전용 우측 하단 FAB(예: DataHelperChatbot: right 1.5rem, 크기 3.5rem)가 있으면
     그 위로 올려 세로로 쌓되, 가로 중심선을 챗봇 FAB와 맞춘다.
     - 챗봇 중심 = 오른쪽에서 1.5rem + 3.5rem/2 = 3.25rem
     - 캡처 버튼(폭 52px=3.25rem)의 중심을 여기에 맞추려면 right = 3.25rem - 1.625rem = 1.625rem
     - 세로: 챗봇 bottom 1.5rem + 높이 3.5rem + 간격 0.75rem = 5.75rem */
  right: ${({ $raised, theme }) => ($raised ? '1.625rem' : theme.spacing.xl)};
  bottom: ${({ $raised, theme }) => ($raised ? '5.75rem' : theme.spacing.xl)};
  z-index: ${({ theme }) => theme.zIndex.sticky};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: none;
  background-color: ${({ theme }) => theme.colors.primary[500]};
  color: #fff;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  cursor: pointer;
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary[600]};
    transform: translateY(-2px);
  }
`;

/**
 * 전역 스크린샷 캡처 트리거. 어느 대시보드 화면에서든 눌러서 영역을 드래그-선택하면
 * AI Room으로 이동하며 캡처 이미지가 첨부된다. AI Room 페이지 자체는 컴포저 안에
 * 별도의 인라인 트리거가 있으므로 여기서는 숨긴다(중복 진입점 방지).
 */
export const FloatingCaptureButton = () => {
  const openOverlay = useCaptureStore((s) => s.openOverlay);
  const bottomRightFabCount = useCaptureStore((s) => s.bottomRightFabCount);
  const location = useLocation();

  if (location.pathname.startsWith('/ai-room')) return null;

  return (
    <Button
      type='button'
      data-capture-ignore='true'
      $raised={bottomRightFabCount > 0}
      onClick={openOverlay}
      aria-label='화면 캡처해서 AI에게 질문'
    >
      <Scissors size={22} />
    </Button>
  );
};
