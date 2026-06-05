import styled from '@emotion/styled';
import { X, ChevronDown, ChevronUp, Upload, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@features/auth/model/AuthContext';
import type { ContextMode, ChatMessage } from '../types';
import {
  errorReportService,
  type BugReportPayload,
} from '@shared/services/errorReportService';

// ============================================================
// 상수
// ============================================================

const ERROR_TYPE_OPTIONS = [
  { id: 'hallucination', label: '사실 환각' },
  { id: 'sensitive', label: '민감 정보' },
  { id: 'data_mismatch', label: '데이터 불일치' },
  { id: 'missing_info', label: '정보 누락' },
  { id: 'ui_bug', label: 'UI 버그' },
  { id: 'other', label: '기타' },
] as const;

const SEVERITY_OPTIONS = [
  { id: 'critical' as const, label: 'Critical', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  { id: 'high' as const, label: 'High', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  { id: 'medium' as const, label: 'Medium', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  { id: 'low' as const, label: 'Low', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
];

// ============================================================
// 타입
// ============================================================

export interface ErrorCaptureContext {
  userId: string;
  conversationId: string;
  mode: ContextMode;
  contextLabel: string;
  stdtId?: string | null;
  claId?: string | null;
  contextData: string | null;
}

export interface ErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMessage: ChatMessage;
  prevUserMessage: ChatMessage | null;
  captureContext: ErrorCaptureContext;
}

// ============================================================
// 스타일
// ============================================================

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Background = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
`;

const ModalCard = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  margin: 0 ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  flex-shrink: 0;
`;

const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.gray[400]};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  flex-shrink: 0;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.625rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary[600] : theme.colors.gray[500])};
  border-bottom: 2px solid ${({ $active, theme }) => ($active ? theme.colors.primary[500] : 'transparent')};
  transition: all 0.15s ease;
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[600]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MessageBox = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  white-space: pre-wrap;
  line-height: 1.6;
`;

const MessageBoxCollapsed = styled(MessageBox)<{ $lines: number }>`
  display: -webkit-box;
  -webkit-line-clamp: ${({ $lines }) => $lines};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.primary[500]};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const ChipGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TypeChip = styled.button<{ $selected: boolean }>`
  padding: 0.25rem 0.625rem;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  border: 1px solid ${({ $selected, theme }) => ($selected ? theme.colors.primary[400] : theme.colors.gray[200])};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.primary[50] : 'transparent')};
  color: ${({ $selected, theme }) => ($selected ? theme.colors.primary[700] : theme.colors.gray[600])};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[400]};
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const SeverityGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SeverityBtn = styled.button<{ $selected: boolean; $bg: string; $color: string; $border: string }>`
  flex: 1;
  padding: 0.375rem 0;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ $selected, theme }) =>
    $selected ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  border: 1px solid ${({ $selected, $border, theme }) => ($selected ? $border : theme.colors.gray[200])};
  background: ${({ $selected, $bg }) => ($selected ? $bg : 'transparent')};
  color: ${({ $selected, $color, theme }) => ($selected ? $color : theme.colors.gray[500])};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ $border }) => $border};
    background: ${({ $bg }) => $bg};
    color: ${({ $color }) => $color};
  }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 0.625rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  resize: vertical;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[400]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const DropZone = styled.label<{ $isDragging: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 1.5rem;
  border: 1.5px dashed
    ${({ $isDragging, theme }) =>
      $isDragging ? theme.colors.primary[400] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ $isDragging, theme }) =>
    $isDragging ? theme.colors.primary[50] : 'transparent'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[400]};
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const DropZoneText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const DropZoneHint = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const DropZoneFile = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ModalFooter = styled.div`
  padding: 0.75rem 1.25rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const SubmitBtn = styled.button`
  padding: 0.5rem 1.25rem;
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[700]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusText = styled.p<{ $isError: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ $isError }) => ($isError ? '#dc2626' : '#16a34a')};
  text-align: center;
  padding: 0.5rem 1.25rem 0;
  flex-shrink: 0;
`;

// ---- Tab 2 List Styles ----

const ListEmpty = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[400]};
  text-align: center;
  padding: 2rem 0;
`;

const ListLoading = styled(ListEmpty)``;

const ReportCard = styled.button`
  width: 100%;
  text-align: left;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[300]};
    box-shadow: 0 2px 6px rgba(139, 92, 246, 0.08);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SeverityBadge = styled.span<{ $severity: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $severity }) =>
    $severity === 'critical' ? '#fef2f2'
    : $severity === 'high' ? '#fffbeb'
    : $severity === 'medium' ? '#eff6ff'
    : '#f0fdf4'};
  color: ${({ $severity }) =>
    $severity === 'critical' ? '#dc2626'
    : $severity === 'high' ? '#d97706'
    : $severity === 'medium' ? '#2563eb'
    : '#16a34a'};
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $status }) =>
    $status === 'resolved' ? '#f0fdf4'
    : $status === 'dismissed' ? '#f9fafb'
    : '#fefce8'};
  color: ${({ $status }) =>
    $status === 'resolved' ? '#16a34a'
    : $status === 'dismissed' ? '#6b7280'
    : '#a16207'};
`;

const CardErrorType = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  flex: 1;
`;

const CardMemo = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
`;

const CardDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  align-self: flex-end;
`;

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.primary[600]};
  padding: 0 0 0.5rem;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[800]};
  }
`;

const DetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DetailLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DetailValue = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  white-space: pre-wrap;
  word-break: break-word;
`;

// ---- Context Panel ----

const ContextScrollBox = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.625rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  max-height: 160px;
  overflow-y: auto;
`;

const ContextRow = styled.div`
  display: grid;
  grid-template-columns: 10rem 1fr;
  gap: 0.5rem;
  align-items: start;
`;

const ContextKey = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  flex-shrink: 0;
`;

const ContextVal = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-family: 'Consolas', 'Monaco', monospace;
  word-break: break-all;
`;

// ============================================================
// 탭 1 — 오류 보고 폼
// ============================================================

interface ReportFormProps {
  targetMessage: ChatMessage;
  prevUserMessage: ChatMessage | null;
  captureContext: ErrorCaptureContext;
  onSuccess: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({
  targetMessage,
  prevUserMessage,
  captureContext,
  onSuccess,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [errorType, setErrorType] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setScreenshot(file);
  };

  const handleSubmit = async () => {
    if (!errorType) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const convIdNum = parseInt(captureContext.conversationId, 10);
    const msgIdNum = /^\d+$/.test(targetMessage.id) ? parseInt(targetMessage.id, 10) : null;

    const payload: BugReportPayload = {
      conversationId: convIdNum,
      messageId: msgIdNum,
      errorType,
      severity,
      description: description || undefined,
    };

    try {
      await errorReportService.submit(payload, screenshot ?? undefined);
      setSubmitStatus('success');
      setTimeout(onSuccess, 1200);
    } catch {
      setSubmitStatus('error');
      setErrorMsg('제출에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ModalBody>
        <Section>
          <Label>신고 메시지 전문</Label>
          {isExpanded ? (
            <MessageBox>{targetMessage.content}</MessageBox>
          ) : (
            <MessageBoxCollapsed $lines={5}>{targetMessage.content}</MessageBoxCollapsed>
          )}
          {targetMessage.content.split('\n').length > 5 && (
            <ExpandButton onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? (
                <>
                  <ChevronUp className='w-3 h-3' /> 접기
                </>
              ) : (
                <>
                  <ChevronDown className='w-3 h-3' /> 더보기
                </>
              )}
            </ExpandButton>
          )}
        </Section>

        <Section>
          <Label>오류 유형</Label>
          <ChipGroup>
            {ERROR_TYPE_OPTIONS.map((opt) => (
              <TypeChip
                key={opt.id}
                $selected={errorType === opt.id}
                onClick={() => setErrorType(opt.id)}
              >
                {opt.label}
              </TypeChip>
            ))}
          </ChipGroup>
        </Section>

        <Section>
          <Label>심각도</Label>
          <SeverityGroup>
            {SEVERITY_OPTIONS.map((opt) => (
              <SeverityBtn
                key={opt.id}
                $selected={severity === opt.id}
                $bg={opt.bg}
                $color={opt.color}
                $border={opt.border}
                onClick={() => setSeverity(opt.id)}
              >
                {opt.label}
              </SeverityBtn>
            ))}
          </SeverityGroup>
        </Section>

        <Section>
          <Label>설명 (선택)</Label>
          <StyledTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='오류에 대한 추가 설명을 입력해주세요.'
          />
        </Section>

        <Section>
          <Label>스크린샷 / 첨부 파일</Label>
          <DropZone
            $isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload
              className='w-5 h-5'
              style={{ color: isDragging ? '#8b5cf6' : '#9ca3af' }}
            />
            {screenshot ? (
              <DropZoneFile>{screenshot.name}</DropZoneFile>
            ) : (
              <>
                <DropZoneText>클릭 또는 드래그</DropZoneText>
                <DropZoneHint>이미지 (JPG, PNG, GIF, WEBP) · 최대 10MB</DropZoneHint>
              </>
            )}
            <input
              type='file'
              accept='image/jpeg,image/png,image/gif,image/webp'
              style={{ display: 'none' }}
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
            />
          </DropZone>
        </Section>

        <Section>
          <Label>자동 캡쳐 컨텍스트</Label>
          <ContextScrollBox>
            <ContextRow>
              <ContextKey>user_id</ContextKey>
              <ContextVal>{captureContext.userId}</ContextVal>
            </ContextRow>
            <ContextRow>
              <ContextKey>conversation_id</ContextKey>
              <ContextVal>{captureContext.conversationId}</ContextVal>
            </ContextRow>
            <ContextRow>
              <ContextKey>mode</ContextKey>
              <ContextVal>{captureContext.mode}</ContextVal>
            </ContextRow>
            <ContextRow>
              <ContextKey>context_label</ContextKey>
              <ContextVal>{captureContext.contextLabel}</ContextVal>
            </ContextRow>
            {captureContext.stdtId && (
              <ContextRow>
                <ContextKey>stdt_id</ContextKey>
                <ContextVal>{captureContext.stdtId}</ContextVal>
              </ContextRow>
            )}
            {captureContext.claId && (
              <ContextRow>
                <ContextKey>cla_id</ContextKey>
                <ContextVal>{captureContext.claId}</ContextVal>
              </ContextRow>
            )}
            <ContextRow>
              <ContextKey>flagged_message_id</ContextKey>
              <ContextVal>{targetMessage.id}</ContextVal>
            </ContextRow>
            <ContextRow>
              <ContextKey>user_message_id</ContextKey>
              <ContextVal>{prevUserMessage?.id ?? '(없음)'}</ContextVal>
            </ContextRow>
            <ContextRow>
              <ContextKey>question_snapshot</ContextKey>
              <ContextVal>{prevUserMessage?.content ?? '(없음)'}</ContextVal>
            </ContextRow>
            <ContextRow>
              <ContextKey>answer_snapshot</ContextKey>
              <ContextVal>{targetMessage.content}</ContextVal>
            </ContextRow>
            <ContextRow>
              <ContextKey>message_timestamp</ContextKey>
              <ContextVal>{targetMessage.timestamp.toISOString()}</ContextVal>
            </ContextRow>
            {captureContext.contextData && (
              <ContextRow>
                <ContextKey>context_data</ContextKey>
                <ContextVal>{captureContext.contextData}</ContextVal>
              </ContextRow>
            )}
          </ContextScrollBox>
        </Section>

      </ModalBody>

      {(submitStatus === 'success' || submitStatus === 'error') && (
        <StatusText $isError={submitStatus === 'error'}>
          {submitStatus === 'success' ? '✓ 오류 보고가 제출되었습니다.' : errorMsg}
        </StatusText>
      )}

      <ModalFooter>
        <SubmitBtn
          onClick={handleSubmit}
          disabled={isSubmitting || !errorType}
        >
          {isSubmitting ? '제출 중...' : '보고 제출'}
        </SubmitBtn>
      </ModalFooter>
    </>
  );
};

// ============================================================
// 탭 2 — 보고한 오류
// ============================================================

const ERROR_TYPE_LABEL: Record<string, string> = {
  hallucination: '사실 환각',
  sensitive: '민감 정보',
  data_mismatch: '데이터 불일치',
  missing_info: '정보 누락',
  ui_bug: 'UI 버그',
  other: '기타',
};

const STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  reviewing: '검토중',
  resolved: '해결',
  dismissed: '기각',
};

const DetailView: React.FC<{ id: number; onBack: () => void }> = ({ id, onBack }) => {
  const { data: detail, isLoading: loading, isError: error } = useQuery({
    queryKey: ['bug-report-detail', id],
    queryFn: () => errorReportService.getDetail(id),
    staleTime: 60_000,
  });

  return (
    <>
      <ModalBody>
        <BackBtn onClick={onBack}>
          <ChevronLeft className='w-4 h-4' />
          목록으로
        </BackBtn>

        {loading && <ListLoading>불러오는 중...</ListLoading>}
        {error && <ListEmpty>상세 정보를 불러오지 못했습니다.</ListEmpty>}
        {detail && (
          <>
            <DetailSection>
              <DetailLabel>신고 일시</DetailLabel>
              <DetailValue>{detail.reportedAt}</DetailValue>
            </DetailSection>

            <DetailSection>
              <DetailLabel>오류 유형 / 심각도 / 상태</DetailLabel>
              <CardTop>
                <SeverityBadge $severity={detail.severity}>
                  {detail.severity.toUpperCase()}
                </SeverityBadge>
                <CardErrorType>{ERROR_TYPE_LABEL[detail.errorType] ?? detail.errorType}</CardErrorType>
                <StatusBadge $status={detail.status}>
                  {STATUS_LABEL[detail.status] ?? detail.status}
                </StatusBadge>
              </CardTop>
            </DetailSection>

            {detail.conversation && (
              <DetailSection>
                <DetailLabel>대화방</DetailLabel>
                <DetailValue>{detail.conversation.title} ({detail.conversation.contextLabel})</DetailValue>
              </DetailSection>
            )}

            {detail.message && (
              <DetailSection>
                <DetailLabel>신고 메시지</DetailLabel>
                <MessageBox>{detail.message.content}</MessageBox>
              </DetailSection>
            )}

            {detail.description && (
              <DetailSection>
                <DetailLabel>설명</DetailLabel>
                <DetailValue>{detail.description}</DetailValue>
              </DetailSection>
            )}

            {detail.screenshotUrl && (
              <DetailSection>
                <DetailLabel>첨부 스크린샷</DetailLabel>
                <img
                  src={detail.screenshotUrl}
                  alt='screenshot'
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
              </DetailSection>
            )}

            {detail.resolutionNote && (
              <DetailSection>
                <DetailLabel>처리 메모</DetailLabel>
                <DetailValue>{detail.resolutionNote}</DetailValue>
              </DetailSection>
            )}
          </>
        )}
      </ModalBody>
    </>
  );
};

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding-top: 0.25rem;
`;

const PageBtn = styled.button<{ $active?: boolean }>`
  min-width: 1.75rem;
  height: 1.75rem;
  padding: 0 0.375rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary[400] : theme.colors.gray[200])};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary[50] : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary[700] : theme.colors.gray[500])};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary[400]};
    background: ${({ theme }) => theme.colors.primary[50]};
    color: ${({ theme }) => theme.colors.primary[700]};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const ReportList: React.FC = () => {
  const { user } = useAuth();
  const userNo = user?.id ? parseInt(user.id, 10) : null;
  const validUserNo = userNo && Number.isFinite(userNo) ? userNo : null;

  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading: loading, isError: error } = useQuery({
    queryKey: ['bug-reports-my', validUserNo, page],
    queryFn: () => errorReportService.getMyReports(validUserNo!, page),
    enabled: !!validUserNo,
    staleTime: 30_000,
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (selectedId !== null) {
    return <DetailView id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <ModalBody>
      {loading && <ListLoading>불러오는 중...</ListLoading>}
      {!loading && error && <ListEmpty>목록을 불러오지 못했습니다.</ListEmpty>}
      {!loading && !error && items.length === 0 && (
        <ListEmpty>보고한 오류가 없습니다.</ListEmpty>
      )}
      {items.map((item) => (
        <ReportCard key={item.id} onClick={() => setSelectedId(item.id)}>
          <CardTop>
            <SeverityBadge $severity={item.severity}>{item.severity.toUpperCase()}</SeverityBadge>
            <CardErrorType>{ERROR_TYPE_LABEL[item.errorType] ?? item.errorType}</CardErrorType>
            <StatusBadge $status={item.status}>{STATUS_LABEL[item.status] ?? item.status}</StatusBadge>
          </CardTop>
          {item.description && <CardMemo>{item.description}</CardMemo>}
          <CardDate>{item.reportedAt}</CardDate>
        </ReportCard>
      ))}
      {totalPages > 1 && (
        <Pagination>
          <PageBtn onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</PageBtn>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <PageBtn key={p} $active={p === page} onClick={() => setPage(p)}>
              {p}
            </PageBtn>
          ))}
          <PageBtn onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>›</PageBtn>
        </Pagination>
      )}
    </ModalBody>
  );
};

// ============================================================
// 메인 모달
// ============================================================

export const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  isOpen,
  onClose,
  targetMessage,
  prevUserMessage,
  captureContext,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'history'>('report');

  if (!isOpen) return null;

  return (
    <Overlay>
      <Background onClick={onClose} />
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>AI 응답 오류 보고</ModalTitle>
          <CloseButton onClick={onClose}>
            <X className='w-4 h-4' />
          </CloseButton>
        </ModalHeader>

        <Tabs>
          <Tab $active={activeTab === 'report'} onClick={() => setActiveTab('report')}>
            오류 보고
          </Tab>
          <Tab $active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            보고한 오류
          </Tab>
        </Tabs>

        {activeTab === 'report' ? (
          <ReportForm
            targetMessage={targetMessage}
            prevUserMessage={prevUserMessage}
            captureContext={captureContext}
            onSuccess={onClose}
          />
        ) : (
          <ReportList />
        )}
      </ModalCard>
    </Overlay>
  );
};
