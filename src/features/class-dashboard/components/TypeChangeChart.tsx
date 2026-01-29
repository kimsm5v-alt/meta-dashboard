import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Class, Student, StudentType } from '../../../shared/types';

interface TypeChangeChartProps {
  classData: Class;
}

interface FlowData {
  from: string;
  to: string;
  count: number;
  students: Student[];
  changeType: 'improve' | 'maintain' | 'concern' | 'notAssessed';
}

interface BarSegment {
  type: string;
  count: number;
  percentage: number;
  yStart: number;
  yEnd: number;
}

// 유형 순서 및 색상 정의 (아래부터: 미실시 → 자원소진형 → 안전균형형 → 몰입자원풍부형)
const TYPE_ORDER = ['몰입자원풍부형', '안전균형형', '자원소진형', '미실시'];
const TYPE_COLORS: Record<string, string> = {
  '미실시': '#E5E7EB',
  '자원소진형': '#FB923C',
  '안전균형형': '#2DD4BF',
  '몰입자원풍부형': '#60A5FA',
};

// 그라디언트 색상 (더 현대적인 느낌)
const TYPE_GRADIENTS: Record<string, { start: string; end: string }> = {
  '미실시': { start: '#F3F4F6', end: '#D1D5DB' },
  '자원소진형': { start: '#FDBA74', end: '#F97316' },
  '안전균형형': { start: '#5EEAD4', end: '#14B8A6' },
  '몰입자원풍부형': { start: '#93C5FD', end: '#3B82F6' },
};

// 변화 유형 결정
const getChangeType = (from: string, to: string): 'improve' | 'maintain' | 'concern' | 'notAssessed' => {
  if (to === '미실시') return 'notAssessed';
  if (from === to) return 'maintain';

  const typeRank: Record<string, number> = {
    '미실시': 0,
    '자원소진형': 1,
    '안전균형형': 2,
    '몰입자원풍부형': 3,
  };

  const fromRank = typeRank[from] || 0;
  const toRank = typeRank[to] || 0;

  return toRank > fromRank ? 'improve' : 'concern';
};

// 변화 유형별 색상 (더 현대적인 팔레트)
const FLOW_COLORS: Record<string, string> = {
  improve: '#10B981',      // 녹색 (개선)
  maintain: '#94A3B8',     // 회색 (유지)
  concern: '#F43F5E',      // 빨간색 (우려)
  notAssessed: '#CBD5E1',  // 연한 회색 (미실시)
};

// 흐름선 그라디언트
const FLOW_GRADIENTS: Record<string, { start: string; end: string }> = {
  improve: { start: '#34D399', end: '#059669' },
  maintain: { start: '#CBD5E1', end: '#64748B' },
  concern: { start: '#FB7185', end: '#DC2626' },
  notAssessed: { start: '#E2E8F0', end: '#94A3B8' },
};

export const TypeChangeChart: React.FC<TypeChangeChartProps> = ({ classData }) => {
  const navigate = useNavigate();
  const [selectedFlow, setSelectedFlow] = useState<FlowData | null>(null);

  // 1차 유형 분포 계산
  const round1Distribution: Record<string, Student[]> = {
    '미실시': [],
    '자원소진형': [],
    '안전균형형': [],
    '몰입자원풍부형': [],
  };

  classData.students.forEach(student => {
    const r1 = student.assessments.find(a => a.round === 1);
    if (r1) {
      round1Distribution[r1.predictedType].push(student);
    } else {
      round1Distribution['미실시'].push(student);
    }
  });

  // 2차 유형 분포 계산
  const round2Distribution: Record<string, Student[]> = {
    '미실시': [],
    '자원소진형': [],
    '안전균형형': [],
    '몰입자원풍부형': [],
  };

  const round2Completed = classData.stats?.round2Completed || false;

  if (round2Completed) {
    classData.students.forEach(student => {
      const r2 = student.assessments.find(a => a.round === 2);
      if (r2) {
        round2Distribution[r2.predictedType].push(student);
      } else {
        round2Distribution['미실시'].push(student);
      }
    });
  } else {
    // 2차 미진행 시 모든 학생 미실시
    classData.students.forEach(student => {
      round2Distribution['미실시'].push(student);
    });
  }

  // 흐름 데이터 계산
  const flows: FlowData[] = [];

  if (round2Completed) {
    TYPE_ORDER.forEach(fromType => {
      TYPE_ORDER.forEach(toType => {
        const students = round1Distribution[fromType].filter(student => {
          const r2 = student.assessments.find(a => a.round === 2);
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

  // 막대 세그먼트 계산 (하단부터 누적)
  const totalStudents = classData.stats?.totalStudents || 0;

  const calculateBarSegments = (distribution: Record<string, Student[]>): BarSegment[] => {
    const segments: BarSegment[] = [];
    let currentY = 0;

    TYPE_ORDER.forEach(type => {
      const count = distribution[type].length;
      const percentage = totalStudents > 0 ? (count / totalStudents) * 100 : 0;

      segments.push({
        type,
        count,
        percentage,
        yStart: currentY,
        yEnd: currentY + percentage,
      });

      currentY += percentage;
    });

    return segments;
  };

  const round1Segments = calculateBarSegments(round1Distribution);
  const round2Segments = calculateBarSegments(round2Distribution);

  // SVG 크기 설정
  const svgWidth = 700;
  const svgHeight = 350;
  const barWidth = 100;
  const barGap = 280;
  const barX1 = 90;
  const barX2 = barX1 + barWidth + barGap;
  const chartTop = 50;
  const chartHeight = 250;

  // Y 좌표 변환 (백분율 → 픽셀)
  const yScale = (percentage: number) => chartTop + (chartHeight * percentage) / 100;

  // 베지어 곡선 경로 생성
  const createFlowPath = (fromSegment: BarSegment, toSegment: BarSegment): string => {
    const x1 = barX1 + barWidth;
    const x2 = barX2;
    const y1Start = yScale(fromSegment.yStart);
    const y1End = yScale(fromSegment.yEnd);
    const y2Start = yScale(toSegment.yStart);
    const y2End = yScale(toSegment.yEnd);

    const controlX = (x1 + x2) / 2;

    return `
      M ${x1} ${y1Start}
      C ${controlX} ${y1Start}, ${controlX} ${y2Start}, ${x2} ${y2Start}
      L ${x2} ${y2End}
      C ${controlX} ${y2End}, ${controlX} ${y1End}, ${x1} ${y1End}
      Z
    `;
  };

  // 변화량 계산
  const getChangeSummary = () => {
    const changes = {
      improve: 0,
      concern: 0,
    };

    flows.forEach(flow => {
      if (flow.changeType === 'improve') {
        changes.improve += flow.count;
      } else if (flow.changeType === 'concern') {
        changes.concern += flow.count;
      }
    });

    return changes;
  };

  const changeSummary = getChangeSummary();

  return (
    <div className="space-y-6">
      {/* 차트 영역 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-shadow duration-300">
        {/* 그래프 제목 - 좌측 상단 */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">검사별 유형 분포</h2>
          <p className="text-sm text-gray-500 mt-1">1차와 2차 검사 결과를 비교하여 학생들의 유형 변화를 확인하세요</p>
        </div>

        <div className="flex items-center justify-center">
          <svg width={svgWidth} height={svgHeight} className="overflow-visible">
            {/* 그림자 필터 및 그라디언트 정의 */}
            <defs>
              {/* 현대적인 그림자 효과 */}
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                <feOffset dx="0" dy="4" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.15"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* 유형별 그라디언트 */}
              {TYPE_ORDER.map((type) => {
                const gradient = TYPE_GRADIENTS[type];
                return (
                  <linearGradient key={type} id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={gradient.start} />
                    <stop offset="100%" stopColor={gradient.end} />
                  </linearGradient>
                );
              })}

              {/* 흐름선 그라디언트 */}
              {Object.entries(FLOW_GRADIENTS).map(([key, gradient]) => (
                <linearGradient key={`flow-${key}`} id={`flow-gradient-${key}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={gradient.start} />
                  <stop offset="100%" stopColor={gradient.end} />
                </linearGradient>
              ))}

              {/* 광택 효과 (선택적) */}
              <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            {/* 1차 막대 */}
            <g>
              <text x={barX1 + barWidth / 2} y={chartTop - 15} textAnchor="middle" className="text-sm font-bold fill-gray-900">
                1차 검사
              </text>
              {round1Segments.map((segment, idx) => (
                <g key={`r1-${idx}`}>
                  <rect
                    x={barX1}
                    y={yScale(segment.yStart)}
                    width={barWidth}
                    height={yScale(segment.yEnd) - yScale(segment.yStart)}
                    fill={`url(#gradient-${segment.type})`}
                    stroke="#fff"
                    strokeWidth={3}
                    rx={8}
                    ry={8}
                    filter="url(#shadow)"
                    className="transition-all duration-300"
                  />
                  {/* 광택 효과 오버레이 */}
                  <rect
                    x={barX1}
                    y={yScale(segment.yStart)}
                    width={barWidth}
                    height={yScale(segment.yEnd) - yScale(segment.yStart)}
                    fill="url(#shine)"
                    stroke="none"
                    rx={8}
                    ry={8}
                    opacity={0.3}
                    pointerEvents="none"
                  />
                  {segment.count > 0 && (
                    <>
                      <text
                        x={barX1 + barWidth / 2}
                        y={yScale((segment.yStart + segment.yEnd) / 2)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-semibold fill-white"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                      >
                        {segment.type.replace('형', '')}
                        <tspan x={barX1 + barWidth / 2} dy="1.2em" className="text-sm font-bold">
                          {segment.count}명
                        </tspan>
                      </text>
                      <g className="transition-all duration-300">
                        <rect
                          x={barX1 - 55}
                          y={yScale((segment.yStart + segment.yEnd) / 2) - 12}
                          width={46}
                          height={24}
                          rx={12}
                          fill="rgba(255, 255, 255, 0.95)"
                          stroke="#E5E7EB"
                          strokeWidth={1.5}
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                        />
                        <text
                          x={barX1 - 32}
                          y={yScale((segment.yStart + segment.yEnd) / 2)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-xs font-bold fill-gray-700"
                        >
                          {segment.percentage.toFixed(1)}%
                        </text>
                      </g>
                    </>
                  )}
                </g>
              ))}
            </g>

            {/* 2차 막대 */}
            <g>
              <text x={barX2 + barWidth / 2} y={chartTop - 15} textAnchor="middle" className="text-sm font-bold fill-gray-900">
                2차 검사
              </text>
              {round2Segments.map((segment, idx) => (
                <g key={`r2-${idx}`}>
                  <rect
                    x={barX2}
                    y={yScale(segment.yStart)}
                    width={barWidth}
                    height={yScale(segment.yEnd) - yScale(segment.yStart)}
                    fill={`url(#gradient-${segment.type})`}
                    stroke="#fff"
                    strokeWidth={3}
                    rx={8}
                    ry={8}
                    filter="url(#shadow)"
                    opacity={round2Completed ? 1 : 0.4}
                    className="transition-all duration-300"
                  />
                  {/* 광택 효과 오버레이 */}
                  <rect
                    x={barX2}
                    y={yScale(segment.yStart)}
                    width={barWidth}
                    height={yScale(segment.yEnd) - yScale(segment.yStart)}
                    fill="url(#shine)"
                    stroke="none"
                    rx={8}
                    ry={8}
                    opacity={round2Completed ? 0.3 : 0.15}
                    pointerEvents="none"
                  />
                  {segment.count > 0 && (
                    <>
                      <text
                        x={barX2 + barWidth / 2}
                        y={yScale((segment.yStart + segment.yEnd) / 2)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className={`text-xs font-semibold ${segment.type === '미실시' ? 'fill-gray-700' : 'fill-white'}`}
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                        opacity={round2Completed ? 1 : 0.6}
                      >
                        {round2Completed ? segment.type.replace('형', '') : '미실시'}
                        <tspan x={barX2 + barWidth / 2} dy="1.2em" className="text-sm font-bold">
                          {segment.count}명
                        </tspan>
                      </text>
                      <g opacity={round2Completed ? 1 : 0.6} className="transition-all duration-300">
                        <rect
                          x={barX2 + barWidth + 12}
                          y={yScale((segment.yStart + segment.yEnd) / 2) - 12}
                          width={46}
                          height={24}
                          rx={12}
                          fill="rgba(255, 255, 255, 0.95)"
                          stroke="#E5E7EB"
                          strokeWidth={1.5}
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                        />
                        <text
                          x={barX2 + barWidth + 35}
                          y={yScale((segment.yStart + segment.yEnd) / 2)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-xs font-bold fill-gray-700"
                        >
                          {segment.percentage.toFixed(1)}%
                        </text>
                      </g>
                    </>
                  )}
                </g>
              ))}
            </g>

            {/* 흐름 선 (2차 완료 시에만 표시) */}
            {/* 중요: maintain/notAssessed를 먼저 렌더링하고, improve/concern을 나중에 렌더링하여 위에 표시 */}
            {round2Completed && flows
              .sort((a, b) => {
                // maintain과 notAssessed를 먼저 (0), improve와 concern을 나중에 (1)
                const aOrder = (a.changeType === 'maintain' || a.changeType === 'notAssessed') ? 0 : 1;
                const bOrder = (b.changeType === 'maintain' || b.changeType === 'notAssessed') ? 0 : 1;
                return aOrder - bOrder;
              })
              .map((flow, idx) => {
              const fromSegment = round1Segments.find(s => s.type === flow.from);
              const toSegment = round2Segments.find(s => s.type === flow.to);

              if (!fromSegment || !toSegment || flow.count === 0) return null;

              // 흐름의 비율만큼 세그먼트 내에서 위치 계산
              const fromHeight = (flow.count / fromSegment.count) * (fromSegment.yEnd - fromSegment.yStart);
              const toHeight = (flow.count / toSegment.count) * (toSegment.yEnd - toSegment.yStart);

              const flowSegment: BarSegment = {
                type: flow.from,
                count: flow.count,
                percentage: 0,
                yStart: fromSegment.yStart,
                yEnd: fromSegment.yStart + fromHeight,
              };

              const flowToSegment: BarSegment = {
                type: flow.to,
                count: flow.count,
                percentage: 0,
                yStart: toSegment.yStart,
                yEnd: toSegment.yStart + toHeight,
              };

              const path = createFlowPath(flowSegment, flowToSegment);
              const isSelected = selectedFlow?.from === flow.from && selectedFlow?.to === flow.to;

              // 변화 유형별로 다른 불투명도 적용 (긍정/부정 강조)
              const getFlowOpacity = () => {
                if (isSelected) return 0.9;
                if (flow.changeType === 'improve' || flow.changeType === 'concern') {
                  return 0.6; // 긍정/부정 변화는 더 진하게
                }
                return 0.25; // 유지/미실시는 더 투명하게
              };

              return (
                <path
                  key={`flow-${idx}`}
                  d={path}
                  fill={`url(#flow-gradient-${flow.changeType})`}
                  opacity={getFlowOpacity()}
                  stroke={isSelected ? '#1F2937' : 'none'}
                  strokeWidth={isSelected ? 3 : 0}
                  strokeDasharray={flow.changeType === 'notAssessed' ? '8,4' : 'none'}
                  className="cursor-pointer transition-all duration-300 hover:opacity-80"
                  style={{
                    filter: isSelected
                      ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))'
                      : (flow.changeType === 'improve' || flow.changeType === 'concern')
                        ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))'
                        : 'none'
                  }}
                  onClick={() => setSelectedFlow(flow)}
                />
              );
            })}

          </svg>
        </div>

        {/* 진행률 표시 (2차 미완료 시) */}
        {!round2Completed && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">2차 검사가 아직 진행되지 않았습니다.</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
        )}

        {/* 선택된 흐름의 학생 목록 (그래프 하단) */}
        {round2Completed && (
          <>
            {selectedFlow ? (
              <div className={`mt-3 border-2 rounded-xl p-3 shadow-md transition-all duration-300 ${
                selectedFlow.changeType === 'concern'
                  ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
                  : selectedFlow.changeType === 'improve'
                  ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'
                  : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {selectedFlow.from} -&gt; {selectedFlow.to} ({selectedFlow.count}명)
                  </h3>
                  <button
                    onClick={() => setSelectedFlow(null)}
                    className="w-6 h-6 rounded-full bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center transition-all duration-200 text-gray-500 hover:text-gray-900 hover:scale-110 active:scale-95 text-sm shadow-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFlow.students.map(student => (
                    <button
                      key={student.id}
                      onClick={() => navigate(`/dashboard/class/${classData.id}/student/${student.id}`)}
                      className="px-3 py-1.5 bg-white rounded-full text-xs font-semibold border border-gray-200 hover:border-gray-400 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                      {student.number}. {student.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-sm text-gray-600">
                  💡 흐름선을 클릭하면 해당 유형 변화의 학생 목록을 확인할 수 있습니다
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
