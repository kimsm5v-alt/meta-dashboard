import styled from '@emotion/styled';
import { getBarPercent, REF_LINE_POS, PREV_COLOR } from '@shared/utils/chartUtils';

const BarContainer = styled.div<{ $height: 'sm' | 'md' }>`
  flex: 1;
  position: relative;
  height: ${({ $height }) => ($height === 'sm' ? '1.25rem' : '1.75rem')};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
`;

const RefLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  border-left: 1px dashed ${({ theme }) => theme.colors.gray[400]};
  z-index: 10;
`;

const Bar = styled.div<{ $radius: string }>`
  height: 100%;
  transition: all 0.3s ease;
  border-radius: ${({ $radius }) => $radius};
`;

const AbsoluteBar = styled.div<{ $radius: string }>`
  position: absolute;
  top: 0;
  height: 100%;
  transition: all 0.3s ease;
  border-radius: ${({ $radius }) => $radius};
`;

interface FactorBarProps {
  score: number;
  color: string;
  height?: 'sm' | 'md';
  /** 비교 모드: 1차 점수. 전달 시 1차=진한회색, 2차=색상 이중 막대 렌더링 */
  prevScore?: number;
}

export const FactorBar: React.FC<FactorBarProps> = ({ score, color, height = 'md', prevScore }) => {
  const radius = height === 'sm' ? '0 3px 3px 0' : '0 4px 4px 0';
  const isCompare = prevScore != null;

  if (!isCompare) {
    // 기본 단일 막대
    return (
      <BarContainer $height={height}>
        <RefLine style={{ left: `${REF_LINE_POS}%` }} />
        <Bar
          $radius={radius}
          style={{
            width: `${getBarPercent(score)}%`,
            backgroundColor: color,
          }}
        />
      </BarContainer>
    );
  }

  // 비교 모드 이중 막대
  const cur = score; // 2차
  const prev = prevScore; // 1차
  const curPct = getBarPercent(cur);
  const prevPct = getBarPercent(prev);

  if (prev > cur) {
    // CASE 1: 1차 > 2차 → [0..2차]=색상, [2차..1차]=진한회색
    return (
      <BarContainer $height={height}>
        <RefLine style={{ left: `${REF_LINE_POS}%` }} />
        {/* 2차 영역 (색상) */}
        <AbsoluteBar
          $radius='0'
          style={{
            left: 0,
            width: `${curPct}%`,
            backgroundColor: color,
          }}
        />
        {/* 1차 초과분 (진한회색) */}
        <AbsoluteBar
          $radius={radius}
          style={{
            left: `${curPct}%`,
            width: `${prevPct - curPct}%`,
            backgroundColor: PREV_COLOR,
          }}
        />
      </BarContainer>
    );
  }

  if (prev < cur) {
    // CASE 2: 1차 < 2차 → [0..1차]=진한회색, [1차..2차]=색상
    return (
      <BarContainer $height={height}>
        <RefLine style={{ left: `${REF_LINE_POS}%` }} />
        {/* 1차 영역 (진한회색) */}
        <AbsoluteBar
          $radius='0'
          style={{
            left: 0,
            width: `${prevPct}%`,
            backgroundColor: PREV_COLOR,
          }}
        />
        {/* 2차 증가분 (색상) */}
        <AbsoluteBar
          $radius={radius}
          style={{
            left: `${prevPct}%`,
            width: `${curPct - prevPct}%`,
            backgroundColor: color,
          }}
        />
      </BarContainer>
    );
  }

  // CASE 3: 1차 = 2차 → 그냥 색상
  return (
    <BarContainer $height={height}>
      <RefLine style={{ left: `${REF_LINE_POS}%` }} />
      <Bar
        $radius={radius}
        style={{
          width: `${curPct}%`,
          backgroundColor: color,
        }}
      />
    </BarContainer>
  );
};
