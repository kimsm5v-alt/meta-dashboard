/**
 * 학습전략검사 결과 리포트 컴포넌트
 */

// 메인 컴포넌트
export { StrategyReport } from './StrategyReport';
export { StrategyRadarChart } from './StrategyRadarChart';
export { StrategyCard } from './StrategyCard';
export { DonutGauge } from './DonutGauge';

// 유틸리티
export { getLevel, LEVEL_BANDS } from './utils/level';

// 상수
export {
  DOMAIN_INFO,
  SUBSCALE_INFO,
  LEVEL_COLORS,
  RING_SEGMENTS,
  RADAR_CONFIG,
} from './constants/strategy';

// 매퍼
export { mapApiResponseToReportData } from './mappers/apiMapper';

// 타입
export type {
  Score,
  DomainResult,
  ReportData,
  LevelType,
  DomainKey,
  SubscaleKey,
} from './types';
