import styled from '@emotion/styled';
import { Scissors } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useCaptureStore } from '@shared/store/useCaptureStore';

const Button = styled.button`
  position: fixed;
  right: ${({ theme }) => theme.spacing.xl};
  bottom: ${({ theme }) => theme.spacing.xl};
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
  const location = useLocation();

  if (location.pathname.startsWith('/ai-room')) return null;

  return (
    <Button
      type='button'
      data-capture-ignore='true'
      onClick={openOverlay}
      aria-label='화면 캡처해서 AI에게 질문'
    >
      <Scissors size={22} />
    </Button>
  );
};
