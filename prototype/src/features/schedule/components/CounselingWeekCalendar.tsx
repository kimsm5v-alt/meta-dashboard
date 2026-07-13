/**
 * 학생 상담 - 주간 캘린더
 *
 * 이번 주 상담 일정을 요일별로 표시
 */

import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { CounselingRecord } from '../types';
import { COUNSELING_TYPE_LABELS } from '../types';

interface CounselingWeekCalendarProps {
  records: CounselingRecord[];
  onRecordClick?: (record: CounselingRecord) => void;
}

/** 주의 시작일(월요일) 구하기 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** 주의 모든 날짜 구하기 */
const getWeekDays = (weekStart: Date): Date[] => {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  return days;
};

/** 날짜 포맷 */
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export const CounselingWeekCalendar: React.FC<CounselingWeekCalendarProps> = ({
  records,
  onRecordClick,
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  // 각 요일별 상담 기록 그룹화
  const recordsByDay = useMemo(() => {
    const grouped: Record<string, CounselingRecord[]> = {};
    weekDays.forEach((day) => {
      const dateKey = day.toISOString().split('T')[0];
      grouped[dateKey] = records.filter((r) => {
        const recordDate = new Date(r.scheduledAt).toISOString().split('T')[0];
        return recordDate === dateKey;
      });
    });
    return grouped;
  }, [records, weekDays]);

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">주간 상담 일정</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm text-gray-700 min-w-[140px] text-center">
            {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
          </span>
          <button
            onClick={handleNextWeek}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 주간 캘린더 */}
      <div className="grid grid-cols-7 divide-x divide-gray-100">
        {weekDays.map((day, index) => {
          const dateKey = day.toISOString().split('T')[0];
          const dayRecords = recordsByDay[dateKey] || [];
          const isToday = day.getTime() === today.getTime();
          const isWeekend = index >= 5;

          return (
            <div key={dateKey} className="min-h-[140px]">
              {/* 요일 헤더 */}
              <div
                className={`px-2 py-2 text-center border-b border-gray-100 ${
                  isToday ? 'bg-primary-50' : isWeekend ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    isToday ? 'text-primary-600' : isWeekend ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {DAY_LABELS[index]}
                </p>
                <p
                  className={`text-lg font-semibold ${
                    isToday ? 'text-primary-700' : 'text-gray-900'
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>

              {/* 상담 목록 */}
              <div className="p-1.5 space-y-1">
                {dayRecords.slice(0, 3).map((record) => (
                  <button
                    key={record.id}
                    onClick={() => onRecordClick?.(record)}
                    className="w-full text-left p-1.5 rounded bg-primary-50 hover:bg-primary-100 transition-colors"
                  >
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {record.studentName}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(record.scheduledAt)}</span>
                    </div>
                  </button>
                ))}
                {dayRecords.length > 3 && (
                  <p className="text-xs text-center text-gray-400">+{dayRecords.length - 3}건</p>
                )}
                {dayRecords.length === 0 && (
                  <p className="text-xs text-center text-gray-300 py-2">-</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CounselingWeekCalendar;
