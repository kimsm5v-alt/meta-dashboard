/**
 * 발표자 모니터링 사이드 패널 — 팝업이 차단됐을 때의 폴백.
 * 본문은 MonitorContent 가 담당하고 여기서는 사이드 크롬만 씌운다.
 */
import { MonitorContent } from './MonitorContent';

export const MonitorPanel = ({
  className,
  classSlide,
  notes,
  onNotesChange,
}: {
  className: string;
  classSlide: number;
  notes: string;
  onNotesChange?: (v: string) => void;
}) => (
  <div className="flex w-72 flex-none flex-col gap-3 border-l border-gray-800 bg-gray-900 p-4 text-gray-100">
    <MonitorContent className={className} classSlide={classSlide} notes={notes} onNotesChange={onNotesChange} />
  </div>
);
