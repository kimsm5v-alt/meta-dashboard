import type { Level } from '@/shared/utils/calculate4StepDiagnosis';
import { COLORS_POSITIVE, COLORS_NEGATIVE } from '@/features/student-dashboard/components/four-step/constants';

// ============================================================
// SubSection Props
// ============================================================

export interface SubSectionProps {
  title: string;
  level: Level;
  isNegativeSection?: boolean;
  children: React.ReactNode;
}

// ============================================================
// SubSection
// ============================================================

export function SubSection({
  title,
  level,
  isNegativeSection = false,
  children,
}: SubSectionProps) {
  const badgeColor = isNegativeSection
    ? COLORS_NEGATIVE[level]
    : COLORS_POSITIVE[level];

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2.5">
        <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}
        >
          {level}
        </span>
        {isNegativeSection && (
          <span className="text-xs text-gray-400">↓ 낮을수록 좋아요</span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
