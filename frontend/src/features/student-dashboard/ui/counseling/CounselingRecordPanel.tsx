import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
} from 'lucide-react';
import styled from '@emotion/styled';
import type {
  CounselingRecord,
  CreateCounselingInput,
  ScheduleType,
  CounselingArea,
  CounselingMethod,
  CounselingStudent,
} from '@shared/types';
import {
  SCHEDULE_TYPE_LABELS,
  COUNSELING_AREA_LABELS,
  COUNSELING_METHOD_LABELS,
} from '@shared/types';
import { counselingService } from '@shared/services/counselingService';
import { SCHEDULE_STUDENTS } from '@shared/data/mockUnifiedCounseling';
import {
  TIME_OPTIONS,
  SCHEDULE_TYPES,
  COUNSELING_AREAS,
  COUNSELING_METHODS,
} from '@shared/data/counselingConstants';
import { formatScheduleDateKr, extractTime } from '@shared/utils/dateUtils';
import { PanelLoading, MultiSelectButtonGroup } from '@shared/components';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_COUNSELING_LIST, API_COUNSELING_CREATE } from '@shared/data/apiDefinitions';
import { ScheduledRecordCard } from './ScheduledRecordCard';
import { CompletionModal } from './CompletionModal';

// Layout Components
const PanelContainer = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderTitle = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

// Form Components
const FormContainer = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FormTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const CloseButton = styled.button`
  padding: 0.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.span`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DateInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  appearance: none;
  background: white;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
  }
`;

const FormLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.375rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  resize: none;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  border-color: ${({ theme }) => theme.colors.gray[300]};
  color: ${({ theme }) => theme.colors.primary[500]};

  &:focus {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
  }
`;

const CheckboxText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FormActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const SubmitButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

// Section Components
const SectionTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const RecordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

// Completed Record Components
const CompletedRecordCard = styled.div`
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  overflow: hidden;
`;

const RecordButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const RecordHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const RecordContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const RecordMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
`;

const RecordDate = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const RecordBadge = styled.span`
  padding: 0.125rem 0.375rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: 0.25rem;
`;

const RecordSummary = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChevronIcon = styled.span`
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Expanded Content
const ExpandedContent = styled.div`
  padding: 0 0.75rem 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const ExpandedInner = styled.div`
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DetailMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  flex-wrap: wrap;
`;

const DetailSeparator = styled.span``;

const SummaryText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  white-space: pre-wrap;
`;

const NextStepsBox = styled.div`
  background: #eff6ff;
  border-radius: 0.5rem;
  padding: 0.5rem;
`;

const NextStepsTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: #1d4ed8;
  margin-bottom: 0.125rem;
`;

const NextStepsText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: #2563eb;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  padding-top: 0.25rem;
`;

const IconButton = styled.button<{ $variant: 'edit' | 'delete' }>`
  padding: 0.375rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    ${({ $variant, theme }) =>
      $variant === 'edit'
        ? `
      color: ${theme.colors.primary[500]};
      background: ${theme.colors.primary[50]};
    `
        : `
      color: #ef4444;
      background: #fef2f2;
    `}
  }
`;

// Empty State
const EmptyState = styled.div`
  text-align: center;
  padding: 1.5rem 0;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

interface CounselingRecordPanelProps {
  studentId: string;
  classId: string;
  studentName?: string;
  studentNumber?: number;
}

export const CounselingRecordPanel: React.FC<CounselingRecordPanelProps> = ({
  studentId,
  classId,
  studentName = '',
  studentNumber = 0,
}) => {
  const [records, setRecords] = useState<CounselingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 완료 처리 모달 상태
  const [completingRecord, setCompletingRecord] = useState<CounselingRecord | null>(null);
  const [completionData, setCompletionData] = useState({
    duration: 30,
    summary: '',
    nextSteps: '',
  });

  // 폼 데이터 (복수 선택 지원)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    types: ['regular'] as ScheduleType[],
    areas: ['academic'] as CounselingArea[],
    methods: ['face-to-face'] as CounselingMethod[],
    reason: '',
    saveAsCompleted: false,
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await counselingService.getByStudentId(studentId);
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 로드
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // 예정 / 완료 분리
  const { scheduledRecords, completedRecords } = useMemo(() => {
    const scheduled = records.filter((r) => r.status === 'scheduled');
    const completed = records.filter((r) => r.status === 'completed');
    return {
      scheduledRecords: scheduled.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
      completedRecords: completed.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
    };
  }, [records]);

  // 학생 정보 생성
  const getStudentInfo = (): CounselingStudent => {
    for (const students of Object.values(SCHEDULE_STUDENTS)) {
      const found = students.find((s) => s.id === studentId);
      if (found) return found;
    }
    return {
      id: studentId,
      name: studentName || '학생',
      number: studentNumber || 1,
      classId,
    };
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      types: ['regular'],
      areas: ['academic'],
      methods: ['face-to-face'],
      reason: '',
      saveAsCompleted: false,
    });
    setShowForm(false);
    setEditingId(null);
  };

  // 토글 선택 헬퍼 함수
  const toggleType = (type: ScheduleType) => {
    setFormData((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const toggleArea = (area: CounselingArea) => {
    setFormData((prev) => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter((a) => a !== area)
        : [...prev.areas, area],
    }));
  };

  const toggleMethod = (method: CounselingMethod) => {
    setFormData((prev) => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter((m) => m !== method)
        : [...prev.methods, method],
    }));
  };

  const handleSubmit = async () => {
    const student = getStudentInfo();

    const input: CreateCounselingInput = {
      students: [student],
      classId,
      scheduledAt: `${formData.date} ${formData.time}`,
      types: formData.types,
      areas: formData.areas,
      methods: formData.methods,
      status: formData.saveAsCompleted ? 'completed' : 'scheduled',
      reason: formData.reason.trim() || undefined,
      summary: formData.saveAsCompleted ? formData.reason.trim() : undefined,
    };

    try {
      if (editingId) {
        await counselingService.update(editingId, {
          scheduledAt: input.scheduledAt,
          types: input.types,
          areas: input.areas,
          methods: input.methods,
          reason: input.reason,
        });
      } else {
        await counselingService.create(input);
      }
      resetForm();
      await loadRecords();
    } catch {
      // 에러 처리
    }
  };

  const handleEdit = (record: CounselingRecord) => {
    const [date, time] = record.scheduledAt.split(' ');
    setFormData({
      date,
      time: time || '09:00',
      types: record.types,
      areas: record.areas,
      methods: record.methods,
      reason: record.reason || record.summary || '',
      saveAsCompleted: false,
    });
    setEditingId(record.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 상담 기록을 삭제하시겠습니까?')) return;
    try {
      await counselingService.delete(id);
      await loadRecords();
    } catch {
      // 에러 처리
    }
  };

  const handleComplete = async () => {
    if (!completingRecord) return;

    try {
      await counselingService.complete(completingRecord.id, {
        duration: completionData.duration,
        summary: completionData.summary,
        nextSteps: completionData.nextSteps || undefined,
      });
      setCompletingRecord(null);
      setCompletionData({ duration: 30, summary: '', nextSteps: '' });
      await loadRecords();
    } catch {
      // 에러 처리
    }
  };

  const handleUpdateReason = async (record: CounselingRecord, newReason: string) => {
    try {
      await counselingService.update(record.id, { reason: newReason });
      await loadRecords();
    } catch {
      // 에러 처리
    }
  };

  if (loading) {
    return <PanelLoading />;
  }

  return (
    <PanelContainer>
      {/* 헤더 */}
      <HeaderRow>
        <ApiTooltip {...API_COUNSELING_LIST} position='bottom-left'>
          <HeaderTitle>상담 기록</HeaderTitle>
        </ApiTooltip>
        <ApiTooltip {...API_COUNSELING_CREATE} position='bottom-right'>
          <AddButton
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus size={16} />새 기록
          </AddButton>
        </ApiTooltip>
      </HeaderRow>

      {/* 작성 폼 */}
      {showForm && (
        <FormContainer>
          <FormHeader>
            <FormTitle>{editingId ? '기록 수정' : '새 상담 기록'}</FormTitle>
            <CloseButton onClick={resetForm}>
              <X size={16} />
            </CloseButton>
          </FormHeader>

          {/* 날짜 + 시간 */}
          <FormGrid>
            <InputWrapper>
              <InputIcon>
                <Calendar size={16} />
              </InputIcon>
              <DateInput
                type='date'
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </InputWrapper>
            <InputWrapper>
              <InputIcon>
                <Clock size={16} />
              </InputIcon>
              <SelectInput
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectInput>
            </InputWrapper>
          </FormGrid>

          <MultiSelectButtonGroup
            label='상담 유형'
            items={SCHEDULE_TYPES}
            selected={formData.types}
            onToggle={toggleType}
            labelMap={SCHEDULE_TYPE_LABELS}
            alertKey='urgent'
            size='sm'
          />

          <MultiSelectButtonGroup
            label='상담 영역'
            items={COUNSELING_AREAS}
            selected={formData.areas}
            onToggle={toggleArea}
            labelMap={COUNSELING_AREA_LABELS}
            size='sm'
          />

          <MultiSelectButtonGroup
            label='상담 방법'
            items={COUNSELING_METHODS}
            selected={formData.methods}
            onToggle={toggleMethod}
            labelMap={COUNSELING_METHOD_LABELS}
            size='sm'
          />

          {/* 상담 내용/사유 */}
          <div>
            <FormLabel>{formData.saveAsCompleted ? '상담 내용' : '상담 사유/메모'}</FormLabel>
            <TextArea
              placeholder={
                formData.saveAsCompleted
                  ? '상담 내용을 입력하세요'
                  : '상담 사유나 메모를 입력하세요 (선택)'
              }
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
            />
          </div>

          {/* 저장 옵션 */}
          {!editingId && (
            <CheckboxLabel>
              <Checkbox
                type='checkbox'
                checked={formData.saveAsCompleted}
                onChange={(e) => setFormData({ ...formData, saveAsCompleted: e.target.checked })}
              />
              <CheckboxText>바로 완료 처리 (이미 진행된 상담)</CheckboxText>
            </CheckboxLabel>
          )}

          <FormActions>
            <CancelButton onClick={resetForm}>취소</CancelButton>
            <SubmitButton
              onClick={handleSubmit}
              disabled={formData.saveAsCompleted && !formData.reason.trim()}
            >
              {editingId ? '수정' : formData.saveAsCompleted ? '완료 기록 저장' : '예정 등록'}
            </SubmitButton>
          </FormActions>
        </FormContainer>
      )}

      {/* 예정된 상담 */}
      {scheduledRecords.length > 0 && (
        <div>
          <SectionTitle>
            <Calendar size={14} />
            예정된 상담 ({scheduledRecords.length})
          </SectionTitle>
          <RecordList>
            {scheduledRecords.map((record) => (
              <ScheduledRecordCard
                key={record.id}
                record={record}
                onComplete={() => setCompletingRecord(record)}
                onEdit={() => handleEdit(record)}
                onDelete={() => handleDelete(record.id)}
                onUpdateReason={(reason) => handleUpdateReason(record, reason)}
              />
            ))}
          </RecordList>
        </div>
      )}

      {/* 완료된 상담 */}
      <div>
        <SectionTitle>
          <Check size={14} />
          완료된 상담 ({completedRecords.length})
        </SectionTitle>
        {completedRecords.length === 0 ? (
          <EmptyState>
            <EmptyText>아직 완료된 상담 기록이 없습니다.</EmptyText>
          </EmptyState>
        ) : (
          <RecordList>
            {completedRecords.map((record) => {
              const isExpanded = expandedId === record.id;
              return (
                <CompletedRecordCard key={record.id}>
                  <RecordButton onClick={() => setExpandedId(isExpanded ? null : record.id)}>
                    <RecordHeader>
                      <RecordContent>
                        <RecordMeta>
                          <RecordDate>{formatScheduleDateKr(record.scheduledAt)}</RecordDate>
                          {record.areas.map((area, i) => (
                            <RecordBadge key={i}>{COUNSELING_AREA_LABELS[area]}</RecordBadge>
                          ))}
                          {record.types.map((type, i) => (
                            <RecordBadge key={i}>{SCHEDULE_TYPE_LABELS[type]}</RecordBadge>
                          ))}
                        </RecordMeta>
                        <RecordSummary>{record.summary || '(내용 없음)'}</RecordSummary>
                      </RecordContent>
                      <ChevronIcon>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </ChevronIcon>
                    </RecordHeader>
                  </RecordButton>

                  {isExpanded && (
                    <ExpandedContent>
                      <ExpandedInner>
                        <DetailMeta>
                          <span>{extractTime(record.scheduledAt)}</span>
                          <DetailSeparator>|</DetailSeparator>
                          <span>{record.duration || 30}분</span>
                          <DetailSeparator>|</DetailSeparator>
                          <span>
                            {record.methods.map((m) => COUNSELING_METHOD_LABELS[m]).join(', ')}
                          </span>
                        </DetailMeta>
                        {record.summary && <SummaryText>{record.summary}</SummaryText>}
                        {record.nextSteps && (
                          <NextStepsBox>
                            <NextStepsTitle>후속 조치</NextStepsTitle>
                            <NextStepsText>{record.nextSteps}</NextStepsText>
                          </NextStepsBox>
                        )}
                        <ActionButtons>
                          <IconButton $variant='edit' onClick={() => handleEdit(record)}>
                            <Edit2 size={14} />
                          </IconButton>
                          <IconButton $variant='delete' onClick={() => handleDelete(record.id)}>
                            <Trash2 size={14} />
                          </IconButton>
                        </ActionButtons>
                      </ExpandedInner>
                    </ExpandedContent>
                  )}
                </CompletedRecordCard>
              );
            })}
          </RecordList>
        )}
      </div>

      {/* 완료 처리 모달 */}
      {completingRecord && (
        <CompletionModal
          record={completingRecord}
          data={completionData}
          onChange={setCompletionData}
          onComplete={handleComplete}
          onClose={() => setCompletingRecord(null)}
        />
      )}
    </PanelContainer>
  );
};
