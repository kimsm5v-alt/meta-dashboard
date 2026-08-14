import type { FactorInfo, ObservationEntry, ObservationPayload } from '../types';

export interface BuildObservationInputParams {
  /** 학생의 강점 요인 목록(TOP3) — 선택된 factorCode가 여기 있으면 type='strength' */
  strengthFactors: string[];
  /** 선택한 요인들(강점+보완 통틀어) */
  factorCodes: string[];
  /** 선택한 관찰 행동(요인 구분 없이 평평한 목록) */
  behaviorCodes: string[];
  freeText: string;
  counselingRefs: string[];
  factorInfo: Record<string, FactorInfo>;
}

/**
 * UI 선택 상태 → 저장 API의 observationInput 형태(FE 가이드 §3-3).
 * 관찰 블록은 선택한 요인 수만큼 생기고, 각 블록엔 그 요인의 추천행동 중 실제 선택된 것만 담는다
 * (behaviorCodes가 평평한 배열이라 요인별로 recommendedBehaviors에 포함되는지로 역산한다).
 */
export function buildObservationInput(params: BuildObservationInputParams): ObservationPayload {
  const observations: ObservationEntry[] = params.factorCodes.map((factor) => {
    const recommended = params.factorInfo[factor]?.recommendedBehaviors ?? [];
    return {
      factor,
      type: params.strengthFactors.includes(factor) ? 'strength' : 'improvement',
      behaviorCodes: params.behaviorCodes.filter((behavior) => recommended.includes(behavior)),
    };
  });

  return {
    observations,
    freeText: params.freeText.trim(),
    counselingRefs: params.counselingRefs,
  };
}
