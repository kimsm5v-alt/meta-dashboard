import React, { useMemo } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { BarCustomLayerProps, ComputedDatum } from '@nivo/bar';
import type { Class } from '@/shared/types';

type BarRecord = Record<string, string | number>;

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
  const isMiddleSchool = classes.length > 0 && classes[0].schoolLevel === '중등';

  const typeKeys = isMiddleSchool
    ? ['자기주도몰입형', '정서조절취약형', '무기력형'] as const
    : ['몰입자원풍부형', '안전균형형', '자원소진형'] as const;

  const typeColors = isMiddleSchool
    ? ['#60A5FA', '#2DD4BF', '#FB923C']
    : ['#60A5FA', '#2DD4BF', '#FB923C'];

  const chartData = useMemo(() => {
    return classes.map(cls => {
      const total = typeKeys.reduce(
        (sum, key) => sum + (cls.stats?.typeDistribution?.[key]?.count || 0), 0,
      );
      const row: BarRecord = {
        name: `${cls.grade}-${cls.classNumber}반`,
        label: `${cls.grade}-${cls.classNumber}반 (${total}명)`,
        classId: cls.id,
      };
      for (const key of typeKeys) {
        row[key] = cls.stats?.typeDistribution?.[key]?.count || 0;
      }
      return row;
    }).sort((a, b) => {
      const aNum = parseInt((a.name as string).split('-')[1]);
      const bNum = parseInt((b.name as string).split('-')[1]);
      return aNum - bNum;
    });
  }, [classes, typeKeys]);

  const handleBarClick = (datum: ComputedDatum<BarRecord>) => {
    if (onClassSelect && datum.data?.classId) {
      const clickedClassId = datum.data.classId as string;
      if (selectedClassId === clickedClassId) {
        onClassSelect(null);
      } else {
        onClassSelect(clickedClassId);
      }
    }
  };

  const CustomBarsLayer: React.FC<BarCustomLayerProps<BarRecord>> = ({ bars }) => (
    <g>
      {bars.map((bar) => {
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
            {bar.width > 30 && (bar.data.value ?? 0) > 0 && (
              <text
                x={bar.width / 2}
                y={bar.height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: '#fff',
                  pointerEvents: 'none',
                }}
              >
                {bar.data.value}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );

  return (
    <div className="relative" style={{ height: 450 }}>
      <ResponsiveBar
        data={chartData}
        keys={[...typeKeys]}
        indexBy="label"
        layout="horizontal"
        margin={{ top: 20, right: 130, bottom: 20, left: 100 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={typeColors}
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
                fontWeight: 400,
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
          CustomBarsLayer,
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
