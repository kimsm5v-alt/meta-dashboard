import { useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download } from 'lucide-react';
import styled from '@emotion/styled';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  padding: 24px 24px 20px;
  width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  position: relative;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.18);
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: none;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  &:hover { background: ${({ theme }) => theme.colors.gray[200]}; }
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 4px;
  align-self: flex-start;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 20px;
  align-self: flex-start;
`;

const QRBox = styled.div`
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 16px;
`;

const CodeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 20px;
`;

const CodeLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const CodeValue = styled.span`
  font-size: 22px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  letter-spacing: 2px;
`;

const Footer = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const DownloadBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 0;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.primary[600]}; }
`;

const CloseTextBtn = styled.button`
  padding: 10px 20px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: white;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.gray[50]}; }
`;

interface QRCodeModalProps {
  isOpen: boolean;
  inviteCode: string;
  inviteUrl: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, inviteCode, inviteUrl, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${inviteCode}.png`;
    a.click();
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}><X size={14} /></CloseBtn>
        <Title>QR 코드로 초대</Title>
        <Subtitle>학생들이 QR 코드를 스캔하여 그룹에 참여할 수 있습니다</Subtitle>

        <QRBox>
          <QRCodeCanvas ref={canvasRef} value={inviteUrl || ' '} size={220} level="H" includeMargin />
        </QRBox>

        <CodeSection>
          <CodeLabel>초대 코드</CodeLabel>
          <CodeValue>{inviteCode}</CodeValue>
        </CodeSection>

        <Footer>
          <DownloadBtn onClick={handleDownload}>
            <Download size={14} />
            QR 코드 다운로드
          </DownloadBtn>
          <CloseTextBtn onClick={onClose}>닫기</CloseTextBtn>
        </Footer>
      </Modal>
    </Overlay>
  );
};
