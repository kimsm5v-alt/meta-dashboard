import styled from '@emotion/styled';
import { getBarPercent, PREV_COLOR } from '@shared/utils/chartUtils';
import { lightenColor } from '@shared/utils/colorUtils';
import { T50_PERCENT } from '@features/student-dashboard/ui/four-step/constants';

const BarContainer = styled.div<{ $height: string }>`
  flex: 1;
  height: ${({ $height }) => $height};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  position: relative;
`;

const RefLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  border-left: 1px dashed ${({ theme }) => theme.colors.gray[600]};
  z-index: 1;
`;

const BarSection = styled.div<{ $radius?: string }>`
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.3s ease;
  border-radius: ${({ $radius }) => $radius || '0'};
`;

const SingleBar = styled.div<{ $radius?: string }>`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  transition: all 0.3s ease;
  border-radius: ${({ $radius }) => $radius || '0'};
`;

const LabelWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  z-index: 20;
  pointer-events: none;
`;

const Label = styled.span<{ $size: string }>`
  font-size: ${({ $size }) => $size};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: #ffffff;
  white-space: nowrap;
`;

const LeafContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LeafLabel = styled.div`
  width: 10rem;
  padding-left: 1.5rem;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.gray[500]};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const LeafPrefix = styled.span`
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const LeafScore = styled.div`
  width: 3rem;
  text-align: right;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

// ============================================================
// DualBar Props
// ============================================================

export interface DualBarProps {
  score: number;
  prevScore?: number;
  color: string;
  height?: string;
  radius?: string;
  showLabel?: boolean;
  labelSize?: string;
}

// ============================================================
// DualBar (이중 막대 렌더링 유틸)
// ============================================================

export function DualBar({
  score,
  prevScore,
  color,
  height = 'h-7',
  radius = '0 4px 4px 0',
  showLabel = true,
  labelSize = 'text-xs',
}: DualBarProps) {
  const curPct = Math.max(0, Math.min(getBarPercent(score), 100));
  const hasPrev = prevScore != null;
  const prevPct = hasPrev ? Math.max(0, Math.min(getBarPercent(prevScore), 100)) : 0;

  return (
    <BarContainer $height={height}>
      {/* T=50 기준선 */}
      <RefLine style={{ left: `${T50_PERCENT}%` }} />

      {hasPrev && prevScore !== score ? (
        prevPct > curPct ? (
          <>
            {/* 1차 > 2차: [0..2차]=색상, [2차..1차]=회색 */}
            <BarSection style={{ left: 0, width: `${curPct}%`, backgroundColor: color }} />
            <BarSection
              $radius={radius}
              style={{
                left: `${curPct}%`,
                width: `${prevPct - curPct}%`,
                backgroundColor: PREV_COLOR,
              }}
            />
            {showLabel && curPct > 20 && (
              <LabelWrapper style={{ width: `${curPct}%` }}>
                <Label $size={labelSize}>T={score.toFixed(0)}</Label>
              </LabelWrapper>
            )}
          </>
        ) : (
          <>
            {/* 1차 < 2차: [0..1차]=회색, [1차..2차]=색상 */}
            <BarSection style={{ left: 0, width: `${prevPct}%`, backgroundColor: PREV_COLOR }} />
            <BarSection
              $radius={radius}
              style={{
                left: `${prevPct}%`,
                width: `${curPct - prevPct}%`,
                backgroundColor: color,
              }}
            />
            {showLabel && curPct > 20 && (
              <LabelWrapper style={{ width: `${curPct}%` }}>
                <Label $size={labelSize}>T={score.toFixed(0)}</Label>
              </LabelWrapper>
            )}
          </>
        )
      ) : (
        /* 단일 막대 (1차 없거나 동일) */
        <SingleBar $radius={radius} style={{ width: `${curPct}%`, backgroundColor: color }}>
          {showLabel && curPct > 20 && <Label $size={labelSize}>T={score.toFixed(0)}</Label>}
        </SingleBar>
      )}
    </BarContainer>
  );
}

// ============================================================
// LeafFactorItem Props
// ============================================================

export interface LeafFactorItemProps {
  label: string;
  score: number;
  prevScore?: number;
  color: string;
}

// ============================================================
// LeafFactorItem (3depth 소분류 단일 요인)
// ============================================================

export function LeafFactorItem({ label, score, prevScore, color }: LeafFactorItemProps) {
  return (
    <LeafContainer>
      <LeafLabel>
        <LeafPrefix>└</LeafPrefix>
        {label}
      </LeafLabel>
      <DualBar
        score={score}
        prevScore={prevScore}
        color={lightenColor(color)}
        height='h-5'
        radius='0 3px 3px 0'
        showLabel={false}
        labelSize='text-[10px]'
      />
      <LeafScore>{score.toFixed(0)}</LeafScore>
    </LeafContainer>
  );
}
