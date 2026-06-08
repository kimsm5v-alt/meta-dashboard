import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
import { Card } from '@/shared/components';
import { useData } from '@/shared/contexts/DataContext';
import { useTeacherClasses, useApiConfig } from '@/shared/hooks/useApiData';
import { CategoryComparisonChart, OverviewSummaryPanel, LPAComparisonSection } from '../components';
import { calculateCategoryAverages } from '@/shared/utils/classComparisonUtils';

// 검사 유형 정의
type TestId = 'comprehensive' | 'selfreg';

interface TeacherDashboardPageProps {
  testId?: TestId;
}

// 검사별 메타 정보
const TEST_META: Record<TestId, { name: string; shortName: string; color: string; hasLPA: boolean }> = {
  comprehensive: { name: '학습종합검사', shortName: '학습종합', color: '#6366F1', hasLPA: true },
  selfreg: { name: '자기조절학습검사', shortName: '자기조절', color: '#10B981', hasLPA: false },
};

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({ testId = 'comprehensive' }) => {
  const navigate = useNavigate();
  const { teacher } = useData();
  const { hasJwtToken } = useApiConfig();
  const { classes, isLoading, error, examStatus } = useTeacherClasses();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [drillLevel, setDrillLevel] = useState<'5areas' | '11categories'>('5areas');

  const testMeta = TEST_META[testId];

  // Hooks must be called before any conditional returns (Rules of Hooks)
  const totalStats = useMemo(() => ({
    totalStudents: classes.reduce((sum, c) => sum + (c.stats?.totalStudents || 0), 0),
    assessedStudents: classes.reduce((sum, c) => sum + (c.stats?.assessedStudents || 0), 0),
  }), [classes]);

  // API 모드 로딩 상태
  if (hasJwtToken && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">학급 데이터를 불러오는 중...</p>
          <p className="text-gray-400 text-sm mt-1">API 연결 확인 중</p>
        </div>
      </div>
    );
  }

  // API 에러 상태
  if (hasJwtToken && error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-gray-500">데이터 로드 실패: {error}</p>
        </div>
      </div>
    );
  }

  // API 모드: 검사가 모두 진행중인 경우
  if (hasJwtToken && examStatus === 'in-progress') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-lg font-medium text-gray-700 mb-2">검사가 진행 중이에요</p>
          <p className="text-gray-500">검사가 종료된 후 결과를 확인할 수 있습니다.</p>
          <p className="text-gray-400 text-sm mt-1">[검사하기] 메뉴에서 검사를 종료해 주세요.</p>
        </div>
      </div>
    );
  }

  // API 모드: 검사가 없는 경우
  if (hasJwtToken && examStatus === 'no-exams') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">등록된 검사가 없습니다.</p>
          <p className="text-gray-400 text-sm mt-1">[검사하기] 메뉴에서 검사를 생성해 주세요.</p>
        </div>
      </div>
    );
  }

  // 데이터 없음 (Mock 모드)
  if (classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">등록된 학급이 없습니다.</p>
          <p className="text-gray-400 text-sm mt-1">데이터를 업로드하거나 API 설정을 확인해주세요.</p>
        </div>
      </div>
    );
  }

  // 반별 평균 계산
  const classAverages = useMemo(() => {
    return classes.map(cls => calculateCategoryAverages(cls));
  }, [classes]);

  // 경로 생성 함수
  const getClassPath = (classId: string) => {
    return `/dashboard/${testId}/class/${classId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header - A안 스타일 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span
              className="px-3 py-1 text-xs font-semibold rounded-full text-white"
              style={{ backgroundColor: testMeta.color }}
            >
              {testMeta.shortName}검사
            </span>
            <nav className="text-sm text-gray-500">
              <span>결과보기</span>
              <ChevronRight className="inline w-4 h-4 mx-1" />
              <span className="text-gray-900">{testMeta.name}</span>
            </nav>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{teacher.name} 선생님의 학급 분석</h1>
          <p className="text-gray-500 mt-1">
            담당 학급 {classes.length}개 반 · 총 학생 {totalStats.totalStudents}명
          </p>
        </div>
      </div>

      {/* A안: 반별 비교 분석 - 라인차트 + 우측 요약 */}
      <Card className="!p-0 overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">반별 비교 분석</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {testId === 'selfreg'
                ? (drillLevel === '5areas'
                    ? `각 반의 3대 전략별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.`
                    : `각 반의 6개 중분류별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.`)
                : (drillLevel === '5areas'
                    ? `각 반의 5대 영역별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.`
                    : `각 반의 11개 요인별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.`)}
            </p>
          </div>
          {/* Drill Level 토글 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDrillLevel('5areas')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                drillLevel === '5areas'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {testId === 'selfreg' ? '3대 전략' : '5대 영역'}
            </button>
            <button
              onClick={() => setDrillLevel('11categories')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                drillLevel === '11categories'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {testId === 'selfreg' ? '6개 중분류' : '11개 요인'}
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠: 차트 + 요약 */}
        <div className="flex">
          {/* 라인차트 영역 */}
          <div className="flex-1 p-5">
            {/* 반 선택 칩 */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedClassId(null)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                  selectedClassId === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                전체 ({totalStats.totalStudents}명)
              </button>
              {classes.map((cls, idx) => {
                const colors = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
                const color = colors[idx % colors.length];
                const isSelected = selectedClassId === cls.id;
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(isSelected ? null : cls.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {cls.grade}학년 {cls.classNumber}반 ({cls.stats?.assessedStudents || 0}명)
                  </button>
                );
              })}
            </div>

            {/* 라인차트 */}
            <CategoryComparisonChart
              classes={classes}
              selectedClassId={selectedClassId}
              onClassSelect={setSelectedClassId}
              drillLevel={drillLevel}
              testId={testId}
            />
          </div>

          {/* 우측 요약 패널 */}
          <div className="w-80 border-l border-gray-100 bg-gray-50 p-5">
            <OverviewSummaryPanel
              classes={classes}
              classAverages={classAverages}
              selectedClassId={selectedClassId}
              testId={testId}
              onGoToClass={(classId) => navigate(getClassPath(classId))}
            />
          </div>
        </div>
      </Card>

      {/* LPA 유형 분포 비교 (학습종합검사만) */}
      {/* TODO: 고등학교(schoolLevel === '고등')일 경우 LPA 유형이 없으므로 이 섹션을 숨겨야 함
          - 현재는 schoolLevel이 '초등' | '중등'만 지원
          - 백엔드에서 그룹별 교과급 분류 작업 완료 후 조건 추가 필요
          - 예: testMeta.hasLPA && schoolLevel !== '고등' */}
      {testMeta.hasLPA && (
        <LPAComparisonSection
          classes={classes}
          onGoToClass={(classId) => navigate(getClassPath(classId))}
        />
      )}
    </div>
  );
};

export default TeacherDashboardPage;
