import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useData } from '@/shared/contexts/DataContext';
import { useClassProfile } from '../hooks/useClassProfile';
import { useClassDetailData } from '../hooks/useClassDetailData';
import { useClassStudents, useApiConfig } from '@/shared/hooks/useApiData';
import { ClassSummarySection } from '../components/detail/ClassSummarySection';
import { FactorHeatmapSection } from '../components/detail/FactorHeatmapSection';
import { RiskStudentsSection } from '../components/detail/RiskStudentsSection';
import { StrategySection } from '../components/detail/StrategySection';
import type { Class } from '@/shared/types';

// ============================================================
// 내부 컴포넌트: classData가 확정된 후에만 렌더링
// ============================================================
interface ClassDetailContentProps {
  classData: Class;
  classId: string;
}

const ClassDetailContent: React.FC<ClassDetailContentProps> = ({ classData, classId }) => {
  const navigate = useNavigate();

  const hasRound2 =
    classData.students.some((s) => s.assessments.some((a) => a.round === 2));

  type ViewMode = 'round1' | 'round2' | 'compare';
  const [viewMode, setViewMode] = useState<ViewMode>('round1');

  const selectedRound: 1 | 2 = viewMode === 'round1' ? 1 : 2;
  const isCompare = viewMode === 'compare';

  // classData가 확정된 상태에서만 훅 호출
  const profile = useClassProfile(classData, selectedRound);
  const detailData = useClassDetailData(classData, selectedRound);

  const prevProfile = useClassProfile(classData, 1);
  const prevDetailData = useClassDetailData(classData, 1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header — L2와 동일한 패턴 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/dashboard/class/${classId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {classData.grade}학년 {classData.classNumber}반 학급 특성 상세 분석
          </h1>
          <p className="text-gray-500">
            유효 학생 {detailData.validStudentCount}명 / 전체 {detailData.totalStudentCount}명
          </p>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2">
        {([
          { mode: 'round1' as ViewMode, label: '1차 검사' },
          ...(hasRound2
            ? [
                { mode: 'round2' as ViewMode, label: '2차 검사' },
                { mode: 'compare' as ViewMode, label: '차수 변화' },
              ]
            : []),
        ]).map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === mode
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 신뢰도 경고 배너 */}
      {detailData.reliabilityWarningOnly && (
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

      {/* 1. 학급 종합 분석 */}
      <section>
        <h2 className="text-xl font-bold mb-4">학급 종합 분석</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ClassSummarySection
            detailData={detailData}
            profile={profile}
            classData={classData}
            round={selectedRound}
            isCompare={isCompare}
            prevProfile={isCompare ? prevProfile : undefined}
            prevDetailData={isCompare ? prevDetailData : undefined}
          />
        </div>
      </section>

      {/* 2. 38개 세부 요인 분석 */}
      <section>
        <h2 className="text-xl font-bold mb-4">38개 세부 요인 분석</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <FactorHeatmapSection
            domainData={detailData.domainData}
            prevDomainData={isCompare ? prevDetailData.domainData : undefined}
          />
        </div>
      </section>

      {/* 3. 관심 필요 학생 */}
      <section>
        <h2 className="text-xl font-bold mb-4">관심 필요 학생</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <RiskStudentsSection
            criticalStudents={detailData.criticalStudents}
            watchListStudents={detailData.watchListStudents}
            classId={classData.id}
            isCompare={isCompare}
            prevCriticalStudents={isCompare ? prevDetailData.criticalStudents : undefined}
            prevWatchListStudents={isCompare ? prevDetailData.watchListStudents : undefined}
          />
        </div>
      </section>

      {/* 4. 학급 맞춤 운영 전략 */}
      <section>
        <h2 className="text-xl font-bold mb-4">학급 맞춤 운영 전략</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <StrategySection profile={profile} prevProfile={isCompare ? prevProfile : undefined} />
        </div>
      </section>
    </div>
  );
};

// ============================================================
// 메인 컴포넌트: 로딩/에러/null 체크 후 ClassDetailContent 렌더링
// ============================================================
export const ClassDetailAnalysisPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { getClassById } = useData();
  const { isApiMode } = useApiConfig();

  // L2와 동일하게 API에서 학생 데이터 가져오기
  const { students: apiStudents, isLoading, error } = useClassStudents(classId);

  const baseClassData = classId ? getClassById(classId) : undefined;

  // API 모드에서 학생 데이터가 있으면 classData 구성 (L2와 동일한 로직)
  const classData: Class | undefined = useMemo(() => {
    if (isApiMode && apiStudents.length > 0 && classId) {
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
  }, [baseClassData, isApiMode, apiStudents, classId]);

  // API 모드 로딩 상태
  if (isApiMode && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">학급 분석 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // API 에러 상태
  if (isApiMode && error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-gray-500">데이터 로드 실패: {error}</p>
        </div>
      </div>
    );
  }

  if (!classData || !classId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">학급 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // classData가 확정된 후에만 ClassDetailContent 렌더링
  return <ClassDetailContent classData={classData} classId={classId} />;
};

export default ClassDetailAnalysisPage;
