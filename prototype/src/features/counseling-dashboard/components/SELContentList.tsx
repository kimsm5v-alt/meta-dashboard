/**
 * 코칭 - 반 전체 - SEL 콘텐츠 추천
 *
 * 반 특성에 맞는 사회정서학습 콘텐츠 목록
 */

import { BookOpen, Clock, Tag, ChevronRight } from 'lucide-react';
import type { SELContent } from '../types';
import { SEL_CATEGORY_LABELS } from '../types';

interface SELContentListProps {
  contents: SELContent[];
  onContentClick?: (contentId: string) => void;
}

/** 카테고리별 색상 */
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'self-awareness': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'self-management': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'social-awareness': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'relationship': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'decision-making': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export const SELContentList: React.FC<SELContentListProps> = ({
  contents,
  onContentClick,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <h3 className="text-base font-semibold text-gray-900">SEL 콘텐츠 추천</h3>
        </div>
        <span className="text-sm text-gray-500">{contents.length}개 콘텐츠</span>
      </div>

      <div className="space-y-3">
        {contents.map((content) => {
          const categoryColor = CATEGORY_COLORS[content.category] || CATEGORY_COLORS['self-awareness'];

          return (
            <button
              key={content.id}
              onClick={() => onContentClick?.(content.id)}
              className={`w-full p-4 rounded-xl border ${categoryColor.border} hover:shadow-md transition-all text-left`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${categoryColor.bg} ${categoryColor.text} mb-2`}>
                    {SEL_CATEGORY_LABELS[content.category]}
                  </span>
                  <h4 className="text-sm font-medium text-gray-900">{content.title}</h4>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
              </div>

              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{content.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{content.duration}분</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <div className="flex gap-1">
                    {content.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SELContentList;
