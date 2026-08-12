/**
 * 응답 격자 — 리포트 상세의 단일 표현 방식.
 *
 * 성격(개념/활동/문항)과 유형을 가리지 않고 (학생, 페이지) 응답 1건을 같은 타일로 그린다.
 * 제출 캡처를 타일 전면에 깔아 두어 '보기'를 누르지 않아도 학생이 무엇을 냈는지 바로 보이고,
 * 타일을 누르면 캡처 뷰어로 들어가 크게 보며 채점한다.
 *
 * 페이지별 보기 → 타일 = 학생 (번호. 이름)
 * 학생별 보기   → 타일 = 페이지 (순번. 제목)
 */
import { Image as ImageIcon, Maximize2, Play } from 'lucide-react';
import { fmtDuration } from '../../../utils/format';
import type { Nature } from '../../../types';
import { NatureBadge, ErrataBadge } from '../badges';
import type { CellInfo, RenderMode } from './shared';

export interface GridItem {
  key: string;
  /** 주라벨 — '3. 김서준' 또는 '4. 갈등 해결 방법 그리기' */
  primary: string;
  nature: Nature;
  mode: RenderMode;
  cell: CellInfo;
  capture?: string;
  /** 우상단 보조 정보 (소요 시간 등) */
  meta?: string;
  /** 성격 배지 표시 — 페이지별 보기는 성격이 고정이라 끈다 */
  showNature?: boolean;
  highlight?: boolean;
  onOpen?: () => void;
}

/** 타일 본문 한 줄 — 유형에 맞는 요약 */
const Summary = ({ cell, mode }: { cell: CellInfo; mode: RenderMode }) => {
  if (!cell.submitted) return <span className="text-gray-400">{cell.value}</span>;

  if (mode === 'media' && cell.mediaSec != null) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-gray-600">
        <Play className="h-3 w-3" />
        {fmtDuration(cell.mediaSec)}
      </span>
    );
  }
  if (cell.correctAnswer) {
    return (
      <>
        내 답 <b className="text-gray-700">{cell.value}</b> · 정답 <b className="text-blue-600">{cell.correctAnswer}</b>
      </>
    );
  }
  if (mode === 'text') return <span className="line-clamp-2 text-gray-600">{cell.value}</span>;
  return <span className="text-gray-500">{cell.value}</span>;
};

/**
 * 정오 슬롯.
 * 자동채점 문항 → 정오 배지 / 교사 수동 채점 활동 → 채점 필요·채점 완료 (실제 O·△·X 는 캡처 뷰어에서)
 */
const Mark = ({ cell }: { cell: CellInfo }) => {
  if (cell.manual)
    return cell.errata != null ? (
      <span className="flex-none rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
        채점 완료
      </span>
    ) : (
      <span className="flex-none rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
        채점 필요
      </span>
    );
  if (cell.errata != null) return <ErrataBadge errata={cell.errata} />;
  return null;
};

interface Props {
  items: GridItem[];
  /** 제출 내용 요약(답안 텍스트·내 답/정답) 표시. 끄면 라벨·성격·채점 상태만 — 내용은 캡처 뷰어에서 */
  showSummary?: boolean;
}

export const ResponseGrid = ({ items, showSummary = true }: Props) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
    {items.map((it) => {
      const clickable = it.cell.submitted;
      return (
        <button
          key={it.key}
          onClick={clickable ? it.onOpen : undefined}
          disabled={!clickable}
          className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-colors ${
            it.highlight ? 'border-primary-400 ring-2 ring-primary-100' : 'border-gray-200'
          } ${clickable ? 'cursor-pointer bg-white hover:border-primary-300' : 'cursor-default bg-gray-50'}`}
        >
          {/* 제출 캡처 */}
          <div className="relative aspect-[16/9] flex-none bg-gray-100">
            {clickable && it.capture ? (
              <>
                <img src={it.capture} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-0 hidden items-center justify-center bg-gray-900/40 group-hover:flex">
                  <Maximize2 className="h-5 w-5 text-white" />
                </span>
              </>
            ) : (
              <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gray-50">
                <ImageIcon className="h-5 w-5 text-gray-300" />
                <span className="text-[11px] font-semibold text-gray-400">미제출</span>
              </span>
            )}
          </div>

          {/* 라벨 + (선택) 요약 */}
          <div className="flex flex-1 flex-col gap-1 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-800">{it.primary}</span>
              {it.meta && <span className="flex-none text-[11px] font-semibold text-gray-400">{it.meta}</span>}
              <Mark cell={it.cell} />
            </div>
            {it.showNature && (
              <div className="flex">
                <NatureBadge nature={it.nature} />
              </div>
            )}
            {showSummary && (
              <div className="min-h-[2rem] text-xs leading-relaxed text-gray-500">
                <Summary cell={it.cell} mode={it.mode} />
              </div>
            )}
          </div>
        </button>
      );
    })}
  </div>
);
