import styled from '@emotion/styled';
import { ExternalLink, Download, Info } from 'lucide-react';
import { Modal, Button } from '@shared/components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CalendarButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const CalendarInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CalendarTextGroup = styled.div`
  text-align: left;
`;

const CalendarTitle = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CalendarDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ConnectBadge = styled.span`
  padding: 0.375rem 0.75rem;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: background-color 0.15s ease;

  ${CalendarButton}:hover & {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const Divider = styled.div`
  position: relative;
`;

const DividerLine = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
`;

const DividerBorder = styled.div`
  width: 100%;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const DividerText = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`;

const DividerLabel = styled.span`
  padding: 0 0.75rem;
  background: ${({ theme }) => theme.colors.background.paper};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ExportIconWrapper = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PrivacyBox = styled.div`
  margin-top: 1.5rem;
  padding: ${({ theme }) => theme.spacing.md};
  background: #eff6ff;
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const PrivacyContent = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const PrivacyIconWrapper = styled.div`
  flex-shrink: 0;
`;

const PrivacyTextGroup = styled.div``;

const PrivacyTitle = styled.h4`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: #1e3a8a;
  margin-bottom: 0.25rem;
`;

const PrivacyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #1d4ed8;
`;

const Footer = styled.div`
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

interface CalendarIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 아이콘 SVG
const GoogleCalendarIcon = () => (
  <svg viewBox='0 0 24 24' className='w-6 h-6'>
    <path
      fill='#4285F4'
      d='M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z'
      opacity='0.1'
    />
    <path fill='#4285F4' d='M12 7v5l4.25 2.52.75-1.27-3.5-2.08V7z' />
    <rect fill='#FBBC04' x='11' y='3' width='2' height='4' />
    <rect fill='#34A853' x='17' y='11' width='4' height='2' />
    <rect fill='#EA4335' x='11' y='17' width='2' height='4' />
    <rect fill='#4285F4' x='3' y='11' width='4' height='2' />
  </svg>
);

const AppleCalendarIcon = () => (
  <svg viewBox='0 0 24 24' className='w-6 h-6'>
    <rect fill='#FF3B30' x='2' y='4' width='20' height='18' rx='2' />
    <rect fill='#fff' x='2' y='8' width='20' height='14' rx='1' />
    <rect fill='#FF3B30' x='6' y='2' width='2' height='4' rx='1' />
    <rect fill='#FF3B30' x='16' y='2' width='2' height='4' rx='1' />
    <text x='12' y='18' textAnchor='middle' fill='#FF3B30' fontSize='8' fontWeight='bold'>
      31
    </text>
  </svg>
);

export const CalendarIntegrationModal: React.FC<CalendarIntegrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const handleGoogleConnect = () => {
    // TODO: Google Calendar OAuth 연동
    alert('Google Calendar 연동 기능은 추후 구현 예정입니다.');
  };

  const handleAppleConnect = () => {
    // TODO: Apple Calendar 연동
    alert('Apple Calendar 연동 기능은 추후 구현 예정입니다.');
  };

  const handleExportICS = () => {
    // TODO: ICS 파일 내보내기 구현
    alert('ICS 파일 내보내기 기능은 추후 구현 예정입니다.');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='캘린더 연동' size='md'>
      <Container>
        {/* Google Calendar */}
        <CalendarButton onClick={handleGoogleConnect}>
          <CalendarInfo>
            <GoogleCalendarIcon />
            <CalendarTextGroup>
              <CalendarTitle>Google Calendar</CalendarTitle>
              <CalendarDescription>Google 계정으로 연동</CalendarDescription>
            </CalendarTextGroup>
          </CalendarInfo>
          <ConnectBadge>연동</ConnectBadge>
        </CalendarButton>

        {/* Apple Calendar */}
        <CalendarButton onClick={handleAppleConnect}>
          <CalendarInfo>
            <AppleCalendarIcon />
            <CalendarTextGroup>
              <CalendarTitle>Apple Calendar</CalendarTitle>
              <CalendarDescription>iCloud 계정으로 연동</CalendarDescription>
            </CalendarTextGroup>
          </CalendarInfo>
          <ConnectBadge>연동</ConnectBadge>
        </CalendarButton>

        {/* 구분선 */}
        <Divider>
          <DividerLine>
            <DividerBorder />
          </DividerLine>
          <DividerText>
            <DividerLabel>또는</DividerLabel>
          </DividerText>
        </Divider>

        {/* ICS 내보내기 */}
        <CalendarButton onClick={handleExportICS}>
          <CalendarInfo>
            <ExportIconWrapper>
              <Download className='w-5 h-5 text-gray-600' />
            </ExportIconWrapper>
            <CalendarTextGroup>
              <CalendarTitle>ICS 파일 내보내기</CalendarTitle>
              <CalendarDescription>다른 캘린더 앱에서 가져오기</CalendarDescription>
            </CalendarTextGroup>
          </CalendarInfo>
          <ExternalLink className='w-5 h-5 text-gray-400' />
        </CalendarButton>

        {/* 개인정보 보호 안내 */}
        <PrivacyBox>
          <PrivacyContent>
            <PrivacyIconWrapper>
              <Info className='w-5 h-5 text-blue-500 mt-0.5' />
            </PrivacyIconWrapper>
            <PrivacyTextGroup>
              <PrivacyTitle>개인정보 보호 안내</PrivacyTitle>
              <PrivacyText>
                외부 캘린더 연동 시 학생 실명은 자동으로 익명 ID(예: 학생A, 학생B)로 변환되어
                내보내집니다. 학생의 개인정보는 외부로 전송되지 않습니다.
              </PrivacyText>
            </PrivacyTextGroup>
          </PrivacyContent>
        </PrivacyBox>
      </Container>

      {/* 하단 버튼 */}
      <Footer>
        <Button variant='secondary' onClick={onClose} className='w-full'>
          닫기
        </Button>
      </Footer>
    </Modal>
  );
};
