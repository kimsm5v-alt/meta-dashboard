/**
 * 통합 이력 목록 (상담 + 관찰)
 *
 * 상담 기록과 관찰 메모를 시간순으로 통합하여 표시
 * - 탭 필터: 전체 / 상담 / 관찰
 * - 아이콘으로 유형 구분
 * - 가로 스크롤 레이아웃 (하단 배치 시)
 */

import { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp, MessageSquare, Eye } from 'lucide-react';
import type { CounselingRecord, ObservationRecord, RecordType } from '../types';
import { COUNSELING_TYPE_LABELS, COUNSELING_AREA_LABELS, OBSERVATION_CATEGORY_LABELS } from '../types';

interface UnifiedHistoryListProps {
  counselingRecords: CounselingRecord[];
  observationRecords: ObservationRecord[];
  studentName: string;
}

type FilterType = 'all' | 'counseling' | 'observation';

/** 상담 유형별 색상 */
const COUNSELING_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  regular: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  urgent: { bg: 'bg-red-50', text: 'text-red-700' },
  'follow-up': { bg: 'bg-green-50', text: 'text-green-700' },
  initial: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

export const UnifiedHistoryList: React.FC<UnifiedHistoryListProps> = ({
  counselingRecords,
  observationRecords,
  studentName,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 통합 이력 생성 및 정렬
  const unifiedRecords = useMemo(() => {
    const counselingItems = counselingRecords.map(record => ({
      id: record.id,
      type: 'counseling' as RecordType,
      date: record.scheduledAt,
      record,
    }));

    const observationItems = observationRecords.map(record => ({
      id: record.id,
      type: 'observation' as RecordType,
      date: record.observedAt,
      record,
    }));

    const all = [...counselingItems, ...observationItems];
    // 날짜 내림차순 정렬 (최신순)
    all.sort((a, b) => b.date.getTime() - a.date.getTime());
    return all;
  }, [counselingRecords, observationRecords]);

  // 필터링된 이력
  const filteredRecords = useMemo(() => {
    if (filter === 'all') return unifiedRecords;
    return unifiedRecords.filter(item => item.type === filter);
  }, [unifiedRecords, filter]);

  // 날짜 포맷팅
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // 카운트
  const counselingCount = counselingRecords.length;
  const observationCount = observationRecords.length;
  const totalCount = counselingCount + observationCount;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">상담 & 관찰 이력</h3>

          {/* 탭 필터 - 인라인 */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              전체 ({totalCount})
            </button>
            <button
              onClick={() => setFilter('counseling')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === 'counseling'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              상담 ({counselingCount})
            </button>
            <button
              onClick={() => setFilter('observation')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === 'observation'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              관찰 ({observationCount})
            </button>
          </div>
        </div>
      </div>

      {/* 이력 목록 - 가로 스크롤 그리드 */}
      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredRecords.map((item) => {
            const isExpanded = expandedId === item.id;
            const isCounseling = item.type === 'counseling';
            const record = item.record;

            if (isCounseling) {
              const counseling = record as CounselingRecord;
              const typeColor = COUNSELING_TYPE_COLORS[counseling.type] || COUNSELING_TYPE_COLORS.regular;

              return (
                <div
                  key={item.id}
                  className="border border-gray-100 rounded-lg overflow-hidden bg-white hover:shadow-sm transition-shadow"
                >
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full px-3 py-2.5 text-left"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor.bg} ${typeColor.text}`}>
                          {COUNSELING_TYPE_LABELS[counseling.type]}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(counseling.scheduledAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">
                        {COUNSELING_AREA_LABELS[counseling.area]}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {counseling.duration && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {counseling.duration}분
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {counseling.summary || counseling.reason || '상담 내용 없음'}
                      </p>
                    </div>
                  )}
                </div>
              );
            } else {
              const observation = record as ObservationRecord;

              return (
                <div
                  key={item.id}
                  className="border border-gray-100 rounded-lg overflow-hidden bg-white hover:shadow-sm transition-shadow"
                >
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full px-3 py-2.5 text-left"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-amber-500" />
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                          관찰
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(observation.observedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {observation.title || OBSERVATION_CATEGORY_LABELS[observation.category]}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 py-2.5 bg-amber-50/50 border-t border-gray-100">
                      <p className="text-xs text-amber-700 mb-1">{OBSERVATION_CATEGORY_LABELS[observation.category]}</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {observation.content}
                      </p>
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            {filter === 'all' && '기록된 이력이 없습니다'}
            {filter === 'counseling' && '상담 이력이 없습니다'}
            {filter === 'observation' && '관찰 메모가 없습니다'}
          </p>
        </div>
      )}
    </div>
  );
};

export default UnifiedHistoryList;
