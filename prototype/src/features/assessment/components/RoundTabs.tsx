/**
 * 검사관리 (반 전체) - 회차 탭
 *
 * 1차/2차 탭 전환, 회차별 상태
 */

import type { ExamStatus } from '../types';
import { EXAM_STATUS_LABELS, EXAM_STATUS_STYLES } from '../types';

interface RoundInfo {
  round: 1 | 2;
  status: ExamStatus;
  submittedCount: number;
  totalCount: number;
}

interface RoundTabsProps {
  rounds: RoundInfo[];
  currentRound: 1 | 2;
  onRoundChange: (round: 1 | 2) => void;
}

export const RoundTabs: React.FC<RoundTabsProps> = ({
  rounds,
  currentRound,
  onRoundChange,
}) => {
  return (
    <div className="flex gap-2">
      {rounds.map((roundInfo) => {
        const isActive = roundInfo.round === currentRound;
        const statusStyle = EXAM_STATUS_STYLES[roundInfo.status];
        const rate = roundInfo.totalCount > 0
          ? Math.round((roundInfo.submittedCount / roundInfo.totalCount) * 100)
          : 0;

        return (
          <button
            key={roundInfo.round}
            onClick={() => onRoundChange(roundInfo.round)}
            className={`
              relative px-5 py-3 rounded-xl border-2 transition-all min-w-[140px]
              ${isActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            {/* 회차 라벨 */}
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-semibold ${isActive ? 'text-primary-700' : 'text-gray-700'}`}>
                {roundInfo.round}차 검사
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                {EXAM_STATUS_LABELS[roundInfo.status]}
              </span>
            </div>

            {/* 진행률 */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    roundInfo.status === 'completed' ? 'bg-green-500' :
                    roundInfo.status === 'in_progress' ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                  style={{ width: `${rate}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                {rate}%
              </span>
            </div>

            {/* 활성 표시 */}
            {isActive && (
              <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default RoundTabs;
