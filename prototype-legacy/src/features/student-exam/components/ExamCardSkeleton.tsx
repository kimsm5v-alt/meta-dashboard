/**
 * 검사 카드 스켈레톤 (로딩 상태)
 */

import { Card } from '@/shared/components';

export const ExamCardSkeleton: React.FC = () => {
  return (
    <Card>
      <div className="animate-pulse flex items-start gap-4">
        {/* 아이콘 스켈레톤 */}
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />

        {/* 내용 스켈레톤 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
          <div className="h-10 w-full bg-gray-200 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};
