/**
 * 전략 카드 컴포넌트
 *
 * - 헤더 배경 = 대분류 색상의 연한 톤
 * - 도넛 게이지 + 고정 문구 + description
 * - description은 백엔드 값 그대로 렌더링 (줄바꿈 포함 가능)
 */

import { DonutGauge } from './DonutGauge';
import { DOMAIN_INFO } from './constants/strategy';
import type { DomainKey, DomainResult } from './types';

interface StrategyCardProps {
  /** 대분류 키 */
  domainKey: DomainKey;
  /** 대분류 결과 데이터 */
  result: DomainResult;
}

export const StrategyCard: React.FC<StrategyCardProps> = ({
  domainKey,
  result,
}) => {
  const domainInfo = DOMAIN_INFO[domainKey];
  const { t, percentile, description } = result;

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden h-full">
      {/* 헤더 */}
      <div
        className="px-4 py-3 text-center"
        style={{ backgroundColor: domainInfo.lightColor }}
      >
        <h4
          className="text-sm font-bold"
          style={{ color: domainInfo.color }}
        >
          {domainInfo.label}
        </h4>
      </div>

      {/* 본문 */}
      <div className="flex-1 p-4 flex flex-col items-center">
        {/* 도넛 게이지 */}
        <div className="mb-4">
          <DonutGauge t={t} percentile={percentile} size={100} strokeWidth={10} />
        </div>

        {/* 고정 문구 (대분류 성격) */}
        <p
          className="text-xs font-semibold text-gray-800 text-center mb-3"
          style={{ whiteSpace: 'pre-line' }}
        >
          {domainInfo.characterDescription}
        </p>

        {/* description (백엔드 제공) */}
        {description && (
          <p
            className="text-xs text-gray-600 text-center leading-relaxed"
            style={{ whiteSpace: 'pre-line' }}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default StrategyCard;
