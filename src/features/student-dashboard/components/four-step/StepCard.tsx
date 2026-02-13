import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

// ============================================================
// StepCard Props
// ============================================================

export interface StepCardProps {
  step: number;
  title: string;
  subtitle: React.ReactNode;
  showBarLegend?: boolean;
  isCompare?: boolean;
  children: React.ReactNode;
}

// ============================================================
// StepCard (아코디언)
// ============================================================

export function StepCard({
  step,
  title,
  subtitle,
  showBarLegend = false,
  isCompare = false,
  children,
}: StepCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="px-2.5 py-1 bg-primary-600 text-white rounded-md text-sm font-bold whitespace-nowrap">
          {step}단계
        </span>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <div className="text-sm text-gray-600">{subtitle}</div>
        </div>
        {showBarLegend && isExpanded && (
          <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
            <span>점선: T=50</span>
            {isCompare && (
              <>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-gray-400" /> 1차
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-indigo-400" /> 2차
                </span>
              </>
            )}
          </div>
        )}
        <ChevronRight
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </div>

      {isExpanded && <div className="p-4 bg-white space-y-4">{children}</div>}
    </div>
  );
}
