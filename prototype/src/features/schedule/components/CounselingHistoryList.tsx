/**
 * 학생 상담 - 학생 선택 - 상담 이력
 *
 * 개별 학생의 상담 이력 목록
 */

import { History, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { CounselingRecord } from '../types';
import { COUNSELING_TYPE_LABELS, COUNSELING_AREA_LABELS } from '../types';

interface CounselingHistoryListProps {
  records: CounselingRecord[];
  studentName: string;
}

/** 상담 유형별 색상 */
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  regular: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  urgent: { bg: 'bg-red-50', text: 'text-red-700' },
  'follow-up': { bg: 'bg-green-50', text: 'text-green-700' },
  initial: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

export const CounselingHistoryList: React.FC<CounselingHistoryListProps> = ({
  records,
  studentName,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 날짜 포맷팅
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary-600" />
          <h3 className="text-base font-semibold text-gray-900">상담 이력</h3>
          <span className="text-sm text-gray-500">- {studentName}</span>
        </div>
        <span className="text-sm text-gray-500">총 {records.length}건</span>
      </div>

      {records.length > 0 ? (
        <div className="space-y-3">
          {records.map((record) => {
            const isExpanded = expandedId === record.id;
            const typeColor = TYPE_COLORS[record.type] || TYPE_COLORS.regular;

            return (
              <div
                key={record.id}
                className="border border-gray-100 rounded-xl overflow-hidden"
              >
                {/* 헤더 */}
                <button
                  onClick={() => toggleExpand(record.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
                      {COUNSELING_TYPE_LABELS[record.type]}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {COUNSELING_AREA_LABELS[record.area]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(record.scheduledAt)}
                    </span>
                    {record.duration && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {record.duration}분
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* 상세 내용 */}
                {isExpanded && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {record.summary || record.reason || '상담 내용 없음'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">상담 이력이 없습니다</p>
        </div>
      )}
    </div>
  );
};

export default CounselingHistoryList;
