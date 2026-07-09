import { useMemo } from 'react';
import { calculate4StepDiagnosis, getLevel } from '@/shared/utils/calculate4StepDiagnosis';
import { CATEGORY_COLORS } from '@/shared/data/lpaProfiles';
import { clamp, TYPE_DESCRIPTIONS } from '@/features/student-dashboard/components/four-step/constants';
import { StepCard } from '@/features/student-dashboard/components/four-step/StepCard';
import { SubSection } from '@/features/student-dashboard/components/four-step/SubSection';
import { BarItem } from '@/features/student-dashboard/components/four-step/BarItem';
import { LeafFactorItem } from '@/features/student-dashboard/components/four-step/DualBar';

// ============================================================
// Props
// ============================================================

interface FourStepInterpretationProps {
  tScores: number[];
  prevTScores?: number[];
  studentName: string;
}

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
                            {delta > 0 ? '+' : ''}{delta.toFixed(0)}
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
