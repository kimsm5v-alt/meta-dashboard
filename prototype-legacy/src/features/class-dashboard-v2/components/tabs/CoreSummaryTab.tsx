import React, { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import { Card } from '@/shared/components';
import type { Class } from '@/shared/types';
import { useClassProfile } from '../../hooks/useClassProfile';
import { TYPE_COLORS } from '../../utils/typeUtils';
import { convertToSelfregScores, SELFREG_SUB_CATEGORY_INDICES } from '@/shared/utils/classComparisonUtils';
import {
  LPA_TOOLTIP_LINES,
  LPA_TYPE_DESCRIPTIONS_ELEMENTARY,
  LPA_TYPE_DESCRIPTIONS_MIDDLE,
} from '@/shared/data/lpaProfiles';

type TestId = 'comprehensive' | 'selfreg';

interface CoreSummaryTabProps {
  classData: Class;
  hasLPA: boolean;
  testId?: TestId;
}

// LPA 유형 순서 및 정보
const LPA_TYPES_ELEMENTARY = ['자원소진형', '안전 균형형', '몰입자원 풍부형'];
const LPA_TYPES_MIDDLE = ['냉소적 무기력형', '정서조절 취약형', '자기주도 몰입형'];

// 도넛 차트용 순서 (immersed, balanced, depleted 순서)
const DONUT_ORDER_ELEMENTARY = ['몰입자원 풍부형', '안전 균형형', '자원소진형'];
const DONUT_ORDER_MIDDLE = ['자기주도 몰입형', '정서조절 취약형', '냉소적 무기력형'];

// 5대 영역 정보 (정책서 기준 색상)
const AREA_INFO: Record<string, { color: string; polarity: 'positive' | 'negative' }> = {
  '자아강점': { color: '#00D282', polarity: 'positive' },
  '학습디딤돌': { color: '#4BC1FF', polarity: 'positive' },
  '긍정적공부마음': { color: '#67A7FF', polarity: 'positive' },
  '학습걸림돌': { color: '#FF849F', polarity: 'negative' },
  '부정적공부마음': { color: '#FF87D4', polarity: 'negative' },
};

// 11개 중분류 (HSJ 기준, 정책서 색상 적용)
const CATEGORY_ORDER = [
  { id: 'selfEsteem', name: '자아존중감', area: '자아강점', color: '#00D282' },
  { id: 'selfEfficacy', name: '자아효능감', area: '자아강점', color: '#00D282' },
  { id: 'metaCognition', name: '메타인지', area: '학습디딤돌', color: '#4BC1FF' },
  { id: 'learningSkill', name: '학습기술', area: '학습디딤돌', color: '#4BC1FF' },
  { id: 'learningMotivation', name: '학습동기', area: '학습디딤돌', color: '#4BC1FF' },
  { id: 'academicEngagement', name: '학업열의', area: '긍정적공부마음', color: '#67A7FF' },
  { id: 'growthMindset', name: '성장마인드셋', area: '긍정적공부마음', color: '#67A7FF' },
  { id: 'academicStress', name: '학업스트레스', area: '학습걸림돌', color: '#FF849F' },
  { id: 'distraction', name: '주의산만', area: '학습걸림돌', color: '#FF849F' },
  { id: 'academicBurnout', name: '학업소진', area: '부정적공부마음', color: '#FF87D4' },
  { id: 'testAnxiety', name: '시험불안', area: '부정적공부마음', color: '#FF87D4' },
];

// 추천 학급 운영 활동
const RECOMMENDED_ACTIVITIES = [
  {
    id: 'emotion-check',
    title: '감정 온도계 활동',
    description: '매일 아침 자신의 감정 상태를 체크하고 공유하는 활동입니다.',
    downloadUrl: '#',
  },
  {
    id: 'peer-learning',
    title: '또래 학습 멘토링',
    description: '학습 강점이 다른 학생끼리 짝을 이루어 서로 가르치는 활동입니다.',
    downloadUrl: '#',
  },
  {
    id: 'metacognition',
    title: '메타인지 학습일지',
    description: '매주 학습 과정을 돌아보고 다음 주 계획을 세우는 활동입니다.',
    downloadUrl: '#',
  },
];

// 자기조절학습검사 6개 중분류 정의
const SELFREG_CATEGORY_ORDER = [
  { id: 'learningDrive', name: '학습원동력', area: '동기전략', color: '#9F91F8' },
  { id: 'emotionRegulation', name: '정서조절', area: '동기전략', color: '#9F91F8' },
  { id: 'metaCognition', name: '메타인지', area: '인지전략', color: '#4BC1FF' },
  { id: 'cognitiveSkill', name: '인지적학습기술', area: '인지전략', color: '#4BC1FF' },
  { id: 'behaviorRegulation', name: '행동조절', area: '행동전략', color: '#FF8A94' },
  { id: 'behavioralSkill', name: '행동적학습기술', area: '행동전략', color: '#FF8A94' },
];

// 자기조절학습검사 3대 전략 영역 정보
const SELFREG_AREA_INFO: Record<string, { color: string }> = {
  '동기전략': { color: '#9F91F8' },
  '인지전략': { color: '#4BC1FF' },
  '행동전략': { color: '#FF8A94' },
};

export const CoreSummaryTab: React.FC<CoreSummaryTabProps> = ({
  classData,
  hasLPA,
  testId = 'comprehensive',
}) => {
  const [summaryRound, setSummaryRound] = useState<1 | 2>(1);
  const [hoveredType, setHoveredType] = useState<{ sessionNo: number; type: string } | null>(null);

  const hasRound1 = classData.students.some(s =>
    s.assessments.some(a => a.round === 1)
  );
  const hasRound2 = classData.students.some(s =>
    s.assessments.some(a => a.round === 2)
  );

  const profile1 = useClassProfile(classData, 1);
  const profile2 = useClassProfile(classData, 2);

  const isMiddleSchool = classData.schoolLevel === '중등';
  const typeOrder = isMiddleSchool ? LPA_TYPES_MIDDLE : LPA_TYPES_ELEMENTARY;
  const donutOrder = isMiddleSchool ? DONUT_ORDER_MIDDLE : DONUT_ORDER_ELEMENTARY;
  const typeDescriptions = isMiddleSchool ? LPA_TYPE_DESCRIPTIONS_MIDDLE : LPA_TYPE_DESCRIPTIONS_ELEMENTARY;

  // 1차/2차별 유형 분포 계산
  const getDistributionByRound = (round: 1 | 2) => {
    const dist: Record<string, number> = {};
    typeOrder.forEach(type => { dist[type] = 0; });

    classData.students.forEach(student => {
      const assessment = student.assessments.find(a => a.round === round);
      if (assessment) {
        const type = assessment.predictedType;
        if (dist[type] !== undefined) {
          dist[type]++;
        }
      }
    });
    return dist;
  };

  const dist1 = hasRound1 ? getDistributionByRound(1) : null;
  const dist2 = hasRound2 ? getDistributionByRound(2) : null;
  const total1 = dist1 ? Object.values(dist1).reduce((sum, n) => sum + n, 0) : 0;
  const total2 = dist2 ? Object.values(dist2).reduce((sum, n) => sum + n, 0) : 0;

  // 중분류별 평균 T점수 계산 (useMemo로 메모이제이션하여 불필요한 재계산 방지)
  const categoryScores = useMemo(() => {
    const scores: Record<string, number> = {};
    const assessedStudents = classData.students.filter(s =>
      s.assessments.some(a => a.round === summaryRound)
    );

    if (testId === 'selfreg') {
      // 자기조절학습검사: 6개 중분류
      SELFREG_CATEGORY_ORDER.forEach(cat => {
        const indices = SELFREG_SUB_CATEGORY_INDICES[cat.name] || [];
        let sum = 0;
        let count = 0;

        assessedStudents.forEach(student => {
          const assessment = student.assessments.find(a => a.round === summaryRound);
          if (assessment) {
            const selfregScores = convertToSelfregScores(assessment.tScores);
            const catScores = indices.map(i => selfregScores[i]);
            const avg = catScores.reduce((a, b) => a + b, 0) / catScores.length;
            sum += avg;
            count++;
          }
        });

        scores[cat.id] = count > 0 ? Math.round(sum / count) : 50;
      });
    } else {
      // 학습종합검사: 11개 중분류
      const profile = summaryRound === 1 ? profile1 : profile2;
      CATEGORY_ORDER.forEach(cat => {
        const item = profile?.strengths.find(s => s.category === cat.name)
          || profile?.weaknesses.find(w => w.category === cat.name);
        // Math.random() 제거 - 데이터가 없으면 기본값 50 사용
        scores[cat.id] = item?.avgT || 50;
      });
    }

    return scores;
  }, [classData.students, summaryRound, testId, profile1, profile2]);

  // 현재 테스트 유형에 맞는 카테고리 순서
  const currentCategoryOrder = testId === 'selfreg' ? SELFREG_CATEGORY_ORDER : CATEGORY_ORDER;
  const currentAreaInfo = testId === 'selfreg' ? SELFREG_AREA_INFO : AREA_INFO;

  // 도넛 차트 렌더링 함수
  const renderDonut = (dist: Record<string, number> | null, total: number, sessionNo: number) => {
    if (!dist || total === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-4xl text-gray-300 mb-2">—</div>
          <p className="text-sm text-gray-500">{sessionNo}차 검사가 아직 진행되지 않았습니다</p>
        </div>
      );
    }

    const size = 188;
    const stroke = 30;
    const r = (size - stroke) / 2;
    const cx = size / 2;
    const cy = size / 2;
    const circ = 2 * Math.PI * r;

    let offset = 0;
    const segs = donutOrder.map(type => {
      const n = dist[type] || 0;
      const frac = total ? n / total : 0;
      const dash = frac * circ;
      const seg = { type, n, frac, dash, offset };
      offset += dash;
      return seg;
    });

    return (
      <div className="flex flex-col items-center">
        <div className="text-sm font-bold text-gray-700 mb-3">{sessionNo}차 검사</div>
        <div className="flex items-center gap-6">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              {segs.map(s => {
                if (s.n === 0) return null;
                const isHovered = hoveredType?.sessionNo === sessionNo && hoveredType?.type === s.type;
                return (
                  <circle
                    key={s.type}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={TYPE_COLORS[s.type]}
                    strokeWidth={stroke}
                    strokeDasharray={`${s.dash} ${circ - s.dash}`}
                    strokeDashoffset={-s.offset}
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s', opacity: isHovered ? 1 : 0.85 }}
                    onMouseEnter={() => setHoveredType({ sessionNo, type: s.type })}
                    onMouseLeave={() => setHoveredType(null)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-gray-900">{total}</p>
                <p className="text-xs text-gray-500">명</p>
              </div>
            </div>
            {/* 호버 툴팁 */}
            {hoveredType?.sessionNo === sessionNo && segs.map(s => {
              if (s.n === 0 || hoveredType.type !== s.type) return null;
              const pct = Math.round(s.frac * 100);
              return (
                <div
                  key={s.type}
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-40 pointer-events-none"
                >
                  <p className="font-bold text-yellow-400 mb-1">{s.type}</p>
                  <p className="text-gray-100 mb-2">{s.n}명 ({pct}%)</p>
                  <p className="leading-relaxed text-gray-300">{typeDescriptions[s.type]}</p>
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="space-y-2">
            {donutOrder.map(type => {
              const n = dist[type] || 0;
              const pct = total > 0 ? Math.round((n / total) * 100) : 0;
              // 2차 검사는 오른쪽에 위치하므로 툴팁을 왼쪽에 표시
              const tooltipPosition = sessionNo === 2
                ? 'right-full mr-2'
                : 'left-full ml-2';
              return (
                <div
                  key={type}
                  className="relative group flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-gray-50 transition-colors cursor-help"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                  <span className="ml-auto text-sm font-medium tabular-nums">
                    {n}명 · {pct}%
                  </span>
                  {/* 유형별 툴팁 */}
                  <div className={`absolute ${tooltipPosition} top-0 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-lg`}>
                    <p className="font-bold text-yellow-400 mb-1">{type}</p>
                    <p className="leading-relaxed text-gray-300">{typeDescriptions[type]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 검사별 유형 분포 (1차, 2차 나란히) - LPA 있는 경우만 */}
      {hasLPA && (
        <Card>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">검사별 유형 분포</h3>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-96 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
                  <p className="font-bold text-yellow-400 mb-2">학생유형 분포 비교</p>
                  <ul className="space-y-1.5 text-gray-300">
                    {LPA_TOOLTIP_LINES.map((line, idx) => (
                      <li key={idx} className="leading-relaxed">{line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              1차와 2차 검사 결과를 비교하여 학생들의 유형 변화를 확인하세요.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-6 pb-4">
            {renderDonut(dist1, total1, 1)}
            {renderDonut(dist2, total2, 2)}
          </div>
        </Card>
      )}

      {/* 종합 결과 요약 (중분류 세로 막대그래프) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">종합 결과 요약</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {testId === 'selfreg'
                ? '6개 중분류 하위요인의 반 평균 T점수입니다. 자세한 분석은 '
                : '11개 중분류 하위요인의 반 평균 T점수입니다. 자세한 분석은 '}
              <strong>학습 상세</strong> 탭에서 볼 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSummaryRound(1)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                summaryRound === 1
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              1차 검사
            </button>
            <button
              onClick={() => hasRound2 && setSummaryRound(2)}
              disabled={!hasRound2}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                summaryRound === 2
                  ? 'bg-indigo-600 text-white'
                  : hasRound2
                    ? 'text-gray-600 hover:bg-gray-200'
                    : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              2차 검사 {!hasRound2 && '예정'}
            </button>
          </div>
        </div>

        {/* 세로 막대 차트 */}
        <div className="mt-6">
          <CategoryBarChart
            scores={categoryScores}
            testId={testId}
            categoryOrder={currentCategoryOrder}
            areaInfo={currentAreaInfo}
          />
        </div>
      </Card>

      {/* 추천 학급 운영 활동 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">추천 학급 운영 활동</h3>
          </div>
          <button
            onClick={() => alert('활동 자료실로 이동합니다.')}
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            전체 보기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {RECOMMENDED_ACTIVITIES.map((activity) => (
            <div
              key={activity.id}
              className="p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
            >
              <h4 className="font-semibold text-gray-900 mb-2">{activity.title}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{activity.description}</p>
              <button
                onClick={() => alert(`${activity.title} 자료를 다운로드합니다.`)}
                className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                <Download className="w-4 h-4" />
                다운로드
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// 중분류 세로 막대 차트 컴포넌트
interface CategoryBarChartProps {
  scores: Record<string, number>;
  testId?: TestId;
  categoryOrder: typeof CATEGORY_ORDER;
  areaInfo: Record<string, { color: string }>;
}

const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  scores,
  testId = 'comprehensive',
  categoryOrder,
  areaInfo,
}) => {
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
  const n = categoryOrder.length;
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

    categoryOrder.forEach((cat, idx) => {
      if (cat.area !== currentArea) {
        if (currentGroup.length > 0) {
          const info = areaInfo[currentArea];
          groups.push({ area: currentArea, color: info?.color || '#666', cols: currentGroup });
        }
        currentArea = cat.area;
        currentGroup = [cat];
      } else {
        currentGroup.push(cat);
      }
      if (idx === categoryOrder.length - 1) {
        const info = areaInfo[currentArea];
        groups.push({ area: currentArea, color: info?.color || '#666', cols: currentGroup });
      }
    });

    return groups;
  }, [categoryOrder, areaInfo]);

  const totalW = pad.l + innerW + pad.r;

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <svg width={totalW} height={height} className="block">
        {/* 등급 배경 밴드 */}
        {bands.map(b => {
          const y = yOf(b.to);
          const h = yOf(b.from) - yOf(b.to);
          return (
            <g key={b.label}>
              <rect x={pad.l} y={y} width={innerW} height={h} fill={b.fill} />
              <text x={pad.l + 6} y={y + 13} fontSize="10" fill="#A1A1A8" fontWeight="600">{b.label}</text>
            </g>
          );
        })}

        {/* 수평선 */}
        {[0, 20, 40, 50, 60, 80, 100].map(t => (
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
            <text x={pad.l - 8} y={yOf(t) + 4} textAnchor="end" fontSize="10.5" fill="#71717A">{t}</text>
          </g>
        ))}

        {/* 막대 */}
        {categoryOrder.map((cat, idx) => {
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
              <text x={x + colW / 2} y={y - 5} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={cat.color}>
                {t}
              </text>
              <text
                x={x + colW / 2}
                y={height - pad.b + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#52525B"
              >
                {cat.name.length > 5 ? (
                  <>
                    <tspan x={x + colW / 2} dy="0">{cat.name.slice(0, Math.ceil(cat.name.length / 2))}</tspan>
                    <tspan x={x + colW / 2} dy="12">{cat.name.slice(Math.ceil(cat.name.length / 2))}</tspan>
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
          return areaGroups.map(g => {
            const startX = pad.l + colIdx * (colW + colGap);
            const endX = pad.l + (colIdx + g.cols.length - 1) * (colW + colGap) + colW;
            colIdx += g.cols.length;

            return (
              <g key={g.area}>
                <line x1={startX} y1={height - pad.b + 56} x2={endX} y2={height - pad.b + 56} stroke={g.color} strokeWidth="2" />
                <text x={(startX + endX) / 2} y={height - pad.b + 72} textAnchor="middle" fontSize="11" fontWeight="800" fill={g.color}>
                  {g.area}
                </text>
              </g>
            );
          });
        })()}
      </svg>

      {/* 참고 문구 - 자기조절학습검사는 모두 정적 요인 */}
      {testId === 'comprehensive' && (
        <div className="mt-4 px-4 py-2 bg-gray-50 rounded-lg text-xs text-gray-600">
          <strong className="text-gray-700">참고!</strong> 학습 걸림돌·부정적 공부마음은 <strong>부적 요인</strong>으로, 점수가 <strong>낮을수록</strong> 좋습니다.
        </div>
      )}
      {testId === 'selfreg' && (
        <div className="mt-4 px-4 py-2 bg-green-50 rounded-lg text-xs text-green-700">
          <strong className="text-green-800">참고!</strong> 자기조절학습검사의 모든 요인은 <strong>정적 요인</strong>으로, 점수가 <strong>높을수록</strong> 좋습니다.
        </div>
      )}
    </div>
  );
};
