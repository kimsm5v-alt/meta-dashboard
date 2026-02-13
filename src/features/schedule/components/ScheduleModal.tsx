import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, X, Trash2, CheckCircle2, FileText } from 'lucide-react';
import { Modal, Button } from '@/shared/components';
import type {
  CounselingStudent,
  ScheduleType,
  CounselingArea,
  CounselingMethod,
  CreateUnifiedCounselingInput,
  UnifiedCounselingRecord,
  UpdateUnifiedCounselingInput,
  CounselingStatus,
} from '@/shared/types';
import {
  SCHEDULE_TYPE_LABELS,
  COUNSELING_AREA_LABELS,
  COUNSELING_METHOD_LABELS,
} from '@/shared/types';
import { ScheduleStudentPicker } from './ScheduleStudentPicker';
import { SCHEDULE_CLASSES, CLASS_COLORS } from '@/shared/data/mockUnifiedCounseling';
import { TIME_OPTIONS, SCHEDULE_TYPES, COUNSELING_AREAS, COUNSELING_METHODS } from '@/shared/data/counselingConstants';
import { MultiSelectButtonGroup } from '@/shared/components';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateUnifiedCounselingInput) => void;
  onUpdate?: (id: string, input: UpdateUnifiedCounselingInput) => void;
  onDelete?: (id: string) => void;
  initialDate?: Date;
  editingSchedule?: UnifiedCounselingRecord | null;
}

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
      setDate(initialDate.toISOString().split('T')[0]);
      setStatus('scheduled');
    } else if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
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
    setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const isValid = selectedStudents.length > 0 && date && areas.length > 0;

  // 토글 선택 헬퍼 함수
  const toggleScheduleType = (type: ScheduleType) => {
    setScheduleTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleArea = (area: CounselingArea) => {
    setAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const toggleMethod = (method: CounselingMethod) => {
    setMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? '상담 일정 상세' : '상담 일정 등록'} size="lg">
        <div className="space-y-5">
          {/* 학생 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학생 <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => setShowStudentPicker(true)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-500">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  {selectedStudents.length > 0
                    ? `${selectedStudents.length}명 선택됨`
                    : '학생을 선택하세요'}
                </span>
              </div>
            </button>

            {/* 선택된 학생 칩 */}
            {selectedStudents.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedStudents.map(student => {
                  const cls = SCHEDULE_CLASSES.find(c => c.id === student.classId);
                  return (
                    <span
                      key={student.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: CLASS_COLORS[student.classId] || '#9CA3AF' }}
                    >
                      {cls?.label} {student.name}
                      <button
                        onClick={() => removeStudent(student.id)}
                        className="ml-0.5 hover:bg-white/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* 날짜와 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                날짜 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시간 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 상담 유형 (복수 선택 가능) */}
          <MultiSelectButtonGroup
            label="상담 유형"
            items={SCHEDULE_TYPES}
            selected={scheduleTypes}
            onToggle={toggleScheduleType}
            labelMap={SCHEDULE_TYPE_LABELS}
            alertKey="urgent"
          />

          {/* 상담 영역 (복수 선택 가능) */}
          <MultiSelectButtonGroup
            label="상담 영역"
            required
            items={COUNSELING_AREAS}
            selected={areas}
            onToggle={toggleArea}
            labelMap={COUNSELING_AREA_LABELS}
          />

          {/* 상담 방법 (복수 선택 가능) */}
          <MultiSelectButtonGroup
            label="상담 방법"
            items={COUNSELING_METHODS}
            selected={methods}
            onToggle={toggleMethod}
            labelMap={COUNSELING_METHOD_LABELS}
          />

          {/* 상담 내용/사유 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 내용/사유
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="상담 내용이나 사유를 입력하세요 (선택)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 상담 기록 (수정 모드에서만 표시) */}
          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>상담 기록</span>
                  {isCompleted && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-medium rounded-full">
                      완료됨
                    </span>
                  )}
                </div>
              </label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="상담 후 기록을 작성하세요. 이 내용은 학생 상담 탭과 동기화됩니다."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          {isEditMode && onDelete && (
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="flex-1">
            취소
          </Button>
          {isEditMode && !isCompleted && (
            <Button
              variant="secondary"
              onClick={() => setShowCompleteConfirm(true)}
              className="flex-1 text-emerald-600 hover:bg-emerald-50 border-emerald-200"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              상담 완료
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={!isValid} className="flex-1">
            {isEditMode ? '수정하기' : '등록하기'}
          </Button>
        </div>

        {/* 삭제 확인 */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white rounded-lg flex flex-col items-center justify-center p-6">
            <p className="text-lg font-medium text-gray-900 mb-2">일정을 삭제하시겠습니까?</p>
            <p className="text-sm text-gray-500 mb-6">삭제된 일정은 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                취소
              </Button>
              <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                삭제
              </Button>
            </div>
          </div>
        )}

        {/* 완료 확인 */}
        {showCompleteConfirm && (
          <div className="absolute inset-0 bg-white rounded-lg flex flex-col items-center justify-center p-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">상담을 완료 처리하시겠습니까?</p>
            <p className="text-sm text-gray-500 mb-6 text-center">
              완료된 상담은 캘린더에서 완료 표시로 나타납니다.
              {summary.trim() && (
                <><br />작성하신 상담 기록도 함께 저장됩니다.</>
              )}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowCompleteConfirm(false)}>
                취소
              </Button>
              <Button onClick={handleComplete} className="bg-emerald-500 hover:bg-emerald-600">
                완료 처리
              </Button>
            </div>
          </div>
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
