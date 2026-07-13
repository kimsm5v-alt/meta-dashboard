/**
 * 학생용 자기조절학습검사 결과 페이지
 *
 * 교사용 StudentDashboardPage (testId='selfreg')를 참조하여 구현
 * - AI 총평 (DiagnosisSummary)
 * - 20개 요인 분석 (SelfregFactorAnalysis)
 * - LPA 유형 분류, 코칭 전략은 자기조절학습검사에서는 미표시
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, AlertTriangle, ShieldAlert, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/components';
import { useAuth } from '@/features/auth/context/AuthContext';
import { formatAttentionTooltip } from '@/shared/utils/attentionChecker';
import {
  DiagnosisSummary,
  SelfregFactorAnalysis,
} from '@/features/student-dashboard/components';
import type { Student, Assessment } from '@/shared/types';
import { MOCK_CLASSES } from '@/shared/data/mockData';

type ViewMode = 'round1' | 'round2' | 'compare';

interface MySelfregResultContentProps {
  assessment: Assessment;
  prevAssessment?: Assessment;
  isCompare: boolean;
}

const MySelfregResultContent: React.FC<MySelfregResultContentProps> = ({
  assessment,
  prevAssessment,
  isCompare,
}) => {
  return (
    <div className="space-y-6">
      {/* AI 총평 */}
      <DiagnosisSummary
        tScores={assessment.tScores}
        studentType={assessment.predictedType}
      />

      {/* 20개 요인 분석 (자기조절학습검사) */}
      <SelfregFactorAnalysis
        tScores={assessment.tScores}
        prevTScores={isCompare && prevAssessment ? prevAssessment.tScores : undefined}
        showCompare={isCompare}
      />
    </div>
  );
};

export const MySelfregResultPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('round1');
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);
  const reportDropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target as Node)) {
        setIsReportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadResult = async () => {
      setIsLoading(true);

      try {
        // [PROTOTYPE MOCK] 목업 데이터 사용
        const mockClass = MOCK_CLASSES[0];
        const mockStudent = mockClass?.students[0];

        if (mockStudent && mockStudent.assessments.length > 0) {
          setStudent(mockStudent);
          setIsLoading(false);
          return;
        }

        setError('아직 시행한 검사 결과가 없습니다.');
      } catch (err) {
        console.error('[MySelfregResultPage] 결과 로드 실패:', err);
        setError('아직 시행한 검사 결과가 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadResult();
  }, [resultId, user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [resultId]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-2" />
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
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => navigate('/student/exams')}>
            검사 목록으로
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
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                style={{ backgroundColor: '#009F88' }}
              >
                자기조절학습검사
              </span>
              <h1 className="text-2xl font-bold text-gray-900">나의 검사 결과</h1>
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
            <p className="text-gray-500 mt-0.5">{user?.name || student.name}님의 자기조절학습검사 결과</p>
          </div>
        </div>

        {/* 보고서 다운로드 드롭다운 */}
        <div className="relative" ref={reportDropdownRef}>
          <Button
            variant="secondary"
            onClick={() => setIsReportDropdownOpen(!isReportDropdownOpen)}
          >
            <Download className="w-4 h-4 mr-2" />
            보고서 다운로드
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isReportDropdownOpen ? 'rotate-180' : ''}`} />
          </Button>
          {isReportDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
              <button
                onClick={() => {
                  // TODO: 1차 보고서 다운로드 로직
                  console.log('1차 보고서 다운로드');
                  setIsReportDropdownOpen(false);
                }}
                disabled={!r1}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                1차 보고서
              </button>
              <button
                onClick={() => {
                  // TODO: 2차 보고서 다운로드 로직
                  console.log('2차 보고서 다운로드');
                  setIsReportDropdownOpen(false);
                }}
                disabled={!r2}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-t border-gray-100"
              >
                2차 보고서
              </button>
            </div>
          )}
        </div>
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
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: viewMode === mode ? '#009F88' : undefined,
              }}
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
      <MySelfregResultContent
        assessment={current}
        prevAssessment={isCompare ? r1 : undefined}
        isCompare={isCompare}
      />
    </div>
  );
};
