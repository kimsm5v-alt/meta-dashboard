/**
 * Pill 스타일 세그먼트 탭 - 검사 회차 선택
 *
 * Handoff 기준:
 * - 컨테이너: inline-flex, bg #F0EEF6, radius 14px, padding 6px, gap 6px
 * - 탭: padding 10px 20px, radius 10px
 * - 활성: bg #FFF + shadow 0 1px 4px rgba(20,10,60,.10)
 * - 라벨: 15px/800 #6B46F2 (활성) / 15px/600 #75717F (비활성)
 * - 내부: [회차 라벨] [상태 뱃지] [진행률 %] (진행률은 '시작 전'/'취소됨'이면 숨김)
 */

import type { ExamStatus } from '../types';
import { EXAM_STATUS_LABELS } from '../types';

interface RoundInfo {
  round: 1 | 2;
  status: ExamStatus;
  submittedCount: number;
  totalCount: number;
  canStart?: boolean; // 2차 시작 가능 여부
}

interface SegmentedRoundTabsProps {
  rounds: RoundInfo[];
  currentRound: 1 | 2;
  onRoundChange: (round: 1 | 2) => void;
}

/** 상태별 뱃지 스타일 */
const getStatusBadgeStyle = (status: ExamStatus) => {
  switch (status) {
    case 'not_started':
      return 'bg-[#F0EEF6] text-[#8A8798]'; // 회색
    case 'in_progress':
      return 'bg-[#FFF3DD] text-[#C47B1D]'; // 주황
    case 'completed':
      return 'bg-[#E6F7EE] text-[#12915C]'; // 초록
    case 'cancelled':
      return 'bg-[#FDEAEA] text-[#D6453D]'; // 빨강
    default:
      return 'bg-[#F0EEF6] text-[#8A8798]';
  }
};

/** 진행률 계산 */
const calculateProgress = (submitted: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((submitted / total) * 100);
};

export const SegmentedRoundTabs: React.FC<SegmentedRoundTabsProps> = ({
  rounds,
  currentRound,
  onRoundChange,
}) => {
  return (
    <div
      className="inline-flex gap-2 p-2 rounded-[14px]"
      style={{ backgroundColor: '#F0EEF6' }}
    >
      {rounds.map((roundInfo) => {
        const isActive = roundInfo.round === currentRound;
        const progress = calculateProgress(roundInfo.submittedCount, roundInfo.totalCount);
        const showProgress = roundInfo.status !== 'not_started' && roundInfo.status !== 'cancelled';
        const isDisabled = roundInfo.canStart === false;

        return (
          <button
            key={roundInfo.round}
            onClick={() => !isDisabled && onRoundChange(roundInfo.round)}
            disabled={isDisabled}
            className={`
              px-8 py-4 rounded-[10px] transition-all
              ${isActive
                ? 'bg-white shadow-[0_1px_4px_rgba(20,10,60,0.10)]'
                : 'bg-transparent'
              }
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {/* 회차 라벨 */}
              <span
                className="text-[16px] font-semibold leading-none whitespace-nowrap"
                style={{
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#6B46F2' : '#75717F',
                }}
              >
                {roundInfo.round}차 검사
              </span>

              {/* 상태 뱃지 */}
              <span
                className={`px-2.5 py-1 rounded-full text-[12px] font-medium leading-none ${getStatusBadgeStyle(roundInfo.status)}`}
              >
                {EXAM_STATUS_LABELS[roundInfo.status]}
              </span>

              {/* 진행률 (조건부 표시) */}
              {showProgress && (
                <span
                  className="text-[14px] font-bold leading-none tabular-nums"
                  style={{ color: isActive ? '#6B46F2' : '#8A8798' }}
                >
                  {progress}%
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedRoundTabs;
