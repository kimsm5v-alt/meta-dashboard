import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, MessageSquare, Eye, ShieldAlert, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { useStudentAnalysis, useApiConfig } from '@/shared/hooks/useApiData';
import { formatAttentionTooltip } from '@/shared/utils/attentionChecker';
import { buildStudentDomainData } from '@/shared/utils/buildStudentDomainData';
import { FactorHeatmapSection } from '@/features/class-dashboard/components/detail/FactorHeatmapSection';
import {
  DiagnosisSummary,
  FourStepInterpretation,
  TypeClassification,
  TypeDeviations,
  CoachingStrategy,
  RightPanel,
  DataHelperChatbot,
  type PanelTab,
} from '../components';
import type { Student, Assessment, SchoolLevel } from '@/shared/types';

// TODO: 4단계 해석 탭을 다시 보이게 하려면 true로 변경
const SHOW_FOUR_STEP = false;

// 헤더 버튼 설정
const PANEL_BUTTONS = [
  { key: 'schoolRecord' as const, label: '생기부', icon: FileText },
  { key: 'counseling' as const, label: '상담', icon: MessageSquare },
  { key: 'observation' as const, label: '관찰', icon: Eye },
];

type ViewMode = 'round1' | 'round2' | 'compare';

// ============================================================
// 내부 컴포넌트: student, classInfo, current가 확정된 후에만 렌더링
// ============================================================
interface StudentDashboardContentProps {
  student: Student;
  classStudents: Student[];
  classInfo: { grade: number; classNumber: number; schoolLevel: SchoolLevel };
  classId: string;
  studentId: string;
  isApiMode: boolean;
}

const StudentDashboardContent: React.FC<StudentDashboardContentProps> = ({
  student,
  classStudents,
  classInfo,
  classId,
  studentId,
  isApiMode,
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [isCoachingOpen, setIsCoachingOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>(null);
  const [chartViewMode, setChartViewMode] = useState<'midCategory' | 'fourStep'>('midCategory');

  useEffect(() => { window.scrollTo(0, 0); }, [studentId]);

  const selectedRound: 1 | 2 = viewMode === 'round1' ? 1 : 2;
  const isCompare = viewMode === 'compare';

  const r1 = student.assessments.find((a) => a.round === 1);
  const r2 = student.assessments.find((a) => a.round === 2);
  const current = selectedRound === 2 && r2 ? r2 : r1;

  // useMemo는 항상 호출 (current가 없으면 빈 배열 사용)
  const domainData = useMemo(
    () => current ? buildStudentDomainData(current.tScores) : [],
    [current]
  );
  const prevDomainData = useMemo(
    () => isCompare && r1 ? buildStudentDomainData(r1.tScores) : undefined,
    [isCompare, r1],
  );

  const currentIdx = classStudents.findIndex(s => s.id === studentId);
  const prev = currentIdx > 0 ? classStudents[currentIdx - 1] : null;
  const next = currentIdx < classStudents.length - 1 ? classStudents[currentIdx + 1] : null;

  // current가 없으면 검사 결과 없음 표시
  if (!current) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">검사 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* 메인 콘텐츠 */}
      <div className={`flex-1 min-w-0 space-y-6 transition-all duration-300 ${panelTab ? 'pr-0' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/dashboard/class/${classId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {student.number}번 {student.name}
              </h1>
              {current.reliabilityWarnings.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-semibold bg-red-50 text-red-600 border-red-200"
                  title={`신뢰도 주의: ${current.reliabilityWarnings.join(', ')}`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  신뢰도 주의
                </span>
              )}
              {current.attentionResult.needsAttention && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-semibold bg-amber-50 text-amber-600 border-amber-200"
                  title={formatAttentionTooltip(current.attentionResult)}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  관심 필요
                </span>
              )}
            </div>
            <p className="text-gray-500">
              {classInfo.grade}학년 {classInfo.classNumber}반
            </p>
          </div>
        </div>

        {/* 학생 네비게이션 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prev && navigate(`/dashboard/class/${classId}/student/${prev.id}`)}
            disabled={!prev}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">
            {currentIdx + 1} / {classStudents.length}
          </span>
          <button
            onClick={() => next && navigate(`/dashboard/class/${classId}/student/${next.id}`)}
            disabled={!next}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Round Selector + Panel Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {([
            { mode: 'round1' as ViewMode, label: '1차 검사' },
            ...(r2
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
        {!panelTab && (
          <div className="flex gap-1.5">
            {PANEL_BUTTONS.map(btn => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.key}
                  onClick={() => setPanelTab(btn.key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                >
                  <Icon className="w-4 h-4" />
                  {btn.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2차 검사 진행중 안내 (Mock 모드에서만 표시) */}
      {!isApiMode && student.round2Submitted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            이 학생은 2차 검사를 제출했습니다. 검사 종료 후 결과가 공개됩니다.
          </p>
        </div>
      )}

      {/* 1. 진단결과 한눈에 보기 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">학생 진단 결과 해석</h2>
          {SHOW_FOUR_STEP && (
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setChartViewMode('midCategory')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  chartViewMode === 'midCategory'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                중분류 요인
              </button>
              <button
                onClick={() => setChartViewMode('fourStep')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  chartViewMode === 'fourStep'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                4단계 해석
              </button>
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 총평 */}
          <div className="p-6 border-b border-gray-200">
            <DiagnosisSummary
              tScores={current.tScores}
              studentType={current.predictedType}
            />
          </div>

          {/* 차트 영역: A/B 토글 */}
          <div className="p-6">
            {SHOW_FOUR_STEP && chartViewMode === 'fourStep' ? (
              <FourStepInterpretation tScores={current.tScores} prevTScores={isCompare && r1 ? r1.tScores : undefined} studentName={student.name} />
            ) : (
              <FactorHeatmapSection domainData={domainData} prevDomainData={prevDomainData} />
            )}
          </div>
        </div>
      </section>

      {/* 2. 학습 유형 알아보기 */}
      <section>
        <h2 className="text-xl font-bold mb-4">학습 유형 알아보기</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 유형 분류 */}
          <div className="p-6 border-b border-gray-200">
            <TypeClassification
              predictedType={current.predictedType}
              typeProbabilities={current.typeProbabilities}
              schoolLevel={student.schoolLevel}
            />
          </div>

          {/* 유형별 특이점 + 코칭 전략 버튼 */}
          <div className="p-6">
            <TypeDeviations
              tScores={current.tScores}
              predictedType={current.predictedType}
              schoolLevel={student.schoolLevel}
              onCoachingClick={() => setIsCoachingOpen(true)}
            />
          </div>
        </div>
      </section>

      {/* 코칭 전략 모달 */}
      <CoachingStrategy
        predictedType={current.predictedType}
        schoolLevel={student.schoolLevel}
        tScores={current.tScores}
        isOpen={isCoachingOpen}
        onClose={() => setIsCoachingOpen(false)}
      />

      {/* 데이터 해석 도우미 (플로팅 챗봇) */}
      <DataHelperChatbot
        tScores={current.tScores}
        predictedType={current.predictedType}
        typeProbabilities={current.typeProbabilities}
        schoolLevel={student.schoolLevel}
        deviations={current.deviations}
      />

      </div>

      {/* 우측 푸시 패널 */}
      <RightPanel
        isOpen={panelTab !== null}
        activeTab={panelTab}
        onTabChange={setPanelTab}
        onClose={() => setPanelTab(null)}
        studentId={studentId}
        classId={classId}
        student={student}
        assessment={current}
      />
    </div>
  );
};

// ============================================================
// 메인 컴포넌트: 로딩/에러/null 체크 후 StudentDashboardContent 렌더링
// ============================================================
export const StudentDashboardPage = () => {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const { isApiMode } = useApiConfig();

  // API 모드: API에서 학생 데이터 + 학급 학생 목록 로드
  // Mock 모드: DataContext에서 데이터 사용
  const {
    student,
    classStudents,
    classInfo,
    isLoading,
    error
  } = useStudentAnalysis(classId, studentId);

  // 로딩 상태
  if (isApiMode && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">학생 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
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

  if (!student || !classInfo || !classId || !studentId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">학생을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // student, classInfo가 확정된 후에만 StudentDashboardContent 렌더링
  return (
    <StudentDashboardContent
      student={student}
      classStudents={classStudents}
      classInfo={classInfo}
      classId={classId}
      studentId={studentId}
      isApiMode={isApiMode}
    />
  );
};

export default StudentDashboardPage;
