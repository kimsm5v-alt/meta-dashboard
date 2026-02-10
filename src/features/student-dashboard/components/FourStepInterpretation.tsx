import { useMemo, useState } from 'react';
import { calculate4StepDiagnosis, getLevel, type Level } from '@/shared/utils/calculate4StepDiagnosis';
import { SUB_CATEGORY_FACTORS, FACTOR_DEFINITIONS } from '@/shared/data/factors';
import { CATEGORY_COLORS } from '@/shared/data/lpaProfiles';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getBarPercent, PREV_COLOR } from '@/shared/utils/chartUtils';
import { lightenColor } from '@/shared/utils/colorUtils';

// ============================================================
// Props
// ============================================================

interface FourStepInterpretationProps {
  tScores: number[];
  prevTScores?: number[];
  studentName: string;
}

// ============================================================
// 상수
// ============================================================

const T50_PERCENT = getBarPercent(50); // 50% — 정중앙

// LevelBadge.tsx와 동일한 5단계 배지 색상
const COLORS_POSITIVE: Record<Level, string> = {
  '매우높음': 'bg-emerald-100 text-emerald-700',
  '높음': 'bg-emerald-50 text-emerald-600',
  '보통': 'bg-gray-100 text-gray-600',
  '낮음': 'bg-orange-50 text-orange-600',
  '매우낮음': 'bg-red-100 text-red-700',
};

const COLORS_NEGATIVE: Record<Level, string> = {
  '매우높음': 'bg-red-100 text-red-700',
  '높음': 'bg-orange-50 text-orange-600',
  '보통': 'bg-gray-100 text-gray-600',
  '낮음': 'bg-emerald-50 text-emerald-600',
  '매우낮음': 'bg-emerald-100 text-emerald-700',
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  '1-1': '학습 동기, 자원, 기술 모두 우수한 이상적인 상태입니다. 자율적 심화 학습이 가능합니다.',
  '1-2': '학습 의욕과 자원은 충분하나 학습 방법 개선이 필요합니다. 효과적인 학습 전략 코칭으로 빠른 성장이 가능합니다.',
  '2-1': '높은 의지와 기술을 가졌으나 자원 부족으로 어려움을 겪고 있습니다. 환경 지원과 스트레스 관리가 우선입니다.',
  '2-2': '학습 의욕은 있으나 자원과 기술이 부족합니다. 환경 개선과 학습법 지도를 병행해야 합니다.',
  '3-1': '학습 기술은 있으나 동기와 자원이 부족합니다. 공부 이유 탐색과 자원 확보가 필요합니다.',
  '3-2': '동기, 자원, 기술 모두 낮은 상태입니다. 단계적이고 종합적인 지원이 시급합니다.',
  '4-1': '자원은 있으나 학습 동기가 낮습니다. 공부 흥미 회복과 동기 부여가 필요합니다.',
  '4-2': '자원은 있으나 동기와 기술이 부족합니다. 학습 흥미 발견과 방법 지도가 필요합니다.',
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export function FourStepInterpretation({ tScores, prevTScores, studentName }: FourStepInterpretationProps) {
  const diagnosis = useMemo(
    () => calculate4StepDiagnosis(tScores),
    [tScores]
  );
  const prevDiagnosis = useMemo(
    () => prevTScores ? calculate4StepDiagnosis(prevTScores) : null,
    [prevTScores]
  );
  const isCompare = !!prevDiagnosis;

  return (
    <div className="space-y-4">
      {/* 가이드 헤더 */}
      <div className="mb-2">
        <h3 className="text-lg font-bold text-gray-900">4단계 해석 가이드</h3>
        <p className="text-sm text-gray-500">보다 학생을 더 잘 이해하기 위해 검사 결과를 4단계로 나눠서 봅니다.</p>
      </div>

      {/* Step 1: 공부 마음 */}
      <StepCard
        step={1}
        title={'공부 마음 : "공부하고 싶은 마음이 있나요?"'}
        subtitle={
          <>
            <span>학업열의·성장 동기가 있는지, 학업소진·번아웃 상태는 아닌지</span><br />
            <span className="text-primary-600 font-semibold">→ 동기가 없으면 아무리 가르쳐도 소용없어요</span>
          </>
        }
        showBarLegend
        isCompare={isCompare}
      >
        <SubSection
          title="긍정적 공부 마음"
          level={getLevel(diagnosis.step1.긍정.종합)}
        >
          <BarItem label="학업열의" score={diagnosis.step1.긍정.학업열의} prevScore={prevDiagnosis?.step1.긍정.학업열의} subCategoryKey="학업열의" tScores={tScores} prevTScores={prevTScores} />
          <BarItem label="성장력" score={diagnosis.step1.긍정.성장력} prevScore={prevDiagnosis?.step1.긍정.성장력} subCategoryKey="성장력" tScores={tScores} prevTScores={prevTScores} />
        </SubSection>

        <SubSection
          title="부정적 공부 마음"
          level={getLevel(diagnosis.step1.부정.학업소진)}
          isNegativeSection
        >
          <BarItem label="학업소진" score={diagnosis.step1.부정.학업소진} prevScore={prevDiagnosis?.step1.부정.학업소진} isNegative subCategoryKey="학업소진" tScores={tScores} prevTScores={prevTScores} />
        </SubSection>
      </StepCard>

      {/* Step 2: 공부 자원 */}
      <StepCard
        step={2}
        title={'공부 자원 : "공부할 수 있는 환경이 되나요?"'}
        subtitle={
          <>
            <span>자존감·자신감·지지 관계가 있는지, 스트레스·방해 요인은 없는지</span><br />
            <span className="text-primary-600 font-semibold">→ 환경이 안 받쳐주면 마음만으론 안 돼요</span>
          </>
        }
        showBarLegend
        isCompare={isCompare}
      >
        <SubSection
          title="개인 자원"
          level={getLevel(diagnosis.step2.개인.종합)}
        >
          <BarItem label="긍정적자아" score={diagnosis.step2.개인.긍정적자아} prevScore={prevDiagnosis?.step2.개인.긍정적자아} subCategoryKey="긍정적자아" tScores={tScores} prevTScores={prevTScores} />
          <BarItem label="대인관계능력" score={diagnosis.step2.개인.대인관계능력} prevScore={prevDiagnosis?.step2.개인.대인관계능력} subCategoryKey="대인관계능력" tScores={tScores} prevTScores={prevTScores} />
        </SubSection>

        <SubSection
          title="환경 자원"
          level={getLevel(diagnosis.step2.환경.종합)}
        >
          <BarItem label="지지적관계" score={diagnosis.step2.환경.지지적관계} prevScore={prevDiagnosis?.step2.환경.지지적관계} subCategoryKey="지지적관계" tScores={tScores} prevTScores={prevTScores} />
        </SubSection>

        <SubSection
          title="자원 방해"
          level={getLevel(diagnosis.step2.방해.학업스트레스)}
          isNegativeSection
        >
          <BarItem label="학업스트레스" score={diagnosis.step2.방해.학업스트레스} prevScore={prevDiagnosis?.step2.방해.학업스트레스} isNegative subCategoryKey="학업스트레스" tScores={tScores} prevTScores={prevTScores} />
          <BarItem label="학습방해물" score={diagnosis.step2.방해.학습방해물} prevScore={prevDiagnosis?.step2.방해.학습방해물} isNegative subCategoryKey="학습방해물" tScores={tScores} prevTScores={prevTScores} />
          <BarItem label="학업관계스트레스" score={diagnosis.step2.방해.학업관계스트레스} prevScore={prevDiagnosis?.step2.방해.학업관계스트레스} isNegative subCategoryKey="학업관계스트레스" tScores={tScores} prevTScores={prevTScores} />
        </SubSection>
      </StepCard>

      {/* Step 3: 공부 기술 */}
      <StepCard
        step={3}
        title={'공부 기술 : "어떻게 공부하는지 알고 있나요?"'}
        subtitle={
          <>
            <span>계획·시간 관리·학습 전략을 아는지, 감정 조절·집중력은 어떤지</span><br />
            <span className="text-primary-600 font-semibold">→ 방법을 모르면 노력해도 성적이 안 나와요</span>
          </>
        }
        showBarLegend
        isCompare={isCompare}
      >
        <SubSection
          title="학습 재설계"
          level={getLevel(diagnosis.step3.학습.종합)}
        >
          <BarItem label="메타인지" score={diagnosis.step3.학습.메타인지} prevScore={prevDiagnosis?.step3.학습.메타인지} subCategoryKey="메타인지" tScores={tScores} prevTScores={prevTScores} />
          <BarItem label="학습기술" score={diagnosis.step3.학습.학습기술} prevScore={prevDiagnosis?.step3.학습.학습기술} subCategoryKey="학습기술" tScores={tScores} prevTScores={prevTScores} />
        </SubSection>

        <SubSection
          title="마음 재설계"
          level={getLevel(diagnosis.step3.마음.종합)}
        >
          <LeafFactorItem
            label="자기정서조절"
            score={diagnosis.step3.마음.자기정서조절}
            prevScore={prevDiagnosis?.step3.마음.자기정서조절}
            color={CATEGORY_COLORS['대인관계능력'] ?? '#9CA3AF'}
          />
        </SubSection>
      </StepCard>

      {/* Step 4: 학습 유형 */}
      <StepCard
        step={4}
        title={'학습 유형 : "그래서 이 학생에게 뭐가 필요한가요?"'}
        subtitle={
          <>
            <span>1~3단계를 종합하여 8가지 유형 판정 및 맞춤 코칭 전략 제시</span><br />
            <span className="text-primary-600 font-semibold">→ 이 학생에게 지금 가장 필요한 게 뭔지 알려줘요</span>
          </>
        }
      >
        <div className="grid grid-cols-5 gap-4">
          {/* 사분면 그래프 */}
          <div className="col-span-2 border rounded-lg p-4 bg-gray-50">
            <div className="flex flex-col items-center">
              {/* Y축 레이블 */}
              <span className="text-xs font-semibold text-gray-600 mb-1">공부마음 ↑</span>

              <div className="flex items-center w-full">
                <div className="relative flex-1 aspect-[4/3] bg-white rounded border overflow-hidden">
                  {/* 사분면 배경 */}
                  <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-50 opacity-30 border-r border-b border-gray-600 flex items-center justify-center">
                      <span className="text-[9px] text-gray-400">2</span>
                    </div>
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-green-50 opacity-30 border-b border-gray-600 flex items-center justify-center">
                      <span className="text-[9px] text-gray-400">1</span>
                    </div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-50 opacity-30 border-r border-gray-600 flex items-center justify-center">
                      <span className="text-[9px] text-gray-400">3</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-yellow-50 opacity-30 flex items-center justify-center">
                      <span className="text-[9px] text-gray-400">4</span>
                    </div>
                  </div>

                  {/* 1차 위치 (비교 모드) */}
                  {prevDiagnosis && (
                    <>
                      {/* 1차→2차 연결선 */}
                      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                        <line
                          x1={`${clamp((prevDiagnosis.step4.공부자원 - 20) / 60 * 100)}%`}
                          y1={`${clamp(100 - (prevDiagnosis.step4.공부마음 - 20) / 60 * 100)}%`}
                          x2={`${clamp((diagnosis.step4.공부자원 - 20) / 60 * 100)}%`}
                          y2={`${clamp(100 - (diagnosis.step4.공부마음 - 20) / 60 * 100)}%`}
                          stroke="#9CA3AF"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                      </svg>
                      <div
                        className="absolute w-5 h-5 rounded-full border-2 border-white shadow bg-gray-400 -translate-x-1/2 -translate-y-1/2 z-10 opacity-60"
                        style={{
                          left: `${clamp((prevDiagnosis.step4.공부자원 - 20) / 60 * 100)}%`,
                          top: `${clamp(100 - (prevDiagnosis.step4.공부마음 - 20) / 60 * 100)}%`,
                        }}
                      >
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded text-[8px] font-bold whitespace-nowrap bg-gray-400 text-white">
                          1차
                        </div>
                      </div>
                    </>
                  )}

                  {/* 2차(현재) 위치 */}
                  <div
                    className={`absolute w-7 h-7 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 z-20 ${
                      diagnosis.step4.공부기술 >= 50 ? 'bg-blue-600' : 'bg-red-500'
                    }`}
                    style={{
                      left: `${clamp((diagnosis.step4.공부자원 - 20) / 60 * 100)}%`,
                      top: `${clamp(100 - (diagnosis.step4.공부마음 - 20) / 60 * 100)}%`,
                    }}
                  >
                    <div className={`absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-md ${
                      diagnosis.step4.공부기술 >= 50 ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {isCompare ? '2차' : studentName}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-semibold text-gray-600 ml-1 [writing-mode:vertical-lr]">공부자원 ↑</span>
              </div>

              {/* 범례 */}
              <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-700">
                <span className="font-bold text-gray-800">공부기술</span>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded-full" />
                  <span className="font-medium">높음(&ge;50)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="font-medium">낮음(&lt;50)</span>
                </div>
                {isCompare && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-400 rounded-full opacity-60" />
                    <span className="font-medium">1차</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 유형 정보 */}
          <div className="col-span-3 border rounded-lg bg-white overflow-hidden">
            {/* 유형명 헤더 */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary-600 text-white rounded text-sm font-bold">
                  {diagnosis.step4.유형코드}
                </span>
                <h4 className="font-bold text-gray-900 text-base">{diagnosis.step4.유형명}</h4>
                {isCompare && prevDiagnosis && prevDiagnosis.step4.유형코드 !== diagnosis.step4.유형코드 && (
                  <span className="text-xs text-gray-400">
                    (1차: {prevDiagnosis.step4.유형코드} {prevDiagnosis.step4.유형명})
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                {TYPE_DESCRIPTIONS[diagnosis.step4.유형코드] || ''}
              </p>
            </div>

            {/* 3개 점수 */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="grid grid-cols-3 gap-3">
                {([
                  { label: '공부 마음', value: diagnosis.step4.공부마음, prev: prevDiagnosis?.step4.공부마음, color: '#3B82F6' },
                  { label: '공부 자원', value: diagnosis.step4.공부자원, prev: prevDiagnosis?.step4.공부자원, color: '#10B981' },
                  { label: '공부 기술', value: diagnosis.step4.공부기술, prev: prevDiagnosis?.step4.공부기술, color: '#8B5CF6' },
                ] as const).map(item => {
                  const delta = item.prev != null ? item.value - item.prev : null;
                  return (
                    <div key={item.label} className="text-center">
                      <div className="text-[11px] text-gray-500 mb-1">{item.label}</div>
                      <div className="flex items-center justify-center gap-1">
                        <div className="text-lg font-bold" style={{ color: item.color }}>
                          {item.value.toFixed(0)}
                        </div>
                        {delta != null && Math.abs(delta) >= 0.5 && (
                          <span className={`text-[10px] font-semibold ${delta > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${clamp((item.value - 20) / 60 * 100)}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 코칭 전략 */}
            <div className="px-4 py-3">
              <div className="text-sm font-bold text-gray-800 mb-2">맞춤 코칭 전략</div>
              <ul className="space-y-1.5">
                {diagnosis.step4.코칭전략.map((strategy, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-primary-600 font-bold mt-px">·</span>
                    <span>{strategy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </StepCard>
    </div>
  );
}

// ============================================================
// StepCard (아코디언)
// ============================================================

function StepCard({
  step,
  title,
  subtitle,
  showBarLegend = false,
  isCompare = false,
  children,
}: {
  step: number;
  title: string;
  subtitle: React.ReactNode;
  showBarLegend?: boolean;
  isCompare?: boolean;
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="px-2.5 py-1 bg-primary-600 text-white rounded-md text-sm font-bold whitespace-nowrap">
          {step}단계
        </span>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <div className="text-sm text-gray-600">{subtitle}</div>
        </div>
        {showBarLegend && isExpanded && (
          <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
            <span>점선: T=50</span>
            {isCompare && (
              <>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-gray-400" /> 1차
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-indigo-400" /> 2차
                </span>
              </>
            )}
          </div>
        )}
        <ChevronRight
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </div>

      {isExpanded && <div className="p-4 bg-white space-y-4">{children}</div>}
    </div>
  );
}

// ============================================================
// SubSection
// ============================================================

function SubSection({
  title,
  level,
  isNegativeSection = false,
  children,
}: {
  title: string;
  level: Level;
  isNegativeSection?: boolean;
  children: React.ReactNode;
}) {
  const badgeColor = isNegativeSection
    ? COLORS_NEGATIVE[level]
    : COLORS_POSITIVE[level];

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2.5">
        <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}
        >
          {level}
        </span>
        {isNegativeSection && (
          <span className="text-xs text-gray-400">↓ 낮을수록 좋아요</span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ============================================================
// DualBar (이중 막대 렌더링 유틸)
// ============================================================

function DualBar({
  score,
  prevScore,
  color,
  height = 'h-7',
  radius = '0 4px 4px 0',
  showLabel = true,
  labelSize = 'text-xs',
}: {
  score: number;
  prevScore?: number;
  color: string;
  height?: string;
  radius?: string;
  showLabel?: boolean;
  labelSize?: string;
}) {
  const curPct = Math.max(0, Math.min(getBarPercent(score), 100));
  const hasPrev = prevScore != null;
  const prevPct = hasPrev ? Math.max(0, Math.min(getBarPercent(prevScore), 100)) : 0;

  return (
    <div className={`flex-1 ${height} bg-gray-100 rounded overflow-hidden relative`}>
      {/* T=50 기준선 */}
      <div
        className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-600 z-[1]"
        style={{ left: `${T50_PERCENT}%` }}
      />

      {hasPrev && prevScore !== score ? (
        prevPct > curPct ? (
          <>
            {/* 1차 > 2차: [0..2차]=색상, [2차..1차]=회색 */}
            <div
              className="absolute top-0 left-0 h-full transition-all duration-300"
              style={{ width: `${curPct}%`, backgroundColor: color }}
            />
            <div
              className="absolute top-0 h-full transition-all duration-300"
              style={{
                left: `${curPct}%`,
                width: `${prevPct - curPct}%`,
                backgroundColor: PREV_COLOR,
                borderRadius: radius,
              }}
            />
            {showLabel && curPct > 20 && (
              <div className="absolute top-0 left-0 h-full flex items-center justify-end pr-2 z-20 pointer-events-none" style={{ width: `${curPct}%` }}>
                <span className={`${labelSize} font-bold text-white whitespace-nowrap`}>
                  T={score.toFixed(1)}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 1차 < 2차: [0..1차]=회색, [1차..2차]=색상 */}
            <div
              className="absolute top-0 left-0 h-full transition-all duration-300"
              style={{ width: `${prevPct}%`, backgroundColor: PREV_COLOR }}
            />
            <div
              className="absolute top-0 h-full transition-all duration-300"
              style={{
                left: `${prevPct}%`,
                width: `${curPct - prevPct}%`,
                backgroundColor: color,
                borderRadius: radius,
              }}
            />
            {showLabel && curPct > 20 && (
              <div className="absolute top-0 left-0 h-full flex items-center justify-end pr-2 z-20 pointer-events-none" style={{ width: `${curPct}%` }}>
                <span className={`${labelSize} font-bold text-white whitespace-nowrap`}>
                  T={score.toFixed(1)}
                </span>
              </div>
            )}
          </>
        )
      ) : (
        /* 단일 막대 (1차 없거나 동일) */
        <div
          className="h-full flex items-center justify-end pr-2 transition-all duration-300"
          style={{
            width: `${curPct}%`,
            backgroundColor: color,
            borderRadius: radius,
          }}
        >
          {showLabel && curPct > 20 && (
            <span className={`${labelSize} font-bold text-white whitespace-nowrap`}>
              T={score.toFixed(1)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// LeafFactorItem (3depth 소분류 단일 요인)
// ============================================================

function LeafFactorItem({ label, score, prevScore, color }: { label: string; score: number; prevScore?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-40 pl-6 text-[11px] text-gray-500 flex-shrink-0 flex items-center gap-1">
        <span className="text-gray-300">└</span>
        {label}
      </div>
      <DualBar
        score={score}
        prevScore={prevScore}
        color={lightenColor(color)}
        height="h-5"
        radius="0 3px 3px 0"
        showLabel={false}
        labelSize="text-[10px]"
      />
      <div className="w-12 text-right text-[11px] font-medium text-gray-500">
        {score.toFixed(1)}
      </div>
    </div>
  );
}

// ============================================================
// BarItem (2depth 중분류)
// ============================================================

function BarItem({
  label,
  score,
  prevScore,
  isNegative = false,
  subCategoryKey,
  tScores,
  prevTScores,
}: {
  label: string;
  score: number;
  prevScore?: number;
  isNegative?: boolean;
  subCategoryKey?: string;
  tScores?: number[];
  prevTScores?: number[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const barHex = subCategoryKey ? (CATEGORY_COLORS[subCategoryKey] ?? '#9CA3AF') : '#9CA3AF';

  const subFactors = useMemo(() => {
    if (!subCategoryKey || !tScores) return [];
    const indices = SUB_CATEGORY_FACTORS[subCategoryKey];
    if (!indices) return [];
    return indices.map(idx => ({
      name: FACTOR_DEFINITIONS[idx].name,
      score: tScores[idx],
      prevScore: prevTScores ? prevTScores[idx] : undefined,
    }));
  }, [subCategoryKey, tScores, prevTScores]);

  const hasSubFactors = subFactors.length > 1;

  return (
    <div>
      <div
        className={`flex items-center gap-2 ${hasSubFactors ? 'cursor-pointer' : ''}`}
        onClick={() => hasSubFactors && setIsExpanded(!isExpanded)}
      >
        <div className="w-40 text-xs font-medium text-gray-700 flex items-center gap-1 flex-shrink-0">
          {hasSubFactors && (
            isExpanded
              ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          )}
          {label}
          {isNegative && (
            <span className="text-[10px] text-red-500 font-normal">(부적)</span>
          )}
        </div>
        <DualBar score={score} prevScore={prevScore} color={barHex} />
        <div className="w-12 text-right text-xs font-semibold text-gray-600">
          {score.toFixed(1)}
        </div>
      </div>

      {/* 하위 요인 드롭다운 */}
      {isExpanded && hasSubFactors && (
        <div className="mt-1 space-y-1">
          {subFactors.map(factor => (
            <div key={factor.name} className="flex items-center gap-2">
              <div className="w-40 pl-6 text-[11px] text-gray-500 flex-shrink-0 flex items-center gap-1">
                <span className="text-gray-300">└</span>
                {factor.name}
              </div>
              <DualBar
                score={factor.score}
                prevScore={factor.prevScore}
                color={lightenColor(barHex)}
                height="h-5"
                radius="0 3px 3px 0"
                showLabel={false}
                labelSize="text-[10px]"
              />
              <div className="w-12 text-right text-[11px] font-medium text-gray-500">
                {factor.score.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 유틸리티
// ============================================================

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}
