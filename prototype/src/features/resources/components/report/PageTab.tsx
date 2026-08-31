/**
 * 페이지별 보기 (REPORT_SPEC_v2 화면3).
 * 좌측 페이지 목록 + 우측 성격/유형별 본문. 참여 0이면 빈 상태.
 */
import { Clock } from 'lucide-react';
import { participantCount } from '../../utils/aggregation';
import type { Report } from '../../types';
import { PageList } from './PageList';
import { PageContent } from './PageContent';

export const PageTab = ({ report }: { report: Report }) => {
  if (participantCount(report) === 0) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <Clock className="mx-auto h-8 w-8 text-gray-300" />
        <div className="mt-2 text-sm font-medium text-gray-500">아직 제출된 응답이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
      <PageList report={report} />
      <PageContent report={report} />
    </div>
  );
};
