/**
 * 홈 > 수업 탭: 사회정서역량별 반별 수업 이력 매트릭스
 *
 * 6가지 SEL 역량:
 * - 자기인식
 * - 자기관리
 * - 사회적 인식
 * - 관계기술
 * - 책임 있는 의사결정
 * - 마음 건강
 */

import { useNavigate } from 'react-router-dom';

interface ClassSELData {
  className: string;
  selfAwareness: number;      // 자기인식
  selfManagement: number;     // 자기관리
  socialAwareness: number;    // 사회적 인식
  relationshipSkills: number; // 관계기술
  responsibleDecision: number; // 책임 있는 의사결정
  mentalHealth: number;       // 마음 건강
}

interface SELCompetencyMatrixProps {
  data: ClassSELData[];
}

const SEL_COMPETENCIES = [
  { key: 'selfAwareness', label: '자기인식' },
  { key: 'selfManagement', label: '자기관리' },
  { key: 'socialAwareness', label: '사회적 인식' },
  { key: 'relationshipSkills', label: '관계기술' },
  { key: 'responsibleDecision', label: '책임있는 의사결정' },
  { key: 'mentalHealth', label: '마음 건강' },
] as const;

// 수업 횟수에 따른 색상 강도 (초록 계열 - 명확한 구분)
const getIntensityClass = (count: number): string => {
  if (count === 0) return 'bg-gray-100 text-gray-400';
  if (count === 1) return 'bg-green-100 text-green-700';
  if (count === 2) return 'bg-green-300 text-green-800';
  if (count === 3) return 'bg-green-500 text-white';
  return 'bg-green-700 text-white';
};

export const SELCompetencyMatrix: React.FC<SELCompetencyMatrixProps> = ({ data }) => {
  const navigate = useNavigate();

  // 전체 최대값 계산 (히트맵 스케일용)
  const maxCount = Math.max(
    ...data.flatMap((cls) =>
      SEL_COMPETENCIES.map((comp) => cls[comp.key as keyof ClassSELData] as number)
    )
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">사회정서역량별 수업 이력</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          반별 SEL 역량 수업 실행 횟수
        </p>
      </div>

      {/* 매트릭스 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-20">
                반
              </th>
              {SEL_COMPETENCIES.map((comp) => (
                <th
                  key={comp.key}
                  className="px-2 py-2 text-center text-xs font-medium text-gray-500 w-24"
                >
                  {comp.label}
                </th>
              ))}
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-16">
                합계
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((cls) => {
              const total = SEL_COMPETENCIES.reduce(
                (sum, comp) => sum + (cls[comp.key as keyof ClassSELData] as number),
                0
              );

              return (
                <tr key={cls.className} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{cls.className}</span>
                  </td>
                  {SEL_COMPETENCIES.map((comp) => {
                    const count = cls[comp.key as keyof ClassSELData] as number;
                    return (
                      <td key={comp.key} className="px-2 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-full h-10 rounded-lg text-sm font-medium ${getIntensityClass(count)}`}
                        >
                          {count}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center">
                    <span className="text-sm font-bold text-gray-900">{total}회</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default SELCompetencyMatrix;
