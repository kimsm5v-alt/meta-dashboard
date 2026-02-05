import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, X, Trash2 } from 'lucide-react';
import { Modal, Button } from '@/shared/components';
import type {
  CounselingStudent,
  ScheduleType,
  CounselingArea,
  CounselingMethod,
  CreateUnifiedCounselingInput,
  UnifiedCounselingRecord,
  UpdateUnifiedCounselingInput,
} from '@/shared/types';
import {
  SCHEDULE_TYPE_LABELS,
  COUNSELING_AREA_LABELS,
  COUNSELING_METHOD_LABELS,
} from '@/shared/types';
import { ScheduleStudentPicker } from './ScheduleStudentPicker';
import { SCHEDULE_CLASSES, CLASS_COLORS } from '@/shared/data/mockUnifiedCounseling';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateUnifiedCounselingInput) => void;
  onUpdate?: (id: string, input: UpdateUnifiedCounselingInput) => void;
  onDelete?: (id: string) => void;
  initialDate?: Date;
  editingSchedule?: UnifiedCounselingRecord | null;
}

// 시간 옵션 생성 (09:00 ~ 17:00, 30분 단위)
const TIME_OPTIONS: string[] = [];
for (let hour = 9; hour <= 17; hour++) {
  TIME_OPTIONS.push(`${hour.toString().padStart(2, '0')}:00`);
  if (hour < 17) {
    TIME_OPTIONS.push(`${hour.toString().padStart(2, '0')}:30`);
  }
}

const SCHEDULE_TYPES: ScheduleType[] = ['regular', 'urgent', 'follow-up', 'initial'];
const COUNSELING_AREAS: CounselingArea[] = [
  'academic',
  'career',
  'peer',
  'family',
  'emotion',
  'behavior',
  'health',
  'other',
];
const COUNSELING_METHODS: CounselingMethod[] = ['face-to-face', 'phone', 'video', 'group'];

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
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditMode = !!editingSchedule;

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
    } else if (isOpen && initialDate) {
      setDate(initialDate.toISOString().split('T')[0]);
    } else if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
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
      setShowDeleteConfirm(false);
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 유형 <span className="text-xs text-gray-400 font-normal">(복수 선택 가능)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SCHEDULE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => toggleScheduleType(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    scheduleTypes.includes(type)
                      ? type === 'urgent'
                        ? 'bg-red-500 text-white'
                        : 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {SCHEDULE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* 상담 영역 (복수 선택 가능) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 영역 <span className="text-red-500">*</span> <span className="text-xs text-gray-400 font-normal">(복수 선택 가능)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COUNSELING_AREAS.map(a => (
                <button
                  key={a}
                  onClick={() => toggleArea(a)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    areas.includes(a)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {COUNSELING_AREA_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {/* 상담 방법 (복수 선택 가능) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 방법 <span className="text-xs text-gray-400 font-normal">(복수 선택 가능)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COUNSELING_METHODS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMethod(m)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    methods.includes(m)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {COUNSELING_METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

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
