import styled from '@emotion/styled';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Class, Student } from '@shared/types';
import { LPA_PROFILE_DATA } from '@shared/data/lpaProfiles';
import {
  TYPE_ORDER_ELEMENTARY,
  TYPE_ORDER_MIDDLE,
  TYPE_COLORS,
  TYPE_GRADIENTS,
  getChangeType,
} from '../lib/typeUtils';

const Container = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  transition: box-shadow 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  }
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const ChartWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const ChartContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const NotAvailableMessage = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

const MessageText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ProgressBarWrapper = styled.div`
  margin-top: 0.5rem;
  width: 100%;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.full};
  height: 0.5rem;
`;

const ProgressBar = styled.div<{ $width: number }>`
  height: 0.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: #fbbf24;
  width: ${({ $width }) => $width}%;
  transition: width 0.3s ease;
`;

const TooltipContainer = styled.div<{ $left: number; $top: number; $borderColor: string }>`
  position: fixed;
  max-width: 24rem;
  width: 100%;
  border: 2px solid ${({ $borderColor }) => $borderColor};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  background: ${({ theme }) => theme.colors.background.paper};
  z-index: 50;
  pointer-events: none;
  left: ${({ $left }) => $left}px;
  top: ${({ $top }) => $top}px;
`;

const TooltipTitle = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: 0.75rem;
`;

const TooltipDescription = styled.div`
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const TooltipText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.5;
`;

const StudentBadgeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

const StudentBadge = styled.span`
  padding: 0.25rem 0.5rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const BottomSection = styled.div`
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 0.75rem;
`;

const FlowDetailBox = styled.div<{ $bg: string; $border: string }>`
  border: 2px solid;
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  background: ${({ $bg }) => $bg};
  border-color: ${({ $border }) => $border};
`;

const FlowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const FlowTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChangeBadge = styled.span<{ $bg: string }>`
  padding: 0.125rem 0.625rem;
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $bg }) => $bg};
`;

const FlowTitle = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const CloseButton = styled.button`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.gray[700]};
  }
`;

const StudentListWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  max-height: 8rem;
  overflow-y: auto;
`;

const StudentButton = styled.button`
  padding: 0.25rem 0.5rem;
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.gray[400]};
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const HelpBox = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 0.75rem;
  text-align: center;
`;

const HelpText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

// ============================================================
// 타입 정의
// ============================================================

interface TypeChangeChartProps {
  classData: Class;
}

interface FlowData {
  from: string;
  to: string;
  count: number;
  students: Student[];
  changeType: 'change' | 'maintain' | 'notAssessed';
}

interface BarSegment {
  type: string;
  count: number;
  percentage: number;
  yStart: number;
  yEnd: number;
}

// ============================================================
// SVG 상수
// ============================================================

const SVG_CONFIG = {
  width: 700,
  height: 460,
  barWidth: 100,
  barGap: 240,
  barX1: 128,
  chartTop: 50,
  chartHeight: 360,
  barX2: 128 + 100 + 240,
};

// ============================================================
// 유틸리티 함수
// ============================================================

const yScale = (percentage: number) =>
  SVG_CONFIG.chartTop + (SVG_CONFIG.chartHeight * percentage) / 100;

const createFlowPath = (from: BarSegment, to: BarSegment): string => {
  const x1 = SVG_CONFIG.barX1 + SVG_CONFIG.barWidth;
  const x2 = SVG_CONFIG.barX2;
  const controlX = (x1 + x2) / 2;

  const y1Start = yScale(from.yStart);
  const y1End = yScale(from.yEnd);
  const y2Start = yScale(to.yStart);
  const y2End = yScale(to.yEnd);

  return `
    M ${x1} ${y1Start}
    C ${controlX} ${y1Start}, ${controlX} ${y2Start}, ${x2} ${y2Start}
    L ${x2} ${y2End}
    C ${controlX} ${y2End}, ${controlX} ${y1End}, ${x1} ${y1End}
    Z
  `;
};

const FLOW_STROKE_COLORS: Record<string, string> = {
  // 초등 유형
  자원소진형: '#EA580C', // orange-600
  안전균형형: '#0D9488', // teal-600
  몰입자원풍부형: '#2563EB', // blue-600
  // 중등 유형
  무기력형: '#EA580C', // orange-600
  정서조절취약형: '#0D9488', // teal-600
  자기주도몰입형: '#2563EB', // blue-600
};

const getFlowStyle = (
  flow: FlowData,
  isSelected: boolean,
): { opacity: number; strokeWidth: number; strokeColor: string; dashArray: string } => {
  const { changeType, to } = flow;

  if (isSelected) {
    return { opacity: 0.9, strokeWidth: 3, strokeColor: '#1F2937', dashArray: 'none' };
  }

  if (changeType === 'change') {
    return {
      opacity: 0.7,
      strokeWidth: 2,
      strokeColor: FLOW_STROKE_COLORS[to] || '#6B7280',
      dashArray: '12,6',
    };
  }
  return { opacity: 0.25, strokeWidth: 0, strokeColor: 'none', dashArray: 'none' };
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export const TypeChangeChart: React.FC<TypeChangeChartProps> = ({ classData }) => {
  const SVG = SVG_CONFIG;
  const navigate = useNavigate();
  const [selectedFlow, setSelectedFlow] = useState<FlowData | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<{
    round: 1 | 2;
    type: string;
    x: number;
    y: number;
  } | null>(null);

  // 학교급에 따라 유형 순서 결정
  const isMiddleSchool = classData.schoolLevel === '중등';
  const TYPE_ORDER = isMiddleSchool ? TYPE_ORDER_MIDDLE : TYPE_ORDER_ELEMENTARY;

  // 분포 계산
  type Distribution = Record<string, Student[]>;

  const createDistribution = (): Distribution => {
    const dist: Distribution = { 미실시: [] };
    TYPE_ORDER.forEach((type) => {
      dist[type] = [];
    });
    return dist;
  };

  const round1Distribution = createDistribution();
  const round2Distribution = createDistribution();
  const round2Available = classData.stats?.examStatus?.round2 === '종료';

  classData.students.forEach((student) => {
    const r1 = student.assessments.find((a) => a.round === 1);
    const r2 = student.assessments.find((a) => a.round === 2);

    const r1Type = r1?.predictedType || '미실시';
    // 키가 없으면 추가 (예: 중등 유형이 초등 분포에 추가되는 경우 방지)
    if (!round1Distribution[r1Type]) {
      round1Distribution[r1Type] = [];
    }
    round1Distribution[r1Type].push(student);

    if (round2Available && r2) {
      const r2Type = r2.predictedType;
      if (!round2Distribution[r2Type]) {
        round2Distribution[r2Type] = [];
      }
      round2Distribution[r2Type].push(student);
    } else {
      round2Distribution['미실시'].push(student);
    }
  });

  // 흐름 데이터 계산
  const flows: FlowData[] = [];
  if (round2Available) {
    TYPE_ORDER.forEach((fromType) => {
      TYPE_ORDER.forEach((toType) => {
        const students = round1Distribution[fromType].filter((student) => {
          const r2 = student.assessments.find((a) => a.round === 2);
          return r2 ? r2.predictedType === toType : toType === '미실시';
        });

        if (students.length > 0) {
          flows.push({
            from: fromType,
            to: toType,
            count: students.length,
            students,
            changeType: getChangeType(fromType, toType),
          });
        }
      });
    });
  }

  // 막대 세그먼트 계산
  const totalStudents = classData.stats?.totalStudents || 0;

  const calculateSegments = (distribution: Record<string, Student[]>): BarSegment[] => {
    const segments: BarSegment[] = [];
    let currentY = 0;

    TYPE_ORDER.forEach((type) => {
      const count = distribution[type].length;
      const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;
      segments.push({ type, count, percentage, yStart: currentY, yEnd: currentY + percentage });
      currentY += percentage;
    });

    return segments;
  };

  const round1Segments = calculateSegments(round1Distribution);
  const round2Segments = calculateSegments(round2Distribution);

  // 렌더링 헬퍼
  const renderBarSegment = (segment: BarSegment, round: 1 | 2, x: number, isEnabled: boolean) => (
    <g key={`r${round}-${segment.type}`}>
      <rect
        x={x}
        y={yScale(segment.yStart)}
        width={SVG.barWidth}
        height={yScale(segment.yEnd) - yScale(segment.yStart)}
        fill={TYPE_COLORS[segment.type]}
        rx={8}
        ry={8}
        filter='url(#shadow)'
        opacity={isEnabled ? 1 : 0.4}
        className={`transition-all duration-300 ${isEnabled ? 'cursor-pointer hover:opacity-90' : ''}`}
        onMouseEnter={(e) => {
          if (isEnabled) {
            setSelectedSegment({ round, type: segment.type, x: e.clientX, y: e.clientY });
          }
        }}
        onClick={(e) => {
          if (isEnabled) {
            setSelectedSegment({ round, type: segment.type, x: e.clientX, y: e.clientY });
          }
        }}
      />
      {/* 광택 효과 */}
      <rect
        x={x}
        y={yScale(segment.yStart)}
        width={SVG.barWidth}
        height={yScale(segment.yEnd) - yScale(segment.yStart)}
        fill='url(#shine)'
        rx={8}
        ry={8}
        opacity={isEnabled ? 0.3 : 0.15}
        pointerEvents='none'
      />
      {segment.count > 0 && (
        <>
          <text
            x={x + SVG.barWidth / 2}
            y={yScale((segment.yStart + segment.yEnd) / 2)}
            textAnchor='middle'
            dominantBaseline='middle'
            className={`text-xs font-semibold ${segment.type === '미실시' ? 'fill-gray-700' : 'fill-white'}`}
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
            opacity={isEnabled ? 1 : 0.6}
          >
            {isEnabled ? segment.type.replace('형', '') : '미실시'}
            <tspan x={x + SVG.barWidth / 2} dy='1.2em' className='text-sm font-bold'>
              {segment.count}명
            </tspan>
          </text>
          {/* 퍼센트 배지 */}
          <g opacity={isEnabled ? 1 : 0.6}>
            <rect
              x={round === 1 ? x - 55 : x + SVG.barWidth + 12}
              y={yScale((segment.yStart + segment.yEnd) / 2) - 12}
              width={46}
              height={24}
              rx={12}
              fill='rgba(255, 255, 255, 0.95)'
              stroke='#E5E7EB'
              strokeWidth={1.5}
              filter='drop-shadow(0 2px 4px rgba(0,0,0,0.06))'
            />
            <text
              x={round === 1 ? x - 32 : x + SVG.barWidth + 35}
              y={yScale((segment.yStart + segment.yEnd) / 2)}
              textAnchor='middle'
              dominantBaseline='middle'
              className='text-xs font-bold fill-gray-700'
            >
              {segment.percentage.toFixed(0)}%
            </text>
          </g>
        </>
      )}
    </g>
  );

  return (
    <Container>
      <Header>
        <Title>검사별 유형 분포</Title>
        <Subtitle>
          1차와 2차 검사 결과를 비교하여 학생들의 유형 변화를 확인하세요
        </Subtitle>
      </Header>

      <ChartWrapper>
        <ChartContainer>
          <svg
            width={SVG.width}
            height={SVG.height}
            className='overflow-visible'
            onMouseLeave={() => setSelectedSegment(null)}
          >
            <defs>
              <filter id='shadow' x='-50%' y='-50%' width='200%' height='200%'>
                <feGaussianBlur in='SourceAlpha' stdDeviation='4' />
                <feOffset dx='0' dy='4' result='offsetblur' />
                <feComponentTransfer>
                  <feFuncA type='linear' slope='0.15' />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in='SourceGraphic' />
                </feMerge>
              </filter>

              {TYPE_ORDER.map((type) => (
                <linearGradient
                  key={type}
                  id={`gradient-${type}`}
                  x1='0%'
                  y1='0%'
                  x2='0%'
                  y2='100%'
                >
                  <stop offset='0%' stopColor={TYPE_GRADIENTS[type].start} />
                  <stop offset='100%' stopColor={TYPE_GRADIENTS[type].end} />
                </linearGradient>
              ))}

              <linearGradient id='flow-maintain' x1='0%' y1='0%' x2='100%' y2='0%'>
                <stop offset='0%' stopColor='#E2E8F0' />
                <stop offset='100%' stopColor='#94A3B8' />
              </linearGradient>

              <linearGradient id='shine' x1='0%' y1='0%' x2='100%' y2='0%'>
                <stop offset='0%' stopColor='rgba(255,255,255,0)' />
                <stop offset='50%' stopColor='rgba(255,255,255,0.2)' />
                <stop offset='100%' stopColor='rgba(255,255,255,0)' />
              </linearGradient>
            </defs>

            {/* 1차 막대 */}
            <g>
              <text
                x={SVG.barX1 + SVG.barWidth / 2}
                y={SVG.chartTop - 15}
                textAnchor='middle'
                className='text-sm font-bold fill-gray-900'
              >
                1차 검사
              </text>
              {round1Segments.map((seg) => renderBarSegment(seg, 1, SVG.barX1, true))}
            </g>

            {/* 2차 막대 */}
            <g>
              <text
                x={SVG.barX2 + SVG.barWidth / 2}
                y={SVG.chartTop - 15}
                textAnchor='middle'
                className='text-sm font-bold fill-gray-900'
              >
                2차 검사
              </text>
              {round2Segments.map((seg) => renderBarSegment(seg, 2, SVG.barX2, round2Available))}
            </g>

            {/* 흐름선 */}
            {round2Available &&
              flows
                .sort((a, b) => {
                  const order = (c: FlowData) =>
                    c.changeType === 'maintain' || c.changeType === 'notAssessed' ? 0 : 1;
                  return order(a) - order(b);
                })
                .map((flow, idx) => {
                  const fromSeg = round1Segments.find((s) => s.type === flow.from);
                  const toSeg = round2Segments.find((s) => s.type === flow.to);
                  if (!fromSeg || !toSeg || flow.count === 0) return null;

                  const fromHeight = (flow.count / fromSeg.count) * (fromSeg.yEnd - fromSeg.yStart);
                  const toHeight = (flow.count / toSeg.count) * (toSeg.yEnd - toSeg.yStart);

                  const flowFrom: BarSegment = { ...fromSeg, yEnd: fromSeg.yStart + fromHeight };
                  const flowTo: BarSegment = { ...toSeg, yEnd: toSeg.yStart + toHeight };

                  const isSelected =
                    selectedFlow?.from === flow.from && selectedFlow?.to === flow.to;
                  const style = getFlowStyle(flow, isSelected);

                  return (
                    <path
                      key={`flow-${idx}`}
                      d={createFlowPath(flowFrom, flowTo)}
                      fill={
                        flow.changeType === 'change'
                          ? `url(#gradient-${flow.to})`
                          : 'url(#flow-maintain)'
                      }
                      opacity={style.opacity}
                      stroke={style.strokeColor}
                      strokeWidth={style.strokeWidth}
                      strokeDasharray={style.dashArray}
                      className='transition-all duration-300 cursor-pointer hover:opacity-90'
                      style={{
                        filter: isSelected
                          ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))'
                          : flow.changeType === 'change'
                            ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))'
                            : 'none',
                      }}
                      onClick={() => setSelectedFlow(flow)}
                    />
                  );
                })}
          </svg>
        </ChartContainer>

        {/* 2차 미완료/진행중 표시 */}
        {!round2Available && (
          <NotAvailableMessage>
            <MessageText>
              {classData.stats?.examStatus?.round2 === '진행중'
                ? `2차 검사 진행 중 (${classData.stats?.round2SubmittedCount}/${classData.stats?.totalStudents}명 제출)`
                : '2차 검사가 아직 진행되지 않았습니다.'}
            </MessageText>
            {classData.stats?.examStatus?.round2 === '진행중' && (
              <ProgressBarWrapper>
                <ProgressBar
                  $width={
                    ((classData.stats?.round2SubmittedCount ?? 0) /
                      (classData.stats?.totalStudents || 1)) *
                    100
                  }
                />
              </ProgressBarWrapper>
            )}
          </NotAvailableMessage>
        )}

        {/* 세그먼트 선택 툴팁 (fixed position — 카드 높이에 영향 없음) */}
        {selectedSegment &&
          (() => {
            const typeData = LPA_PROFILE_DATA[classData.schoolLevel].types.find(
              (t) => t.name === selectedSegment.type,
            );
            const studentList =
              selectedSegment.round === 1
                ? round1Distribution[selectedSegment.type]
                : round2Distribution[selectedSegment.type];

            return (
              <TooltipContainer
                $left={selectedSegment.x + 20}
                $top={selectedSegment.y - 100}
                $borderColor={TYPE_COLORS[selectedSegment.type]}
              >
                <TooltipTitle>
                  {selectedSegment.round}차 검사 - {selectedSegment.type} ({studentList.length}명)
                </TooltipTitle>

                {typeData && selectedSegment.type !== '미실시' && (
                  <TooltipDescription>
                    <TooltipText>{typeData.description}</TooltipText>
                  </TooltipDescription>
                )}

                <StudentBadgeList>
                  {studentList.map((student) => (
                    <StudentBadge key={student.id}>
                      {student.number}. {student.name}
                    </StudentBadge>
                  ))}
                </StudentBadgeList>
              </TooltipContainer>
            );
          })()}

        {/* 하단 고정 영역: 흐름선 상세 / 도움말 */}
        <BottomSection>
          {selectedFlow && round2Available ? (
            (() => {
              const isChange = selectedFlow.changeType === 'change';

              const colorMap: Record<string, { bg: string; border: string; badge: string }> = {
                자원소진형: {
                  bg: '#fff7ed',
                  border: '#fdba74',
                  badge: '#f97316',
                },
                안전균형형: { bg: '#f0fdfa', border: '#5eead4', badge: '#14b8a6' },
                몰입자원풍부형: {
                  bg: '#eff6ff',
                  border: '#93c5fd',
                  badge: '#3b82f6',
                },
              };
              const colors = isChange
                ? colorMap[selectedFlow.to] || {
                    bg: '#f9fafb',
                    border: '#d1d5db',
                    badge: '#6b7280',
                  }
                : { bg: '#f9fafb', border: '#d1d5db', badge: '#6b7280' };

              return (
                <FlowDetailBox $bg={colors.bg} $border={colors.border}>
                  <FlowHeader>
                    <FlowTitleWrapper>
                      {isChange && <ChangeBadge $bg={colors.badge}>유형 변화</ChangeBadge>}
                      <FlowTitle>
                        {selectedFlow.from} → {selectedFlow.to} ({selectedFlow.count}명)
                      </FlowTitle>
                    </FlowTitleWrapper>
                    <CloseButton onClick={() => setSelectedFlow(null)}>✕</CloseButton>
                  </FlowHeader>

                  <StudentListWrapper>
                    {selectedFlow.students.map((student) => (
                      <StudentButton
                        key={student.id}
                        onClick={() =>
                          navigate(`/dashboard/class/${classData.id}/student/${student.id}`)
                        }
                      >
                        {student.number}. {student.name}
                      </StudentButton>
                    ))}
                  </StudentListWrapper>
                </FlowDetailBox>
              );
            })()
          ) : round2Available ? (
            <HelpBox>
              <HelpText>
                막대 또는 흐름선을 클릭하면 해당 유형의 학생 목록을 확인할 수 있습니다
              </HelpText>
            </HelpBox>
          ) : null}
        </BottomSection>
      </ChartWrapper>
    </Container>
  );
};
