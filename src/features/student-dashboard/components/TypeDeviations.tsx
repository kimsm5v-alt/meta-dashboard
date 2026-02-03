import { getTypeDeviations } from '../../../shared/utils/lpaClassifier';
import type { StudentType, SchoolLevel } from '../../../shared/types';

interface TypeDeviationsProps {
  tScores: number[];
  predictedType: StudentType;
  schoolLevel: SchoolLevel;
  onCoachingClick?: () => void;
}

export const TypeDeviations: React.FC<TypeDeviationsProps> = ({
  tScores,
  predictedType,
  schoolLevel,
  onCoachingClick,
}) => {
  let deviations: ReturnType<typeof getTypeDeviations> = [];

  try {
    deviations = getTypeDeviations(tScores, predictedType, schoolLevel, 3);
  } catch {
    // 유형 특이점 추출 실패 시 빈 배열 유지
  }

  if (deviations.length === 0) {
    return null;
  }

  const generateDeviationText = () => {
    const parts: string[] = [];

    deviations.forEach((dev) => {
      const direction = dev.diff > 0 ? '높고' : '낮으며';
      const sign = dev.diff > 0 ? '+' : '';
      parts.push(`${dev.factor}이 특히 ${direction} (${sign}${dev.diff})`);
    });

    return `같은 ${predictedType} 학생들에 비해 ${parts.join(', ')} 합니다.`;
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">유형별 특이점</h3>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          {generateDeviationText()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {deviations.map((dev, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center p-4 bg-gray-50 border rounded-lg hover:shadow-sm transition-shadow text-center"
          >
            <div className="mb-2">
              {dev.diff > 0 ? (
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-red-500">
                  <path
                    d="M16 6 C16 6, 16 6, 16 6 L28 24 C28 24, 28 25, 27 25 L5 25 C4 25, 4 24, 4 24 L16 6 Z"
                    fill="currentColor"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-500">
                  <path
                    d="M16 26 C16 26, 16 26, 16 26 L4 8 C4 8, 4 7, 5 7 L27 7 C28 7, 28 8, 28 8 L16 26 Z"
                    fill="currentColor"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <p className="font-medium text-gray-800 mb-1">{dev.factor}</p>
            <span className={`text-2xl font-bold mb-2 ${dev.diff > 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {dev.diff > 0 ? '+' : ''}{dev.diff}
            </span>
            <p className="text-xs text-gray-500">학생 T={dev.studentScore} / 유형평균 T={dev.typeMean}</p>
          </div>
        ))}
      </div>

      {onCoachingClick && (
        <button
          onClick={onCoachingClick}
          className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>코칭 전략 보기</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
};

export default TypeDeviations;
