/**
 * 홈 > Section 6: 학생 유형 분포 요약
 *
 * 결과보기 > 전체의 LPA 스택바 (1차/2차 구분)
 */

import { useNavigate } from 'react-router-dom';

interface TypeInfo {
  name: string;
  count: number;
  color: string;
}

interface RoundDistribution {
  types: TypeInfo[] | null;
}

interface ClassDistribution {
  className: string;
  round1: RoundDistribution;
  round2: RoundDistribution;
}

interface StudentTypeDistributionProps {
  data: ClassDistribution[];
}

const LPA_COLORS: Record<string, string> = {
  '몰입자원 풍부형': '#10B981',
  '안전 균형형': '#F59E0B',
  '자원소진형': '#EF4444',
  '자기주도 몰입형': '#10B981',
  '정서조절 취약형': '#F59E0B',
  '냉소적 무기력형': '#EF4444',
};

const LPA_TYPE_ORDER = ['자원소진형', '냉소적 무기력형', '안전 균형형', '정서조절 취약형', '몰입자원 풍부형', '자기주도 몰입형'];

const DistributionBar: React.FC<{ distribution: RoundDistribution }> = ({ distribution }) => {
  if (!distribution.types) {
    return (
      <div className="flex-1 flex items-center justify-center h-8 bg-gray-50 rounded-lg">
        <span className="text-sm text-gray-400">검사 미실시</span>
      </div>
    );
  }

  const total = distribution.types.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="flex-1 flex h-8 rounded-lg overflow-hidden">
      {LPA_TYPE_ORDER.map((typeName) => {
        const typeInfo = distribution.types?.find((t) => t.name === typeName);
        if (!typeInfo || typeInfo.count === 0) return null;

        const percentage = total > 0 ? Math.round((typeInfo.count / total) * 100) : 0;

        return (
          <div
            key={typeName}
            className="flex items-center justify-center text-xs text-white font-medium"
            style={{
              width: `${percentage}%`,
              backgroundColor: typeInfo.color,
            }}
            title={`${typeName}: ${typeInfo.count}명 (${percentage}%)`}
          >
            {percentage > 10 && `${typeInfo.count}명`}
          </div>
        );
      })}
    </div>
  );
};

export const StudentTypeDistribution: React.FC<StudentTypeDistributionProps> = ({ data }) => {
  const navigate = useNavigate();

  // 모든 유형 수집
  const allTypes = new Set<string>();
  data.forEach((cls) => {
    [cls.round1, cls.round2].forEach((round) => {
      if (round.types) {
        round.types.forEach((t) => allTypes.add(t.name));
      }
    });
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-3 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">학생 유형 분포</h3>
        <p className="text-xs text-gray-500 mt-0.5">반별 LPA 유형 비교</p>
      </div>

      <div className="overflow-x-auto px-6">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                반
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                1차 검사
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                2차 검사
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((cls, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900">{cls.className}</span>
                </td>
                <td className="px-4 py-4">
                  <DistributionBar distribution={cls.round1} />
                </td>
                <td className="px-4 py-4">
                  <DistributionBar distribution={cls.round2} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 범례 */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <div className="flex gap-3 justify-center flex-wrap">
          {LPA_TYPE_ORDER.filter((typeName) =>
            data.some((cls) =>
              [cls.round1, cls.round2].some((round) => round.types?.some((t) => t.name === typeName))
            )
          ).map((typeName) => {
            const typeInfo = data
              .flatMap((cls) => [...(cls.round1.types || []), ...(cls.round2.types || [])])
              .find((t) => t.name === typeName);
            return (
              <div key={typeName} className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: typeInfo?.color || LPA_COLORS[typeName] }}
                />
                <span className="text-xs text-gray-600">{typeName}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentTypeDistribution;
