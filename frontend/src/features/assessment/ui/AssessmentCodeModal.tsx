import styled from '@emotion/styled';
import { Copy, Check, Download } from 'lucide-react';
import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal, Button } from '@shared/components';
import type { ManagedAssessment } from '@shared/types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InfoSection = styled.div`
  text-align: center;
`;

const AssessmentName = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.25rem;
`;

const AssessmentMeta = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const QRSection = styled.div`
  background: linear-gradient(to bottom right, ${({ theme }) => theme.colors.primary[50]}, #eef2ff);
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 1.5rem;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.primary[100]};
`;

const QRWrapper = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  display: inline-block;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const CodeDisplay = styled.p`
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-family: monospace;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
`;

const UrlDisplay = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  word-break: break-all;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const InstructionBox = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const InstructionTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const InstructionList = styled.ol`
  list-style-type: decimal;
  list-style-position: inside;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DateSection = styled.div`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const DateRange = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

interface AssessmentCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: ManagedAssessment | null;
}

export const AssessmentCodeModal: React.FC<AssessmentCodeModalProps> = ({
  isOpen,
  onClose,
  assessment,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!assessment) return null;

  // 검사 URL 생성 (현재 도메인 기준) - 그룹의 inviteCode 사용
  const examUrl = `${window.location.origin}/join/${assessment.inviteCode}`;

  const handleCopy = async () => {
    if (!assessment.inviteCode) return;
    try {
      await navigator.clipboard.writeText(assessment.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = assessment.inviteCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(examUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = examUrl;
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
        downloadLink.download = `검사코드_${assessment.code}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '미정';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='검사 코드' size='2xl'>
      <Container>
        {/* 검사 정보 */}
        <InfoSection>
          <AssessmentName>{assessment.name}</AssessmentName>
          <AssessmentMeta>
            {assessment.grade}학년 {assessment.classNumber}반 · {assessment.round}차 검사
          </AssessmentMeta>
        </InfoSection>

        {/* QR 코드 */}
        <QRSection>
          <QRWrapper ref={qrRef}>
            <QRCodeSVG value={examUrl} size={180} level='H' includeMargin />
          </QRWrapper>
          <CodeDisplay>{assessment.inviteCode}</CodeDisplay>
          <UrlDisplay>{examUrl}</UrlDisplay>
          <ButtonGroup>
            <Button
              onClick={handleCopy}
              variant={copied ? 'primary' : 'secondary'}
              className='justify-center flex-1'
            >
              {copied ? (
                <>
                  <Check className='w-4 h-4 mr-2' />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className='w-4 h-4 mr-2' />
                  코드 복사
                </>
              )}
            </Button>
            <Button
              onClick={handleCopyUrl}
              variant={copiedUrl ? 'primary' : 'secondary'}
              className='justify-center flex-1'
            >
              {copiedUrl ? (
                <>
                  <Check className='w-4 h-4 mr-2' />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className='w-4 h-4 mr-2' />
                  URL 복사
                </>
              )}
            </Button>
            <Button onClick={handleDownloadQR} variant='secondary' className='justify-center'>
              <Download className='w-4 h-4' />
            </Button>
          </ButtonGroup>
        </QRSection>

        {/* 안내 */}
        <InstructionBox>
          <InstructionTitle>학생 안내 방법</InstructionTitle>
          <InstructionList>
            <li>학생들에게 초대 코드 또는 QR 코드를 공유하세요.</li>
            <li>학생은 링크 접속 후 로그인/게스트 가입합니다.</li>
            <li>검사 완료 후 결과가 자동으로 집계됩니다</li>
          </InstructionList>
        </InstructionBox>

        {/* 검사 기간 */}
        <DateSection>
          <p>검사 기간</p>
          <DateRange>
            {formatDate(assessment.startDate)} ~ {formatDate(assessment.endDate)}
          </DateRange>
        </DateSection>

        {/* 닫기 버튼 */}
        <Button variant='secondary' onClick={onClose} className='justify-center w-full'>
          닫기
        </Button>
      </Container>
    </Modal>
  );
};
