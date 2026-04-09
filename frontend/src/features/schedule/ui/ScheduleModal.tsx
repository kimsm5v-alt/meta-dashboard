import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Users, Calendar, Clock, X, Trash2, CheckCircle2, FileText } from 'lucide-react';
import { Modal, Button } from '@shared/components';
import type {
  CounselingStudent,
  ScheduleType,
  CounselingArea,
  CounselingMethod,
  CreateCounselingInput,
  CounselingRecord,
  UpdateCounselingInput,
  CounselingStatus,
} from '@shared/types';
import {
  SCHEDULE_TYPE_LABELS,
  COUNSELING_AREA_LABELS,
  COUNSELING_METHOD_LABELS,
} from '@shared/types';
import { ScheduleStudentPicker } from './ScheduleStudentPicker';
import { formatDateISO } from '@shared/utils/dateUtils';
import { SCHEDULE_CLASSES, CLASS_COLORS } from '@shared/data/mockUnifiedCounseling';
import {
  TIME_OPTIONS,
  SCHEDULE_TYPES,
  COUNSELING_AREAS,
  COUNSELING_METHODS,
} from '@shared/data/counselingConstants';
import { MultiSelectButtonGroup } from '@shared/components';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_COUNSELING_COMPLETE } from '@shared/data/apiDefinitions';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateCounselingInput) => void;
  onUpdate?: (id: string, input: UpdateCounselingInput) => void;
  onDelete?: (id: string) => void;
  initialDate?: Date;
  editingSchedule?: CounselingRecord | null;
}

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div``;

const FormLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.5rem;
`;

const RequiredStar = styled.span`
  color: #ef4444;
`;

const StudentPickerButton = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  text-align: left;
  background: white;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ButtonIcon = styled.div`
  width: 1rem;
  height: 1rem;
`;

const ButtonText = styled.span`
  font-size: 0.875rem;
`;

const StudentChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const StudentChip = styled.span<{ $bgColor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  background-color: ${({ $bgColor }) => $bgColor};
`;

const RemoveChipButton = styled.button`
  margin-left: 0.125rem;
  border-radius: 9999px;
  padding: 0.125rem;
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const SmallIcon = styled.div`
  width: 0.75rem;
  height: 0.75rem;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const DateInput = styled.input`
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const TimeSelect = styled.select`
  width: 100%;
  padding: 0.625rem 1rem 0.625rem 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  appearance: none;
  background: white;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  resize: none;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const SummaryLabelContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SummaryIcon = styled(FileText)`
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const CompletedBadge = styled.span`
  padding: 0.125rem 0.5rem;
  background: #d1fae5;
  color: #059669;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const DeleteButton = styled(Button)`
  color: #dc2626;

  &:hover {
    background: #fef2f2;
  }
`;

const CompleteButton = styled(Button)`
  flex: 1;
  color: #059669;
  border-color: #d1fae5;

  &:hover {
    background: #d1fae5;
  }
`;

const CompleteIcon = styled(CheckCircle2)`
  width: 1rem;
  height: 1rem;
  margin-right: 0.25rem;
`;

const ConfirmOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: white;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
`;

const ConfirmTitle = styled.p`
  font-size: 1.125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const ConfirmMessage = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 1.5rem;
`;

const ConfirmMessageCenter = styled(ConfirmMessage)`
  text-align: center;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ConfirmIcon = styled(CheckCircle2)`
  width: 3rem;
  height: 3rem;
  color: #10b981;
  margin-bottom: 1rem;
`;

const DeleteConfirmButton = styled(Button)`
  background: #ef4444;

  &:hover {
    background: #dc2626;
  }
`;

const CompleteConfirmButton = styled(Button)`
  background: #10b981;

  &:hover {
    background: #059669;
  }
`;

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  onDelete,
  initialDate,
  editingSchedule,
}) => {
  const [selectedStudents, setSelectedStudents] = useState<CounselingStudent[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleType[]>(['regular']);
  const [areas, setAreas] = useState<CounselingArea[]>(['academic']);
  const [methods, setMethods] = useState<CounselingMethod[]>(['face-to-face']);
  const [reason, setReason] = useState('');
  const [summary, setSummary] = useState('');
  const [status, setStatus] = useState<CounselingStatus>('scheduled');
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const isEditMode = !!editingSchedule;
  const isCompleted = status === 'completed';

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isOpen && editingSchedule) {
      const [scheduleDate, scheduleTime] = editingSchedule.scheduledAt.split(' ');
      setSelectedStudents(editingSchedule.students);
      setDate(scheduleDate);
      setTime(scheduleTime || '09:00');
      setScheduleTypes(editingSchedule.types);
      setAreas(editingSchedule.areas);
      setMethods(editingSchedule.methods);
      setReason(editingSchedule.reason || '');
      setSummary(editingSchedule.summary || '');
      setStatus(editingSchedule.status);
    } else if (isOpen && initialDate) {
      setDate(formatDateISO(initialDate));
      setStatus('scheduled');
    } else if (isOpen) {
      setDate(formatDateISO(new Date()));
      setStatus('scheduled');
    }
  }, [initialDate, isOpen, editingSchedule]);

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setSelectedStudents([]);
      setTime('09:00');
      setScheduleTypes(['regular']);
      setAreas(['academic']);
      setMethods(['face-to-face']);
      setReason('');
      setSummary('');
      setStatus('scheduled');
      setShowDeleteConfirm(false);
      setShowCompleteConfirm(false);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (selectedStudents.length === 0 || !date || areas.length === 0) return;

    const classId = selectedStudents[0].classId;

    if (isEditMode && editingSchedule && onUpdate) {
      onUpdate(editingSchedule.id, {
        students: selectedStudents,
        classId,
        scheduledAt: `${date} ${time}`,
        types: scheduleTypes,
        areas,
        methods,
        reason: reason.trim() || undefined,
        summary: summary.trim() || undefined,
        status,
      });
    } else {
      onSubmit({
        students: selectedStudents,
        classId,
        scheduledAt: `${date} ${time}`,
        types: scheduleTypes,
        areas,
        methods,
        status: 'scheduled',
        reason: reason.trim() || undefined,
      });
    }

    onClose();
  };

  const handleComplete = () => {
    if (editingSchedule && onUpdate) {
      onUpdate(editingSchedule.id, {
        status: 'completed',
        summary: summary.trim() || undefined,
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (editingSchedule && onDelete) {
      onDelete(editingSchedule.id);
      onClose();
    }
  };

  const removeStudent = (studentId: string) => {
    setSelectedStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const isValid = selectedStudents.length > 0 && date && areas.length > 0;

  // Generic array toggle helper
  const createToggle =
    <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>) =>
    (item: T) =>
      setter((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]));

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? '상담 일정 상세' : '상담 일정 등록'}
        size='lg'
      >
        <FormContainer>
          {/* 학생 선택 */}
          <FormGroup>
            <FormLabel>
              학생 <RequiredStar>*</RequiredStar>
            </FormLabel>
            <StudentPickerButton onClick={() => setShowStudentPicker(true)}>
              <ButtonContent>
                <ButtonIcon as={Users} />
                <ButtonText>
                  {selectedStudents.length > 0
                    ? `${selectedStudents.length}명 선택됨`
                    : '학생을 선택하세요'}
                </ButtonText>
              </ButtonContent>
            </StudentPickerButton>

            {/* 선택된 학생 칩 */}
            {selectedStudents.length > 0 && (
              <StudentChipsContainer>
                {selectedStudents.map((student) => {
                  const cls = SCHEDULE_CLASSES.find((c) => c.id === student.classId);
                  return (
                    <StudentChip
                      key={student.id}
                      $bgColor={CLASS_COLORS[student.classId] || '#9CA3AF'}
                    >
                      {cls?.label} {student.name}
                      <RemoveChipButton onClick={() => removeStudent(student.id)}>
                        <SmallIcon as={X} />
                      </RemoveChipButton>
                    </StudentChip>
                  );
                })}
              </StudentChipsContainer>
            )}
          </FormGroup>

          {/* 날짜와 시간 */}
          <GridContainer>
            <FormGroup>
              <FormLabel>
                날짜 <RequiredStar>*</RequiredStar>
              </FormLabel>
              <InputWrapper>
                <InputIcon as={Calendar} />
                <DateInput type='date' value={date} onChange={(e) => setDate(e.target.value)} />
              </InputWrapper>
            </FormGroup>
            <FormGroup>
              <FormLabel>
                시간 <RequiredStar>*</RequiredStar>
              </FormLabel>
              <InputWrapper>
                <InputIcon as={Clock} />
                <TimeSelect value={time} onChange={(e) => setTime(e.target.value)}>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </TimeSelect>
              </InputWrapper>
            </FormGroup>
          </GridContainer>

          {/* 상담 유형 (복수 선택 가능) */}
          <MultiSelectButtonGroup
            label='상담 유형'
            items={SCHEDULE_TYPES}
            selected={scheduleTypes}
            onToggle={createToggle(setScheduleTypes)}
            labelMap={SCHEDULE_TYPE_LABELS}
            alertKey='urgent'
          />

          {/* 상담 영역 (복수 선택 가능) */}
          <MultiSelectButtonGroup
            label='상담 영역'
            required
            items={COUNSELING_AREAS}
            selected={areas}
            onToggle={createToggle(setAreas)}
            labelMap={COUNSELING_AREA_LABELS}
          />

          {/* 상담 방법 (복수 선택 가능) */}
          <MultiSelectButtonGroup
            label='상담 방법'
            items={COUNSELING_METHODS}
            selected={methods}
            onToggle={createToggle(setMethods)}
            labelMap={COUNSELING_METHOD_LABELS}
          />

          {/* 상담 내용/사유 */}
          <FormGroup>
            <FormLabel>상담 내용/사유</FormLabel>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='상담 내용이나 사유를 입력하세요 (선택)'
              rows={3}
            />
          </FormGroup>

          {/* 상담 기록 (수정 모드에서만 표시) */}
          {isEditMode && (
            <FormGroup>
              <FormLabel>
                <SummaryLabelContainer>
                  <SummaryIcon />
                  <span>상담 기록</span>
                  {isCompleted && <CompletedBadge>완료됨</CompletedBadge>}
                </SummaryLabelContainer>
              </FormLabel>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder='상담 후 기록을 작성하세요. 이 내용은 학생 상담 탭과 동기화됩니다.'
                rows={4}
              />
            </FormGroup>
          )}
        </FormContainer>

        {/* 하단 버튼 */}
        <ModalFooter>
          {isEditMode && onDelete && (
            <DeleteButton variant='secondary' onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 style={{ width: '1rem', height: '1rem' }} />
            </DeleteButton>
          )}
          <Button variant='secondary' onClick={onClose} style={{ flex: 1 }}>
            취소
          </Button>
          {isEditMode && !isCompleted && (
            <ApiTooltip {...API_COUNSELING_COMPLETE} position='top-right'>
              <CompleteButton variant='secondary' onClick={() => setShowCompleteConfirm(true)}>
                <CompleteIcon />
                상담 완료
              </CompleteButton>
            </ApiTooltip>
          )}
          <Button onClick={handleSubmit} disabled={!isValid} style={{ flex: 1 }}>
            {isEditMode ? '수정하기' : '등록하기'}
          </Button>
        </ModalFooter>

        {/* 삭제 확인 */}
        {showDeleteConfirm && (
          <ConfirmOverlay>
            <ConfirmTitle>일정을 삭제하시겠습니까?</ConfirmTitle>
            <ConfirmMessage>삭제된 일정은 복구할 수 없습니다.</ConfirmMessage>
            <ConfirmActions>
              <Button variant='secondary' onClick={() => setShowDeleteConfirm(false)}>
                취소
              </Button>
              <DeleteConfirmButton onClick={handleDelete}>삭제</DeleteConfirmButton>
            </ConfirmActions>
          </ConfirmOverlay>
        )}

        {/* 완료 확인 */}
        {showCompleteConfirm && (
          <ConfirmOverlay>
            <ConfirmIcon />
            <ConfirmTitle>상담을 완료 처리하시겠습니까?</ConfirmTitle>
            <ConfirmMessageCenter>
              완료된 상담은 캘린더에서 완료 표시로 나타납니다.
              {summary.trim() && (
                <>
                  <br />
                  작성하신 상담 기록도 함께 저장됩니다.
                </>
              )}
            </ConfirmMessageCenter>
            <ConfirmActions>
              <Button variant='secondary' onClick={() => setShowCompleteConfirm(false)}>
                취소
              </Button>
              <CompleteConfirmButton onClick={handleComplete}>완료 처리</CompleteConfirmButton>
            </ConfirmActions>
          </ConfirmOverlay>
        )}
      </Modal>

      {/* 학생 선택 모달 (중첩) */}
      <ScheduleStudentPicker
        isOpen={showStudentPicker}
        onClose={() => setShowStudentPicker(false)}
        selectedStudents={selectedStudents}
        onConfirm={setSelectedStudents}
      />
    </>
  );
};
