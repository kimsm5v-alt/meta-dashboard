import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Class, Student } from '../../../shared/types';
import { LPA_PROFILE_DATA } from '../../../shared/data/lpaProfiles';
import {
  TYPE_ORDER,
  TYPE_COLORS,
  TYPE_GRADIENTS,
  FLOW_GRADIENTS,
  getChangeType,
} from '../utils/typeUtils';

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
  changeType: 'improve' | 'maintain' | 'concern' | 'notAssessed';
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
  height: 350,
  barWidth: 100,
  barGap: 280,
  barX1: 90,
  chartTop: 50,
  chartHeight: 250,
} as const;

const SVG = {
  ...SVG_CONFIG,
  barX2: SVG_CONFIG.barX1 + SVG_CONFIG.barWidth + SVG_CONFIG.barGap,
};

// ============================================================
// 유틸리티 함수
// ============================================================

const yScale = (percentage: number) =>
  SVG.chartTop + (SVG.chartHeight * percentage) / 100;

const createFlowPath = (from: BarSegment, to: BarSegment): string => {
  const x1 = SVG.barX1 + SVG.barWidth;
  const x2 = SVG.barX2;
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

const getFlowStyle = (
  flow: FlowData,
  isSelected: boolean
): { opacity: number; strokeWidth: number; strokeColor: string; dashArray: string } => {
  const { changeType } = flow;

  if (isSelected) {
    return { opacity: 0.9, strokeWidth: 3, strokeColor: '#1F2937', dashArray: 'none' };
  }

  if (changeType === 'improve') {
    return { opacity: 0.7, strokeWidth: 2.5, strokeColor: '#059669', dashArray: '12,6' };
  }
  if (changeType === 'concern') {
    return { opacity: 0.6, strokeWidth: 2.5, strokeColor: '#DC2626', dashArray: '12,6' };
  }
  if (changeType === 'notAssessed') {
    return { opacity: 0.2, strokeWidth: 0, strokeColor: 'none', dashArray: '6,3' };
  }
  return { opacity: 0.2, strokeWidth: 0, strokeColor: 'none', dashArray: 'none' };
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export const TypeChangeChart: React.FC<TypeChangeChartProps> = ({ classData }) => {
  const navigate = useNavigate();
  const [selectedFlow, setSelectedFlow] = useState<FlowData | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<{
    round: 1 | 2;
    type: string;
    x: number;
    y: number;
  } | null>(null);

  // 분포 계산
  type Distribution = Record<string, Student[]>;

  const createDistribution = (): Distribution => ({
    '미실시': [],
    '자원소진형': [],
    '안전균형형': [],
    '몰입자원풍부형': [],
  });

  const round1Distribution = createDistribution();
  const round2Distribution = createDistribution();
  const round2Completed = classData.stats?.round2Completed || false;

  classData.students.forEach(student => {
    const r1 = student.assessments.find(a => a.round === 1);
    const r2 = student.assessments.find(a => a.round === 2);

    round1Distribution[r1?.predictedType || '미실시'].push(student);

    if (round2Completed && r2) {
      round2Distribution[r2.predictedType].push(student);
    } else {
      round2Distribution['미실시'].push(student);
    }
  });

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

  // 막대 세그먼트 계산
  const totalStudents = classData.stats?.totalStudents || 0;

  const calculateSegments = (distribution: Record<string, Student[]>): BarSegment[] => {
    const segments: BarSegment[] = [];
    let currentY = 0;

    TYPE_ORDER.forEach(type => {
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
  const renderBarSegment = (
    segment: BarSegment,
    round: 1 | 2,
    x: number,
    isEnabled: boolean
  ) => (
    <g key={`r${round}-${segment.type}`}>
      <rect
        x={x}
        y={yScale(segment.yStart)}
        width={SVG.barWidth}
        height={yScale(segment.yEnd) - yScale(segment.yStart)}
        fill={TYPE_COLORS[segment.type]}
        rx={8}
        ry={8}
        filter="url(#shadow)"
        opacity={isEnabled ? 1 : 0.4}
        className={`transition-all duration-300 ${isEnabled ? 'cursor-pointer hover:opacity-90' : ''}`}
        onMouseEnter={(e) => {
          if (isEnabled) {
            setSelectedSegment({ round, type: segment.type, x: e.clientX, y: e.clientY });
            setSelectedFlow(null);
          }
        }}
        onClick={(e) => {
          if (isEnabled) {
            setSelectedSegment({ round, type: segment.type, x: e.clientX, y: e.clientY });
            setSelectedFlow(null);
          }
        }}
      />
      {/* 광택 효과 */}
      <rect
        x={x}
        y={yScale(segment.yStart)}
        width={SVG.barWidth}
        height={yScale(segment.yEnd) - yScale(segment.yStart)}
        fill="url(#shine)"
        rx={8}
        ry={8}
        opacity={isEnabled ? 0.3 : 0.15}
        pointerEvents="none"
      />
      {segment.count > 0 && (
        <>
          <text
            x={x + SVG.barWidth / 2}
            y={yScale((segment.yStart + segment.yEnd) / 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`text-xs font-semibold ${segment.type === '미실시' ? 'fill-gray-700' : 'fill-white'}`}
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
            opacity={isEnabled ? 1 : 0.6}
          >
            {isEnabled ? segment.type.replace('형', '') : '미실시'}
            <tspan x={x + SVG.barWidth / 2} dy="1.2em" className="text-sm font-bold">
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
              fill="rgba(255, 255, 255, 0.95)"
              stroke="#E5E7EB"
              strokeWidth={1.5}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
            />
            <text
              x={round === 1 ? x - 32 : x + SVG.barWidth + 35}
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
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-shadow duration-300">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">검사별 유형 분포</h2>
          <p className="text-sm text-gray-500 mt-1">
            1차와 2차 검사 결과를 비교하여 학생들의 유형 변화를 확인하세요
          </p>
        </div>

        <div className="flex items-center justify-center">
          <svg width={SVG.width} height={SVG.height} className="overflow-visible">
            <defs>
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

              {TYPE_ORDER.map(type => (
                <linearGradient key={type} id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={TYPE_GRADIENTS[type].start} />
                  <stop offset="100%" stopColor={TYPE_GRADIENTS[type].end} />
                </linearGradient>
              ))}

              {Object.entries(FLOW_GRADIENTS).map(([key, gradient]) => (
                <linearGradient key={`flow-${key}`} id={`flow-gradient-${key}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={gradient.start} />
                  <stop offset="100%" stopColor={gradient.end} />
                </linearGradient>
              ))}

              <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            {/* 1차 막대 */}
            <g>
              <text x={SVG.barX1 + SVG.barWidth / 2} y={SVG.chartTop - 15} textAnchor="middle" className="text-sm font-bold fill-gray-900">
                1차 검사
              </text>
              {round1Segments.map(seg => renderBarSegment(seg, 1, SVG.barX1, true))}
            </g>

            {/* 2차 막대 */}
            <g>
              <text x={SVG.barX2 + SVG.barWidth / 2} y={SVG.chartTop - 15} textAnchor="middle" className="text-sm font-bold fill-gray-900">
                2차 검사
              </text>
              {round2Segments.map(seg => renderBarSegment(seg, 2, SVG.barX2, round2Completed))}
            </g>

            {/* 흐름선 */}
            {round2Completed && flows
              .sort((a, b) => {
                const order = (c: FlowData) => (c.changeType === 'maintain' || c.changeType === 'notAssessed') ? 0 : 1;
                return order(a) - order(b);
              })
              .map((flow, idx) => {
                const fromSeg = round1Segments.find(s => s.type === flow.from);
                const toSeg = round2Segments.find(s => s.type === flow.to);
                if (!fromSeg || !toSeg || flow.count === 0) return null;

                const fromHeight = (flow.count / fromSeg.count) * (fromSeg.yEnd - fromSeg.yStart);
                const toHeight = (flow.count / toSeg.count) * (toSeg.yEnd - toSeg.yStart);

                const flowFrom: BarSegment = { ...fromSeg, yEnd: fromSeg.yStart + fromHeight };
                const flowTo: BarSegment = { ...toSeg, yEnd: toSeg.yStart + toHeight };

                const isSelected = selectedFlow?.from === flow.from && selectedFlow?.to === flow.to;
                const style = getFlowStyle(flow, isSelected);

                return (
                  <path
                    key={`flow-${idx}`}
                    d={createFlowPath(flowFrom, flowTo)}
                    fill={`url(#flow-gradient-${flow.changeType})`}
                    opacity={style.opacity}
                    stroke={style.strokeColor}
                    strokeWidth={style.strokeWidth}
                    strokeDasharray={style.dashArray}
                    className="cursor-pointer transition-all duration-300 hover:opacity-90"
                    style={{
                      filter: isSelected ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' :
                        (flow.changeType === 'improve' || flow.changeType === 'concern')
                          ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))' : 'none'
                    }}
                    onClick={() => setSelectedFlow(flow)}
                  />
                );
              })}
          </svg>
        </div>

        {/* 2차 미완료 표시 */}
        {!round2Completed && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">2차 검사가 아직 진행되지 않았습니다.</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
        )}

        {/* 세그먼트 선택 툴팁 */}
        {selectedSegment && (() => {
          const typeData = LPA_PROFILE_DATA[classData.schoolLevel].types.find(t => t.name === selectedSegment.type);
          const studentList = selectedSegment.round === 1
            ? round1Distribution[selectedSegment.type]
            : round2Distribution[selectedSegment.type];

          return (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSelectedSegment(null)} />
              <div
                className="fixed max-w-sm w-full border-2 rounded-lg p-4 shadow-xl bg-white z-50"
                style={{
                  left: `${selectedSegment.x + 20}px`,
                  top: `${selectedSegment.y - 100}px`,
                  borderColor: TYPE_COLORS[selectedSegment.type],
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {selectedSegment.round}차 검사 - {selectedSegment.type} ({studentList.length}명)
                  </h3>
                  <button
                    onClick={() => setSelectedSegment(null)}
                    className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {typeData && selectedSegment.type !== '미실시' && (
                  <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-700 leading-relaxed">{typeData.description}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {studentList.map(student => (
                    <button
                      key={student.id}
                      onClick={() => navigate(`/dashboard/class/${classData.id}/student/${student.id}`)}
                      className="px-2 py-1 bg-gray-50 rounded text-xs font-medium border border-gray-200 hover:border-gray-400 hover:bg-gray-100 cursor-pointer"
                    >
                      {student.number}. {student.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          );
        })()}

        {/* 흐름선 선택 상자 */}
        {selectedFlow && round2Completed && (() => {
          const isPositive = selectedFlow.changeType === 'improve';
          const isNegative = selectedFlow.changeType === 'concern';
          const boxColor = isPositive ? 'bg-lime-50 border-lime-300' :
            isNegative ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-300';

          return (
            <div className={`mt-3 border-2 rounded-xl p-4 shadow-md ${boxColor}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isPositive && (
                    <span className="px-2.5 py-0.5 bg-lime-500 text-white text-xs font-semibold rounded-full">
                      긍정 변화
                    </span>
                  )}
                  {isNegative && (
                    <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                      부정 변화
                    </span>
                  )}
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {selectedFlow.from} → {selectedFlow.to} ({selectedFlow.count}명)
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedFlow(null)}
                  className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {selectedFlow.students.map(student => (
                  <button
                    key={student.id}
                    onClick={() => navigate(`/dashboard/class/${classData.id}/student/${student.id}`)}
                    className="px-2 py-1 bg-white rounded text-xs font-medium border border-gray-200 hover:border-gray-400 hover:bg-gray-100 cursor-pointer"
                  >
                    {student.number}. {student.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 도움말 */}
        {!selectedFlow && round2Completed && (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-sm text-gray-600">
              막대 또는 흐름선을 클릭하면 해당 유형의 학생 목록을 확인할 수 있습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
