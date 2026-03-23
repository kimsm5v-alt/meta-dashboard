/**
 * 학생용 결과 대시보드 페이지
 *
 * 교사용 StudentDashboardPage (L3)에서 아래 기능 제외:
 * 1. 코칭 전략 보기 버튼 & 팝업
 * 2. 우측 패널 (생기부, 상담, 관찰)
 * 3. 학생 네비게이션 (이전/다음 학생)
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, AlertTriangle, Clock, Loader2, Download } from 'lucide-react';
import { Button } from '@/shared/components';
import { useAuth } from '@/features/auth/context/AuthContext';
import { formatAttentionTooltip } from '@/shared/utils/attentionChecker';
import { buildStudentDomainData } from '@/shared/utils/buildStudentDomainData';
import { FactorHeatmapSection } from '@/shared/components/FactorHeatmapSection';
import {
  DiagnosisSummary,
  TypeClassification,
  TypeDeviations,
  DataHelperChatbot,
} from '@/features/student-dashboard/components';
import type { Student, SchoolLevel, Assessment } from '@/shared/types';

// Mock 데이터 (API 연동 전)
const MOCK_STUDENT: Student = {
  id: 'mock-student-1',
  name: '김학생',
  number: 15,
  gender: 'M',
  schoolLevel: 'middle',
  round2Submitted: false,
  assessments: [
    {
      round: 1,
      completedAt: '2026-03-15',
      predictedType: '안전균형형',
      typeProbabilities: {
        '몰입자원풍부형': 0.15,
        '안전균형형': 0.65,
        '자기주도몰입형': 0.10,
        '정서조절취약형': 0.05,
        '자원소진형': 0.03,
        '무기력형': 0.02,
      },
      tScores: [55, 52, 48, 45, 50, 53, 47, 51, 49, 54, 46, 52, 50, 48],
      reliabilityWarnings: [],
      attentionResult: {
        needsAttention: false,
        flags: [],
      },
      deviations: [],
    },
  ],
};

type ViewMode = 'round1' | 'round2' | 'compare';

interface MyResultContentProps {
  student: Student;
  assessment: Assessment;
  prevAssessment?: Assessment;
  isCompare: boolean;
}

const MyResultContent: React.FC<MyResultContentProps> = ({
  student,
  assessment,
  prevAssessment,
  isCompare,
}) => {
  const domainData = useMemo(
    () => buildStudentDomainData(assessment.tScores),
    [assessment.tScores]
  );

  const prevDomainData = useMemo(
    () => isCompare && prevAssessment ? buildStudentDomainData(prevAssessment.tScores) : undefined,
    [isCompare, prevAssessment]
  );

  return (
    <div className="space-y-6">
      {/* 1. 진단결과 한눈에 보기 */}
      <section>
        <h2 className="text-xl font-bold mb-4">나의 진단 결과</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 총평 */}
          <div className="p-6 border-b border-gray-200">
            <DiagnosisSummary
              tScores={assessment.tScores}
              studentType={assessment.predictedType}
            />
          </div>

          {/* 차트 영역 */}
          <div className="p-6">
            <FactorHeatmapSection domainData={domainData} prevDomainData={prevDomainData} />
          </div>
        </div>
      </section>

      {/* 2. 학습 유형 알아보기 */}
      <section>
        <h2 className="text-xl font-bold mb-4">나의 학습 유형</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 유형 분류 */}
          <div className="p-6 border-b border-gray-200">
            <TypeClassification
              predictedType={assessment.predictedType}
              typeProbabilities={assessment.typeProbabilities}
              schoolLevel={student.schoolLevel}
            />
          </div>

          {/* 유형별 특이점 (코칭 버튼 없음) */}
          <div className="p-6">
            <TypeDeviations
              tScores={assessment.tScores}
              predictedType={assessment.predictedType}
              schoolLevel={student.schoolLevel}
              // onCoachingClick 제거 - 학생에게는 코칭 전략 미표시
            />
          </div>
        </div>
      </section>

      {/* 데이터 해석 도우미 (플로팅 챗봇) */}
      <DataHelperChatbot
        tScores={assessment.tScores}
        predictedType={assessment.predictedType}
        typeProbabilities={assessment.typeProbabilities}
        schoolLevel={student.schoolLevel}
        deviations={assessment.deviations}
      />
    </div>
  );
};

export const MyResultPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock 데이터 로드 (실제로는 API 호출)
    const loadResult = async () => {
      setIsLoading(true);
      try {
        // TODO: GET /api/dgnss/st/analysis API 호출
        await new Promise((resolve) => setTimeout(resolve, 500));
        setStudent(MOCK_STUDENT);
      } catch (err) {
        setError('결과를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [resultId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [resultId]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-gray-500">{error}</p>
          <Button variant="secondary" onClick={() => navigate(-1)} className="mt-4">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">결과를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const r1 = student.assessments.find((a) => a.round === 1);
  const r2 = student.assessments.find((a) => a.round === 2);
  const selectedRound: 1 | 2 = viewMode === 'round1' ? 1 : 2;
  const isCompare = viewMode === 'compare';
  const current = selectedRound === 2 && r2 ? r2 : r1;

  if (!current) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">검사 결과가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/student/exams')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">나의 검사 결과</h1>
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
            <p className="text-gray-500">{user?.name || student.name}님의 학습심리정서검사 결과</p>
          </div>
        </div>

        {/* PDF 다운로드 */}
        <Button variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          PDF 다운로드
        </Button>
      </div>

      {/* 차수 선택 */}
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
      </div>

      {/* 2차 검사 진행중 안내 */}
      {student.round2Submitted && !r2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            2차 검사를 제출했습니다. 검사 종료 후 결과가 공개됩니다.
          </p>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <MyResultContent
        student={student}
        assessment={current}
        prevAssessment={isCompare ? r1 : undefined}
        isCompare={isCompare}
      />
    </div>
  );
};
