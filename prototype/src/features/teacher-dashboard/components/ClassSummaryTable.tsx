/**
 * 홈 > Section 4: 반별 현황 요약 테이블
 *
 * 검사관리 + 결과보기 데이터 통합
 * 컬럼: 반, 학생, 1차 검사, 2차 검사, 보기
 */

interface ClassSummary {
  id: string;
  name: string;
  totalStudents: number;
  round1Rate: number;
  round2Rate: number;
}

interface ClassSummaryTableProps {
  classes: ClassSummary[];
  onClassClick: (classId: string, className: string) => void;
}

export const ClassSummaryTable: React.FC<ClassSummaryTableProps> = ({
  classes,
  onClassClick,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">반별 현황 요약</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          각 반의 검사 진행 상황을 한눈에 확인하세요.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                반
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                학생
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                1차 검사
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                2차 검사
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                보기
              </th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr
                key={cls.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {/* 반 이름 */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => onClassClick(cls.id, cls.name)}
                    className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {cls.name}
                  </button>
                </td>

                {/* 학생 수 */}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {cls.totalStudents}명
                </td>

                {/* 1차 검사 */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        cls.round1Rate === 100
                          ? 'text-green-600'
                          : cls.round1Rate === 0
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {cls.round1Rate}%
                    </span>
                    {cls.round1Rate === 100
                      ? '✅'
                      : cls.round1Rate === 0
                      ? '🔴'
                      : '🟡'}
                  </div>
                </td>

                {/* 2차 검사 */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        cls.round2Rate === 100
                          ? 'text-green-600'
                          : cls.round2Rate === 0
                          ? 'text-gray-400'
                          : 'text-amber-600'
                      }`}
                    >
                      {cls.round2Rate}%
                    </span>
                    {cls.round2Rate === 100
                      ? '✅'
                      : cls.round2Rate === 0
                      ? '⏸️'
                      : '🟡'}
                  </div>
                </td>

                {/* 보기 버튼 */}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onClassClick(cls.id, cls.name)}
                    className="text-primary-600 hover:text-primary-700 transition-colors font-medium"
                  >
                    →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassSummaryTable;
