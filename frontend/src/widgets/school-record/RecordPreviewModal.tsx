import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Check, Copy, Download, Sparkles, X } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
`;

const Panel = styled.div`
  display: flex;
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 12px;
`;

const HeaderTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HeaderTitle = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const HeaderCount = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const HeaderSub = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const CloseButton = styled.button`
  padding: 6px;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 0 20px;
`;

const EmptyText = styled.div`
  padding: 48px 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const StudentCard = styled.div`
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const StudentCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const StudentName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const StudentSavedAt = styled.span`
  margin-left: 6px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  color: ${({ theme }) => theme.colors.gray[500]};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const ContentText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: 1.75;
  white-space: pre-wrap;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  padding: 12px 20px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const CloseTextButton = styled.button`
  padding: 8px 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const DownloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  color: white;
  background: ${({ theme }) => theme.colors.primary[500]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

export interface PreviewStudent {
  studentId: string;
  no: number;
  name: string;
  savedAt: string | null;
  content: string;
}

export interface RecordPreviewModalProps {
  classLabel: string;
  hasSelection: boolean;
  students: PreviewStudent[];
  onClose: () => void;
  onDownloadAll: () => void;
}

export const RecordPreviewModal = ({
  classLabel,
  hasSelection,
  students,
  onClose,
  onDownloadAll,
}: RecordPreviewModalProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const copyText = async (studentId: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(studentId);
    setTimeout(() => setCopiedId((current) => (current === studentId ? null : current)), 2000);
  };

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={(event) => event.stopPropagation()}>
        <Header>
          <div>
            <HeaderTitleRow>
              <Sparkles size={16} color='#8b5cf6' />
              <HeaderTitle>문구 미리보기</HeaderTitle>
              <HeaderCount>{students.length}명</HeaderCount>
            </HeaderTitleRow>
            <HeaderSub>
              {classLabel} · {hasSelection ? '선택 학생 문구' : '생성 완료 문구'}
            </HeaderSub>
          </div>
          <CloseButton onClick={onClose} aria-label='닫기'>
            <X size={16} />
          </CloseButton>
        </Header>
        <Body>
          {students.length === 0 ? (
            <EmptyText>아직 생성된 문구가 없습니다.</EmptyText>
          ) : (
            students.map((student) => (
              <StudentCard key={student.studentId}>
                <StudentCardHeader>
                  <span>
                    <StudentName>
                      {student.no}번 {student.name}
                    </StudentName>
                    {student.savedAt && <StudentSavedAt>· {student.savedAt}</StudentSavedAt>}
                  </span>
                  <CopyButton onClick={() => copyText(student.studentId, student.content)}>
                    {copiedId === student.studentId ? (
                      <Check size={14} color='#10B981' />
                    ) : (
                      <Copy size={14} />
                    )}
                    {copiedId === student.studentId ? '복사됨' : '복사'}
                  </CopyButton>
                </StudentCardHeader>
                <ContentText>{student.content}</ContentText>
              </StudentCard>
            ))
          )}
        </Body>
        <Footer>
          <CloseTextButton onClick={onClose}>닫기</CloseTextButton>
          <DownloadButton onClick={onDownloadAll} disabled={students.length === 0}>
            <Download size={16} /> {hasSelection ? '다운로드' : '전체 다운로드'}
          </DownloadButton>
        </Footer>
      </Panel>
    </Overlay>
  );
};
