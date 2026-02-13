import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '@/shared/contexts/DataContext';
import { useClassProfile } from '../hooks/useClassProfile';
import { useClassDetailData } from '../hooks/useClassDetailData';
import { ClassSummarySection } from '../components/detail/ClassSummarySection';
import { FactorHeatmapSection } from '../components/detail/FactorHeatmapSection';
import { RiskStudentsSection } from '../components/detail/RiskStudentsSection';
import { StrategySection } from '../components/detail/StrategySection';

export const ClassDetailAnalysisPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { getClassById } = useData();
  const classData = classId ? getClassById(classId) : undefined;

  const hasRound2 =
    classData?.students.some((s) => s.assessments.some((a) => a.round === 2)) ?? false;
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);

  const profile = useClassProfile(classData!, selectedRound);
  const detailData = useClassDetailData(classData!, selectedRound);

  // 2차 선택 시 자동으로 1차 데이터 비교
  const prevProfile = useClassProfile(classData!, 1);
  const prevDetailData = useClassDetailData(classData!, 1);
  const isCompare = selectedRound === 2 && hasRound2;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!classData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">학급 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

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

      {/* Round Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedRound(1)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedRound === 1
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          1차 검사
        </button>
        {hasRound2 && (
          <button
            onClick={() => setSelectedRound(2)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedRound === 2
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            2차 검사
          </button>
        )}
      </div>

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

export default ClassDetailAnalysisPage;
