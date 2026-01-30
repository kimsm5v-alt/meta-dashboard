import React from 'react';
import { Keyword, getKeywordColor } from '../utils/typeUtils';

interface KeywordBadgesProps {
  keywords: Keyword[];
}

export const KeywordBadges: React.FC<KeywordBadgesProps> = ({ keywords }) => {
  if (keywords.length === 0) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((kw, idx) => {
        const colorClass = getKeywordColor(kw.isPositive, kw.direction);
        return (
          <span key={idx} className={`text-xs font-medium ${colorClass}`}>
            {kw.name}
            {idx < keywords.length - 1 && ','}
          </span>
        );
      })}
    </div>
  );
};
