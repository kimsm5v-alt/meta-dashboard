/**
 * 검사 관리 페이지 (교사용)
 *
 * - 검사 생성/조회/종료/취소
 * - QR 코드 생성 및 표시
 * - PDF 결과 업로드
 */

import { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/features/auth';
import type { ManagedAssessment } from '@/shared/types';
import {
  GeneralSection,
  CreateAssessmentModal,
  AssessmentCodeModal,
  PdfUploadModal,
  type AssessmentFormData,
} from '../components';
import { registerExamCode } from '@/features/exam/services/examService';
import {
  startExam,
  fetchExamList,
  endExam,
  cancelExam,
  type ExamListItem,
} from '../services/assessmentService';
import {
  TEST_TC_ID,
  TEST_CLA_ID,
  generateShortCode,
  schoolLevelToGradeLevel,
} from '../config';

// ============================================================
// 유틸리티
// ============================================================

/** API 검사 목록 → ManagedAssessment 변환 */
function convertExamListItem(item: ExamListItem): ManagedAssessment {
  const shortCode = String(item.dgnssId);
  registerExamCode(shortCode, item.claId);

  return {
    id: `assessment-${item.dgnssId}`,
    name: `${item.ordNo}차 검사`,
    code: shortCode,
    dgnssId: item.dgnssId,
    grade: 0,
    classNumber: 0,
    studentCount: item.stTotalCnt,
    completedCount: item.stSubmCnt,
    round: item.ordNo as 1 | 2,
    startDate: new Date(item.dgnssStDt),
    endDate: item.dgnssEdDt ? new Date(item.dgnssEdDt) : undefined,
    createdAt: new Date(item.dgnssStDt),
    ownerId: item.tcId,
    isActive: item.dgnssAt === 'Y',
  };
}

// ============================================================
// 컴포넌트
// ============================================================

export const AssessmentPage: React.FC = () => {
  const { user } = useAuth();

  // 상태
  const [assessments, setAssessments] = useState<ManagedAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<ManagedAssessment | null>(null);

  // ============================================================
  // 데이터 로드
  // ============================================================

  const loadExamList = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await fetchExamList(TEST_CLA_ID, TEST_TC_ID, '1');
      setAssessments(items.map(convertExamListItem));
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사 목록 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExamList();
  }, [loadExamList]);

  // ============================================================
  // 검사 생성
  // ============================================================

  const handleCreateAssessment = useCallback(async (data: AssessmentFormData) => {
    setIsProcessing(true);
    setError(null);

    try {
      const gradeLevel = schoolLevelToGradeLevel(data.schoolLevel);

      const result = await startExam(
        TEST_CLA_ID,
        TEST_TC_ID,
        data.round,
        gradeLevel,
        '1'
      );

      const shortCode = generateShortCode();
      registerExamCode(shortCode, result.claId);

      const newAssessment: ManagedAssessment = {
        id: `assessment-${result.dgnssId}`,
        name: data.name,
        code: shortCode,
        dgnssId: result.dgnssId,
        grade: data.grade,
        classNumber: data.classNumber,
        studentCount: data.studentCount,
        completedCount: 0,
        round: data.round,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        createdAt: new Date(),
        ownerId: user?.id ?? '',
        isActive: true,
      };

      setAssessments(prev => [newAssessment, ...prev]);
      setSelectedAssessment(newAssessment);
      setIsCodeModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사 생성에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id]);

  // ============================================================
  // 검사 종료
  // ============================================================

  const handleEndExam = useCallback(async (assessment: ManagedAssessment) => {
    if (!assessment.dgnssId) return;
    if (!confirm(`"${assessment.name}" 검사를 종료하시겠습니까?`)) return;

    setIsProcessing(true);
    setError(null);

    try {
      await endExam(assessment.dgnssId, '1');
      await loadExamList();
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사 종료에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [loadExamList]);

  // ============================================================
  // 검사 취소
  // ============================================================

  const handleCancelExam = useCallback(async (assessment: ManagedAssessment) => {
    if (!assessment.dgnssId) return;

    const confirmed = confirm(
      `"${assessment.name}" 검사를 취소하시겠습니까?\n\n⚠️ 주의: 모든 응답 데이터가 삭제되며 복구할 수 없습니다.`
    );
    if (!confirmed) return;

    setIsProcessing(true);
    setError(null);

    try {
      await cancelExam(assessment.dgnssId);
      await loadExamList();
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사 취소에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [loadExamList]);

  // ============================================================
  // 핸들러
  // ============================================================

  const handleViewCode = (assessment: ManagedAssessment) => {
    setSelectedAssessment(assessment);
    setIsCodeModalOpen(true);
  };

  // ============================================================
  // 렌더링
  // ============================================================

  return (
    <div className="max-w-5xl">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">검사하기</h1>
        <p className="text-gray-600">
          검사 코드를 생성하여 학생들에게 배포하거나, 기존 결과를 업로드하세요.
        </p>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* 처리 중 오버레이 */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            <span className="text-gray-700">처리 중...</span>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <span className="ml-3 text-gray-600">검사 목록을 불러오는 중...</span>
        </div>
      )}

      {/* 검사 관리 섹션 */}
      {!isLoading && (
        <GeneralSection
          assessments={assessments}
          onCreateClick={() => setIsCreateModalOpen(true)}
          onUploadClick={() => setIsUploadModalOpen(true)}
          onViewCode={handleViewCode}
          onEndExam={handleEndExam}
          onCancelExam={handleCancelExam}
        />
      )}

      {/* 모달 */}
      <CreateAssessmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateAssessment}
      />
      <AssessmentCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        assessment={selectedAssessment}
      />
      <PdfUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
