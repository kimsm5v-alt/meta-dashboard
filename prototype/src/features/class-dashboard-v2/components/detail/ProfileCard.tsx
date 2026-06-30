import type { ClassProfileItem } from '../../hooks/useClassProfile';
import { DOMAIN_COLORS } from '@/shared/data/lpaProfiles';

// ============================================================
// 스타일 상수
// ============================================================

export const ACCENT_STYLES = {
  emerald: {
    card: 'bg-emerald-50/50 border-emerald-200',
    rank: 'text-emerald-500',
    score: 'text-emerald-600',
  },
  red: {
    card: 'bg-red-50/50 border-red-200',
    rank: 'text-red-500',
    score: 'text-red-600',
  },
} as const;

// ============================================================
// Props
// ============================================================

export interface ProfileCardProps {
  item: ClassProfileItem;
  idx: number;
  accent: 'emerald' | 'red';
  prevItems?: ClassProfileItem[];
}

// ============================================================
// 컴포넌트
// ============================================================

export const ProfileCard: React.FC<ProfileCardProps> = ({ item, idx, accent, prevItems }) => {
  const s = ACCENT_STYLES[accent];
  const prevMap: Record<string, number> = {};
  if (prevItems) {
    for (const p of prevItems) {
      prevMap[p.factorName] = p.avgT;
    }
  }
  const prevT = prevMap[item.factorName];
  const hasPrev = prevT != null;
  const delta = hasPrev ? Math.round(item.avgT - prevT) : 0;

  return (
    <div className={`flex-1 p-3 rounded-lg border ${s.card}`}>
      {/* 대분류 태그 */}
      {item.category && (
        <span
          className="text-[11px] font-semibold mb-1 inline-block"
          style={{ color: DOMAIN_COLORS[item.category] ?? '#9CA3AF' }}
        >
          #{item.category}
        </span>
      )}
      {/* 순위 + 요인명 */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`text-xs font-bold ${s.rank}`}>{idx + 1}</span>
        <p className="text-sm font-semibold text-gray-800">{item.factorName}</p>
      </div>
      {/* T점수 (변화 표시) */}
      {hasPrev ? (
        <p className="text-xs text-gray-500 mb-1">
          T {prevT} → {item.avgT}
          {delta !== 0 && (
            <span
              className={`ml-1 font-semibold ${
                delta > 0
                  ? item.isPositive
                    ? 'text-emerald-600'
                    : 'text-red-500'
                  : item.isPositive
                    ? 'text-red-500'
                    : 'text-emerald-600'
              }`}
            >
              ({delta > 0 ? '+' : ''}
              {delta})
            </span>
          )}
        </p>
      ) : (
        <p className={`text-xs mb-1 ${s.score}`}>T {item.avgT}</p>
      )}
      {/* 요인 정의 (조작적 정의) */}
      {item.definition && (
        <p className="text-xs text-gray-500 leading-relaxed">{item.definition}</p>
      )}
    </div>
  );
};
