import { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { Card } from '@shared/components';
import { CategoryComparisonChart } from '@features/teacher-dashboard/ui';
import {
  calculateCategoryAverages,
} from '@shared/utils/classComparisonUtils';
import type { Class, FactorCategory } from '@shared/types';
import type { ClassCategoryAverage } from '@shared/types';

// ============================================================
// 5대 영역 극성 (outlier 방향 판정)
// ============================================================

const AREA_POLARITY: Record<FactorCategory, 'positive' | 'negative'> = {
  자아강점: 'positive',
  학습디딤돌: 'positive',
  긍정적공부마음: 'positive',
  학습걸림돌: 'negative',
  부정적공부마음: 'negative',
};

const AREA_ORDER: FactorCategory[] = [
  '자아강점', '학습디딤돌', '긍정적공부마음', '학습걸림돌', '부정적공부마음',
];

const AREA_COLORS: Record<FactorCategory, string> = {
  자아강점: '#3B82F6',
  학습디딤돌: '#10B981',
  긍정적공부마음: '#8B5CF6',
  학습걸림돌: '#EF4444',
  부정적공부마음: '#F59E0B',
};

// TYPE_COLORS for selected-class type distribution
const TYPE_COLORS: Record<string, string> = {
  '자원소진형': '#E74C3C',
  '안전 균형형': '#3498DB',
  '몰입자원 풍부형': '#2ECC71',
  '냉소적 무기력형': '#E74C3C',
  '정서조절 취약형': '#F39C12',
  '자기주도 몰입형': '#2ECC71',
};

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
  gap: 0.25rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.25rem;
`;

const DrillBtn = styled.button<{ $active: boolean }>`
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

const ChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 1rem;
`;

const Chip = styled.button<{ $active: boolean; $color?: string }>`
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
  color: ${({ $active }) => ($active ? '#fff' : '#4B5563')};

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

const CardBody = styled.div`
  display: flex;
  min-height: 0;
`;

const ChartArea = styled.div`
  flex: 1;
  padding: 1rem 1.5rem 1.25rem;
  min-width: 0;
`;

const SidePanel = styled.div`
  width: 280px;
  flex-shrink: 0;
  border-left: 1px solid ${({ theme }) => theme.colors.gray[100]};
  background: ${({ theme }) => theme.colors.gray[50]};
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
  margin-bottom: 0.25rem;
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

  &:hover {
    background: ${({ $kind }) => ($kind === 'warn' ? '#FEE2E2' : '#D1FAE5')};
  }
`;

const OutlierArrow = styled.span<{ $kind: 'good' | 'warn' }>`
  font-size: 1rem;
  line-height: 1;
  color: ${({ $kind }) => ($kind === 'warn' ? '#EF4444' : '#10B981')};
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const OutlierLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  line-height: 1.3;
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

// Selected class panel
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
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

const KpiBoxValue = styled.p<{ $color?: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $color, theme }) => $color ?? theme.colors.gray[900]};
`;

const KpiBoxSub = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.125rem;
`;

const TypeBar = styled.div`
  display: flex;
  height: 1.5rem;
  border-radius: 0.375rem;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const TypeBarSegment = styled.div<{ $pct: number; $color: string }>`
  width: ${({ $pct }) => $pct}%;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  color: white;
  font-weight: 600;
`;

const GoToClassBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: #4F46E5;
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: auto;

  &:hover {
    background: #4338CA;
  }
`;

const SectionLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.375rem;
`;

const ConcernItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  margin-bottom: 0.375rem;
`;

// ============================================================
// Outlier computation helpers
// ============================================================

interface OutlierCell {
  cls: Class;
  category: FactorCategory;
  t: number;
  delta: number;
  kind: 'good' | 'warn';
  strong: boolean;
}

function computeOutliers(classes: Class[], classAverages: ClassCategoryAverage[]): OutlierCell[] {
  const outliers: OutlierCell[] = [];

  AREA_ORDER.forEach((category) => {
    const values = classAverages.map((a) => a.categoryAverages[category]);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;

    classAverages.forEach((avg, idx) => {
      const cls = classes[idx];
      const t = avg.categoryAverages[category];
      const delta = Math.round(t - mean);
      const polarity = AREA_POLARITY[category];
      const positiveSignal = polarity === 'negative' ? delta < 0 : delta > 0;
      outliers.push({ cls, category, t, delta, kind: positiveSignal ? 'good' : 'warn', strong: Math.abs(delta) >= 3 });
    });
  });

  outliers.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'warn' ? -1 : 1;
    return Math.abs(b.delta) - Math.abs(a.delta);
  });

  return outliers;
}

// ============================================================
// Main Component
// ============================================================

interface ComparisonSectionProps {
  classes: Class[];
  selectedClassId: string | null;
  onClassSelect: (classId: string | null) => void;
  onGoToClass: (classId: string) => void;
}

export const ComparisonSection = ({
  classes,
  selectedClassId,
  onClassSelect,
  onGoToClass,
}: ComparisonSectionProps) => {
  const [drillLevel, setDrillLevel] = useState<'5areas' | '11categories'>('5areas');

  const classAverages = useMemo(() => classes.map(calculateCategoryAverages), [classes]);

  const outliers = useMemo(() => computeOutliers(classes, classAverages), [classes, classAverages]);

  const selectedClass = useMemo(
    () => (selectedClassId ? classes.find((c) => c.id === selectedClassId) : null),
    [classes, selectedClassId],
  );

  const selectedAvg = useMemo(
    () => (selectedClassId ? classAverages.find((a) => a.classId === selectedClassId) : null),
    [selectedClassId, classAverages],
  );

  const avgT = useMemo(() => {
    if (!selectedAvg) return null;
    return Math.round(
      Object.entries(selectedAvg.categoryAverages).reduce((sum, [cat, val]) => {
        const polarity = AREA_POLARITY[cat as FactorCategory];
        return sum + (polarity === 'negative' ? 100 - val : val);
      }, 0) / 5,
    );
  }, [selectedAvg]);

  const concerns = useMemo(() => {
    if (!selectedAvg) return [];
    return Object.entries(selectedAvg.categoryAverages)
      .map(([cat, t]) => {
        const polarity = AREA_POLARITY[cat as FactorCategory];
        const score = polarity === 'negative' ? t - 50 : 50 - t;
        return { category: cat as FactorCategory, t, score, polarity };
      })
      .filter((a) => a.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }, [selectedAvg]);

  const callouts = useMemo(() => {
    const strong = outliers.filter((o) => o.strong);
    return (strong.length ? strong : outliers).slice(0, 4);
  }, [outliers]);

  const drillSubtitle =
    drillLevel === '5areas'
      ? '각 반의 5대 영역별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.'
      : '각 반의 11개 중분류별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.';

  const totalStudents = classes.reduce((s, c) => s + (c.stats?.totalStudents || 0), 0);

  const CLASS_COLORS_LIST = [
    '#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
    '#14B8A6', '#F97316', '#06B6D4',
  ];

  return (
    <CardOuter>
      {/* Header */}
      <CardHeader>
        <div>
          <CardTitle>반별 비교 분석</CardTitle>
          <CardSubtitle>{drillSubtitle}</CardSubtitle>
        </div>
        <DrillToggle>
          <DrillBtn $active={drillLevel === '5areas'} onClick={() => setDrillLevel('5areas')}>
            5대 영역
          </DrillBtn>
          <DrillBtn $active={drillLevel === '11categories'} onClick={() => setDrillLevel('11categories')}>
            11개 요인
          </DrillBtn>
        </DrillToggle>
      </CardHeader>

      {/* Body */}
      <CardBody>
        {/* Chart */}
        <ChartArea>
          {/* Class Chips */}
          <ChipsRow>
            <Chip $active={selectedClassId === null} onClick={() => onClassSelect(null)}>
              <ChipDot $color="#9CA3AF" />
              전체 ({totalStudents}명)
            </Chip>
            {classes.map((cls, idx) => {
              const color = CLASS_COLORS_LIST[idx % CLASS_COLORS_LIST.length];
              const isActive = selectedClassId === cls.id;
              return (
                <Chip
                  key={cls.id}
                  $active={isActive}
                  $color={color}
                  onClick={() => onClassSelect(isActive ? null : cls.id)}
                >
                  <ChipDot $color={color} />
                  {cls.grade}학년 {cls.classNumber}반 ({cls.stats?.assessedStudents || 0}명)
                </Chip>
              );
            })}
          </ChipsRow>
          <CategoryComparisonChart
            classes={classes}
            selectedClassId={selectedClassId}
            onClassSelect={onClassSelect}
            drillLevel={drillLevel}
          />
        </ChartArea>

        {/* Side Panel */}
        <SidePanel>
          {!selectedClass || !selectedAvg ? (
            /* 전체 비교 요약 */
            <>
              <div>
                <PanelTitle>전체 비교 요약</PanelTitle>
                <PanelSubtitle>학년 평균과 가장 차이 나는 지점이에요</PanelSubtitle>
              </div>
              <div>
                {callouts.length === 0 ? (
                  <EmptyText>모든 반이 고른 분포예요.</EmptyText>
                ) : (
                  callouts.map((c, i) => (
                    <OutlierItem
                      key={i}
                      $kind={c.kind}
                      onClick={() => onGoToClass(c.cls.id)}
                      style={{ marginBottom: '0.5rem' }}
                    >
                      <OutlierArrow $kind={c.kind}>{c.kind === 'warn' ? '▼' : '▲'}</OutlierArrow>
                      <div>
                        <OutlierLabel>
                          {c.cls.grade}학년 {c.cls.classNumber}반 : {c.category}
                        </OutlierLabel>
                        <OutlierDelta $kind={c.kind}>
                          학년 평균보다 {c.delta > 0 ? '+' : ''}{c.delta || 1}{' '}
                          {c.delta >= 0 ? '높음' : '낮음'}
                        </OutlierDelta>
                      </div>
                    </OutlierItem>
                  ))
                )}
              </div>
            </>
          ) : (
            /* 선택된 반 요약 */
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: '#6366F1', display: 'inline-block' }} />
                  <PanelTitle>
                    {selectedClass.grade}학년 {selectedClass.classNumber}반 분석 요약
                  </PanelTitle>
                </div>
                <PanelSubtitle>
                  학생 {selectedClass.stats?.assessedStudents || 0}명 · 검사 완료
                </PanelSubtitle>
              </div>

              <KpiGrid>
                <KpiBox>
                  <KpiBoxLabel>평균 T점수</KpiBoxLabel>
                  <KpiBoxValue>{avgT ?? '-'}</KpiBoxValue>
                  <KpiBoxSub>전국 대비 {avgT != null ? (avgT - 50 >= 0 ? '+' : '') + (avgT - 50) : '-'}</KpiBoxSub>
                </KpiBox>
                <KpiBox>
                  <KpiBoxLabel>관심 필요</KpiBoxLabel>
                  <KpiBoxValue $color="#DC2626">{selectedClass.stats?.needAttentionCount ?? 0}명</KpiBoxValue>
                  <KpiBoxSub>
                    {selectedClass.stats?.totalStudents
                      ? Math.round(((selectedClass.stats.needAttentionCount ?? 0) / selectedClass.stats.totalStudents) * 100)
                      : 0}%
                  </KpiBoxSub>
                </KpiBox>
              </KpiGrid>

              {concerns.length > 0 && (
                <div>
                  <SectionLabel>관심 영역 ({concerns.length})</SectionLabel>
                  {concerns.map((a) => (
                    <ConcernItem key={a.category}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: AREA_COLORS[a.category], display: 'inline-block' }} />
                        <span style={{ fontSize: '0.875rem', color: '#1F2937' }}>{a.category}</span>
                      </div>
                      <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                        T {a.t}{' '}
                        <span style={{ color: a.polarity === 'negative' ? '#EF4444' : '#3B82F6' }}>
                          {a.polarity === 'negative' ? '↑' : '↓'}
                        </span>
                      </span>
                    </ConcernItem>
                  ))}
                </div>
              )}

              {selectedClass.stats?.typeDistribution && (
                <div>
                  <SectionLabel>유형 분포</SectionLabel>
                  <TypeBar>
                    {Object.entries(selectedClass.stats.typeDistribution).map(([type, data]) => {
                      const color = TYPE_COLORS[type] ?? '#9CA3AF';
                      if (data.percentage === 0) return null;
                      return (
                        <TypeBarSegment key={type} $pct={data.percentage} $color={color} title={`${type}: ${data.count}명`}>
                          {data.percentage > 15 && `${data.count}명`}
                        </TypeBarSegment>
                      );
                    })}
                  </TypeBar>
                </div>
              )}

              <GoToClassBtn onClick={() => onGoToClass(selectedClass.id)}>
                {selectedClass.grade}학년 {selectedClass.classNumber}반 상세 분석 →
              </GoToClassBtn>
            </>
          )}
        </SidePanel>
      </CardBody>
    </CardOuter>
  );
};
