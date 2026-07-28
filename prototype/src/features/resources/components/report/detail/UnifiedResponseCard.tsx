/**
 * 통일 응답 카드 (R8) — (학생, 페이지) 응답 1건을 성격 무관 고정 4-슬롯으로.
 * [캡처 썸네일] · [주라벨 + 성격배지 + 응답값] · [정오 슬롯] · [활동보기 슬롯]
 * 해당 없는 슬롯은 비활성(회색)으로 자리 유지 → 개념/문항/활동 시각 통일.
 */
import type { ReactNode } from 'react';
import { Image as ImageIcon, Play } from 'lucide-react';
import type { Nature } from '../../../types';
import { NatureBadge, ErrataBadge } from '../badges';
import type { CellInfo } from './shared';

interface Props {
  primary: ReactNode; // 주라벨 (학생명 or 페이지 번호+제목)
  nature: Nature;
  cell: CellInfo;
  onReplay?: () => void;
  highlight?: boolean;
  /** 성격 배지 표시 (페이지별 보기는 성격이 고정이라 false) */
  showNature?: boolean;
}

export const UnifiedResponseCard = ({ primary, nature, cell, onReplay, highlight, showNature = true }: Props) => {
  // 제출하면 캡처가 저장되므로 유형 무관 '보기'(캡처) 활성
  const canView = cell.submitted;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
        highlight ? 'border-primary-300 bg-primary-50/40' : 'border-gray-100'
      }`}
    >
      {/* 캡처 썸네일 placeholder */}
      <div
        className={`flex h-10 w-14 flex-none items-center justify-center rounded-md ${
          cell.submitted ? 'bg-gray-200 text-gray-400' : 'bg-gray-50 text-gray-300'
        }`}
      >
        <ImageIcon className="h-4 w-4" />
      </div>

      {/* 주라벨 + 성격 + 응답값 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 truncate text-sm font-semibold text-gray-800">{primary}</span>
          {showNature && <NatureBadge nature={nature} />}
        </div>
        <div className="mt-0.5 truncate text-xs text-gray-500">
          {cell.gradable && cell.submitted ? (
            <>
              내 답 <b className="text-gray-700">{cell.value}</b>
              {cell.correctAnswer && (
                <>
                  {' · '}정답 <b className="text-blue-600">{cell.correctAnswer}</b>
                </>
              )}
            </>
          ) : (
            <span className={cell.submitted ? '' : 'text-gray-400'}>{cell.value}</span>
          )}
        </div>
      </div>

      {/* 정오 슬롯 */}
      <div className="flex-none">
        {cell.gradable && cell.errata != null ? (
          <ErrataBadge errata={cell.errata} />
        ) : (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-50 text-xs font-bold text-gray-300"
            title="정오 대상 아님"
          >
            –
          </span>
        )}
      </div>

      {/* 보기 슬롯 — 제출(캡처 저장) 시 활성 */}
      <div className="flex-none">
        {canView ? (
          <button
            onClick={onReplay}
            className="inline-flex items-center gap-1 rounded border border-gray-200 px-1.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <Play className="h-3 w-3" /> 보기
          </button>
        ) : (
          <button
            disabled
            className="inline-flex cursor-not-allowed items-center gap-1 rounded border border-gray-100 px-1.5 py-1 text-xs font-semibold text-gray-300"
          >
            <Play className="h-3 w-3" /> 보기
          </button>
        )}
      </div>
    </div>
  );
};
