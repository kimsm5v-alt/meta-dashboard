/**
 * 검사 관리 페이지 (교사용)
 *
 * - 검사 생성/조회/종료/취소
 * - QR 코드 생성 및 표시
 * - PDF 결과 업로드
 */

import { useState, useCallback, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

import { useAuth } from '@/features/auth';
import type { ManagedAssessment } from '@/shared/types';
import { AlertModal } from '@/shared/components';
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
import { APIError } from '@/shared/services/apiClient';
import {
  generateShortCode,
  schoolLevelToGradeLevel,
} from '../config';
import {
  saveAssessmentMeta,
  getAssessmentMeta,
} from '../services/assessmentMetaStorage';

// ============================================================
// 유틸리티
// ============================================================

/** API 검사 목록 → ManagedAssessment 변환 */
function convertExamListItem(item: ExamListItem): ManagedAssessment {
  const shortCode = String(item.dgnssId);
  registerExamCode(shortCode, item.claId);

  // localStorage에서 학년/반 정보 조회
  const meta = getAssessmentMeta(item.dgnssId);

  return {
    id: `assessment-${item.dgnssId}`,
    name: `${item.ordNo}차 검사`,
    code: shortCode,
    dgnssId: item.dgnssId,
    grade: meta?.grade ?? 0,
    classNumber: meta?.classNumber ?? 0,
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
  const { user, credentials } = useAuth();

  // credentials에서 ID 추출
  const tcId = credentials?.teacherId ?? '';
  const claId = credentials?.classId ?? '';
  const hasCredentials = !!credentials;

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

  // 알럿 모달 상태
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  // ============================================================
  // 데이터 로드
  // ============================================================

  const loadExamList = useCallback(async () => {
    if (!hasCredentials) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const items = await fetchExamList(claId, tcId, '1');
      setAssessments(items.map(item => convertExamListItem(item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사 목록 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [hasCredentials, claId, tcId]);

  useEffect(() => {
    loadExamList();
  }, [loadExamList]);

  // ============================================================
  // 검사 생성
  // ============================================================

  const handleCreateAssessment = useCallback(async (data: AssessmentFormData) => {
    if (!hasCredentials) return;

    setIsProcessing(true);
    setError(null);

    try {
      const gradeLevel = schoolLevelToGradeLevel(data.schoolLevel);

      const result = await startExam(
        claId,
        tcId,
        data.round,
        gradeLevel,
        '1'
      );

      const shortCode = generateShortCode();
      registerExamCode(shortCode, result.claId);

      // 학년/반 정보를 localStorage에 저장
      saveAssessmentMeta(result.dgnssId, {
        grade: data.grade,
        classNumber: data.classNumber,
      });

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
      if (err instanceof APIError && err.isDuplicateKeyError()) {
        // 해당 차수의 기존 검사 찾기
        const existingExam = assessments.find(a => a.round === data.round);
        const isActive = existingExam?.isActive ?? false;
        const examLabel = `${data.grade}학년 ${data.classNumber}반 ${data.round}차 검사`;

        if (isActive) {
          setAlertModal({
            isOpen: true,
            title: '진행 중인 검사',
            message: `${examLabel}는 현재 진행 중이에요.\n재시작을 원한다면 검사를 [취소]하고 다시 시작해보세요.`,
          });
        } else {
          setAlertModal({
            isOpen: true,
            title: '완료된 검사',
            message: `${examLabel}는 이미 완료된 검사예요.\n재응시를 원한다면 검사를 [취소]하고 다시 시작해보세요.`,
          });
        }
      } else {
        setError(err instanceof Error ? err.message : '검사 생성에 실패했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, hasCredentials, claId, tcId, assessments]);

  // ============================================================
  // 검사 종료
  // ============================================================

  const handleEndExam = useCallback(async (assessment: ManagedAssessment) => {
    if (!assessment.dgnssId) return;

    // 제출 인원이 0명이면 종료 불가
    if (assessment.completedCount === 0) {
      setAlertModal({
        isOpen: true,
        title: '검사 종료 불가',
        message: `제출 인원이 ${assessment.completedCount}명입니다.\n검사 취소만 가능합니다.`,
      });
      return;
    }

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

      {/* credentials 없음 경고 */}
      {!hasCredentials && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>로그인 시 입력한 credentials가 없습니다. 다시 로그인해주세요.</span>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && hasCredentials && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <span className="ml-3 text-gray-600">검사 목록을 불러오는 중...</span>
        </div>
      )}

      {/* 검사 관리 섹션 */}
      {!isLoading && hasCredentials && (
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

      {/* 알럿 모달 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type="warning"
      />
    </div>
  );
};
