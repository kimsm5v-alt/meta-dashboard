/**
 * 학습전략검사 결과 리포트 메인 컴포넌트
 *
 * - 상단: 레이더 차트
 * - 범례: "T점수(백분위)" - 차트 카드 바깥 아래, 우측 정렬
 * - 하단: 3개 전략 카드 (grid)
 */

import { StrategyRadarChart } from './StrategyRadarChart';
import { StrategyCard } from './StrategyCard';
import type { ReportData, DomainKey } from './types';

interface StrategyReportProps {
  /** 리포트 데이터 */
  data: ReportData;
  /** 차트 크기 (px) */
  chartSize?: number;
}

// 카드 순서
const DOMAIN_ORDER: DomainKey[] = ['motivation', 'cognitive', 'behavioral'];

export const StrategyReport: React.FC<StrategyReportProps> = ({
  data,
  chartSize = 340,
}) => {
  return (
    <div className="w-full">
      {/* 레이더 차트 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-2">
        <StrategyRadarChart
          subscales={data.subscales}
          size={chartSize}
        />
      </div>

      {/* 범례 - 차트 카드 바깥, 우측 정렬 */}
      <div className="flex justify-end mb-4">
        <span className="text-xs text-gray-400">T점수(백분위)</span>
      </div>

      {/* 3개 전략 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DOMAIN_ORDER.map((domainKey) => (
          <StrategyCard
            key={domainKey}
            domainKey={domainKey}
            result={data.domains[domainKey]}
          />
        ))}
      </div>
    </div>
  );
};

export default StrategyReport;
