import styled from '@emotion/styled';
import { X } from 'lucide-react';
import type { CounselingRecord } from '@shared/types';
import { COUNSELING_AREA_LABELS, COUNSELING_METHOD_LABELS } from '@shared/types';
import { formatScheduleDateKr, extractTime } from '@shared/utils/dateUtils';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalContainer = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.xl};
  width: 100%;
  max-width: 28rem;
  padding: 1.25rem;
  margin: ${({ theme }) => theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CloseButton = styled.button`
  padding: 0.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  border: none;
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const FormContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const InfoBox = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.75rem;
`;

const InfoDate = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const InfoMeta = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const FormField = styled.div``;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.375rem;
`;

const RequiredMark = styled.span`
  color: #ef4444;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  resize: none;
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: ${({ theme }) => `0.5rem ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const SubmitButton = styled.button`
  flex: 1;
  padding: ${({ theme }) => `0.5rem ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface CompletionData {
  duration: number;
  summary: string;
  nextSteps: string;
}

interface CompletionModalProps {
  record: CounselingRecord;
  data: CompletionData;
  onChange: (data: CompletionData) => void;
  onComplete: () => void;
  isCompleting?: boolean;
  onClose: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  record,
  data,
  onChange,
  onComplete,
  isCompleting = false,
  onClose,
}) => {
  return (
    <Overlay>
      <ModalContainer>
        <Header>
          <Title>상담 완료 처리</Title>
          <CloseButton onClick={onClose}>
            <X className='w-5 h-5' />
          </CloseButton>
        </Header>

        <FormContent>
          {/* 상담 정보 */}
          <InfoBox>
            <InfoDate>
              {formatScheduleDateKr(record.scheduledAt)} {extractTime(record.scheduledAt)}
            </InfoDate>
            <InfoMeta>
              {record.areas.map((a) => COUNSELING_AREA_LABELS[a]).join(', ')} |{' '}
              {record.methods.map((m) => COUNSELING_METHOD_LABELS[m]).join(', ')}
            </InfoMeta>
          </InfoBox>

          {/* 소요 시간 */}
          <FormField>
            <Label>소요 시간 (분)</Label>
            <Input
              type='number'
              value={data.duration}
              onChange={(e) => onChange({ ...data, duration: parseInt(e.target.value) || 30 })}
              min={5}
              max={180}
            />
          </FormField>

          {/* 상담 내용 */}
          <FormField>
            <Label>
              상담 내용 <RequiredMark>*</RequiredMark>
            </Label>
            <Textarea
              value={data.summary}
              onChange={(e) => onChange({ ...data, summary: e.target.value })}
              placeholder='상담 내용을 입력하세요'
              rows={4}
            />
          </FormField>

          {/* 후속 조치 */}
          <FormField>
            <Label>후속 조치 (선택)</Label>
            <Textarea
              value={data.nextSteps}
              onChange={(e) => onChange({ ...data, nextSteps: e.target.value })}
              placeholder='후속 조치 사항을 입력하세요'
              rows={2}
            />
          </FormField>
        </FormContent>

        <Actions>
          <CancelButton onClick={onClose} disabled={isCompleting}>
            취소
          </CancelButton>
          <SubmitButton onClick={onComplete} disabled={!data.summary.trim() || isCompleting}>
            {isCompleting ? '처리 중...' : '완료 처리'}
          </SubmitButton>
        </Actions>
      </ModalContainer>
    </Overlay>
  );
};
