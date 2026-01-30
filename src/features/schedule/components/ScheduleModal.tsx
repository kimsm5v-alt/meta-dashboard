import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, X } from 'lucide-react';
import { Modal, Button } from '@/shared/components';
import type {
  ScheduleStudent,
  ScheduleType,
  CounselingArea,
  CounselingMethod,
  CreateScheduleInput,
} from '@/shared/types';
import {
  SCHEDULE_TYPE_LABELS,
  COUNSELING_AREA_LABELS,
  COUNSELING_METHOD_LABELS,
  CLASS_COLORS,
} from '@/shared/types';
import { ScheduleStudentPicker } from './ScheduleStudentPicker';
import { SCHEDULE_CLASSES } from '../data/mockSchedules';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateScheduleInput) => void;
  initialDate?: Date;
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
  initialDate,
}) => {
  const [selectedStudents, setSelectedStudents] = useState<ScheduleStudent[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('regular');
  const [area, setArea] = useState<CounselingArea>('academic');
  const [method, setMethod] = useState<CounselingMethod>('face-to-face');
  const [reason, setReason] = useState('');
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  // 초기 날짜 설정
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate.toISOString().split('T')[0]);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialDate, isOpen]);

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setSelectedStudents([]);
      setTime('09:00');
      setScheduleType('regular');
      setArea('academic');
      setMethod('face-to-face');
      setReason('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (selectedStudents.length === 0 || !date || !area) return;

    const classId = selectedStudents[0].classId;

    onSubmit({
      students: selectedStudents,
      classId,
      date,
      time,
      type: scheduleType,
      area,
      method,
      reason: reason.trim() || undefined,
    });

    onClose();
  };

  const removeStudent = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const isValid = selectedStudents.length > 0 && date && area;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="상담 일정 등록" size="lg">
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

          {/* 상담 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 유형
            </label>
            <div className="flex flex-wrap gap-2">
              {SCHEDULE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setScheduleType(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    scheduleType === type
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

          {/* 상담 영역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 영역 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COUNSELING_AREAS.map(a => (
                <button
                  key={a}
                  onClick={() => setArea(a)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    area === a
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {COUNSELING_AREA_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {/* 상담 방법 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상담 방법
            </label>
            <div className="flex flex-wrap gap-2">
              {COUNSELING_METHODS.map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    method === m
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
          <Button variant="secondary" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid} className="flex-1">
            등록하기
          </Button>
        </div>
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
