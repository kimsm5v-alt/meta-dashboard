import styled from '@emotion/styled';
import { Copy, Check, Download } from 'lucide-react';
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal, Button } from '@shared/components';

export interface Group {
  id: string;
  name: string;
  grade: number;
  classNumber: number;
  inviteCode: string;
  studentCount: number;
}

interface GroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
}

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const GroupInfo = styled.div`
  text-align: center;
`;

const GroupName = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const GroupDetails = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const QRSection = styled.div`
  background: linear-gradient(to bottom right, ${({ theme }) => theme.colors.primary[50]}, #eef2ff);
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.primary[100]};
`;

const QRWrapper = styled.div`
  background: white;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  display: inline-block;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const InviteCode = styled.p`
  font-size: 30px;
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  letter-spacing: 0.15em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const InviteUrl = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  word-break: break-all;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FlexButton = styled(Button)`
  flex: 1;
  justify-content: center;
`;

const IconOnlyButton = styled(Button)`
  justify-content: center;
`;

const GuideSection = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const GuideTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const GuideList = styled.ol`
  list-style: decimal;
  list-style-position: inside;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const CloseButton = styled(Button)`
  width: 100%;
  justify-content: center;
`;

export const GroupInviteModal: React.FC<GroupInviteModalProps> = ({ isOpen, onClose, group }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!group) return null;

  // 초대 URL 생성 (현재 도메인 기준)
  const inviteUrl = `${window.location.origin}/join/${group.inviteCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = group.inviteCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 300, 300);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `초대코드_${group.name}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='학생 초대' size='lg'>
      <ContentWrapper>
        {/* 그룹 정보 */}
        <GroupInfo>
          <GroupName>{group.name}</GroupName>
          <GroupDetails>
            {group.grade}학년 {group.classNumber}반 · 현재 {group.studentCount}명
          </GroupDetails>
        </GroupInfo>

        {/* QR 코드 */}
        <QRSection>
          <QRWrapper ref={qrRef}>
            <QRCodeSVG value={inviteUrl} size={180} level='H' includeMargin />
          </QRWrapper>
          <InviteCode>{group.inviteCode}</InviteCode>
          <InviteUrl>{inviteUrl}</InviteUrl>
          <ButtonGroup>
            <FlexButton onClick={handleCopyCode} variant={copiedCode ? 'primary' : 'secondary'}>
              {copiedCode ? (
                <>
                  <Check size={16} style={{ marginRight: 8 }} />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy size={16} style={{ marginRight: 8 }} />
                  코드 복사
                </>
              )}
            </FlexButton>
            <FlexButton onClick={handleCopyUrl} variant={copiedUrl ? 'primary' : 'secondary'}>
              {copiedUrl ? (
                <>
                  <Check size={16} style={{ marginRight: 8 }} />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy size={16} style={{ marginRight: 8 }} />
                  URL 복사
                </>
              )}
            </FlexButton>
            <IconOnlyButton onClick={handleDownloadQR} variant='secondary'>
              <Download size={16} />
            </IconOnlyButton>
          </ButtonGroup>
        </QRSection>

        {/* 안내 */}
        <GuideSection>
          <GuideTitle>학생 초대 방법</GuideTitle>
          <GuideList>
            <li>학생들에게 초대 코드 또는 QR 코드를 공유하세요</li>
            <li>학생은 초대 링크에서 이름을 입력하고 가입합니다</li>
            <li>가입한 학생은 그룹에 자동으로 추가됩니다</li>
          </GuideList>
        </GuideSection>

        {/* 닫기 버튼 */}
        <CloseButton variant='secondary' onClick={onClose}>
          닫기
        </CloseButton>
      </ContentWrapper>
    </Modal>
  );
};
