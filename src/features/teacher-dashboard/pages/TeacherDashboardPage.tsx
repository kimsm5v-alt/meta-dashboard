import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '@/shared/components';
import { MOCK_CLASSES, MOCK_TEACHER } from '@/shared/data/mockData';
import { TYPE_COLORS, TYPE_COLOR_CLASSES } from '@/shared/data/lpaProfiles';
import { CategoryComparisonChart, TypeDistributionChart } from '../components';
import type { Class } from '@/shared/types';

const TYPE_ORDER: Record<string, string[]> = {
  '초등': ['자원소진형', '안전균형형', '몰입자원풍부형'],
  '중등': ['무기력형', '정서조절취약형', '자기주도몰입형'],
};

const getSortedTypeDistribution = (cls: Class) => {
  const dist = cls.stats?.typeDistribution;
  if (!dist) return [];
  const order = TYPE_ORDER[cls.schoolLevel] ?? [];
  return order
    .filter(t => dist[t])
    .map(t => [t, dist[t]] as [string, { count: number; percentage: number }]);
};

export const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const classes = MOCK_CLASSES;
  const teacher = MOCK_TEACHER;
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const totalStats = {
    totalStudents: classes.reduce((sum, c) => sum + (c.stats?.totalStudents || 0), 0),
    assessedStudents: classes.reduce((sum, c) => sum + (c.stats?.assessedStudents || 0), 0),
    needAttention: classes.reduce((sum, c) => sum + (c.stats?.needAttentionCount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{teacher.name}님의 학급 현황</h1>
        <p className="text-gray-500 mt-1">
          담당 학급: {classes.length}개 반 | 총 학생: {totalStats.totalStudents}명 | 
          검사 완료: {totalStats.assessedStudents}명 ({Math.round((totalStats.assessedStudents / totalStats.totalStudents) * 100)}%)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 학생</p>
              <p className="text-xl font-semibold">{totalStats.totalStudents}명</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">검사 완료</p>
              <p className="text-xl font-semibold">{totalStats.assessedStudents}명</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">관심 필요</p>
              <p className="text-xl font-semibold text-orange-600">{totalStats.needAttention}명</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 반별 비교 분석 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">반별 비교 분석</h2>

        {/* 반 선택 카드 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">비교할 학급을 선택하세요</p>
                <p className="text-xs text-gray-600 mt-0.5">선택한 학급이 그래프에서 강조 표시됩니다</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {classes.map((cls) => {
                const isSelected = selectedClassId === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(isSelected ? null : cls.id)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    {cls.grade}-{cls.classNumber}반
                  </button>
                );
              })}
              {selectedClassId && (
                <button
                  onClick={() => setSelectedClassId(null)}
                  className="ml-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white text-red-600 hover:bg-red-50 border border-red-200 hover:shadow-md transition-all duration-200"
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    선택 해제
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 5대 영역 비교 */}
          <Card>
            <h3 className="text-base font-semibold mb-3">5대 영역 반별 평균 비교</h3>
            <p className="text-sm text-gray-500 mb-4">
              각 반의 5대 영역별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.
            </p>
            <CategoryComparisonChart
              classes={classes}
              selectedClassId={selectedClassId}
              onClassSelect={setSelectedClassId}
            />
          </Card>

          {/* 학생 유형 분포 비교 */}
          <Card>
            <h3 className="text-base font-semibold mb-3">학생 유형 분포 비교</h3>
            <p className="text-sm text-gray-500 mb-4">
              각 반의 학생 유형별 분포를 비교합니다.
            </p>
            <TypeDistributionChart
              classes={classes}
              selectedClassId={selectedClassId}
              onClassSelect={setSelectedClassId}
            />
          </Card>
        </div>
      </div>

      {/* Class Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">반별 현황</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const round1Count = cls.stats?.round1Completed ? cls.stats.assessedStudents : 0;
            const round2Count = cls.students.filter(s => s.assessments.some(a => a.round === 2)).length;
            const totalStudents = cls.stats?.totalStudents || 0;

            return (
              <Card key={cls.id} hoverable>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">{cls.grade}학년 {cls.classNumber}반</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/class/${cls.id}`);
                    }}
                    className="px-3 py-1 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    상세보기
                  </button>
                </div>

                {/* Student Count */}
                <div className="mb-3 pb-3 border-b border-gray-100">
                  <p className="text-sm text-gray-600">
                    전체 학생 <span className="font-semibold text-gray-900">{cls.stats?.totalStudents}명</span>
                  </p>
                </div>

                {/* Assessment Progress - Compact 2-column */}
                <div className="mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-3">검사 진행 현황</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Round 1 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {cls.stats?.round1Completed ? (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">!</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-900">1차</p>
                      </div>
                      <p className="text-xs text-gray-600 ml-7">{round1Count}/{totalStudents}명</p>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded text-center ${
                        cls.stats?.round1Completed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {cls.stats?.round1Completed ? '완료' : '진행중'}
                      </span>
                    </div>

                    {/* Round 2 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                          {cls.stats?.round2Completed ? (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : round2Count > 0 ? (
                            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">!</span>
                            </div>
                          ) : (
                            <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-900">2차</p>
                      </div>
                      <p className="text-xs text-gray-600 ml-7">{round2Count}/{totalStudents}명</p>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded text-center ${
                        cls.stats?.round2Completed
                          ? 'bg-green-100 text-green-700'
                          : round2Count > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {cls.stats?.round2Completed ? '완료' : round2Count > 0 ? '진행중' : '시작전'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Type Distribution Bar */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">유형 분포</p>
                  {(() => {
                    const sorted = getSortedTypeDistribution(cls);
                    if (sorted.length === 0) return null;
                    return (
                      <>
                        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                          {sorted.map(([type, data]) => (
                            <div key={type} className="h-full" style={{ width: `${data.percentage}%`, backgroundColor: TYPE_COLORS[type] }} />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sorted.map(([type, data]) => (
                            <span key={type} className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLOR_CLASSES[type]}`}>
                              {type.replace('형', '')}: {data.count}명
                            </span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Attention Badge */}
                {(cls.stats?.needAttentionCount || 0) > 0 && (
                  <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">관심 필요: {cls.stats?.needAttentionCount}명</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
