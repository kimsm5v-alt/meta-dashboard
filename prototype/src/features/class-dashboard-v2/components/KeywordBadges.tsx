import React from 'react';
import type { Keyword } from '../utils/typeUtils';

interface KeywordBadgesProps {
  keywords: Keyword[];
}

/** 키워드가 강점인지 약점인지 판별 */
const isStrength = (kw: Keyword): boolean =>
  (kw.isPositive && kw.direction === 'positive') ||
  (!kw.isPositive && kw.direction === 'negative');

export const KeywordBadges: React.FC<KeywordBadgesProps> = ({ keywords }) => {
  if (keywords.length === 0) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {keywords.map((kw, idx) => {
        const strength = isStrength(kw);
        return (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              strength
                ? 'bg-blue-50 text-blue-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                strength ? 'bg-blue-400' : 'bg-rose-400'
              }`}
            />
            {kw.name}
          </span>
        );
      })}
    </div>
  );
};
