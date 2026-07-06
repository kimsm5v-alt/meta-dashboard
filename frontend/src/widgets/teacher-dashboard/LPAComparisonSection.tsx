import { useState } from 'react';
import styled from '@emotion/styled';
import { Info, ChevronRight } from 'lucide-react';
import { Card } from '@shared/components';
import { TYPE_COLORS } from '@shared/data/lpaProfiles';
import {
  LPA_TOOLTIP_LINES,
  LPA_TOOLTIP_TITLE,
  getLpaTypeDescriptions,
} from '@shared/data/lpaTooltipContent';
import type { Class } from '@shared/types';

// ============================================================
// LPA 유형 순서
// ============================================================

const LPA_TYPES_ELEMENTARY = ['자원소진형', '안전 균형형', '몰입자원 풍부형'];
const LPA_TYPES_MIDDLE = ['냉소적 무기력형', '정서조절 취약형', '자기주도 몰입형'];

// ============================================================
// Styled Components
// ============================================================

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
`;

const HeaderLeft = styled.div``;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const InfoWrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const TooltipBox = styled.div<{ $visible: boolean }>`
  position: absolute;
  left: 0;
  bottom: 100%;
  margin-bottom: 0.5rem;
  width: 20rem;
  padding: 0.75rem;
  background: #111827;
  color: white;
  font-size: 0.75rem;
  border-radius: 0.5rem;
  z-index: 10;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  transition:
    opacity 0.15s,
    visibility 0.15s;
`;

const TooltipTitle = styled.p`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #facc15;
`;

const TooltipList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const TooltipItem = styled.li`
  color: #d1d5db;
  line-height: 1.5;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: help;
`;

const LegendDot = styled.span<{ $color: string }>`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $color }) => $color};
`;

const LegendLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const TypeTooltip = styled.div`
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  width: 18rem;
  padding: 0.75rem;
  background: #111827;
  color: white;
  font-size: 0.75rem;
  border-radius: 0.5rem;
  z-index: 20;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2);
  transition:
    opacity 0.15s,
    visibility 0.15s;

  ${LegendItem}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

const TypeTooltipName = styled.p`
  font-weight: 700;
  color: #facc15;
  margin-bottom: 0.25rem;
`;

const TypeTooltipText = styled.p`
  color: #d1d5db;
  line-height: 1.5;
`;

const RowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

// Row components
const RowWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ClassNameBtn = styled.button`
  width: 6.5rem;
  flex-shrink: 0;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover span:first-of-type {
    color: #4f46e5;
  }
`;

const ClassNameText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  transition: color 0.15s;
`;

const StudentCount = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-left: 0.25rem;
`;

const RoundGroup = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`;

const RoundLabel = styled.span`
  font-size: 0.75rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
  width: 2rem;
  flex-shrink: 0;
`;

const EmptyBar = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const TypeBarRow = styled.div`
  flex: 1;
  display: flex;
  height: 2rem;
  border-radius: 0.5rem;
`;

const TypeSegment = styled.div<{ $pct: number; $color: string }>`
  position: relative;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: white;
  font-weight: 600;
  cursor: help;

  &:first-of-type {
    border-top-left-radius: 0.5rem;
    border-bottom-left-radius: 0.5rem;
  }

  &:last-of-type {
    border-top-right-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
  }
`;

const SegmentTooltip = styled.div`
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  width: 18rem;
  padding: 0.75rem;
  background: #111827;
  color: white;
  font-size: 0.75rem;
  border-radius: 0.5rem;
  z-index: 40;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.2);
  transition: opacity 0.15s, visibility 0.15s;

  ${TypeSegment}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

const SegmentTooltipMeta = styled.p`
  color: #f3f4f6;
  margin-bottom: 0.5rem;
`;

const DetailBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: #4f46e5;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.md};
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    color: #4338ca;
    background: #eef2ff;
  }
`;

// ============================================================
// Row Component
// ============================================================

interface LPAComparisonRowProps {
  cls: Class;
  typeOrder: string[];
  typeDescriptions: Record<string, string>;
  onGoToClass: (classId: string) => void;
}

const LPAComparisonRow = ({
  cls,
  typeOrder,
  typeDescriptions,
  onGoToClass,
}: LPAComparisonRowProps) => {
  const typeDistribution = cls.stats?.typeDistribution;
  const round1Completed = cls.stats?.round1Completed;
  const round2Completed = cls.stats?.round2Completed;

  const renderBar = (sessionNo: 1 | 2) => {
    const isCompleted = sessionNo === 1 ? round1Completed : round2Completed;

    if (!isCompleted || !typeDistribution) {
      return <EmptyBar>{sessionNo}차 검사 미실시</EmptyBar>;
    }

    const total = Object.values(typeDistribution).reduce((sum, d) => sum + d.count, 0);
    if (total === 0) {
      return <EmptyBar>데이터 없음</EmptyBar>;
    }

    return (
      <TypeBarRow>
        {typeOrder.map((type) => {
          const data = typeDistribution[type];
          if (!data || data.count === 0) return null;
          const pct = Math.round((data.count / total) * 100);
          const color = TYPE_COLORS[type] || '#9CA3AF';
          return (
            <TypeSegment key={type} $pct={pct} $color={color}>
              {pct > 12 && `${data.count}명`}
              <SegmentTooltip>
                <TypeTooltipName>{type}</TypeTooltipName>
                <SegmentTooltipMeta>
                  {data.count}명 · {pct}%
                </SegmentTooltipMeta>
                <TypeTooltipText>{typeDescriptions[type]}</TypeTooltipText>
              </SegmentTooltip>
            </TypeSegment>
          );
        })}
      </TypeBarRow>
    );
  };

  return (
    <RowWrapper>
      <ClassNameBtn onClick={() => onGoToClass(cls.id)}>
        <ClassNameText>
          {cls.grade}학년 {cls.classNumber}반
        </ClassNameText>
        <StudentCount>({cls.stats?.totalStudents || 0}명)</StudentCount>
      </ClassNameBtn>

      <RoundGroup>
        <RoundLabel>1차</RoundLabel>
        {renderBar(1)}
      </RoundGroup>

      <RoundGroup>
        <RoundLabel>2차</RoundLabel>
        {renderBar(2)}
      </RoundGroup>

      <DetailBtn onClick={() => onGoToClass(cls.id)}>
        상세
        <ChevronRight size={16} />
      </DetailBtn>
    </RowWrapper>
  );
};

// ============================================================
// Main Component
// ============================================================

interface LPAComparisonSectionProps {
  classes: Class[];
  onGoToClass: (classId: string) => void;
}

export const LPAComparisonSection = ({ classes, onGoToClass }: LPAComparisonSectionProps) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  if (classes.length === 0) return null;

  // 고등학교는 LPA 유형 분석을 제공하지 않음
  const isHighSchool = classes[0].schoolLevel === '고등';
  if (isHighSchool) return null;

  const isMiddleSchool = classes[0].schoolLevel === '중등';
  const typeOrder = isMiddleSchool ? LPA_TYPES_MIDDLE : LPA_TYPES_ELEMENTARY;
  const typeDescriptions = getLpaTypeDescriptions(classes[0].schoolLevel);

  return (
    <Card>
      <Header>
        <HeaderLeft>
          <TitleRow>
            <Title>학생 유형 분포 비교</Title>
            <InfoWrapper
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
            >
              <Info size={16} color='#9CA3AF' style={{ cursor: 'help' }} />
              <TooltipBox $visible={tooltipVisible}>
                <TooltipTitle>{LPA_TOOLTIP_TITLE}</TooltipTitle>
                <TooltipList>
                  {LPA_TOOLTIP_LINES.map((line, idx) => (
                    <TooltipItem key={idx}>{line}</TooltipItem>
                  ))}
                </TooltipList>
              </TooltipBox>
            </InfoWrapper>
          </TitleRow>
          <Subtitle>
            1차·2차 검사 결과를 나란히 비교합니다. 반 이름을 클릭하면 반 상세 분석으로 이동합니다.
          </Subtitle>
        </HeaderLeft>

        <Legend>
          {typeOrder.map((type) => (
            <LegendItem key={type}>
              <LegendDot $color={TYPE_COLORS[type] || '#9CA3AF'} />
              <LegendLabel>{type}</LegendLabel>
              <TypeTooltip>
                <TypeTooltipName>{type}</TypeTooltipName>
                <TypeTooltipText>{typeDescriptions[type]}</TypeTooltipText>
              </TypeTooltip>
            </LegendItem>
          ))}
        </Legend>
      </Header>

      <RowList>
        {classes
          .filter((cls) => (cls.stats?.assessedStudents ?? 0) > 0)
          .map((cls) => (
            <LPAComparisonRow
              key={cls.id}
              cls={cls}
              typeOrder={typeOrder}
              typeDescriptions={typeDescriptions}
              onGoToClass={onGoToClass}
            />
          ))}
      </RowList>
    </Card>
  );
};
