import { AlertCircle, RefreshCw } from 'lucide-react';
import type { UnifiedCounselingRecord } from '@/shared/types';
import { SCHEDULE_CLASSES, CLASS_COLORS } from '@/shared/data/mockUnifiedCounseling';

interface ClassSummaryCardsProps {
  schedules: UnifiedCounselingRecord[];
  onClassClick?: (classId: string) => void;
  selectedClassFilter: string | null;
}

export const ClassSummaryCards: React.FC<ClassSummaryCardsProps> = ({
  schedules,
  onClassClick,
  selectedClassFilter,
}) => {
  // 학급별 통계 계산
  const classStats = SCHEDULE_CLASSES.map(cls => {
    const classSchedules = schedules.filter(s => s.classId === cls.id);
    const urgentCount = classSchedules.filter(s => s.types.includes('urgent')).length;
    const followUpCount = classSchedules.filter(s => s.types.includes('follow-up')).length;

    return {
      ...cls,
      total: classSchedules.length,
      urgent: urgentCount,
      followUp: followUpCount,
    };
  });

  return (
    <div className="grid grid-cols-4 gap-4">
      {classStats.map(cls => {
        const isSelected = selectedClassFilter === cls.id;
        const color = CLASS_COLORS[cls.id] || '#9CA3AF';

        return (
          <button
            key={cls.id}
            onClick={() => onClassClick?.(cls.id)}
            className={`relative p-4 bg-white rounded-xl border-2 transition-all hover:shadow-md text-left ${
              isSelected
                ? 'border-primary-500 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* 상단: 반 이름 + 색상 인디케이터 */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-semibold text-gray-900">{cls.label}</span>
            </div>

            {/* 총 건수 */}
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {cls.total}
              <span className="text-sm font-normal text-gray-500 ml-1">건</span>
            </div>

            {/* 하단: 긴급/후속 표시 */}
            <div className="flex items-center gap-3 mt-2">
              {cls.urgent > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  긴급 {cls.urgent}
                </span>
              )}
              {cls.followUp > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                  <RefreshCw className="w-3 h-3" />
                  후속 {cls.followUp}
                </span>
              )}
              {cls.urgent === 0 && cls.followUp === 0 && cls.total > 0 && (
                <span className="text-xs text-gray-400">정기상담 위주</span>
              )}
              {cls.total === 0 && (
                <span className="text-xs text-gray-400">예정된 상담 없음</span>
              )}
            </div>

            {/* 선택 표시 */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500" />
            )}
          </button>
        );
      })}
    </div>
  );
};
