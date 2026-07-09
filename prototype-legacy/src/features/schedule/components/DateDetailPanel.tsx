import { X, Plus, User, Users, Phone, Video, AlertCircle, Clock } from 'lucide-react';
import type { UnifiedCounselingRecord } from '@/shared/types';
import {
  COUNSELING_AREA_LABELS,
  COUNSELING_METHOD_LABELS,
} from '@/shared/types';
import { Button } from '@/shared/components';
import { SCHEDULE_CLASSES, CLASS_COLORS } from '@/shared/data/mockUnifiedCounseling';

interface DateDetailPanelProps {
  date: Date;
  schedules: UnifiedCounselingRecord[];
  onClose: () => void;
  onAddClick: () => void;
  onScheduleClick: (schedule: UnifiedCounselingRecord) => void;
}

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };
  return date.toLocaleDateString('ko-KR', options);
};

export const DateDetailPanel: React.FC<DateDetailPanelProps> = ({
  date,
  schedules,
  onClose,
  onAddClick,
  onScheduleClick,
}) => {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'group':
        return <Users className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getClassLabel = (classId: string) => {
    const cls = SCHEDULE_CLASSES.find(c => c.id === classId);
    return cls?.label || classId;
  };

  return (
    <div className="fixed right-0 top-16 bottom-0 w-96 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="font-semibold text-gray-900">{formatDate(date)}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {schedules.length}건의 상담 일정
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 일정 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">이 날짜에 예정된 상담이 없습니다</p>
          </div>
        ) : (
          schedules
            .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
            .map(schedule => {
              const scheduleTime = schedule.scheduledAt.split(' ')[1] || '09:00';
              return (
              <button
                key={schedule.id}
                onClick={() => onScheduleClick(schedule)}
                className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
              >
                {/* 상단: 시간 + 긴급 + 유형 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {scheduleTime}
                    </span>
                    {schedule.types.includes('urgent') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        긴급
                      </span>
                    )}
                  </div>
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: `${CLASS_COLORS[schedule.classId]}15`,
                      color: CLASS_COLORS[schedule.classId],
                    }}
                  >
                    {getClassLabel(schedule.classId)}
                  </span>
                </div>

                {/* 학생명 */}
                <div className="mb-2">
                  <div className="font-medium text-gray-900">
                    {schedule.students.length === 1
                      ? schedule.students[0].name
                      : `${schedule.students[0].name} 외 ${schedule.students.length - 1}명`}
                  </div>
                  {schedule.students.length > 1 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {schedule.students.slice(1, 4).map(s => (
                        <span
                          key={s.id}
                          className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                        >
                          {s.name}
                        </span>
                      ))}
                      {schedule.students.length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{schedule.students.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 상담 정보 */}
                <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                  {schedule.areas.map((area, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${CLASS_COLORS[schedule.classId]}15`,
                        color: CLASS_COLORS[schedule.classId],
                      }}
                    >
                      {COUNSELING_AREA_LABELS[area]}
                    </span>
                  ))}
                  <span className="flex items-center gap-1">
                    {getMethodIcon(schedule.methods[0])}
                    <span className="text-xs">
                      {schedule.methods.map(m => COUNSELING_METHOD_LABELS[m]).join(', ')}
                    </span>
                  </span>
                </div>

                {/* 사유 */}
                {schedule.reason && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {schedule.reason}
                  </p>
                )}
              </button>
              );
            })
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="p-4 border-t border-gray-200">
        <Button onClick={onAddClick} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          이 날짜에 상담 등록
        </Button>
      </div>
    </div>
  );
};
