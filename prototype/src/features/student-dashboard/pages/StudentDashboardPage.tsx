import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShieldAlert, AlertTriangle, Clock, Loader2, Download, ChevronDown, FileText, Info } from 'lucide-react';
import { useStudentAnalysis, useApiConfig } from '@/shared/hooks/useApiData';
import { formatAttentionTooltip } from '@/shared/utils/attentionChecker';
import {
  DiagnosisSummary,
  StudentFactorAnalysis,
  SelfregFactorAnalysis,
  TypeClassification,
  TypeDeviations,
  CoachingStrategy,
  RightPanel,
  DataHelperChatbot,
  type PanelTab,
} from '../components';
import type { Student, SchoolLevel } from '@/shared/types';

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
  hasJwtToken: boolean;
  testId: TestId;
}

type TestId = 'comprehensive' | 'selfreg';

// 검사별 메타 정보 (반 대시보드와 동일)
const TEST_META: Record<TestId, { name: string; shortName: string; color: string }> = {
  comprehensive: { name: '학습종합검사', shortName: '학습종합', color: '#6366F1' },
  selfreg: { name: '자기조절학습검사', shortName: '자기조절', color: '#10B981' },
};

// LPA 툴팁 메시지 (반 대시보드와 동일)
const LPA_TOOLTIP_LINES = [
  '학생의 학습 심리 패턴을 3가지 유형으로 나눈 것입니다.',
  '검사 결과를 분석해 비슷한 학습 특성을 가진 학생끼리 묶어서 맞춤형 지도 방법을 제공하기 위한 분류입니다.',
  '단, 유형은 학생을 이해하기 위한 참고이며, 같은 유형 안에서도 개인별 강점과 보완점을 함께 살펴봐 주세요.',
];

const StudentDashboardContent: React.FC<StudentDashboardContentProps> = ({
  student,
  classStudents,
  classInfo,
  classId,
  studentId,
  hasJwtToken,
  testId,
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [panelTab, setPanelTab] = useState<PanelTab>(null);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [studentId]);

  const selectedRound: 1 | 2 = viewMode === 'round1' ? 1 : 2;
  const isCompare = viewMode === 'compare';

  const r1 = student.assessments.find((a) => a.round === 1);
  const r2 = student.assessments.find((a) => a.round === 2);
  const current = selectedRound === 2 && r2 ? r2 : r1;

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

  // 보고서 다운로드 핸들러
  const handleReportDownload = (round: 1 | 2, format: 'detail' | 'summary') => {
    setReportMenuOpen(false);
    alert(`${student.name} 학생 ${round}차 ${format === 'detail' ? '상세' : '요약'} 보고서를 다운로드합니다 (데모)`);
  };

  return (
    <div className="flex gap-6">
      {/* 메인 콘텐츠 */}
      <div className={`flex-1 min-w-0 space-y-6 transition-all duration-300 ${panelTab ? 'pr-0' : ''}`}>

      {/* 브레드크럼 (반 대시보드와 동일 형식) */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="px-3 py-1 text-xs font-semibold rounded-full text-white"
          style={{ backgroundColor: TEST_META[testId].color }}
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
            {TEST_META[testId].name}
          </button>
          <ChevronRight className="inline w-4 h-4 mx-1" />
          <button
            onClick={() => navigate(`/dashboard/${testId}/class/${classId}`)}
            className="hover:text-gray-900 transition-colors"
          >
            {classInfo.grade}학년 {classInfo.classNumber}반
          </button>
          <ChevronRight className="inline w-4 h-4 mx-1" />
          <span className="text-gray-900">{student.number}번 {student.name}</span>
        </nav>
      </div>

      {/* 타이틀 행: 뒤로가기 버튼 + 타이틀 + 액션 (같은 선상) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 뒤로가기 버튼 (vj-back 스타일) */}
          <button
            className="vj-back"
            onClick={() => navigate(`/dashboard/${testId}/class/${classId}`)}
            aria-label="돌아가기"
            title="돌아가기"
            style={{ padding: 8 }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            {/* 학생 이름 + 배지들 */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {student.number}번 {student.name}
              </h1>
              {/* 관심 필요 배지 */}
              {current.attentionResult.needsAttention && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-600"
                  title={formatAttentionTooltip(current.attentionResult)}
                >
                  <AlertTriangle className="w-3 h-3" />
                  관심 필요
                </span>
              )}
              {/* 신뢰도 주의 배지 */}
              {current.reliabilityWarnings.length > 0 && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600"
                  title={`신뢰도 주의: ${current.reliabilityWarnings.join(', ')}`}
                >
                  <ShieldAlert className="w-3 h-3" />
                  신뢰도 주의
                </span>
              )}
            </div>
            {/* 메타 정보: 학교명 · 학교급 · n학년n반 · 성별 */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <span>서울초등학교</span>
              <span className="text-gray-300">·</span>
              <span>{classInfo.schoolLevel === 'elementary' ? '초등' : classInfo.schoolLevel === 'middle' ? '중등' : '고등'}</span>
              <span className="text-gray-300">·</span>
              <span>{classInfo.grade}학년 {classInfo.classNumber}반</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-700 font-medium">{student.number % 2 === 0 ? '여자' : '남자'}</span>
            </div>
          </div>
        </div>

        {/* 우측: 학생 네비게이션 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => prev && navigate(`/dashboard/${testId}/class/${classId}/student/${prev.id}`)}
            disabled={!prev}
            className="px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ‹ 이전
          </button>
          <span className="px-2 text-sm text-gray-500 tabular-nums">
            {currentIdx + 1} / {classStudents.length}
          </span>
          <button
            onClick={() => next && navigate(`/dashboard/${testId}/class/${classId}/student/${next.id}`)}
            disabled={!next}
            className="px-2.5 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            다음 ›
          </button>
        </div>
      </div>

      {/* Round Selector + 보고서 다운로드 (같은 높이) */}
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

        {/* 보고서 다운로드 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setReportMenuOpen(!reportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              보고서 다운로드
              <ChevronDown className={`w-4 h-4 transition-transform ${reportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {reportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setReportMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  {/* 1차 검사 */}
                  <div className="px-3 py-1.5">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      1차 검사 {!r1 && <span className="text-gray-400">(미실시)</span>}
                    </p>
                    <button
                      disabled={!r1}
                      onClick={() => handleReportDownload(1, 'detail')}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      1차 상세 보고서
                    </button>
                    <button
                      disabled={!r1}
                      onClick={() => handleReportDownload(1, 'summary')}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      1차 요약 보고서
                    </button>
                  </div>
                  <div className="border-t border-gray-100 my-1" />
                  {/* 2차 검사 */}
                  <div className="px-3 py-1.5">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      2차 검사 {!r2 && <span className="text-gray-400">(예정)</span>}
                    </p>
                    <button
                      disabled={!r2}
                      onClick={() => handleReportDownload(2, 'detail')}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      2차 상세 보고서
                    </button>
                    <button
                      disabled={!r2}
                      onClick={() => handleReportDownload(2, 'summary')}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-4 h-4 text-red-500" />
                      2차 요약 보고서
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
      </div>

      {/* 2차 검사 진행중 안내 (Mock 모드에서만 표시) */}
      {!hasJwtToken && student.round2Submitted && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            이 학생은 2차 검사를 제출했습니다. 검사 종료 후 결과가 공개됩니다.
          </p>
        </div>
      )}

      {/* AI 총평 (HSJ 스타일) */}
      <DiagnosisSummary
        tScores={current.tScores}
        studentType={current.predictedType}
      />

      {/* 요인 분석 (검사 유형에 따라 다른 컴포넌트) */}
      {testId === 'comprehensive' ? (
        <StudentFactorAnalysis
          tScores={current.tScores}
          prevTScores={isCompare && r1 ? r1.tScores : undefined}
          showCompare={isCompare}
        />
      ) : (
        <SelfregFactorAnalysis
          tScores={current.tScores}
          prevTScores={isCompare && r1 ? r1.tScores : undefined}
          showCompare={isCompare}
        />
      )}

      {/* 학습 유형 분류 (학습종합검사만, 고등학교 제외 - 자기조절검사는 LPA 없음) */}
      {testId === 'comprehensive' && student.schoolLevel !== '고등' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">학습 유형 분류</h3>
              <div className="relative group">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-0 top-full mt-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
                  <p className="font-bold text-sm mb-2">LPA 유형이란?</p>
                  <ul className="space-y-1.5 list-none">
                    {LPA_TOOLTIP_LINES.map((line, idx) => (
                      <li key={idx} className="leading-relaxed">• {line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="p-5">
            <TypeClassification
              predictedType={isCompare && r2 ? r2.predictedType : current.predictedType}
              typeProbabilities={isCompare && r2 ? r2.typeProbabilities : current.typeProbabilities}
              schoolLevel={student.schoolLevel}
              showCompare={isCompare && !!r1 && !!r2}
              prevType={r1?.predictedType}
              prevTypeProbabilities={r1?.typeProbabilities}
            />
          </div>
        </div>
      )}

      {/* 1차→2차 변화가 큰 요인 (비교 모드에서만 표시) */}
      {testId === 'comprehensive' && student.schoolLevel !== '고등' && isCompare && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                1차→2차 변화가 큰 요인
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                1차와 2차 검사 사이에 가장 큰 변화를 보인 요인입니다.
              </p>
            </div>
          </div>
          <div className="p-5">
            <TypeDeviations
              tScores={current.tScores}
              predictedType={current.predictedType}
              schoolLevel={student.schoolLevel}
              isCompare={isCompare}
              prevTScores={r1?.tScores}
            />
          </div>
        </div>
      )}

      {/* 추천 코칭 전략 (학습종합검사만, 고등학교 제외 - LPA 유형 기반) */}
      {testId === 'comprehensive' && student.schoolLevel !== '고등' && (
        <CoachingStrategy
          predictedType={current.predictedType}
          schoolLevel={student.schoolLevel}
          tScores={current.tScores}
        />
      )}

      {/* 스피드다이얼 FAB (플로팅 버튼) */}
      <DataHelperChatbot
        onOpenPanel={setPanelTab}
        isPanelOpen={panelTab !== null}
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

interface StudentDashboardPageProps {
  testId?: TestId;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ testId = 'comprehensive' }) => {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const { hasJwtToken } = useApiConfig();

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
  if (hasJwtToken && isLoading) {
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
      hasJwtToken={hasJwtToken}
      testId={testId}
    />
  );
};

export default StudentDashboardPage;
