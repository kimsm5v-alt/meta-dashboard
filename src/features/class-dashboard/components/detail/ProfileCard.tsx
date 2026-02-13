import type { ClassProfileItem } from '../../hooks/useClassProfile';
import { SUB_CATEGORY_SCRIPTS } from '@/shared/data/subCategoryScripts';
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
// 유틸리티
// ============================================================

function getCategoryDisplayName(category: string): string {
  return SUB_CATEGORY_SCRIPTS[category]?.name ?? category;
}

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
      prevMap[p.category] = p.avgT;
    }
  }
  const prevT = prevMap[item.category];
  const hasPrev = prevT != null;
  const delta = hasPrev ? Math.round(item.avgT - prevT) : 0;

  return (
    <div className={`flex-1 p-3 rounded-lg border ${s.card}`}>
      {item.parentCategory && (
        <span
          className="text-[11px] font-semibold mb-1 inline-block"
          style={{ color: DOMAIN_COLORS[item.parentCategory] ?? '#9CA3AF' }}
        >
          #{item.parentCategory}
        </span>
      )}
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`text-xs font-bold ${s.rank}`}>{idx + 1}</span>
        <p className="text-sm font-semibold text-gray-800">
          {getCategoryDisplayName(item.category)}
        </p>
      </div>
      {hasPrev ? (
        <p className="text-xs text-gray-500 mb-1">
          T {prevT} → {item.avgT}
          {delta !== 0 && (
            <span className={`ml-1 font-semibold ${delta > 0 ? (item.isPositive ? 'text-emerald-600' : 'text-red-500') : (item.isPositive ? 'text-red-500' : 'text-emerald-600')}`}>
              ({delta > 0 ? '+' : ''}{delta})
            </span>
          )}
        </p>
      ) : (
        <p className={`text-xs mb-1 ${s.score}`}>T {item.avgT}</p>
      )}
      {item.categoryScript && (
        <p className="text-xs text-gray-500 leading-relaxed">{item.categoryScript}</p>
      )}
    </div>
  );
};
