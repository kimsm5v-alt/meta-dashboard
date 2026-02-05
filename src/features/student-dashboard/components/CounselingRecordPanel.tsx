import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
  Mic,
  Edit2,
  Trash2,
} from 'lucide-react';
import type {
  UnifiedCounselingRecord,
  CreateUnifiedCounselingInput,
  ScheduleType,
  CounselingArea,
  CounselingMethod,
  CounselingStudent,
} from '@/shared/types';
import {
  SCHEDULE_TYPE_LABELS,
  COUNSELING_AREA_LABELS,
  COUNSELING_METHOD_LABELS,
} from '@/shared/types';
import { unifiedCounselingService } from '@/shared/services/unifiedCounselingService';
import { SCHEDULE_STUDENTS } from '@/shared/data/mockUnifiedCounseling';

interface CounselingRecordPanelProps {
  studentId: string;
  classId: string;
  studentName?: string;
  studentNumber?: number;
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
  'academic', 'career', 'peer', 'family', 'emotion', 'behavior', 'health', 'other',
];
const COUNSELING_METHODS: CounselingMethod[] = ['face-to-face', 'phone', 'video', 'group'];

export const CounselingRecordPanel: React.FC<CounselingRecordPanelProps> = ({
  studentId,
  classId,
  studentName = '',
  studentNumber = 0,
}) => {
  const [records, setRecords] = useState<UnifiedCounselingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 완료 처리 모달 상태
  const [completingRecord, setCompletingRecord] = useState<UnifiedCounselingRecord | null>(null);
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

  // 데이터 로드
  useEffect(() => {
    loadRecords();
  }, [studentId]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await unifiedCounselingService.getByStudentId(studentId);
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  // 예정 / 완료 분리
  const { scheduledRecords, completedRecords } = useMemo(() => {
    const scheduled = records.filter(r => r.status === 'scheduled');
    const completed = records.filter(r => r.status === 'completed');
    return {
      scheduledRecords: scheduled.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
      completedRecords: completed.sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)),
    };
  }, [records]);

  // 학생 정보 생성
  const getStudentInfo = (): CounselingStudent => {
    // SCHEDULE_STUDENTS에서 찾기
    for (const students of Object.values(SCHEDULE_STUDENTS)) {
      const found = students.find(s => s.id === studentId);
      if (found) return found;
    }
    // 못 찾으면 기본값
    return {
      id: studentId,
      name: studentName || '학생',
      number: studentNumber || 0,
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
    setFormData(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type],
    }));
  };

  const toggleArea = (area: CounselingArea) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area],
    }));
  };

  const toggleMethod = (method: CounselingMethod) => {
    setFormData(prev => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter(m => m !== method)
        : [...prev.methods, method],
    }));
  };

  const handleSubmit = async () => {
    const student = getStudentInfo();

    const input: CreateUnifiedCounselingInput = {
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
        await unifiedCounselingService.update(editingId, {
          scheduledAt: input.scheduledAt,
          types: input.types,
          areas: input.areas,
          methods: input.methods,
          reason: input.reason,
        });
      } else {
        await unifiedCounselingService.create(input);
      }
      resetForm();
      await loadRecords();
    } catch {
      // 에러 처리
    }
  };

  const handleEdit = (record: UnifiedCounselingRecord) => {
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
      await unifiedCounselingService.delete(id);
      await loadRecords();
    } catch {
      // 에러 처리
    }
  };

  const handleComplete = async () => {
    if (!completingRecord) return;

    try {
      await unifiedCounselingService.complete(completingRecord.id, {
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

  const handleUpdateReason = async (record: UnifiedCounselingRecord, newReason: string) => {
    try {
      await unifiedCounselingService.update(record.id, { reason: newReason });
      await loadRecords();
    } catch {
      // 에러 처리
    }
  };

  const formatDate = (dateStr: string) => {
    const [date] = dateStr.split(' ');
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const formatTime = (dateStr: string) => {
    return dateStr.split(' ')[1] || '09:00';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">상담 기록</h3>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 기록
        </button>
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {editingId ? '기록 수정' : '새 상담 기록'}
            </span>
            <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 날짜 + 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
              >
                {TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 상담 유형 (복수 선택 가능) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              상담 유형 <span className="text-[10px] text-gray-400">(복수 선택)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SCHEDULE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    formData.types.includes(type)
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
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              상담 영역 <span className="text-[10px] text-gray-400">(복수 선택)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COUNSELING_AREAS.map(area => (
                <button
                  key={area}
                  onClick={() => toggleArea(area)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    formData.areas.includes(area)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {COUNSELING_AREA_LABELS[area]}
                </button>
              ))}
            </div>
          </div>

          {/* 상담 방법 (복수 선택 가능) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              상담 방법 <span className="text-[10px] text-gray-400">(복수 선택)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COUNSELING_METHODS.map(method => (
                <button
                  key={method}
                  onClick={() => toggleMethod(method)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    formData.methods.includes(method)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {COUNSELING_METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          </div>

          {/* 상담 내용/사유 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              {formData.saveAsCompleted ? '상담 내용' : '상담 사유/메모'}
            </label>
            <textarea
              placeholder={formData.saveAsCompleted
                ? '상담 내용을 입력하세요'
                : '상담 사유나 메모를 입력하세요 (선택)'
              }
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 저장 옵션 */}
          {!editingId && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.saveAsCompleted}
                onChange={e => setFormData({ ...formData, saveAsCompleted: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-xs text-gray-600">바로 완료 처리 (이미 진행된 상담)</span>
            </label>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={formData.saveAsCompleted && !formData.reason.trim()}
              className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {editingId ? '수정' : formData.saveAsCompleted ? '완료 기록 저장' : '예정 등록'}
            </button>
          </div>
        </div>
      )}

      {/* 예정된 상담 */}
      {scheduledRecords.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            예정된 상담 ({scheduledRecords.length})
          </h4>
          <div className="space-y-2">
            {scheduledRecords.map(record => (
              <ScheduledRecordCard
                key={record.id}
                record={record}
                onComplete={() => setCompletingRecord(record)}
                onEdit={() => handleEdit(record)}
                onDelete={() => handleDelete(record.id)}
                onUpdateReason={(reason) => handleUpdateReason(record, reason)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 완료된 상담 */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Check className="w-3.5 h-3.5" />
          완료된 상담 ({completedRecords.length})
        </h4>
        {completedRecords.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">아직 완료된 상담 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedRecords.map(record => {
              const isExpanded = expandedId === record.id;
              return (
                <div
                  key={record.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs text-gray-400">{formatDate(record.scheduledAt)}</span>
                          {record.areas.map((area, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">
                              {COUNSELING_AREA_LABELS[area]}
                            </span>
                          ))}
                          {record.types.map((type, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">
                              {SCHEDULE_TYPE_LABELS[type]}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-gray-900 line-clamp-1">
                          {record.summary || '(내용 없음)'}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-gray-100">
                      <div className="pt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                          <span>{formatTime(record.scheduledAt)}</span>
                          <span>|</span>
                          <span>{record.duration || 30}분</span>
                          <span>|</span>
                          <span>{record.methods.map(m => COUNSELING_METHOD_LABELS[m]).join(', ')}</span>
                        </div>
                        {record.summary && (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {record.summary}
                          </p>
                        )}
                        {record.nextSteps && (
                          <div className="bg-blue-50 rounded-lg p-2">
                            <p className="text-xs font-medium text-blue-700 mb-0.5">후속 조치</p>
                            <p className="text-xs text-blue-600">{record.nextSteps}</p>
                          </div>
                        )}
                        <div className="flex justify-end gap-1 pt-1">
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 음성 녹음 안내 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-blue-700 mb-2">
              음성 녹음으로 상담 기록을 작성할 수 있습니다.
            </p>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors">
              <Mic className="w-3.5 h-3.5" />
              음성으로 기록
            </button>
          </div>
        </div>
      </div>

      {/* 완료 처리 모달 */}
      {completingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-5 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">상담 완료 처리</h3>
              <button
                onClick={() => setCompletingRecord(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 상담 정보 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(completingRecord.scheduledAt)} {formatTime(completingRecord.scheduledAt)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {completingRecord.areas.map(a => COUNSELING_AREA_LABELS[a]).join(', ')} | {completingRecord.methods.map(m => COUNSELING_METHOD_LABELS[m]).join(', ')}
                </p>
              </div>

              {/* 소요 시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  소요 시간 (분)
                </label>
                <input
                  type="number"
                  value={completionData.duration}
                  onChange={e => setCompletionData({ ...completionData, duration: parseInt(e.target.value) || 30 })}
                  min={5}
                  max={180}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* 상담 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  상담 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={completionData.summary}
                  onChange={e => setCompletionData({ ...completionData, summary: e.target.value })}
                  placeholder="상담 내용을 입력하세요"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* 후속 조치 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  후속 조치 (선택)
                </label>
                <textarea
                  value={completionData.nextSteps}
                  onChange={e => setCompletionData({ ...completionData, nextSteps: e.target.value })}
                  placeholder="후속 조치 사항을 입력하세요"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setCompletingRecord(null)}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleComplete}
                disabled={!completionData.summary.trim()}
                className="flex-1 px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                완료 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 예정된 상담 카드 컴포넌트
interface ScheduledRecordCardProps {
  record: UnifiedCounselingRecord;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateReason: (reason: string) => void;
}

const ScheduledRecordCard: React.FC<ScheduledRecordCardProps> = ({
  record,
  onComplete,
  onEdit,
  onDelete,
  onUpdateReason,
}) => {
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [reasonText, setReasonText] = useState(record.reason || '');

  const handleSaveReason = () => {
    onUpdateReason(reasonText);
    setIsEditingReason(false);
  };

  const formatDate = (dateStr: string) => {
    const [date] = dateStr.split(' ');
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const formatTime = (dateStr: string) => {
    return dateStr.split(' ')[1] || '09:00';
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{formatDate(record.scheduledAt)}</span>
          <span className="text-sm text-gray-600">{formatTime(record.scheduledAt)}</span>
          {record.types.includes('urgent') && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-medium rounded">
              <AlertCircle className="w-3 h-3" />
              긴급
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-primary-500 hover:bg-white rounded transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {record.areas.map((area, i) => (
          <span key={`area-${i}`} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
            {COUNSELING_AREA_LABELS[area]}
          </span>
        ))}
        {record.types.map((type, i) => (
          <span key={`type-${i}`} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
            {SCHEDULE_TYPE_LABELS[type]}
          </span>
        ))}
        {record.methods.map((method, i) => (
          <span key={`method-${i}`} className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
            {COUNSELING_METHOD_LABELS[method]}
          </span>
        ))}
      </div>

      {/* 메모 영역 */}
      {isEditingReason ? (
        <div className="space-y-2">
          <textarea
            value={reasonText}
            onChange={e => setReasonText(e.target.value)}
            placeholder="상담 사유나 메모를 입력하세요"
            rows={2}
            className="w-full px-2 py-1.5 text-xs border border-amber-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => {
                setReasonText(record.reason || '');
                setIsEditingReason(false);
              }}
              className="px-2 py-1 text-xs text-gray-500 hover:bg-white rounded"
            >
              취소
            </button>
            <button
              onClick={handleSaveReason}
              className="px-2 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600"
            >
              저장
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsEditingReason(true)}
          className="w-full text-left text-xs text-gray-600 hover:bg-amber-100 rounded p-1.5 -m-1.5 transition-colors"
        >
          {record.reason || (
            <span className="text-gray-400 italic">메모 추가...</span>
          )}
        </button>
      )}

      {/* 완료 버튼 */}
      <button
        onClick={onComplete}
        className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
      >
        <Check className="w-3.5 h-3.5" />
        완료 처리
      </button>
    </div>
  );
};
