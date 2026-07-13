/**
 * 상담·코칭 전체 현황 - 최근/예정 상담 목록
 *
 * 최근 상담 기록, 예정된 상담
 */

import { Clock, CheckCircle, Calendar, ChevronRight, User } from 'lucide-react';
import type { CounselingRecord } from '../types';
import { COUNSELING_TYPE_LABELS, COUNSELING_AREA_LABELS } from '../types';

interface RecentCounselingListProps {
  title: string;
  records: CounselingRecord[];
  type: 'recent' | 'scheduled';
  onRecordClick: (record: CounselingRecord) => void;
}

/** 날짜 포맷팅 */
const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7) return `${diff}일 전`;

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const formatScheduledDate = (date: Date): string => {
  const now = new Date();
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  if (diff < 7) return `${diff}일 후`;

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

export const RecentCounselingList: React.FC<RecentCounselingListProps> = ({
  title,
  records,
  type,
  onRecordClick,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {type === 'recent' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Calendar className="w-5 h-5 text-primary-600" />
          )}
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        <span className="text-sm text-gray-500">{records.length}건</span>
      </div>

      {/* 목록 */}
      <div className="divide-y divide-gray-100">
        {records.map((record) => (
          <button
            key={record.id}
            onClick={() => onRecordClick(record)}
            className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
          >
            {/* 학생 정보 */}
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-500" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">{record.studentName}</span>
                <span className="text-sm text-gray-500">{record.className}</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {COUNSELING_TYPE_LABELS[record.type]}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {type === 'recent'
                    ? formatDate(record.scheduledAt)
                    : formatScheduledDate(record.scheduledAt)
                  }
                  {' · '}
                  {formatTime(record.scheduledAt)}
                </span>
                <span className="px-1.5 py-0.5 bg-primary-50 text-primary-700 text-xs rounded">
                  {COUNSELING_AREA_LABELS[record.area]}
                </span>
              </div>
              {record.reason && (
                <p className="text-sm text-gray-600 mt-1 truncate">{record.reason}</p>
              )}
            </div>

            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Empty State */}
      {records.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">
            {type === 'recent' ? '최근 상담 기록이 없습니다.' : '예정된 상담이 없습니다.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentCounselingList;
