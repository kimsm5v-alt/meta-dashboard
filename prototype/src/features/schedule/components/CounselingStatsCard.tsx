/**
 * 학생 상담 - 반 전체 - 상담 통계
 *
 * 상담 빈도, 유형별 분포
 */

import { BarChart3, Clock } from 'lucide-react';
import type { CounselingStats } from '../types';
import { COUNSELING_TYPE_LABELS, COUNSELING_AREA_LABELS } from '../types';

interface CounselingStatsCardProps {
  stats: CounselingStats;
}

/** 유형별 색상 */
const TYPE_COLORS: Record<string, string> = {
  regular: '#6366F1',
  urgent: '#EF4444',
  'follow-up': '#10B981',
  initial: '#F59E0B',
};

/** 영역별 색상 */
const AREA_COLORS: Record<string, string> = {
  academic: '#3B82F6',
  career: '#8B5CF6',
  peer: '#10B981',
  family: '#F59E0B',
  emotion: '#EC4899',
  behavior: '#EF4444',
  health: '#06B6D4',
  other: '#6B7280',
};

export const CounselingStatsCard: React.FC<CounselingStatsCardProps> = ({ stats }) => {
  // 유형별 데이터 정렬 (내림차순)
  const typeData = Object.entries(stats.byType)
    .map(([type, count]) => ({
      type,
      label: COUNSELING_TYPE_LABELS[type as keyof typeof COUNSELING_TYPE_LABELS],
      count,
      color: TYPE_COLORS[type],
    }))
    .sort((a, b) => b.count - a.count);

  // 영역별 데이터 정렬 (내림차순, 0 제외)
  const areaData = Object.entries(stats.byArea)
    .filter(([, count]) => count > 0)
    .map(([area, count]) => ({
      area,
      label: COUNSELING_AREA_LABELS[area as keyof typeof COUNSELING_AREA_LABELS],
      count,
      color: AREA_COLORS[area],
    }))
    .sort((a, b) => b.count - a.count);

  const maxTypeCount = Math.max(...typeData.map((d) => d.count), 1);
  const maxAreaCount = Math.max(...areaData.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-primary-600" />
        <h3 className="text-base font-semibold text-gray-900">상담 통계</h3>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-500 mb-1">전체 상담</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalCount}<span className="text-sm font-medium text-gray-500 ml-1">건</span>
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-500 mb-1">평균 상담 시간</p>
          <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
            <Clock className="w-5 h-5 text-gray-400" />
            {stats.avgDuration}<span className="text-sm font-medium text-gray-500 ml-1">분</span>
          </p>
        </div>
      </div>

      {/* 유형별 분포 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">유형별 분포</h4>
        <div className="space-y-2">
          {typeData.map((item) => (
            <div key={item.type} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20">{item.label}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(item.count / maxTypeCount) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 w-8 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 영역별 분포 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">영역별 분포</h4>
        <div className="space-y-2">
          {areaData.map((item) => (
            <div key={item.area} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-20">{item.label}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(item.count / maxAreaCount) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 w-8 text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CounselingStatsCard;
