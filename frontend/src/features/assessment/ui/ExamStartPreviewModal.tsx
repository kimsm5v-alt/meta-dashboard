import styled from '@emotion/styled';
import { useEffect } from 'react';
import { AlertCircle, Users } from 'lucide-react';
import { Button } from '@shared/components';
import type { ExamStartPreviewResponse } from '../api/assessmentService';

interface ExamStartPreviewModalProps {
  isOpen: boolean;
  preview: ExamStartPreviewResponse | null;
  onClose: () => void;
  onConfirm: () => void;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Background = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
`;

const Container = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  width: 100%;
  max-width: 440px;
  margin: 0 ${({ theme }) => theme.spacing.md};
  overflow: hidden;
`;

const Content = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const IconWrapper = styled.div<{ $blocked: boolean }>`
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${({ $blocked }) => ($blocked ? '#fee2e2' : '#fef3c7')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $blocked }) => ($blocked ? '#dc2626' : '#d97706')};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  text-align: center;
  white-space: pre-line;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const StudentList = styled.ul`
  list-style: none;
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  padding: 0;
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const StudentItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:last-child {
    border-bottom: none;
  }
`;

const MemberNo = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  min-width: 2rem;
`;

const Summary = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const ExamStartPreviewModal = ({
  isOpen,
  preview,
  onClose,
  onConfirm,
}: ExamStartPreviewModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !preview) return null;

  const isBlocked = !preview.canStart;

  return (
    <Overlay>
      <Background onClick={onClose} />
      <Container>
        <Content>
          <IconWrapper $blocked={isBlocked}>
            <AlertCircle size={28} />
          </IconWrapper>

          {isBlocked ? (
            <>
              <Title>2회차 출제 불가</Title>
              <Description>
                {`현재 학급에서 1회차를 응시한 학생이 없어\n2회차를 출제할 수 없습니다.\n\n타 학급 응시자: ${preview.blockedOtherClassCount}명\n1회차 미응시: ${preview.noHistoryCount}명`}
              </Description>
              <Button onClick={onClose} variant='primary' style={{ width: '100%' }}>
                확인
              </Button>
            </>
          ) : (
            <>
              <Title>2회차 출제 안내</Title>
              <Description>
                아래 학생들은 다른 학급에서 1회차를 응시하여 이번 2회차에서 제외됩니다.
              </Description>
              {preview.blockedStudents.length > 0 && (
                <StudentList>
                  {preview.blockedStudents.map((s) => (
                    <StudentItem key={s.stdtId}>
                      <Users size={14} style={{ flexShrink: 0, color: '#9ca3af' }} />
                      <MemberNo>{s.memberNo}번</MemberNo>
                      <span>{s.nickname}</span>
                    </StudentItem>
                  ))}
                </StudentList>
              )}
              <Summary>
                출제 가능 학생: <strong>{preview.eligibleCount}명</strong> / 전체:{' '}
                {preview.totalCount}명
              </Summary>
              <Actions>
                <Button onClick={onClose} variant='secondary' style={{ flex: 1 }}>
                  취소
                </Button>
                <Button onClick={onConfirm} variant='primary' style={{ flex: 1 }}>
                  계속 출제
                </Button>
              </Actions>
            </>
          )}
        </Content>
      </Container>
    </Overlay>
  );
};
