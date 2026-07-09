import { useMemo } from 'react';
import { getTypeDeviations } from '../../../shared/utils/lpaClassifier';
import { FACTOR_DEFINITIONS } from '../../../shared/data/factors';
import type { StudentType, SchoolLevel } from '../../../shared/types';

interface TypeDeviationsProps {
  tScores: number[];
  predictedType: StudentType;
  schoolLevel: SchoolLevel;
  /** 차수 비교 모드 여부 */
  isCompare?: boolean;
  /** 1차 T점수 (차수 비교 시 사용) */
  prevTScores?: number[];
}

/** 차수 변화 항목 타입 */
interface RoundChangeItem {
  factor: string;
  index: number;
  round1Score: number;
  round2Score: number;
  diff: number;          // 2차 - 1차 (변화량)
  absDiff: number;       // 절대값 (정렬용)
  isPositive: boolean;   // 긍정 요인 여부
  isImproved: boolean;   // 개선 여부
}

export const TypeDeviations: React.FC<TypeDeviationsProps> = ({
  tScores,
  predictedType,
  schoolLevel,
  isCompare = false,
  prevTScores,
}) => {
  // 차수 비교 모드: 1차→2차 변화가 가장 큰 항목들
  const roundChanges = useMemo<RoundChangeItem[]>(() => {
    if (!isCompare || !prevTScores || prevTScores.length !== tScores.length) {
      return [];
    }

    const changes: RoundChangeItem[] = FACTOR_DEFINITIONS.map((factor, idx) => {
      const round1Score = Math.round(prevTScores[idx]);
      const round2Score = Math.round(tScores[idx]);
      const diff = round2Score - round1Score;

      // 긍정 요인: diff > 0 이면 개선
      // 부정 요인: diff < 0 이면 개선
      const isImproved = factor.isPositive ? diff > 0 : diff < 0;

      return {
        factor: factor.name,
        index: idx,
        round1Score,
        round2Score,
        diff,
        absDiff: Math.abs(diff),
        isPositive: factor.isPositive,
        isImproved,
      };
    });

    // 절대값 기준 정렬 후 상위 3개
    return changes
      .filter(c => c.absDiff >= 3) // 최소 3점 이상 변화만
      .sort((a, b) => b.absDiff - a.absDiff)
      .slice(0, 3);
  }, [isCompare, prevTScores, tScores]);

  // 일반 모드: 유형 대비 특이점
  let deviations: ReturnType<typeof getTypeDeviations> = [];

  if (!isCompare) {
    try {
      deviations = getTypeDeviations(tScores, predictedType, schoolLevel, 3);
    } catch {
      // 유형 특이점 추출 실패 시 빈 배열 유지
    }
  }

  // 차수 비교 모드 렌더링
  if (isCompare) {
    if (roundChanges.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          1차와 2차 사이에 큰 변화가 없습니다.
        </div>
      );
    }

    return (
      <div>
        <div className="flex gap-4">
          {roundChanges.map((item, i) => {
            // 개선: 초록색, 악화: 빨간색
            const arrowColor = item.isImproved ? '#16A34A' : '#DC2626';
            const arrowSymbol = item.diff > 0 ? '↑' : '↓';
            const bgColor = item.isImproved ? 'bg-green-50' : 'bg-red-50';
            const borderColor = item.isImproved ? 'border-green-200' : 'border-red-200';

            return (
              <div
                key={i}
                className={`flex-1 flex flex-col items-center ${bgColor} border ${borderColor} rounded-xl p-4 hover:shadow-md transition-shadow`}
              >
                {/* 화살표 */}
                <div
                  className="text-3xl font-bold mb-2"
                  style={{ color: arrowColor }}
                >
                  {arrowSymbol}
                </div>

                {/* 요인명 */}
                <div className="text-base font-semibold text-gray-900 mb-1">
                  {item.factor}
                </div>

                {/* 변화량 */}
                <div
                  className="text-2xl font-bold mb-2"
                  style={{ color: arrowColor }}
                >
                  {item.diff > 0 ? '+' : ''}{item.diff}
                </div>

                {/* 상세 정보: 1차 → 2차 */}
                <div className="text-xs text-gray-500">
                  1차 T={item.round1Score} → 2차 T={item.round2Score}
                </div>

                {/* 개선/악화 라벨 */}
                <div
                  className="mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: item.isImproved ? '#DCFCE7' : '#FEE2E2',
                    color: item.isImproved ? '#166534' : '#991B1B',
                  }}
                >
                  {item.isImproved ? '개선' : '주의'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 일반 모드 렌더링 (기존 로직)
  if (deviations.length === 0) {
    return null;
  }

  return (
    <div>
      {/* HSJ 스타일: 특이점 카드 그리드 */}
      <div className="flex gap-4">
        {deviations.map((dev, i) => {
          const isUp = dev.diff > 0;
          const arrowColor = isUp ? '#E74C3C' : '#3498DB';
          const arrowSymbol = isUp ? '↑' : '↓';

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              {/* 화살표 */}
              <div
                className="text-3xl font-bold mb-2"
                style={{ color: arrowColor }}
              >
                {arrowSymbol}
              </div>

              {/* 요인명 */}
              <div className="text-base font-semibold text-gray-900 mb-1">
                {dev.factor}
              </div>

              {/* 편차 */}
              <div
                className="text-2xl font-bold mb-2"
                style={{ color: arrowColor }}
              >
                {isUp ? '+' : ''}{dev.diff}
              </div>

              {/* 상세 정보 */}
              <div className="text-xs text-gray-500">
                학생 T={dev.studentScore} / 유형평균 T={dev.typeMean}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TypeDeviations;
