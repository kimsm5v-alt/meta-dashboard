import { useState } from 'react';
import { Calendar, Users, AlertCircle, TrendingUp, Filter } from 'lucide-react';
import { Card } from '@/shared/components';
import { CounselingFrequencyChart, CounselingTypeChart } from '../components';

// 임시 Mock 데이터
const mockStats = {
  totalCounseling: 156,
  thisMonth: 23,
  notCounseledStudents: 5,
};

const mockStudentCounseling = [
  { id: '1', name: '김민준', count: 8, lastDate: '2024-03-15', tags: ['학업', '진로'] },
  { id: '2', name: '이서연', count: 5, lastDate: '2024-03-12', tags: ['교우관계'] },
  { id: '3', name: '박지호', count: 3, lastDate: '2024-03-08', tags: ['정서심리'] },
  { id: '4', name: '최수아', count: 0, lastDate: null, tags: [] },
  { id: '5', name: '정우진', count: 0, lastDate: null, tags: [] },
];

type PeriodFilter = 'all' | 'semester' | 'month' | 'custom';

type ChartView = 'type' | 'area';

export const CounselingDashboardPage: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [chartView, setChartView] = useState<ChartView>('type');

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">상담 대시보드</h1>
          <p className="text-gray-500 mt-1">상담 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">전체 기간</option>
            <option value="semester">이번 학기</option>
            <option value="month">이번 달</option>
            <option value="custom">기간 설정</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            필터
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 상담</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalCounseling}건</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">이번 달</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.thisMonth}건</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">미진행 학생</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.notCounseledStudents}명</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">상담 빈도 추이</h3>
          <CounselingFrequencyChart />
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">상담 분포</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setChartView('type')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  chartView === 'type'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                유형별
              </button>
              <button
                onClick={() => setChartView('area')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  chartView === 'area'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                영역별
              </button>
            </div>
          </div>
          <CounselingTypeChart type={chartView} />
        </Card>
      </div>

      {/* 학생별 상담 현황 테이블 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">학생별 상담 현황</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              총 {mockStudentCounseling.length}명
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이름</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상담 횟수</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">최근 상담일</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상담 영역</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockStudentCounseling.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="font-medium text-gray-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{student.count}회</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {student.lastDate || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {student.tags.length > 0 ? (
                        student.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {student.count === 0 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                        미진행
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                        진행중
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
