/**
 * 검사 > 결과보기 > 반 선택 시 화면
 *
 * 화면 구성 순서:
 * 1. 학급 요약 제공 (상단)
 * 2. 종합 결과 요약
 * 3. 우리 반 강점/보완점 top3
 * 4. 검사별 유형 분포
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 * @see prototype-legacy/src/features/class-dashboard-v2
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Check, AlertCircle, Info, ChevronRight, AlertTriangle } from 'lucide-react';
import type { ClassResultSummary, LPADistribution, ProfileFactor } from '@/features/class-dashboard/types';
import type { StudentExamResult } from '../types';
import { TYPE_COLORS } from '@/shared/data/lpaProfiles';

interface ClassResultViewProps {
  className: string;
  onBack: () => void;
  resultData: ClassResultSummary;
  /** 학생 클릭 핸들러 (학생 결과 화면으로 이동) */
  onStudentClick?: (studentId: string) => void;
  /** 학생 결과 목록 */
  students?: StudentExamResult[];
}

// Mock 학교 정보
const MOCK_SCHOOL_INFO = {
  schoolName: '한빛중학교',
  eduLevel: '중학교',
};

// 11개 중분류 정보 (Depth 2 기준 - 02_검사구조.md 참조)
// breakLine: 차트 X축 라벨에서 줄바꿈 위치 지정 [첫째줄, 둘째줄]
const CATEGORY_ORDER = [
  { id: 'positiveSelf', name: '긍정적 자아', area: '자아강점', color: '#00D282', breakLine: ['긍정적', '자아'] },
  { id: 'interpersonal', name: '대인관계능력', area: '자아강점', color: '#00D282', breakLine: ['대인관계', '능력'] },
  { id: 'metaCognition', name: '메타인지', area: '학습디딤돌', color: '#4BC1FF' },
  { id: 'learningSkill', name: '학습기술', area: '학습디딤돌', color: '#4BC1FF' },
  { id: 'supportiveRelation', name: '지지적 관계', area: '학습디딤돌', color: '#4BC1FF', breakLine: ['지지적', '관계'] },
  { id: 'academicEngagement', name: '학업열의', area: '긍정적공부마음', color: '#67A7FF' },
  { id: 'growthPower', name: '성장력', area: '긍정적공부마음', color: '#67A7FF' },
  { id: 'academicStress', name: '학업스트레스', area: '학습걸림돌', color: '#FF849F', breakLine: ['학업', '스트레스'] },
  { id: 'learningObstacle', name: '학습방해물', area: '학습걸림돌', color: '#FF849F' },
  { id: 'relationStress', name: '학업관계스트레스', area: '학습걸림돌', color: '#FF849F', breakLine: ['학업관계', '스트레스'] },
  { id: 'academicBurnout', name: '학업소진', area: '부정적공부마음', color: '#FF87D4' },
];

// 5대 영역 정보
const AREA_INFO: Record<string, { color: string; polarity: 'positive' | 'negative' }> = {
  '자아강점': { color: '#00D282', polarity: 'positive' },
  '학습디딤돌': { color: '#4BC1FF', polarity: 'positive' },
  '긍정적공부마음': { color: '#67A7FF', polarity: 'positive' },
  '학습걸림돌': { color: '#FF849F', polarity: 'negative' },
  '부정적공부마음': { color: '#FF87D4', polarity: 'negative' },
};

// 학년/반 파싱
const parseClassName = (name: string) => {
  const match = name.match(/(\d+)-(\d+)/);
  if (match) {
    return `${match[1]}학년 ${match[2]}반`;
  }
  return name;
};

export const ClassResultView: React.FC<ClassResultViewProps> = ({
  className,
  onBack,
  resultData,
  onStudentClick,
  students,
}) => {
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  // 응시율 계산
  const assessmentRate = useMemo(() => {
    if (resultData.totalCount === 0) return 0;
    return Math.round((resultData.assessedCount / resultData.totalCount) * 100);
  }, [resultData.assessedCount, resultData.totalCount]);

  // 중분류별 점수 계산 (mock data의 factorAverages 사용)
  const categoryScores = useMemo(() => {
    const scores: Record<string, number> = {};
    CATEGORY_ORDER.forEach((cat) => {
      const factor = resultData.factorAverages?.find((f) => f.name === cat.name);
      scores[cat.id] = factor?.avgScore || 50;
    });
    return scores;
  }, [resultData.factorAverages]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{className}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {MOCK_SCHOOL_INFO.schoolName} · {MOCK_SCHOOL_INFO.eduLevel} {parseClassName(className)}
          </p>
        </div>
      </div>

      {/* 1. 학급 요약 제공 (상단) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">학급 요약</h3>
        <div className="grid grid-cols-4 gap-4">
          {/* 응시 현황 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">응시 현황</p>
            <p className="text-lg font-semibold text-gray-900">
              {resultData.assessedCount} / {resultData.totalCount}명
            </p>
            <p className="text-xs text-primary-600 font-medium">{assessmentRate}%</p>
          </div>

          {/* 평균 T점수 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">평균 T점수</p>
            <p className="text-lg font-semibold text-gray-900">{resultData.avgTScore}</p>
            <p className="text-xs text-green-600 font-medium">
              {resultData.avgTScore >= 55 ? '양호' : resultData.avgTScore >= 45 ? '보통' : '관심 필요'}
            </p>
          </div>

          {/* 관심 필요 학생 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">관심 필요 학생</p>
            <p className="text-lg font-semibold text-gray-900">{resultData.riskStudents?.length || 0}명</p>
            <p className="text-xs text-orange-600 font-medium">상담 권장</p>
          </div>

          {/* 검사 회차 */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">검사 회차</p>
            <p className="text-lg font-semibold text-gray-900">{resultData.round}차 검사</p>
            <p className="text-xs text-blue-600 font-medium">완료</p>
          </div>
        </div>
      </div>

      {/* 2. 종합 결과 요약 (중분류 막대 그래프) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">종합 결과 요약</h3>
            <p className="text-sm text-gray-500 mt-1">
              11개 중분류 하위요인의 반 평균 T점수입니다.
            </p>
          </div>
          {/* 회차 토글 */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedRound(1)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                selectedRound === 1
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              1차 검사
            </button>
            <button
              onClick={() => setSelectedRound(2)}
              disabled={resultData.round < 2}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                selectedRound === 2
                  ? 'bg-primary-600 text-white'
                  : resultData.round >= 2
                    ? 'text-gray-600 hover:bg-gray-200'
                    : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              2차 검사 {resultData.round < 2 && '예정'}
            </button>
          </div>
        </div>

        {/* 막대 차트 */}
        <CategoryBarChart scores={categoryScores} />

        {/* 참고 문구 */}
        <div className="mt-4 px-4 py-2 bg-gray-50 rounded-lg text-xs text-gray-600">
          <strong className="text-gray-700">참고!</strong> 학습 걸림돌·부정적 공부마음은 <strong>부적 요인</strong>으로, 점수가 <strong>낮을수록</strong> 좋습니다.
        </div>
      </div>

      {/* 3. 우리 반 강점/보완점 top3 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">우리 반 강점 / 보완점 Top 3</h3>
          {/* 회차 토글 */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedRound(1)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                selectedRound === 1
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              1차 검사
            </button>
            <button
              onClick={() => setSelectedRound(2)}
              disabled={resultData.round < 2}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                selectedRound === 2
                  ? 'bg-primary-600 text-white'
                  : resultData.round >= 2
                    ? 'text-gray-600 hover:bg-gray-200'
                    : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              2차 검사 {resultData.round < 2 && '예정'}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* 강점 */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
              </span>
              <h4 className="text-sm font-bold text-emerald-800">주요 강점</h4>
            </div>
            <div className="flex gap-2">
              {resultData.strengths.map((item, index) => (
                <ProfileFactorCard key={index} item={item} index={index} accent="emerald" />
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <div className="w-px bg-gray-200 self-stretch" />

          {/* 보완점 */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-5 h-5 rounded bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-3 h-3 text-red-600" strokeWidth={3} />
              </span>
              <h4 className="text-sm font-bold text-red-800">주요 보완점</h4>
            </div>
            <div className="flex gap-2">
              {resultData.weaknesses.map((item, index) => (
                <ProfileFactorCard key={index} item={item} index={index} accent="red" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. 검사별 유형 분포 (1차/2차 나란히) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">검사별 유형 분포</h3>
            <div className="relative group">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[420px] p-4 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                <p className="font-bold text-yellow-400 mb-3 text-sm">학생유형 분포 비교</p>
                <p className="text-gray-200 leading-relaxed">
                  비상교육은 학생을 단순한 점수로 구분하지 않고, 학습 특성이 함께 나타나는 패턴을 분석하기 위해 LPA 기반 학습유형 분석을 도입했습니다.
                </p>
                <p className="text-gray-200 leading-relaxed mt-2">
                  LPA는 최근 교육·심리·사회과학 연구에서 활용되는 통계 분석 기법으로, 학생의 학습 부담, 심리·정서적 자원, 학습 몰입을 종합적으로 살펴 유사한 학습 상태를 유형화합니다.
                </p>
                <p className="text-gray-200 leading-relaxed mt-2">
                  이를 통해 선생님께서는 학생의 현재 상태를 더 입체적으로 이해하고, 유형별로 필요한 지원 방향을 확인할 수 있습니다.
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            1차와 2차 검사 결과를 비교하여 학생들의 유형 변화를 확인하세요.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-6">
          {/* 1차 검사 도넛 */}
          <LPADonutChart
            round={1}
            distribution={resultData.lpaDistribution}
            totalCount={resultData.assessedCount}
            hoveredType={hoveredType}
            onHover={setHoveredType}
          />

          {/* 2차 검사 도넛 (예정 표시) */}
          {resultData.round >= 2 ? (
            <LPADonutChart
              round={2}
              distribution={resultData.lpaDistribution}
              totalCount={resultData.assessedCount}
              hoveredType={hoveredType}
              onHover={setHoveredType}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-4xl text-gray-300 mb-2">—</div>
              <p className="text-sm text-gray-500">2차 검사가 아직 진행되지 않았습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. 학생 목록 (학생 클릭 시 학생 결과 화면으로 이동) - 4열 그리드 */}
      {students && students.length > 0 && onStudentClick && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-3">학생 목록</h3>
          <div className="grid grid-cols-4 gap-2">
            {students.map((student) => {
              const hasNoAssessment = !student.lpaType1 && !student.lpaType2;
              return (
                <div
                  key={student.id}
                  className="relative p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors"
                >
                  {/* 우측 상단 상태 배지 */}
                  {!hasNoAssessment && (student.needsAttention || student.hasReliabilityWarning) && (
                    <div className="absolute top-1.5 right-1.5 flex gap-0.5">
                      {student.needsAttention && (
                        <span
                          className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700"
                          title={student.attentionReason}
                        >
                          관심
                        </span>
                      )}
                      {student.hasReliabilityWarning && (
                        <span
                          className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700"
                          title={student.reliabilityWarningReason}
                        >
                          신뢰도 주의
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    {/* 번호 */}
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center flex-shrink-0">
                      {student.number}
                    </span>

                    {/* 이름 + 유형 */}
                    <div className="flex-1 min-w-0">
                      {/* 이름 */}
                      <div className="font-semibold text-sm text-gray-900 mb-2">{student.name}</div>

                      {/* 유형 (상하 배치) */}
                      {hasNoAssessment ? (
                        <span className="text-xs text-gray-400 italic">응시 전</span>
                      ) : (
                        <div className="space-y-1.5 text-xs">
                          {/* 1차 유형 */}
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 w-5">1차</span>
                            {student.lpaType1 ? (
                              <span
                                className="px-1.5 py-0.5 rounded font-medium"
                                style={{
                                  backgroundColor: `${TYPE_COLORS[student.lpaType1]}15`,
                                  color: TYPE_COLORS[student.lpaType1] || '#9CA3AF',
                                }}
                              >
                                {student.lpaType1}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">응시 전</span>
                            )}
                          </div>
                          {/* 2차 유형 */}
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 w-5">2차</span>
                            {student.lpaType2 ? (
                              <span
                                className="px-1.5 py-0.5 rounded font-medium"
                                style={{
                                  backgroundColor: `${TYPE_COLORS[student.lpaType2]}15`,
                                  color: TYPE_COLORS[student.lpaType2] || '#9CA3AF',
                                }}
                              >
                                {student.lpaType2}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">응시 전</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 더보기 버튼 */}
                      <button
                        onClick={() => onStudentClick(student.id)}
                        className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <span>결과보기</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// 중분류 막대 차트 컴포넌트
interface CategoryBarChartProps {
  scores: Record<string, number>;
}

const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ scores }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const pad = { l: 44, r: 16, t: 16, b: 90 };
  const n = CATEGORY_ORDER.length;
  const colGap = 10;
  const innerW = containerWidth - pad.l - pad.r;
  const colW = Math.max(22, (innerW - colGap * (n - 1)) / n);
  const barW = Math.min(30, colW);
  const height = 360;
  const plotH = height - pad.t - pad.b;

  const yOf = (t: number) => pad.t + (1 - t / 100) * plotH;

  const bands = [
    { from: 70, to: 100, label: '매우높음', fill: '#EAF6EE' },
    { from: 60, to: 70, label: '높음', fill: '#F2FAF4' },
    { from: 40, to: 60, label: '보통', fill: '#F7F7F8' },
    { from: 30, to: 40, label: '낮음', fill: '#FEF4EC' },
    { from: 0, to: 30, label: '매우낮음', fill: '#FDEEEC' },
  ];

  // 영역별 그룹 생성
  const areaGroups = useMemo(() => {
    const groups: { area: string; color: string; cols: typeof CATEGORY_ORDER }[] = [];
    let currentArea = '';
    let currentGroup: typeof CATEGORY_ORDER = [];

    CATEGORY_ORDER.forEach((cat, idx) => {
      if (cat.area !== currentArea) {
        if (currentGroup.length > 0) {
          const info = AREA_INFO[currentArea];
          groups.push({ area: currentArea, color: info?.color || '#666', cols: currentGroup });
        }
        currentArea = cat.area;
        currentGroup = [cat];
      } else {
        currentGroup.push(cat);
      }
      if (idx === CATEGORY_ORDER.length - 1) {
        const info = AREA_INFO[currentArea];
        groups.push({ area: currentArea, color: info?.color || '#666', cols: currentGroup });
      }
    });

    return groups;
  }, []);

  const totalW = pad.l + innerW + pad.r;

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <svg width={totalW} height={height} className="block">
        {/* 등급 배경 밴드 */}
        {bands.map((b) => {
          const y = yOf(b.to);
          const h = yOf(b.from) - yOf(b.to);
          return (
            <g key={b.label}>
              <rect x={pad.l} y={y} width={innerW} height={h} fill={b.fill} />
              <text x={pad.l + 6} y={y + 13} fontSize="10" fill="#A1A1A8" fontWeight="600">
                {b.label}
              </text>
            </g>
          );
        })}

        {/* 수평선 */}
        {[0, 20, 40, 50, 60, 80, 100].map((t) => (
          <g key={t}>
            <line
              x1={pad.l}
              y1={yOf(t)}
              x2={pad.l + innerW}
              y2={yOf(t)}
              stroke={t === 50 ? '#9CA3AF' : '#E5E5E7'}
              strokeWidth={t === 50 ? 1.3 : 0.7}
              strokeDasharray={t === 50 ? '4 4' : '0'}
            />
            <text x={pad.l - 8} y={yOf(t) + 4} textAnchor="end" fontSize="10.5" fill="#71717A">
              {t}
            </text>
          </g>
        ))}

        {/* 막대 */}
        {CATEGORY_ORDER.map((cat, idx) => {
          const t = scores[cat.id] || 50;
          const x = pad.l + idx * (colW + colGap);
          const barH = (t / 100) * plotH;
          const barX = x + (colW - barW) / 2;
          const y = yOf(t);

          return (
            <g key={cat.id}>
              <rect x={barX} y={y} width={barW} height={barH} rx="3" fill={cat.color} opacity="0.9">
                <title>{`${cat.name} T ${t}`}</title>
              </rect>
              <text
                x={x + colW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fill={cat.color}
              >
                {t}
              </text>
              <text x={x + colW / 2} y={height - pad.b + 16} textAnchor="middle" fontSize="10" fill="#52525B">
                {cat.breakLine ? (
                  <>
                    <tspan x={x + colW / 2} dy="0">
                      {cat.breakLine[0]}
                    </tspan>
                    <tspan x={x + colW / 2} dy="12">
                      {cat.breakLine[1]}
                    </tspan>
                  </>
                ) : (
                  cat.name
                )}
              </text>
            </g>
          );
        })}

        {/* 영역 라벨 (하단) */}
        {(() => {
          let colIdx = 0;
          return areaGroups.map((g) => {
            const startX = pad.l + colIdx * (colW + colGap);
            const endX = pad.l + (colIdx + g.cols.length - 1) * (colW + colGap) + colW;
            colIdx += g.cols.length;

            return (
              <g key={g.area}>
                <line
                  x1={startX}
                  y1={height - pad.b + 56}
                  x2={endX}
                  y2={height - pad.b + 56}
                  stroke={g.color}
                  strokeWidth="2"
                />
                <text
                  x={(startX + endX) / 2}
                  y={height - pad.b + 72}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill={g.color}
                >
                  {g.area}
                </text>
              </g>
            );
          });
        })()}
      </svg>
    </div>
  );
};

// LPA 유형 설명
const LPA_TYPE_DESCRIPTIONS: Record<string, string> = {
  // 초등
  '자원소진형': '학습에 필요한 심리·정서적 자원이 상대적으로 낮고, 기대나 부담은 크게 느끼는 유형입니다. 먼저 부담을 낮추고 작은 성공 경험을 통해 학습 회복감을 키워주세요.',
  '안전 균형형': '전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다. 계획·점검 습관을 함께 길러주세요.',
  '몰입자원 풍부형': '긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 강점을 유지하면서 도전 목표와 깊이 있는 학습 경험으로 확장해주세요.',
  // 중등
  '냉소적 무기력형': '심리·정서적 자원이 상대적으로 낮고, 성적과 공부 부담을 크게 느끼는 유형입니다. 먼저 부담을 낮추고 정서적 회복감과 작은 성취 경험을 만들어주세요.',
  '정서조절 취약형': '학습 자원은 일정 수준 있으나, 성적 압박과 소진을 크게 느끼는 유형입니다. 학습 전략뿐 아니라 감정 조절과 부담 관리 방법을 함께 지원해주세요.',
  '자기주도 몰입형': '심리·정서적 자원이 풍부하고 자기주도적 몰입 가능성이 높은 유형입니다. 현재의 강점을 유지하면서 도전 목표와 심화 학습 기회를 제공해주세요.',
};

// LPA 도넛 차트 컴포넌트
interface LPADonutChartProps {
  round: 1 | 2;
  distribution: LPADistribution[];
  totalCount: number;
  hoveredType: string | null;
  onHover: (type: string | null) => void;
}

const LPADonutChart: React.FC<LPADonutChartProps> = ({
  round,
  distribution,
  totalCount,
  hoveredType,
  onHover,
}) => {
  const size = 188;
  const stroke = 30;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const segs = distribution.map((item) => {
    const frac = item.percentage / 100;
    const dash = frac * circ;
    const seg = { ...item, frac, dash, offset };
    offset += dash;
    return seg;
  });

  // 2차 검사는 오른쪽에 위치하므로 툴팁을 왼쪽에 표시
  const tooltipPosition = round === 2 ? 'right-full mr-2' : 'left-full ml-2';

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-bold text-gray-700 mb-3">{round}차 검사</div>
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {segs.map((s) => {
              if (s.count === 0) return null;
              const isHovered = hoveredType === s.type;
              return (
                <circle
                  key={s.type}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${s.dash} ${circ - s.dash}`}
                  strokeDashoffset={-s.offset}
                  style={{ cursor: 'pointer', transition: 'opacity 0.15s', opacity: isHovered ? 1 : 0.85 }}
                  onMouseEnter={() => onHover(s.type)}
                  onMouseLeave={() => onHover(null)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-gray-900">{totalCount}</p>
              <p className="text-xs text-gray-500">명</p>
            </div>
          </div>
          {/* 도넛 차트 호버 툴팁 */}
          {hoveredType && segs.map((s) => {
            if (s.count === 0 || hoveredType !== s.type) return null;
            const pct = Math.round(s.frac * 100);
            return (
              <div
                key={s.type}
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-40 pointer-events-none"
              >
                <p className="font-bold text-yellow-400 mb-1">{s.type}</p>
                <p className="text-gray-100 mb-2">{s.count}명 ({pct}%)</p>
                <p className="leading-relaxed text-gray-300">{LPA_TYPE_DESCRIPTIONS[s.type]}</p>
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="space-y-2">
          {distribution.map((item) => (
            <div
              key={item.type}
              className={`relative group flex items-center gap-2 w-full text-left px-2 py-1 rounded transition-colors cursor-help ${
                hoveredType === item.type ? 'bg-gray-50' : ''
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-700">{item.type}</span>
              <span className="ml-auto text-sm font-medium tabular-nums">
                {item.count}명 · {item.percentage}%
              </span>
              {/* 범례 호버 툴팁 */}
              <div className={`absolute ${tooltipPosition} top-0 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-lg`}>
                <p className="font-bold text-yellow-400 mb-1">{item.type}</p>
                <p className="leading-relaxed text-gray-300">{LPA_TYPE_DESCRIPTIONS[item.type]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5대 영역 색상 (대분류)
const DOMAIN_COLORS: Record<string, string> = {
  '자아강점': '#00D282',
  '학습디딤돌': '#4BC1FF',
  '긍정적공부마음': '#67A7FF',
  '학습걸림돌': '#FF849F',
  '부정적공부마음': '#FF87D4',
};

// 강점/보완점 카드 스타일
const ACCENT_STYLES = {
  emerald: {
    cardBg: 'rgba(16, 185, 129, 0.05)',
    cardBorder: '#a7f3d0',
    rank: '#10b981',
    score: '#059669',
  },
  red: {
    cardBg: 'rgba(239, 68, 68, 0.05)',
    cardBorder: '#fecaca',
    rank: '#ef4444',
    score: '#dc2626',
  },
} as const;

// 강점/보완점 요인 카드 컴포넌트
interface ProfileFactorCardProps {
  item: ProfileFactor;
  index: number;
  accent: 'emerald' | 'red';
}

const ProfileFactorCard: React.FC<ProfileFactorCardProps> = ({ item, index, accent }) => {
  const styles = ACCENT_STYLES[accent];
  const domainColor = DOMAIN_COLORS[item.parentCategory] || '#9CA3AF';

  return (
    <div
      className="flex-1 p-3 rounded-lg border"
      style={{
        backgroundColor: styles.cardBg,
        borderColor: styles.cardBorder,
      }}
    >
      {/* 대분류 태그 */}
      <span
        className="text-[11px] font-semibold inline-block mb-1"
        style={{ color: domainColor }}
      >
        #{item.parentCategory}
      </span>

      {/* 순위 + 요인명 */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="text-xs font-bold"
          style={{ color: styles.rank }}
        >
          {index + 1}
        </span>
        <p className="text-sm font-semibold text-gray-800">{item.factorName}</p>
      </div>

      {/* 설명 */}
      <p className="text-xs text-gray-500 leading-relaxed">{item.definition}</p>
    </div>
  );
};

export default ClassResultView;
