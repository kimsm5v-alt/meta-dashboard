import styled from '@emotion/styled';
import { useState } from 'react';
import { AlertCircle, Check, Edit2, Trash2 } from 'lucide-react';
import type { CounselingRecord } from '@shared/types';
import {
  SCHEDULE_TYPE_LABELS,
  COUNSELING_AREA_LABELS,
  COUNSELING_METHOD_LABELS,
} from '@shared/types';
import { formatScheduleDateKr, extractTime } from '@shared/utils/dateUtils';

const Card = styled.div`
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 0.75rem;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const DateSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DateText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const TimeText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const UrgentBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.125rem 0.375rem;
  background: #fee2e2;
  color: #dc2626;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const IconButton = styled.button<{ $isDelete?: boolean }>`
  padding: 0.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  border: none;
  background: transparent;
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: ${({ $isDelete, theme }) => ($isDelete ? '#ef4444' : theme.colors.primary[500])};
    background: ${({ theme }) => theme.colors.background.paper};
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
`;

const Tag = styled.span`
  padding: 0.125rem 0.375rem;
  background: #fef3c7;
  color: #b45309;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const MemoEditContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MemoTextarea = styled.textarea`
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border: 1px solid #fcd34d;
  border-radius: ${({ theme }) => theme.radius.lg};
  resize: none;
  outline: none;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const MemoActions = styled.div`
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
`;

const MemoButton = styled.button<{ $isPrimary?: boolean }>`
  padding: 0.25rem 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;
  transition: background-color 0.15s ease;

  ${({ $isPrimary, theme }) =>
    $isPrimary
      ? `
    background: ${theme.colors.primary[500]};
    color: #ffffff;
    &:hover {
      background: ${theme.colors.primary[600]};
    }
  `
      : `
    background: transparent;
    color: ${theme.colors.gray[500]};
    &:hover {
      background: ${theme.colors.background.paper};
    }
  `}
`;

const MemoDisplayButton = styled.button`
  width: 100%;
  text-align: left;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  background: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  padding: 0.375rem;
  margin: -0.375rem;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: #fef3c7;
  }
`;

const MemoPlaceholder = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-style: italic;
`;

const CompleteButton = styled.button`
  width: 100%;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

interface ScheduledRecordCardProps {
  record: CounselingRecord;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateReason: (reason: string) => void;
  isActionPending?: boolean;
}

export const ScheduledRecordCard: React.FC<ScheduledRecordCardProps> = ({
  record,
  onComplete,
  onEdit,
  onDelete,
  onUpdateReason,
  isActionPending = false,
}) => {
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [reasonText, setReasonText] = useState(record.reason || '');

  const handleSaveReason = () => {
    if (isActionPending) return;
    onUpdateReason(reasonText);
    setIsEditingReason(false);
  };

  return (
    <Card>
      <Header>
        <DateSection>
          <DateText>{formatScheduleDateKr(record.scheduledAt)}</DateText>
          <TimeText>{extractTime(record.scheduledAt)}</TimeText>
          {record.types.includes('urgent') && (
            <UrgentBadge>
              <AlertCircle className='w-3 h-3' />
              긴급
            </UrgentBadge>
          )}
        </DateSection>
        <ActionButtons>
          <IconButton onClick={onEdit} disabled={isActionPending}>
            <Edit2 className='w-3.5 h-3.5' />
          </IconButton>
          <IconButton onClick={onDelete} $isDelete disabled={isActionPending}>
            <Trash2 className='w-3.5 h-3.5' />
          </IconButton>
        </ActionButtons>
      </Header>

      <TagsContainer>
        {record.areas.map((area, i) => (
          <Tag key={`area-${i}`}>{COUNSELING_AREA_LABELS[area]}</Tag>
        ))}
        {record.types.map((type, i) => (
          <Tag key={`type-${i}`}>{SCHEDULE_TYPE_LABELS[type]}</Tag>
        ))}
        {record.methods.map((method, i) => (
          <Tag key={`method-${i}`}>{COUNSELING_METHOD_LABELS[method]}</Tag>
        ))}
      </TagsContainer>

      {/* 메모 영역 */}
      {isEditingReason ? (
        <MemoEditContainer>
          <MemoTextarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder='상담 사유나 메모를 입력하세요'
            rows={2}
            autoFocus
          />
          <MemoActions>
            <MemoButton
              onClick={() => {
                setReasonText(record.reason || '');
                setIsEditingReason(false);
              }}
            >
              취소
            </MemoButton>
            <MemoButton onClick={handleSaveReason} $isPrimary disabled={isActionPending}>
              저장
            </MemoButton>
          </MemoActions>
        </MemoEditContainer>
      ) : (
        <MemoDisplayButton onClick={() => setIsEditingReason(true)}>
          {record.reason || <MemoPlaceholder>메모 추가...</MemoPlaceholder>}
        </MemoDisplayButton>
      )}

      {/* 완료 버튼 */}
      <CompleteButton onClick={onComplete} disabled={isActionPending}>
        <Check className='w-3.5 h-3.5' />
        완료 처리
      </CompleteButton>
    </Card>
  );
};
