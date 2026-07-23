import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, ShieldAlert, Clock, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/shared/components';
import { useData } from '@/shared/contexts/DataContext';
import { useClassStudents, useApiConfig } from '@/shared/hooks/useApiData';
import type { Class } from '@/shared/types';
import { useClassProfile } from '../hooks/useClassProfile';
import { TYPE_COLORS } from '../utils/typeUtils';

// 탭 컴포넌트 import
import { CoreSummaryTab } from '../components/tabs/CoreSummaryTab';
import { LearningDetailTab } from '../components/tabs/LearningDetailTab';
import { StudentListTab } from '../components/tabs/StudentListTab';

type TestId = 'comprehensive' | 'selfreg';
type TabId = 'core-summary' | 'learning-detail' | 'student-list';

interface ClassDashboardPageProps {
  testId?: TestId;
}

// 검사별 메타 정보
const TEST_META: Record<TestId, { name: string; shortName: string; color: string; hasLPA: boolean }> = {
  comprehensive: { name: '학습종합검사', shortName: '학습종합', color: '#6366F1', hasLPA: true }, // 고등일 때는 hasLPA가 false로 동적 처리됨
  selfreg: { name: '자기조절학습검사', shortName: '자기조절', color: '#10B981', hasLPA: false },
};

export const ClassDashboardPage: React.FC<ClassDashboardPageProps> = ({ testId = 'comprehensive' }) => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { getClassById } = useData();
  const { hasJwtToken } = useApiConfig();
  const { students: apiStudents, isLoading, error } = useClassStudents(classId);

  const [activeTab, setActiveTab] = useState<TabId>('core-summary');

  // API 모드: useClassStudents에서 가져온 학생 데이터 사용
  // Mock 모드: DataContext에서 가져온 데이터 사용
  const baseClassData = classId ? getClassById(classId) : undefined;

  // API 모드에서 학생 데이터가 있으면 classData 구성
  const classData: Class | undefined = useMemo(() => {
    // API 모드이고 학생 데이터가 있으면 API 데이터로 학급 구성
    if (hasJwtToken && apiStudents.length > 0 && classId) {
      const firstStudent = apiStudents[0];
      const schoolLevel = firstStudent?.schoolLevel ?? '초등';
      const grade = firstStudent?.grade ?? 1;
      const parts = classId.split('-');
      const classNumber = parseInt(parts[1], 10) || 1;

      const assessedStudents = apiStudents.filter(s => s.assessments.length > 0).length;
      const typeDistribution: Record<string, { count: number; percentage: number }> = {};

      for (const student of apiStudents) {
        const latestAssessment = student.assessments[student.assessments.length - 1];
        if (latestAssessment) {
          const type = latestAssessment.predictedType;
          if (!typeDistribution[type]) {
            typeDistribution[type] = { count: 0, percentage: 0 };
          }
          typeDistribution[type].count++;
        }
      }

      for (const type of Object.keys(typeDistribution)) {
        typeDistribution[type].percentage = assessedStudents > 0
          ? Math.round((typeDistribution[type].count / assessedStudents) * 100)
          : 0;
      }

      const needAttentionCount = apiStudents.filter(
        s => s.assessments.some(a => a.attentionResult.needsAttention)
      ).length;

      return {
        id: classId,
        schoolLevel,
        grade,
        classNumber,
        teacherId: '',
        students: apiStudents,
        stats: {
          totalStudents: apiStudents.length,
          assessedStudents,
          typeDistribution,
          needAttentionCount,
          round1Completed: assessedStudents > 0,
          round2Completed: apiStudents.some(s => s.assessments.some(a => a.round === 2)),
          examStatus: {
            round1: assessedStudents > 0 ? '종료' : '시작전',
            round2: apiStudents.some(s => s.assessments.some(a => a.round === 2)) ? '종료' : '시작전',
          },
          round2SubmittedCount: apiStudents.filter(s => s.assessments.some(a => a.round === 2)).length,
        },
      };
    }
    return baseClassData;
  }, [baseClassData, hasJwtToken, apiStudents, classId]);

  // 학교급에 따른 hasLPA 동적 처리
  // - 초등/중등 학습종합검사: LPA 있음
  // - 고등 학습종합검사: LPA 없음 (영역별 강점/약점만 표시)
  // - 자기조절학습검사: LPA 없음
  const testMeta = useMemo(() => {
    const baseMeta = TEST_META[testId];
    if (testId === 'comprehensive' && classData?.schoolLevel === '고등') {
      return { ...baseMeta, hasLPA: false };
    }
    return baseMeta;
  }, [testId, classData?.schoolLevel]);

  // 학급 프로필 (강점/약점)
  const classProfile = useClassProfile(classData, 1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // API 모드 로딩 상태
  if (hasJwtToken && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">학급 데이터를 불러오는 중...</p>
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

  if (!classData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">학급을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 신뢰도 경고 상태 계산
  const reliabilityWarningOnly = (() => {
    const studentsWithRound1 = classData.students.filter(s =>
      s.assessments.some(a => a.round === 1)
    );
    if (studentsWithRound1.length === 0) return false;

    const reliableStudents = studentsWithRound1.filter(s => {
      const r1 = s.assessments.find(a => a.round === 1);
      return r1 && r1.reliabilityWarnings.length === 0;
    });
    return reliableStudents.length === 0;
  })();

  // KPI 계산
  const totalStudents = classData.stats?.totalStudents || 0;
  const assessedStudents = classData.stats?.assessedStudents || 0;
  const needAttentionCount = classData.stats?.needAttentionCount || 0;
  const completionRate = totalStudents > 0 ? Math.round((assessedStudents / totalStudents) * 100) : 0;

  // 우세 유형 계산 (LPA가 있는 경우)
  const dominantType = (() => {
    const typeDistribution = classData.stats?.typeDistribution;
    if (!typeDistribution) return null;
    let maxCount = 0;
    let dominant = '';
    Object.entries(typeDistribution).forEach(([type, data]) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        dominant = type;
      }
    });
    return dominant || null;
  })();

  // 대표 강점 영역 (LPA가 없는 경우)
  const topStrength = classProfile?.strengths[0]?.category || '분석 중';

  // 탭 정의
  const tabs: { id: TabId; label: string }[] = [
    { id: 'core-summary', label: '핵심 요약' },
    { id: 'learning-detail', label: '학습 상세' },
    { id: 'student-list', label: '학생 목록' },
  ];

  // 학교급 표시
  const schoolLevelLabel = classData.schoolLevel === '초등' ? '초등' : '중등';

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="page-head">
        {/* 브레드크럼 (반 전체 대시보드와 동일 형식) */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className="px-3 py-1 text-xs font-semibold rounded-full text-white"
            style={{ backgroundColor: testMeta.color }}
          >
            {TEST_META[testId].shortName}검사
          </span>
          <nav className="text-sm text-gray-500">
            <span>결과보기</span>
            <ChevronRight className="inline w-4 h-4 mx-1" />
            <button
              onClick={() => navigate(`/dashboard/${testId}`)}
              className="hover:text-gray-900 transition-colors"
            >
              {testMeta.name}
            </button>
            <ChevronRight className="inline w-4 h-4 mx-1" />
            <span className="text-gray-900">{classData.grade}학년 {classData.classNumber}반</span>
          </nav>
        </div>

        {/* 타이틀 행: 뒤로가기 버튼 + 타이틀 + 액션 (같은 선상) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 뒤로가기 버튼 (vj-back 스타일) */}
            <button
              className="vj-back"
              onClick={() => navigate(`/dashboard/${testId}`)}
              aria-label="돌아가기"
              title="돌아가기"
              style={{ padding: 8 }}
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {classData.grade}학년 {classData.classNumber}반 검사 분석
              </h1>
              {/* 메타 정보: 학교명 · 학교급 · n학년n반 · 학생nn명 */}
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <span>서울초등학교</span>
                <span className="text-gray-300">·</span>
                <span>{schoolLevelLabel}</span>
                <span className="text-gray-300">·</span>
                <span>{classData.grade}학년 {classData.classNumber}반</span>
                <span className="text-gray-300">·</span>
                <span>학생 <strong className="text-gray-700">{totalStudents}명</strong></span>
              </div>
            </div>
          </div>
          {/* 보고서 다운로드 버튼 */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            보고서 다운로드
          </button>
        </div>
      </div>

      {/* 2차 검사 진행중 배너 */}
      {classData.stats?.examStatus?.round2 === '진행중' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">2차 검사 진행 중</p>
            <p className="text-xs text-amber-600">
              {classData.stats.round2SubmittedCount}/{totalStudents}명 제출 완료.
              검사 종료 후 결과를 확인할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* 신뢰도 경고 배너 */}
      {reliabilityWarningOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              모든 학생이 신뢰도 주의 상태입니다
            </p>
            <p className="text-sm text-amber-700 mt-1">
              신뢰도 양호 학생이 없어 전체 학생 데이터를 기반으로 분석 결과를 표시합니다.
              결과 해석에 주의가 필요합니다.
            </p>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 (둥근 pill 스타일) */}
      <div className="class-tabs flex gap-1 bg-gray-100 p-1 rounded-full w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI 카드 4개 */}
      <div className="grid grid-cols-4 gap-4">
        {/* 학급 평균 점수 */}
        <Card className="!p-4">
          <p className="text-xs text-gray-500 mb-1">학급 평균 T점수</p>
          <p className="text-2xl font-extrabold text-gray-900">
            {classProfile ? Math.round(
              (classProfile.strengths.reduce((sum, s) => sum + s.avgT, 0) +
               classProfile.weaknesses.reduce((sum, w) => sum + w.avgT, 0)) /
              (classProfile.strengths.length + classProfile.weaknesses.length) || 50
            ) : 50}
          </p>
        </Card>

        {/* 우세 유형 또는 대표 강점 */}
        <Card className="!p-4">
          <p className="text-xs text-gray-500 mb-1">
            {testMeta.hasLPA ? '우세 유형' : '대표 강점'}
          </p>
          <p
            className="text-lg font-extrabold truncate"
            style={{
              color: testMeta.hasLPA && dominantType
                ? TYPE_COLORS[dominantType]
                : '#10B981',
            }}
          >
            {testMeta.hasLPA ? (dominantType || '-') : topStrength}
          </p>
        </Card>

        {/* 관심 필요 학생 */}
        <Card className="!p-4">
          <p className="text-xs text-gray-500 mb-1">관심 필요 학생</p>
          <p className="text-2xl font-extrabold text-red-600">
            {needAttentionCount}<span className="text-lg">명</span>
          </p>
        </Card>

        {/* 검사 완료율 */}
        <Card className="!p-4">
          <p className="text-xs text-gray-500 mb-1">검사 완료율</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-extrabold text-emerald-600">{completionRate}%</p>
            <span className="text-xs text-gray-400">({assessedStudents}/{totalStudents})</span>
          </div>
        </Card>
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === 'core-summary' && (
          <CoreSummaryTab
            classData={classData}
            hasLPA={testMeta.hasLPA}
            testId={testId}
          />
        )}
        {activeTab === 'learning-detail' && (
          <LearningDetailTab
            classData={classData}
            testId={testId}
          />
        )}
        {activeTab === 'student-list' && (
          <StudentListTab
            classData={classData}
            testId={testId}
            hasLPA={testMeta.hasLPA}
          />
        )}
      </div>
    </div>
  );
};

export default ClassDashboardPage;
