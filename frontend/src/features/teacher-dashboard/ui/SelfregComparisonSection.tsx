import { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { useQueries } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { Class } from '@shared/types';
import { fetchSelfregClassAnalysis } from '@shared/services/dashboardService';
import { Card } from '@shared/components';

// ============================================================
// 자기조절학습검사 20요인 카테고리 매핑 (SELFREG_CLASS_KEYS 순서 기준)
// ============================================================

const CATEGORY_INDICES: Record<string, number[]> = {
  동기전략: [0, 1, 2, 3, 4, 5],
  인지전략: [6, 7, 8, 9, 10, 11],
  행동전략: [12, 13, 14, 15, 16, 17, 18, 19],
};

const SUBCATEGORY_INDICES: Record<string, number[]> = {
  학습원동력: [0, 1, 2],
  정서조절: [3, 4, 5],
  메타인지: [6, 7, 8],
  인지적학습기술: [9, 10, 11],
  행동조절: [12, 13, 14],
  행동적학습기술: [15, 16, 17, 18, 19],
};

const CLASS_COLORS = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EF4444',
  '#14B8A6',
  '#F97316',
  '#06B6D4',
  '#EC4899',
  '#3B82F6',
];

function computeGroupAvg(tScores: number[], indices: number[]): number {
  return Math.round(indices.reduce((sum, i) => sum + (tScores[i] ?? 50), 0) / indices.length);
}

// ============================================================
// Styled Components
// ============================================================

const CardOuter = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CardSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const DrillToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.25rem;
`;

const DrillButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
  background: ${({ $active, theme }) => ($active ? theme.colors.background.paper : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.gray[900] : theme.colors.gray[600])};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.sm : 'none')};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[900]};
  }
`;

const CardBody = styled.div`
  display: flex;
  min-height: 0;
`;

const ChartArea = styled.div`
  flex: 1;
  padding: 1.25rem 1.5rem;
  min-width: 0;
`;

const ChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Chip = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
  background: ${({ $active }) => ($active ? '#111827' : '#F3F4F6')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#4B5563')};

  &:hover {
    background: ${({ $active }) => ($active ? '#111827' : '#E5E7EB')};
  }
`;

const ChipDot = styled.span<{ $color: string }>`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $color }) => $color};
`;

const SidePanel = styled.div`
  width: 280px;
  flex-shrink: 0;
  border-left: 1px solid ${({ theme }) => theme.colors.gray[100]};
  background: ${({ theme }) => theme.colors.gray[50]};
  padding: 1.25rem;
`;

const PanelTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PanelSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
  margin-bottom: 1rem;
`;

const OutlierItem = styled.button<{ $kind: 'good' | 'warn' }>`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 150ms ease;
  background: ${({ $kind }) => ($kind === 'warn' ? '#FEF2F2' : '#ECFDF5')};
  margin-bottom: 0.5rem;

  &:hover {
    background: ${({ $kind }) => ($kind === 'warn' ? '#FEE2E2' : '#D1FAE5')};
  }
`;

const OutlierIcon = styled.span<{ $kind: 'good' | 'warn' }>`
  font-size: 1.125rem;
  line-height: 1;
  color: ${({ $kind }) => ($kind === 'warn' ? '#EF4444' : '#10B981')};
`;

const OutlierLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const OutlierDelta = styled.p<{ $kind: 'good' | 'warn' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ $kind }) => ($kind === 'warn' ? '#DC2626' : '#059669')};
  margin-top: 0.125rem;
`;

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
  margin-bottom: 0.75rem;
`;

const KpiBox = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const KpiBoxLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.25rem;
`;

const KpiBoxValue = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const KpiBoxSub = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.125rem;
`;

const GoToClassBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: #009f88;
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: auto;

  &:hover {
    background: #007f6e;
  }
`;

// ============================================================
// Component
// ============================================================

interface Props {
  classes: Class[];
  selectedClassId: string | null;
  onClassSelect: (classId: string | null) => void;
  onGoToClass: (classId: string) => void;
}

export const SelfregComparisonSection = ({
  classes,
  selectedClassId,
  onClassSelect,
  onGoToClass,
}: Props) => {
  const [drillLevel, setDrillLevel] = useState<'3strategies' | '6subcategories'>('3strategies');

  // 모든 반의 자기조절 분석 데이터를 병렬 조회 (useSelfregClassAnalysis 캐시 공유)
  const queries = useQueries({
    queries: classes.map((cls) => ({
      queryKey: ['class', 'selfreg-analysis', cls.id] as const,
      queryFn: () =>
        Promise.all([
          fetchSelfregClassAnalysis(cls.id, 1),
          fetchSelfregClassAnalysis(cls.id, 2),
        ]).then(([round1, round2]) => ({ round1, round2 })),
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);

  // 2차 우선, 없으면 1차
  const classTScores = useMemo(
    () => classes.map((_, idx) => queries[idx]?.data?.round2 ?? queries[idx]?.data?.round1 ?? null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classes, queries.map((q) => q.dataUpdatedAt).join(',')],
  );

  const indices = drillLevel === '3strategies' ? CATEGORY_INDICES : SUBCATEGORY_INDICES;

  const chartData = useMemo(
    () =>
      Object.entries(indices).map(([category, idxList]) => {
        const point: Record<string, string | number> = { category };
        classes.forEach((cls, idx) => {
          const ts = classTScores[idx];
          if (ts) point[`${cls.grade}-${cls.classNumber}반`] = computeGroupAvg(ts, idxList);
        });
        return point;
      }),
    [classes, classTScores, indices],
  );

  // 전체 비교 요약: 학년 평균 대비 편차 (3대 전략 기준 고정)
  const outliers = useMemo(() => {
    const classStats = classes
      .map((cls, idx) => {
        const ts = classTScores[idx];
        if (!ts) return null;
        return {
          cls,
          averages: Object.fromEntries(
            Object.entries(CATEGORY_INDICES).map(([cat, idxList]) => [
              cat,
              computeGroupAvg(ts, idxList),
            ]),
          ) as Record<string, number>,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (classStats.length < 2) return [];

    const result: Array<{
      cls: Class;
      category: string;
      t: number;
      delta: number;
      kind: 'good' | 'warn';
    }> = [];

    Object.keys(CATEGORY_INDICES).forEach((category) => {
      const values = classStats.map((cs) => cs.averages[category]);
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      classStats.forEach(({ cls, averages }) => {
        const t = averages[category];
        const delta = Math.round(t - mean);
        if (Math.abs(delta) >= 2) {
          result.push({ cls, category, t, delta, kind: delta > 0 ? 'good' : 'warn' });
        }
      });
    });

    return result
      .sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === 'warn' ? -1 : 1;
        return Math.abs(b.delta) - Math.abs(a.delta);
      })
      .slice(0, 4);
  }, [classes, classTScores]);

  const totalStudents = classes
    .filter((c) => (c.stats?.assessedStudents ?? 0) > 0)
    .reduce((s, c) => s + (c.stats?.assessedStudents || 0), 0);

  const subtitle =
    drillLevel === '3strategies'
      ? '각 반의 3대 전략별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.'
      : '각 반의 6개 중분류별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.';

  return (
    <CardOuter>
      <CardHeader>
        <div>
          <CardTitle>반별 비교 분석</CardTitle>
          <CardSubtitle>{subtitle}</CardSubtitle>
        </div>
        <DrillToggle>
          <DrillButton
            $active={drillLevel === '3strategies'}
            onClick={() => setDrillLevel('3strategies')}
          >
            3대 전략
          </DrillButton>
          <DrillButton
            $active={drillLevel === '6subcategories'}
            onClick={() => setDrillLevel('6subcategories')}
          >
            6개 중분류
          </DrillButton>
        </DrillToggle>
      </CardHeader>

      <CardBody>
        <ChartArea>
          <ChipsRow>
            <Chip $active={selectedClassId === null} onClick={() => onClassSelect(null)}>
              <ChipDot $color='#9CA3AF' />
              전체 ({totalStudents}명)
            </Chip>

            {classes
              .filter((cls) => (cls.stats?.assessedStudents ?? 0) > 0)
              .map((cls, idx) => {
                const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                const isSelected = selectedClassId === cls.id;
                return (
                  <Chip
                    key={cls.id}
                    $active={isSelected}
                    onClick={() => onClassSelect(isSelected ? null : cls.id)}
                  >
                    <ChipDot $color={color} />
                    {cls.grade}학년 {cls.classNumber}반 ({cls.stats?.assessedStudents || 0}명)
                  </Chip>
                );
              })}
          </ChipsRow>

          <ResponsiveContainer width='100%' height={420}>
            <LineChart data={chartData} margin={{ top: 20, right: 80, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#E5E7EB' vertical={false} />
              <XAxis
                dataKey='category'
                angle={-20}
                textAnchor='end'
                height={80}
                tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
                axisLine={{ stroke: '#D1D5DB', strokeWidth: 1.5 }}
                tickLine={false}
              />
              <YAxis
                domain={[20, 80]}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                axisLine={{ stroke: '#D1D5DB', strokeWidth: 1.5 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.98)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  padding: '12px 16px',
                  fontSize: '13px',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#111827' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '12px', fontSize: '13px', fontWeight: 500 }}
                iconType='line'
                iconSize={16}
                onClick={(e) => {
                  const cls = classes.find((c) => `${c.grade}-${c.classNumber}반` === e.value);
                  if (cls) onClassSelect(selectedClassId === cls.id ? null : cls.id);
                }}
                style={{ cursor: 'pointer' }}
              />
              <ReferenceLine
                y={50}
                stroke='#9CA3AF'
                strokeDasharray='5 5'
                strokeWidth={2}
                label={{
                  value: '전국 평균 (50)',
                  position: 'right',
                  fontSize: 11,
                  fill: '#6B7280',
                  fontWeight: 600,
                }}
              />
              {classes.map((cls, idx) => {
                const key = `${cls.grade}-${cls.classNumber}반`;
                const isSelected = selectedClassId === cls.id;
                const hasSelection = selectedClassId !== null;
                const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                return (
                  <Line
                    key={key}
                    type='monotone'
                    dataKey={key}
                    stroke={color}
                    strokeWidth={isSelected ? 4 : hasSelection ? 2 : 3}
                    strokeOpacity={isSelected ? 1 : hasSelection ? 0.3 : 0.9}
                    dot={{ r: isSelected ? 6 : 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, fill: color, strokeWidth: 3, stroke: '#fff' }}
                    onClick={() => onClassSelect(selectedClassId === cls.id ? null : cls.id)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </ChartArea>

        <SidePanel style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {selectedClassId ? (
            (() => {
              const clsIdx = classes.findIndex((c) => c.id === selectedClassId);
              const cls = classes[clsIdx];
              const ts = classTScores[clsIdx];
              const avgT = ts
                ? Math.round(
                    Object.values(CATEGORY_INDICES).reduce(
                      (sum, idxList) => sum + computeGroupAvg(ts, idxList),
                      0,
                    ) / Object.keys(CATEGORY_INDICES).length,
                  )
                : null;
              return (
                <>
                  <div>
                    <PanelTitle>
                      {cls.grade}학년 {cls.classNumber}반 분석 요약
                    </PanelTitle>
                    <PanelSubtitle style={{ marginBottom: 0 }}>
                      학생 {cls.stats?.assessedStudents || 0}명 · 자기조절검사
                    </PanelSubtitle>
                  </div>
                  <KpiGrid>
                    <KpiBox>
                      <KpiBoxLabel>평균 T점수</KpiBoxLabel>
                      <KpiBoxValue>{avgT ?? '-'}</KpiBoxValue>
                      <KpiBoxSub>
                        전국 대비 {avgT != null ? (avgT - 50 >= 0 ? '+' : '') + (avgT - 50) : '-'}
                      </KpiBoxSub>
                    </KpiBox>
                    <KpiBox>
                      <KpiBoxLabel>관심 필요</KpiBoxLabel>
                      <KpiBoxValue style={{ color: '#DC2626' }}>
                        {cls.stats?.needAttentionCount ?? 0}명
                      </KpiBoxValue>
                      <KpiBoxSub>
                        {cls.stats?.totalStudents
                          ? Math.round(
                              ((cls.stats.needAttentionCount ?? 0) / cls.stats.totalStudents) * 100,
                            )
                          : 0}
                        %
                      </KpiBoxSub>
                    </KpiBox>
                  </KpiGrid>
                  <GoToClassBtn onClick={() => onGoToClass(selectedClassId)}>
                    {cls.grade}학년 {cls.classNumber}반 상세 분석 →
                  </GoToClassBtn>
                </>
              );
            })()
          ) : (
            <>
              <div>
                <PanelTitle>전체 비교 요약</PanelTitle>
                <PanelSubtitle>학년 평균과 가장 차이 나는 지점이에요</PanelSubtitle>
              </div>
              {isLoading ? (
                <EmptyText>데이터 불러오는 중...</EmptyText>
              ) : outliers.length === 0 ? (
                <EmptyText>모든 반이 고른 분포예요.</EmptyText>
              ) : (
                outliers.map((o, i) => (
                  <OutlierItem key={i} $kind={o.kind} onClick={() => onGoToClass(o.cls.id)}>
                    <OutlierIcon $kind={o.kind}>{o.kind === 'warn' ? '▼' : '▲'}</OutlierIcon>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <OutlierLabel>
                        {o.cls.grade}학년 {o.cls.classNumber}반 : {o.category}
                      </OutlierLabel>
                      <OutlierDelta $kind={o.kind}>
                        학년 평균보다 {o.delta > 0 ? '+' : ''}
                        {o.delta} {o.delta >= 0 ? '높음' : '낮음'}
                      </OutlierDelta>
                    </div>
                    <ChevronRight
                      size={14}
                      style={{ color: '#9CA3AF', flexShrink: 0, marginTop: '2px' }}
                    />
                  </OutlierItem>
                ))
              )}
            </>
          )}
        </SidePanel>
      </CardBody>
    </CardOuter>
  );
};
