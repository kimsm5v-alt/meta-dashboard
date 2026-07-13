/**
 * 결과보기 전체 현황 (화면 3번)
 *
 * 반 미선택 시 보이는 전체 현황 화면
 * - 반별 비교 분석 (라인 차트 + 요약 패널)
 * - LPA 유형 분포 비교 (1차/2차 스택바)
 *
 * @reference prototype-legacy/src/features/teacher-dashboard/pages/TeacherDashboardPage.tsx
 */

import { useState, useMemo } from 'react';
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
import { Users, TrendingUp, AlertTriangle, ChevronRight, Info } from 'lucide-react';

interface ClassSummary {
  id: string;
  name: string;
  grade: number;
  classNumber: number;
  totalStudents: number;
  assessedStudents: number;
  avgTScore: number;
  categoryAverages: {
    자아강점: number;
    학습디딤돌: number;
    긍정적공부마음: number;
    학습걸림돌: number;
    부정적공부마음: number;
  };
  lpaDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  needsAttentionCount: number;
  round1Completed: boolean;
  round2Completed: boolean;
}

interface ResultOverviewViewProps {
  classes?: ClassSummary[];
  onClassClick: (classId: string, className: string) => void;
}

// Mock 데이터
const MOCK_CLASSES: ClassSummary[] = [
  {
    id: 'group-1',
    name: '2-3반',
    grade: 2,
    classNumber: 3,
    totalStudents: 26,
    assessedStudents: 26,
    avgTScore: 52,
    categoryAverages: {
      자아강점: 54,
      학습디딤돌: 51,
      긍정적공부마음: 55,
      학습걸림돌: 48,
      부정적공부마음: 46,
    },
    lpaDistribution: [
      { type: '몰입자원 풍부형', count: 12, percentage: 46 },
      { type: '안전 균형형', count: 10, percentage: 38 },
      { type: '자원소진형', count: 4, percentage: 16 },
    ],
    needsAttentionCount: 4,
    round1Completed: true,
    round2Completed: false,
  },
  {
    id: 'group-2',
    name: '2-4반',
    grade: 2,
    classNumber: 4,
    totalStudents: 28,
    assessedStudents: 25,
    avgTScore: 54,
    categoryAverages: {
      자아강점: 56,
      학습디딤돌: 53,
      긍정적공부마음: 57,
      학습걸림돌: 45,
      부정적공부마음: 44,
    },
    lpaDistribution: [
      { type: '몰입자원 풍부형', count: 14, percentage: 56 },
      { type: '안전 균형형', count: 8, percentage: 32 },
      { type: '자원소진형', count: 3, percentage: 12 },
    ],
    needsAttentionCount: 2,
    round1Completed: true,
    round2Completed: true,
  },
  {
    id: 'group-3',
    name: '2-5반',
    grade: 2,
    classNumber: 5,
    totalStudents: 27,
    assessedStudents: 24,
    avgTScore: 49,
    categoryAverages: {
      자아강점: 48,
      학습디딤돌: 47,
      긍정적공부마음: 50,
      학습걸림돌: 52,
      부정적공부마음: 53,
    },
    lpaDistribution: [
      { type: '몰입자원 풍부형', count: 8, percentage: 33 },
      { type: '안전 균형형', count: 10, percentage: 42 },
      { type: '자원소진형', count: 6, percentage: 25 },
    ],
    needsAttentionCount: 6,
    round1Completed: true,
    round2Completed: false,
  },
];

// LPA 유형별 색상
const LPA_COLORS: Record<string, string> = {
  '몰입자원 풍부형': '#10B981',
  '안전 균형형': '#F59E0B',
  '자원소진형': '#EF4444',
};

// LPA 유형 순서
const LPA_TYPE_ORDER = ['자원소진형', '안전 균형형', '몰입자원 풍부형'];

// LPA 유형 설명
const LPA_TYPE_DESCRIPTIONS: Record<string, string> = {
  '몰입자원 풍부형':
    '학습 동기와 자원이 풍부하며 긍정적인 학습 태도를 보입니다. 자기주도적 학습이 가능하고 스트레스 관리 능력이 좋습니다.',
  '안전 균형형':
    '전반적으로 안정적인 학습 패턴을 보입니다. 적절한 지원과 격려가 있으면 더 성장할 수 있는 잠재력이 있습니다.',
  '자원소진형':
    '학습 에너지가 소진된 상태로 관심과 지원이 필요합니다. 스트레스 관리와 정서적 지지가 중요합니다.',
};

// 반별 색상
const CLASS_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

// 5대 영역 순서
const CATEGORY_ORDER = ['자아강점', '학습디딤돌', '긍정적공부마음', '학습걸림돌', '부정적공부마음'];

export const ResultOverviewView: React.FC<ResultOverviewViewProps> = ({
  classes = MOCK_CLASSES,
  onClassClick,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // 선택된 반 정보
  const selectedClass = selectedClassId ? classes.find((c) => c.id === selectedClassId) : null;

  // 전체 통계
  const totalStats = useMemo(
    () => ({
      totalClasses: classes.length,
      totalStudents: classes.reduce((sum, c) => sum + c.totalStudents, 0),
      assessedStudents: classes.reduce((sum, c) => sum + c.assessedStudents, 0),
      avgTScore:
        classes.length > 0
          ? Math.round(classes.reduce((sum, c) => sum + c.avgTScore, 0) / classes.length)
          : 0,
      needsAttentionCount: classes.reduce((sum, c) => sum + c.needsAttentionCount, 0),
    }),
    [classes]
  );

  // 라인 차트 데이터 변환
  const chartData = useMemo(() => {
    return CATEGORY_ORDER.map((category) => {
      const dataPoint: Record<string, string | number> = { category };
      classes.forEach((cls) => {
        const key = `${cls.grade}학년 ${cls.classNumber}반`;
        dataPoint[key] =
          cls.categoryAverages[category as keyof typeof cls.categoryAverages] || 50;
      });
      return dataPoint;
    });
  }, [classes]);

  // 요약 패널용 아웃라이어 계산
  const outliers = useMemo(() => {
    const result: Array<{
      cls: ClassSummary;
      category: string;
      t: number;
      delta: number;
      kind: 'warn' | 'good';
    }> = [];

    CATEGORY_ORDER.forEach((category) => {
      const values = classes.map(
        (c) => c.categoryAverages[category as keyof typeof c.categoryAverages]
      );
      const mean = values.reduce((s, v) => s + v, 0) / values.length;

      classes.forEach((cls) => {
        const t = cls.categoryAverages[category as keyof typeof cls.categoryAverages];
        const delta = Math.round(t - mean);
        // 학습걸림돌, 부정적공부마음은 낮을수록 좋음
        const isNegative = category === '학습걸림돌' || category === '부정적공부마음';
        const positiveSignal = isNegative ? delta < 0 : delta > 0;

        if (Math.abs(delta) >= 3) {
          result.push({
            cls,
            category,
            t,
            delta,
            kind: positiveSignal ? 'good' : 'warn',
          });
        }
      });
    });

    // 주의 우선, 편차 절댓값 큰 순 정렬
    result.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'warn' ? -1 : 1;
      return Math.abs(b.delta) - Math.abs(a.delta);
    });

    return result.slice(0, 4);
  }, [classes]);

  const completionRate =
    totalStats.totalStudents > 0
      ? Math.round((totalStats.assessedStudents / totalStats.totalStudents) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-full text-white bg-indigo-500">
              학습종합검사
            </span>
            <nav className="text-sm text-gray-500">
              <span>검사</span>
              <ChevronRight className="inline w-4 h-4 mx-1" />
              <span className="text-gray-900">결과보기</span>
            </nav>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            전체 반 결과 분석
          </h1>
          <p className="text-gray-500 mt-1">
            담당 학급 {classes.length}개 반 · 총 학생 {totalStats.totalStudents}명
          </p>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-sm text-gray-500">담당 반</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {totalStats.totalClasses}
            <span className="text-lg font-normal text-gray-500">개</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-gray-500">전체 평균 T점수</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalStats.avgTScore}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">검사 완료율</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
            <span className="text-sm text-gray-500">
              ({totalStats.assessedStudents}/{totalStats.totalStudents}명)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-gray-500">관심 필요 학생</p>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {totalStats.needsAttentionCount}
            <span className="text-lg font-normal text-gray-500">명</span>
          </p>
        </div>
      </div>

      {/* 반별 비교 분석 (라인 차트 + 요약 패널) */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">반별 비교 분석</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              각 반의 5대 영역별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.
            </p>
          </div>
        </div>

        {/* 메인 콘텐츠: 차트 + 요약 */}
        <div className="flex">
          {/* 라인차트 영역 */}
          <div className="flex-1 p-5">
            {/* 반 선택 칩 */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedClassId(null)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                  selectedClassId === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                전체 ({totalStats.totalStudents}명)
              </button>
              {classes.map((cls, idx) => {
                const color = CLASS_COLORS[idx % CLASS_COLORS.length];
                const isSelected = selectedClassId === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(isSelected ? null : cls.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {cls.grade}학년 {cls.classNumber}반 ({cls.assessedStudents}명)
                  </button>
                );
              })}
            </div>

            {/* 라인 차트 */}
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="category"
                  angle={-25}
                  textAnchor="end"
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
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    padding: '12px 16px',
                    fontSize: '13px',
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '16px', fontSize: '13px', fontWeight: 500 }}
                  iconType="line"
                />
                <ReferenceLine
                  y={50}
                  stroke="#9CA3AF"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: '전국 평균 (50)',
                    position: 'right',
                    fontSize: 11,
                    fill: '#6B7280',
                  }}
                />
                {classes.map((cls, idx) => {
                  const className = `${cls.grade}학년 ${cls.classNumber}반`;
                  const isSelected = selectedClassId === cls.id;
                  const hasSelection = selectedClassId !== null;
                  const color = CLASS_COLORS[idx % CLASS_COLORS.length];

                  return (
                    <Line
                      key={className}
                      type="monotone"
                      dataKey={className}
                      stroke={color}
                      strokeWidth={isSelected ? 4 : hasSelection ? 2 : 3}
                      strokeOpacity={isSelected ? 1 : hasSelection ? 0.25 : 0.9}
                      dot={{
                        r: isSelected ? 6 : hasSelection ? 3 : 5,
                        fill: color,
                        strokeWidth: 2,
                        stroke: '#fff',
                      }}
                      activeDot={{ r: 8, fill: color, strokeWidth: 3, stroke: '#fff' }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 우측 요약 패널 */}
          <div className="w-80 border-l border-gray-100 bg-gray-50 p-5">
            {selectedClass ? (
              // 반 선택 시 요약
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          CLASS_COLORS[classes.findIndex((c) => c.id === selectedClass.id) % 5],
                      }}
                    />
                    <h3 className="text-base font-semibold text-gray-900">
                      {selectedClass.grade}학년 {selectedClass.classNumber}반 분석 요약
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    학생 {selectedClass.assessedStudents}명 · 검사 완료
                  </p>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">평균 T점수</p>
                    <p className="text-xl font-bold text-gray-900 tabular-nums">
                      {selectedClass.avgTScore}.0
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">관심 필요</p>
                    <p className="text-xl font-bold text-red-600 tabular-nums">
                      {selectedClass.needsAttentionCount}명
                    </p>
                  </div>
                </div>

                {/* LPA 분포 */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    유형 분포
                  </p>
                  <div className="flex h-6 rounded-lg overflow-hidden bg-gray-100">
                    {selectedClass.lpaDistribution.map((item) => (
                      <div
                        key={item.type}
                        className="flex items-center justify-center text-[10px] text-white font-medium"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: LPA_COLORS[item.type] || '#9CA3AF',
                        }}
                      >
                        {item.percentage > 15 && `${item.count}명`}
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {selectedClass.lpaDistribution.map((item) => (
                      <div key={item.type} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: LPA_COLORS[item.type] }}
                          />
                          {item.type}
                        </span>
                        <span className="text-gray-500 tabular-nums">{item.count}명</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 상세 보기 버튼 */}
                <button
                  onClick={() => onClassClick(selectedClass.id, selectedClass.name)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {selectedClass.grade}학년 {selectedClass.classNumber}반 상세 분석 보기
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // 전체 비교 요약
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">전체 비교 요약</h3>
                  <p className="text-sm text-gray-500 mt-1">학년 평균과 가장 차이 나는 지점이에요</p>
                </div>

                <div className="space-y-2">
                  {outliers.length === 0 ? (
                    <p className="text-sm text-gray-400">모든 반이 영역별로 고른 분포예요.</p>
                  ) : (
                    outliers.map((o, i) => (
                      <button
                        key={i}
                        onClick={() => onClassClick(o.cls.id, o.cls.name)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                          o.kind === 'warn'
                            ? 'bg-red-50 hover:bg-red-100'
                            : 'bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        <span
                          className={`text-lg ${o.kind === 'warn' ? 'text-red-500' : 'text-emerald-500'}`}
                        >
                          {o.kind === 'warn' ? '▼' : '▲'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {o.cls.grade}학년 {o.cls.classNumber}반 : {o.category}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${o.kind === 'warn' ? 'text-red-600' : 'text-emerald-600'}`}
                          >
                            학년 평균보다 {o.delta > 0 ? '+' : ''}
                            {o.delta} {o.delta >= 0 ? '높음' : '낮음'}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LPA 유형 분포 비교 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">학생 유형 분포 비교</h2>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-96 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <p className="font-bold text-yellow-400 mb-2">학생유형 분포 비교</p>
                  <ul className="space-y-1.5 text-gray-300">
                    <li>• 1차·2차 검사 결과의 유형 분포 변화를 비교합니다.</li>
                    <li>• 자원소진형 비율이 감소하면 긍정적인 변화입니다.</li>
                    <li>• 몰입자원 풍부형 비율이 증가하면 성장의 신호입니다.</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              1차·2차 검사 결과를 나란히 비교합니다. 반 이름을 클릭하면 반 상세 분석으로 이동합니다.
            </p>
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-4">
            {LPA_TYPE_ORDER.map((type) => (
              <div key={type} className="relative group flex items-center gap-1.5 cursor-help">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: LPA_COLORS[type] || '#9CA3AF' }}
                />
                <span className="text-sm text-gray-600">{type}</span>
                {/* 유형별 툴팁 */}
                <div className="absolute right-0 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-lg">
                  <p className="font-bold text-yellow-400 mb-1">{type}</p>
                  <p className="leading-relaxed text-gray-300">{LPA_TYPE_DESCRIPTIONS[type]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 비교 테이블 */}
        <div className="p-5 space-y-3">
          {classes.map((cls) => (
            <LPAComparisonRow
              key={cls.id}
              cls={cls}
              onClassClick={() => onClassClick(cls.id, cls.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// LPA 비교 행 컴포넌트
interface LPAComparisonRowProps {
  cls: ClassSummary;
  onClassClick: () => void;
}

const LPAComparisonRow: React.FC<LPAComparisonRowProps> = ({ cls, onClassClick }) => {
  const renderBar = (sessionNo: 1 | 2) => {
    const isCompleted = sessionNo === 1 ? cls.round1Completed : cls.round2Completed;

    if (!isCompleted) {
      return (
        <div className="flex-1 flex items-center justify-center h-8 bg-gray-50 rounded-lg text-sm text-gray-400">
          {sessionNo}차 검사 미실시
        </div>
      );
    }

    const total = cls.lpaDistribution.reduce((sum, d) => sum + d.count, 0);
    if (total === 0) {
      return (
        <div className="flex-1 flex items-center justify-center h-8 bg-gray-50 rounded-lg text-sm text-gray-400">
          데이터 없음
        </div>
      );
    }

    return (
      <div className="flex-1 relative">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {LPA_TYPE_ORDER.map((type) => {
            const item = cls.lpaDistribution.find((d) => d.type === type);
            if (!item || item.count === 0) return null;
            const pct = Math.round((item.count / total) * 100);
            const color = LPA_COLORS[type] || '#9CA3AF';

            return (
              <div
                key={type}
                className="group flex items-center justify-center text-xs text-white font-medium cursor-help relative"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                }}
              >
                {pct > 12 && `${item.count}명`}
                {/* 호버 툴팁 */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 shadow-lg pointer-events-none">
                  <p className="font-bold text-yellow-400 mb-1">{type}</p>
                  <p className="text-gray-100 mb-2">
                    {item.count}명 ({pct}%)
                  </p>
                  <p className="leading-relaxed text-gray-300">{LPA_TYPE_DESCRIPTIONS[type]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* 반 이름 */}
      <button onClick={onClassClick} className="w-24 text-left group">
        <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
          {cls.grade}학년 {cls.classNumber}반
        </span>
        <span className="text-xs text-gray-500 ml-1">({cls.totalStudents}명)</span>
      </button>

      {/* 1차 */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 w-8">1차</span>
        {renderBar(1)}
      </div>

      {/* 2차 */}
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 w-8">2차</span>
        {renderBar(2)}
      </div>

      {/* 상세 버튼 */}
      <button
        onClick={onClassClick}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
      >
        상세
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ResultOverviewView;
