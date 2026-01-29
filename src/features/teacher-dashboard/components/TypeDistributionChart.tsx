import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { Class } from '../../../shared/types';

interface TypeDistributionChartProps {
  classes: Class[];
  selectedClassId?: string | null;
  onClassSelect?: (classId: string | null) => void;
}

export const TypeDistributionChart: React.FC<TypeDistributionChartProps> = ({
  classes,
  selectedClassId,
  onClassSelect,
}) => {
  const chartData = useMemo(() => {
    return classes.map(cls => {
      const total = (cls.stats?.typeDistribution?.['자원소진형']?.count || 0) +
                    (cls.stats?.typeDistribution?.['안전균형형']?.count || 0) +
                    (cls.stats?.typeDistribution?.['몰입자원풍부형']?.count || 0);
      return {
        name: `${cls.grade}-${cls.classNumber}반`,
        label: `${cls.grade}-${cls.classNumber}반 (${total}명)`,
        classId: cls.id,
        자원소진형: cls.stats?.typeDistribution?.['자원소진형']?.count || 0,
        안전균형형: cls.stats?.typeDistribution?.['안전균형형']?.count || 0,
        몰입자원풍부형: cls.stats?.typeDistribution?.['몰입자원풍부형']?.count || 0,
      };
    }).sort((a, b) => {
      const aNum = parseInt(a.name.split('-')[1]);
      const bNum = parseInt(b.name.split('-')[1]);
      return aNum - bNum;
    });
  }, [classes]);

  const handleBarClick = (data: any) => {
    if (onClassSelect && data.data?.classId) {
      const clickedClassId = data.data.classId;
      if (selectedClassId === clickedClassId) {
        onClassSelect(null);
      } else {
        onClassSelect(clickedClassId);
      }
    }
  };

  return (
    <div className="relative" style={{ height: 450 }}>
      <ResponsiveBar
        data={chartData}
        keys={['자원소진형', '안전균형형', '몰입자원풍부형']}
        indexBy="label"
        layout="horizontal"
        margin={{ top: 20, right: 130, bottom: 20, left: 100 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={['#FB923C', '#2DD4BF', '#60A5FA']}
        borderRadius={4}
        borderColor={{
          from: 'color',
          modifiers: [['darker', 0.2]],
        }}
        theme={{
          axis: {
            ticks: {
              text: {
                fontSize: 12,
                fontWeight: selectedClassId ? (tick: any) => {
                  const classData = chartData.find(d => d.label === tick);
                  return classData?.classId === selectedClassId ? 600 : 400;
                } : 400,
              },
            },
          },
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={null}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        enableLabel={true}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1.6]],
        }}
        layers={[
          'grid',
          'axes',
          ({ bars }) => {
            return bars.map((bar: any) => {
              const barClassId = bar.data.data?.classId;
              const isSelected = barClassId === selectedClassId;
              const hasSelection = selectedClassId !== null;
              const opacity = isSelected ? 1 : hasSelection ? 0.3 : 1;

              return (
                <g key={bar.key} transform={`translate(${bar.x}, ${bar.y})`}>
                  <rect
                    width={bar.width}
                    height={bar.height}
                    fill={bar.color}
                    opacity={opacity}
                    rx={4}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleBarClick(bar.data)}
                  />
                  {bar.width > 30 && bar.data.value > 0 && (
                    <text
                      x={bar.width / 2}
                      y={bar.height / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        fill: bar.labelColor,
                        pointerEvents: 'none',
                      }}
                    >
                      {bar.data.value}
                    </text>
                  )}
                </g>
              );
            });
          },
          'markers',
          'legends',
          'annotations',
        ]}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 12,
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        role="application"
        ariaLabel="학생 유형 분포 비교"
      />
    </div>
  );
};
