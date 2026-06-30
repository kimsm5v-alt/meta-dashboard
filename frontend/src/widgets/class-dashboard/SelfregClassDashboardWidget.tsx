import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Search, ExternalLink } from 'lucide-react';
import styled from '@emotion/styled';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Cell,
  LabelList,
} from 'recharts';
import { Card } from '@shared/components';
import { useSelfregClassAnalysis, useClassStudents } from '@features/api';

// ============================================================
// 자기조절학습검사 6개 중분류 + 20요인 정의
// ============================================================

const SUBCATEGORY_INFO = [
  {
    name: '학습원동력',
    shortName: '학습\n원동력',
    indices: [0, 1, 2],
    domain: '동기전략',
    color: '#9F91F8',
  },
  {
    name: '정서조절',
    shortName: '정서\n조절',
    indices: [3, 4, 5],
    domain: '동기전략',
    color: '#9F91F8',
  },
  {
    name: '메타인지',
    shortName: '메타\n인지',
    indices: [6, 7, 8],
    domain: '인지전략',
    color: '#4BC1FF',
  },
  {
    name: '인지적학습기술',
    shortName: '인지적\n학습기술',
    indices: [9, 10, 11],
    domain: '인지전략',
    color: '#4BC1FF',
  },
  {
    name: '행동조절',
    shortName: '행동\n조절',
    indices: [12, 13, 14],
    domain: '행동전략',
    color: '#FF8A94',
  },
  {
    name: '행동적학습기술',
    shortName: '행동적\n학습기술',
    indices: [15, 16, 17, 18, 19],
    domain: '행동전략',
    color: '#FF8A94',
  },
];

const DOMAIN_INFO: Record<string, { color: string; bg: string }> = {
  동기전략: { color: '#9F91F8', bg: '#F5F3FF' },
  인지전략: { color: '#4BC1FF', bg: '#EFF9FF' },
  행동전략: { color: '#FF8A94', bg: '#FFF1F2' },
};

const FACTOR_NAMES = [
  '마인드셋',
  '자아효능감',
  '학습동기',
  '등급조절',
  '유형조절',
  '실패조절',
  '계획능력',
  '점검능력',
  '통제능력',
  '이해기술',
  '기억기술',
  '의도기술',
  '자기칭찬',
  '도움구하기',
  '학습지속성',
  '학습환경',
  '시간통제',
  '학습태도',
  '노트필기',
  '시험준비',
];

const RECOMMENDED_ACTIVITIES = [
  {
    id: 'emotion-check',
    title: '감정 온도계 활동',
    description: '매일 아침 자신의 감정 상태를 체크하고 공유하는 활동입니다.',
  },
  {
    id: 'peer-learning',
    title: '또래 학습 멘토링',
    description: '학습 강점이 다른 학생끼리 짝을 이루어 서로 가르치는 활동입니다.',
  },
  {
    id: 'metacognition',
    title: '메타인지 학습일지',
    description: '매주 학습 과정을 돌아보고 다음 주 계획을 세우는 활동입니다.',
  },
];

// ============================================================
// Helpers
// ============================================================

function computeSubcategoryAvgs(tScores: number[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const cat of SUBCATEGORY_INFO) {
    const vals = cat.indices.map((i) => tScores[i] ?? 50);
    result[cat.name] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  return result;
}

// ============================================================
// Styled Components
// ============================================================

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div``;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.625rem;
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.gray[500]};
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const BadgeTeal = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #fff;
  background: #009f88;
`;

const BreadcrumbSep = styled(ChevronRight)`
  color: ${({ theme }) => theme.colors.gray[400]};
  flex-shrink: 0;
`;

const BreadcrumbText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

// Tabs
const TabNav = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray[200]};
`;

const TabBtn = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ $active, theme }) => ($active ? '#009f88' : theme.colors.gray[500])};
  border-bottom: 2px solid ${({ $active }) => ($active ? '#009f88' : 'transparent')};
  margin-bottom: -2px;
  transition: all 0.15s;

  &:hover {
    color: ${({ $active, theme }) => ($active ? '#009f88' : theme.colors.gray[700])};
  }
`;

// KPI cards row
const KpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const KpiCard = styled(Card)`
  padding: 1.25rem 1.5rem;
`;

const KpiLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.375rem;
`;

const KpiValue = styled.p<{ $color?: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $color, theme }) => $color ?? theme.colors.gray[900]};
  line-height: 1.2;
`;

const KpiSub = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-top: 0.25rem;
`;

// Round toggle
const RoundToggle = styled.div`
  display: flex;
  gap: 0.25rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 0.25rem;
`;

const RoundBtn = styled.button<{ $active: boolean; $disabled?: boolean }>`
  padding: 0.375rem 0.875rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.md};
  border: none;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition: all 150ms ease;
  background: ${({ $active, theme }) => ($active ? theme.colors.background.paper : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.gray[900] : theme.colors.gray[600])};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.sm : 'none')};
`;

// Chart section
const SectionCard = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const SectionBody = styled.div`
  padding: 1.5rem;
`;

const ChartContainer = styled.div`
  height: 280px;
`;

// Domain legend for chart
const DomainLegend = styled.div`
  display: flex;
  gap: 1.25rem;
  justify-content: center;
  margin-top: 0.75rem;
`;

const DomainLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const DomainDot = styled.span<{ $color: string }>`
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

// Selfreg positive note
const NoteBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #166534;
  margin-top: 0.75rem;
`;

// Recommended activities
const ActivitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ActivityCard = styled.div`
  padding: 1rem 1.25rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background: ${({ theme }) => theme.colors.background.paper};
`;

const ActivityTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.375rem;
`;

const ActivityDesc = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.5;
`;

// Detail tab
const DetailCard = styled(Card)`
  padding: 1.5rem;
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
`;

const DetailTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const AnalysisLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  background: ${({ theme }) => theme.colors.background.paper};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
    border-color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const DomainSection = styled.div`
  margin-bottom: 2rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const DomainLabel = styled.div<{ $color: string; $bg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 0.75rem;
`;

const FactorChartContainer = styled.div`
  height: 180px;
`;

// Student list tab
const StudentListCard = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const StudentListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const SearchWrapper = styled.div`
  position: relative;
  width: 220px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[900]};
  background: ${({ theme }) => theme.colors.background.paper};
  outline: none;

  &:focus {
    border-color: #009f88;
    box-shadow: 0 0 0 2px rgba(0, 159, 136, 0.1);
  }
`;

const SearchIconWrap = styled.span`
  position: absolute;
  left: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.gray[400]};
  display: flex;
  align-items: center;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Thead = styled.thead``;

const THeadRow = styled.tr`
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Th = styled.th<{ $align?: 'left' | 'center' }>`
  text-align: ${({ $align }) => $align ?? 'left'};
  padding: 0.75rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Tbody = styled.tbody``;

const TRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  cursor: pointer;
  transition: background 0.12s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const Td = styled.td<{ $align?: 'left' | 'center' }>`
  padding: 0.875rem 0.75rem;
  text-align: ${({ $align }) => $align ?? 'left'};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const StudentNum = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const StudentName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 10rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

// Tooltip for chart
const ChartTooltipBox = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  padding: 0.625rem 0.875rem;
  box-shadow: ${({ theme }) => theme.shadows.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

// ============================================================
// Sub-components
// ============================================================

type TooltipPayloadItem = {
  name: string;
  value: number;
  color?: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
};

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  const level =
    score >= 65
      ? '매우높음'
      : score >= 55
        ? '높음'
        : score >= 45
          ? '보통'
          : score >= 35
            ? '낮음'
            : '매우낮음';
  return (
    <ChartTooltipBox>
      <p style={{ fontWeight: 600, marginBottom: 2 }}>{label}</p>
      <p>
        T점수: <strong>{score}</strong>
      </p>
      <p style={{ color: '#6B7280' }}>등급: {level}</p>
    </ChartTooltipBox>
  );
};

// ============================================================
// Main Component
// ============================================================

export const SelfregClassDashboardWidget: React.FC = () => {
  const { classId, testId = 'selfreg' } = useParams<{ classId: string; testId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'summary' | 'detail' | 'students'>('summary');
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { round1, round2, isLoading: chartLoading } = useSelfregClassAnalysis(classId);
  const { students, classInfo, isLoading: studentsLoading } = useClassStudents(classId, '2');

  const hasRound2 = !!round2;
  const activeScores = selectedRound === 1 ? round1 : (round2 ?? round1);

  const subCategoryAvgs = useMemo(
    () => (activeScores ? computeSubcategoryAvgs(activeScores) : {}),
    [activeScores],
  );

  const overallAvg = useMemo(() => {
    if (!activeScores) return null;
    return Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length);
  }, [activeScores]);

  const topSubcategory = useMemo(() => {
    const entries = Object.entries(subCategoryAvgs);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [subCategoryAvgs]);

  const bottomSubcategory = useMemo(() => {
    const entries = Object.entries(subCategoryAvgs);
    if (!entries.length) return null;
    return entries.sort((a, b) => a[1] - b[1])[0];
  }, [subCategoryAvgs]);

  const barChartData = useMemo(
    () =>
      SUBCATEGORY_INFO.map((cat) => ({
        name: cat.name,
        score: subCategoryAvgs[cat.name] ?? 0,
        color: cat.color,
        domain: cat.domain,
      })),
    [subCategoryAvgs],
  );

  const factorChartsByDomain = useMemo(() => {
    if (!activeScores) return [];
    const domains = ['동기전략', '인지전략', '행동전략'];
    const domainIndices: Record<string, number[]> = {
      동기전략: [0, 1, 2, 3, 4, 5],
      인지전략: [6, 7, 8, 9, 10, 11],
      행동전략: [12, 13, 14, 15, 16, 17, 18, 19],
    };
    return domains.map((domain) => ({
      domain,
      color: DOMAIN_INFO[domain].color,
      bg: DOMAIN_INFO[domain].bg,
      factors: domainIndices[domain].map((i) => ({
        name: FACTOR_NAMES[i],
        score: activeScores[i] ?? 50,
      })),
    }));
  }, [activeScores]);

  const classTitle = classInfo ? `${classInfo.grade}학년 ${classInfo.classNumber}반` : '학급';

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) return students;
    return students.filter((s) => s.name.includes(term) || String(s.number).includes(term));
  }, [students, searchTerm]);

  const isLoading = chartLoading && studentsLoading;

  if (isLoading && !activeScores) {
    return (
      <PageContainer>
        <EmptyState>데이터를 불러오는 중...</EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <Header>
        <Breadcrumb>
          <BackBtn onClick={() => navigate(`/dashboard/${testId}`)}>
            <ArrowLeft size={16} />
          </BackBtn>
          <BadgeTeal>자기조절검사</BadgeTeal>
          <BreadcrumbSep size={14} />
          <BreadcrumbText>결과보기</BreadcrumbText>
          <BreadcrumbSep size={14} />
          <BreadcrumbText style={{ color: '#111827', fontWeight: 500 }}>
            {classTitle}
          </BreadcrumbText>
        </Breadcrumb>
        <PageTitle>{classTitle} 자기조절학습 분석</PageTitle>
      </Header>

      {/* Tab Navigation */}
      <TabNav>
        <TabBtn $active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
          핵심요약
        </TabBtn>
        <TabBtn $active={activeTab === 'detail'} onClick={() => setActiveTab('detail')}>
          학습상세
        </TabBtn>
        <TabBtn $active={activeTab === 'students'} onClick={() => setActiveTab('students')}>
          학생목록
        </TabBtn>
      </TabNav>

      {/* ── 핵심요약 탭 ── */}
      {activeTab === 'summary' && (
        <>
          {/* KPI Cards */}
          <KpiRow>
            <KpiCard>
              <KpiLabel>학급 평균 T점수</KpiLabel>
              <KpiValue $color='#009f88'>{overallAvg ?? '-'}</KpiValue>
              <KpiSub>전체 20요인 평균</KpiSub>
            </KpiCard>
            <KpiCard>
              <KpiLabel>대표 강점</KpiLabel>
              <KpiValue style={{ fontSize: '1.125rem' }}>
                {topSubcategory ? topSubcategory[0] : '-'}
              </KpiValue>
              <KpiSub>{topSubcategory ? `T${topSubcategory[1]}` : '데이터 없음'}</KpiSub>
            </KpiCard>
            <KpiCard>
              <KpiLabel>주의 영역</KpiLabel>
              <KpiValue style={{ fontSize: '1.125rem' }} $color='#EF4444'>
                {bottomSubcategory ? bottomSubcategory[0] : '-'}
              </KpiValue>
              <KpiSub>{bottomSubcategory ? `T${bottomSubcategory[1]}` : '데이터 없음'}</KpiSub>
            </KpiCard>
            <KpiCard>
              <KpiLabel>검사 차수</KpiLabel>
              <KpiValue
                style={{ fontSize: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
              >
                {round1 && <span style={{ color: '#009f88' }}>1차 ✓</span>}
                {round2 && <span style={{ color: '#6366f1' }}>2차 ✓</span>}
                {!round1 && !round2 && <span style={{ color: '#9CA3AF' }}>-</span>}
              </KpiValue>
              <KpiSub>완료된 검사 차수</KpiSub>
            </KpiCard>
          </KpiRow>

          {/* 6개 중분류 Bar Chart */}
          <SectionCard>
            <SectionHeader>
              <div>
                <SectionTitle>6개 중분류 학급 평균</SectionTitle>
              </div>
              <RoundToggle>
                <RoundBtn $active={selectedRound === 1} onClick={() => setSelectedRound(1)}>
                  1차
                </RoundBtn>
                <RoundBtn
                  $active={selectedRound === 2}
                  $disabled={!hasRound2}
                  onClick={() => hasRound2 && setSelectedRound(2)}
                >
                  2차
                </RoundBtn>
              </RoundToggle>
            </SectionHeader>
            <SectionBody>
              <ChartContainer>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={barChartData}
                    margin={{ top: 20, right: 24, left: 0, bottom: 8 }}
                    barSize={48}
                  >
                    {/* Level bands */}
                    <ReferenceArea y1={0} y2={35} fill='#FEE2E2' fillOpacity={0.35} />
                    <ReferenceArea y1={35} y2={45} fill='#FEF9C3' fillOpacity={0.35} />
                    <ReferenceArea y1={45} y2={55} fill='#F3F4F6' fillOpacity={0.35} />
                    <ReferenceArea y1={55} y2={65} fill='#D1FAE5' fillOpacity={0.35} />
                    <ReferenceArea y1={65} y2={80} fill='#A7F3D0' fillOpacity={0.35} />

                    <CartesianGrid vertical={false} stroke='#E5E7EB' strokeDasharray='3 3' />
                    <XAxis
                      dataKey='name'
                      tick={{ fontSize: 11, fill: '#6B7280' }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis
                      domain={[30, 75]}
                      tickCount={6}
                      tick={{ fontSize: 11, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine
                      y={50}
                      stroke='#9CA3AF'
                      strokeDasharray='4 4'
                      strokeWidth={1.5}
                    />
                    <Bar dataKey='score' radius={[4, 4, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList
                        dataKey='score'
                        position='top'
                        style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Domain Legend */}
              <DomainLegend>
                {Object.entries(DOMAIN_INFO).map(([name, { color }]) => (
                  <DomainLegendItem key={name}>
                    <DomainDot $color={color} />
                    {name}
                  </DomainLegendItem>
                ))}
              </DomainLegend>

              {/* Positive note */}
              <NoteBox>
                <span>💡</span>
                <span>
                  자기조절학습검사의 모든 요인은 <strong>정적 요인</strong>으로, 점수가 높을수록
                  학습에 유리한 특성을 보입니다.
                </span>
              </NoteBox>
            </SectionBody>
          </SectionCard>

          {/* 추천 학급 운영 활동 */}
          <SectionCard>
            <SectionHeader>
              <SectionTitle>추천 학급 운영 활동</SectionTitle>
            </SectionHeader>
            <SectionBody>
              <ActivitiesGrid>
                {RECOMMENDED_ACTIVITIES.map((act) => (
                  <ActivityCard key={act.id}>
                    <ActivityTitle>{act.title}</ActivityTitle>
                    <ActivityDesc>{act.description}</ActivityDesc>
                  </ActivityCard>
                ))}
              </ActivitiesGrid>
            </SectionBody>
          </SectionCard>
        </>
      )}

      {/* ── 학습상세 탭 ── */}
      {activeTab === 'detail' && (
        <DetailCard>
          <DetailHeader>
            <DetailTitle>20요인 상세 분석</DetailTitle>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <RoundToggle>
                <RoundBtn $active={selectedRound === 1} onClick={() => setSelectedRound(1)}>
                  1차
                </RoundBtn>
                <RoundBtn
                  $active={selectedRound === 2}
                  $disabled={!hasRound2}
                  onClick={() => hasRound2 && setSelectedRound(2)}
                >
                  2차
                </RoundBtn>
              </RoundToggle>
              <AnalysisLink
                onClick={() => navigate(`/dashboard/${testId}/class/${classId}/analysis`)}
              >
                <ExternalLink size={14} />
                상세 분석 보기
              </AnalysisLink>
            </div>
          </DetailHeader>

          {factorChartsByDomain.map(({ domain, color, bg, factors }) => (
            <DomainSection key={domain}>
              <DomainLabel $color={color} $bg={bg}>
                {domain}
              </DomainLabel>
              <FactorChartContainer>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={factors}
                    margin={{ top: 16, right: 16, left: 0, bottom: 4 }}
                    barSize={32}
                  >
                    <ReferenceArea y1={0} y2={35} fill='#FEE2E2' fillOpacity={0.3} />
                    <ReferenceArea y1={35} y2={45} fill='#FEF9C3' fillOpacity={0.3} />
                    <ReferenceArea y1={45} y2={55} fill='#F3F4F6' fillOpacity={0.3} />
                    <ReferenceArea y1={55} y2={65} fill='#D1FAE5' fillOpacity={0.3} />
                    <ReferenceArea y1={65} y2={80} fill='#A7F3D0' fillOpacity={0.3} />

                    <CartesianGrid vertical={false} stroke='#E5E7EB' strokeDasharray='3 3' />
                    <XAxis
                      dataKey='name'
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis
                      domain={[30, 75]}
                      tickCount={5}
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine
                      y={50}
                      stroke='#9CA3AF'
                      strokeDasharray='4 4'
                      strokeWidth={1.5}
                    />
                    <Bar dataKey='score' fill={color} radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey='score'
                        position='top'
                        style={{ fontSize: 11, fontWeight: 600, fill: '#374151' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </FactorChartContainer>
            </DomainSection>
          ))}

          {!activeScores && <EmptyState>검사 데이터가 없습니다.</EmptyState>}
        </DetailCard>
      )}

      {/* ── 학생목록 탭 ── */}
      {activeTab === 'students' && (
        <StudentListCard>
          <StudentListHeader>
            <SectionTitle>학생 목록 ({filteredStudents.length}명)</SectionTitle>
            <SearchWrapper>
              <SearchIconWrap>
                <Search size={14} />
              </SearchIconWrap>
              <SearchInput
                placeholder='이름 또는 번호 검색'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchWrapper>
          </StudentListHeader>

          <TableWrapper>
            {filteredStudents.length === 0 ? (
              <EmptyState>
                {studentsLoading ? '학생 목록을 불러오는 중...' : '학생 정보가 없습니다.'}
              </EmptyState>
            ) : (
              <Table>
                <Thead>
                  <THeadRow>
                    <Th $align='center' style={{ width: '4rem' }}>
                      번호
                    </Th>
                    <Th>이름</Th>
                    <Th $align='center'>개인 분석 보기</Th>
                  </THeadRow>
                </Thead>
                <Tbody>
                  {filteredStudents.map((student) => (
                    <TRow
                      key={student.id}
                      onClick={() =>
                        navigate(`/dashboard/${testId}/class/${classId}/student/${student.id}`)
                      }
                    >
                      <Td $align='center'>
                        <StudentNum>{student.number}</StudentNum>
                      </Td>
                      <Td>
                        <StudentName>{student.name}</StudentName>
                      </Td>
                      <Td $align='center'>
                        <ExternalLink size={14} color='#9CA3AF' />
                      </Td>
                    </TRow>
                  ))}
                </Tbody>
              </Table>
            )}
          </TableWrapper>
        </StudentListCard>
      )}
    </PageContainer>
  );
};

export default SelfregClassDashboardWidget;
