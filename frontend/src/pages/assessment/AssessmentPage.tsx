/**
 * 검사 관리 페이지 (교사용)
 *
 * - 검사 생성/조회/종료/취소
 * - QR 코드 생성 및 표시
 * - PDF 결과 업로드
 */

import { useState, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Loader2, AlertCircle } from 'lucide-react';

import { useAuth } from '@features/auth';
import { useMyGroupsQuery } from '@features/api';
import type { ManagedAssessment, Group } from '@shared/types';
import { AlertModal } from '@shared/components';
import {
  GeneralSection,
  CreateAssessmentModal,
  AssessmentCodeModal,
  ExamStartPreviewModal,
  type AssessmentFormData,
} from '@features/assessment/ui';
import { registerExamCode } from '@features/exam/api/examService';
import {
  startExam,
  fetchExamList,
  endExam,
  cancelExam,
  restartExam,
  downloadSampleExcel,
  uploadAnswersExcel,
  previewExamStart,
  type ExamListItem,
  type ExamStartPreviewResponse,
} from '@features/assessment/api/assessmentService';
import { APIError } from '@shared/services/apiClient';
import { generateShortCode, schoolLevelToGradeLevel } from '@features/assessment/config';
import {
  saveAssessmentMeta,
  getAssessmentMeta,
} from '@features/assessment/api/assessmentMetaStorage';

const PageContainer = styled.div`
  max-width: 80rem;
`;

const HeaderSection = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ErrorBanner = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  color: #b91c1c;
`;

const ProcessingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ProcessingCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const ProcessingSpinner = styled(Loader2)`
  width: 1.5rem;
  height: 1.5rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
`;

const ProcessingText = styled.span`
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const WarningBanner = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #b45309;
`;

const WarningIcon = styled(AlertCircle)`
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
`;

const LoadingSpinner = styled(Loader2)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.span`
  margin-left: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

// ============================================================
// 유틸리티
// ============================================================

/** API 검사 목록 → ManagedAssessment 변환 */
function convertExamListItem(item: ExamListItem, groups: Group[]): ManagedAssessment {
  const shortCode = String(item.dgnssId);
  registerExamCode(shortCode, item.claId);

  // 1순위: localStorage 메타 (직접 생성한 검사), 2순위: group/list claId 매칭
  const meta = getAssessmentMeta(item.dgnssId);
  const group = groups.find((g) => g.claId === item.claId);

  return {
    id: `assessment-${item.dgnssId}`,
    name: `${item.ordNo}차 검사`,
    code: shortCode,
    dgnssId: item.dgnssId,
    claId: item.claId,
    grade: meta?.grade ?? group?.grade ?? 0,
    classNumber: meta?.classNumber ?? group?.classNumber ?? 0,
    studentCount: item.stTotalCnt,
    completedCount: item.stSubmCnt,
    round: item.ordNo as 1 | 2,
    startDate: new Date(item.dgnssStDt),
    endDate: item.dgnssEdDt ? new Date(item.dgnssEdDt) : undefined,
    createdAt: new Date(item.dgnssStDt),
    ownerId: item.tcId,
    isActive: item.dgnssAt === 'Y',
    inviteCode: group?.inviteCode,
  };
}

// ============================================================
// 컴포넌트
// ============================================================

export const AssessmentPage: React.FC = () => {
  const { user } = useAuth();

  const tcId = user?.id ?? '';

  // 그룹 목록: ['my-groups'] 캐시 공유
  const { data: groups = [], isLoading: isGroupsLoading } = useMyGroupsQuery();
  const [selectedClaId, setSelectedClaId] = useState('');

  // 상태
  const [assessments, setAssessments] = useState<ManagedAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<ManagedAssessment | null>(null);

  // 알럿 모달 상태
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  // 2회차 출제 사전 검증 모달 상태
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    preview: ExamStartPreviewResponse | null;
    pendingData: AssessmentFormData | null;
    pendingClaId: string;
  }>({ isOpen: false, preview: null, pendingData: null, pendingClaId: '' });

  // ============================================================
  // 데이터 로드
  // ============================================================

  // 첫 그룹 자동 선택
  useEffect(() => {
    if (groups.length > 0 && !selectedClaId) {
      setSelectedClaId(groups[0].claId);
    }
  }, [groups, selectedClaId]);

  const loadExamList = useCallback(async () => {
    if (groups.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(groups.map((g) => fetchExamList(g.claId, tcId, '1')));

      // 중복 제거 (dgnssId 기준)
      const seen = new Set<number>();
      const flat = results.flat().filter((item) => {
        if (seen.has(item.dgnssId)) return false;
        seen.add(item.dgnssId);
        return true;
      });
      console.log(flat, '검사 목록 API 결과');
      setAssessments(flat.map((item) => convertExamListItem(item, groups)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사 목록 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [groups, tcId]);

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      if (isCancelled) return;
      await loadExamList();
    };
    void load();
    return () => {
      isCancelled = true;
    };
  }, [loadExamList]);

  // ============================================================
  // 검사 생성
  // ============================================================

  const doCreateExam = useCallback(
    async (data: AssessmentFormData, claId: string) => {
      setIsProcessing(true);
      setError(null);

      try {
        const gradeLevel = schoolLevelToGradeLevel(data.schoolLevel);

        const result = await startExam(claId, tcId, data.round, gradeLevel, '1');

        const shortCode = generateShortCode();
        registerExamCode(shortCode, result.claId);

        saveAssessmentMeta(result.dgnssId, {
          grade: data.grade,
          classNumber: data.classNumber,
        });

        const group = groups.find((g) => g.claId === claId);

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
          inviteCode: group?.inviteCode,
        };

        setAssessments((prev) => [newAssessment, ...prev]);
        setSelectedAssessment(newAssessment);
        setIsCodeModalOpen(true);
      } catch (err) {
        if (err instanceof APIError && err.isDuplicateKeyError()) {
          const existingExam = assessments.find((a) => a.round === data.round);
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
    },
    [user?.id, tcId, groups, assessments],
  );

  const handleCreateAssessment = useCallback(
    async (data: AssessmentFormData) => {
      const claId = data.groupId
        ? (groups.find((g) => g.id === data.groupId)?.claId ?? selectedClaId)
        : selectedClaId;

      if (!claId) return;

      // 2회차 출제 전 사전 검증
      if (data.round === 2) {
        setIsProcessing(true);
        try {
          const preview = await previewExamStart(claId);
          setIsProcessing(false);

          if (!preview.canStart || preview.blockedOtherClassCount > 0) {
            setPreviewModal({ isOpen: true, preview, pendingData: data, pendingClaId: claId });
            return;
          }
        } catch {
          setIsProcessing(false);
          setError('2회차 출제 사전 검증에 실패했습니다.');
          return;
        }
      }

      await doCreateExam(data, claId);
    },
    [groups, selectedClaId, doCreateExam],
  );

  // ============================================================
  // 검사 종료
  // ============================================================

  const handleEndExam = useCallback(
    async (assessment: ManagedAssessment) => {
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
    },
    [loadExamList],
  );

  // ============================================================
  // 검사 취소
  // ============================================================

  const handleCancelExam = useCallback(
    async (assessment: ManagedAssessment) => {
      if (!assessment.dgnssId) return;

      const confirmed = confirm(
        `"${assessment.name}" 검사를 취소하시겠습니까?\n\n⚠️ 주의: 모든 응답 데이터가 삭제되며 복구할 수 없습니다.`,
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
    },
    [loadExamList],
  );

  // ============================================================
  // 검사 재시작 (추가 진행하기)
  // ============================================================

  const handleRestartExam = useCallback(
    async (assessment: ManagedAssessment) => {
      if (!assessment.dgnssId || !assessment.claId) return;

      setIsProcessing(true);
      setError(null);

      try {
        const group = groups.find((g) => g.claId === assessment.claId);
        const gradeLevel = group ? schoolLevelToGradeLevel(group.schoolLevel) : 'mi';
        await restartExam(assessment.dgnssId, assessment.claId, gradeLevel);
        await loadExamList();
      } catch (err) {
        setError(err instanceof Error ? err.message : '검사 재시작에 실패했습니다.');
      } finally {
        setIsProcessing(false);
      }
    },
    [groups, loadExamList],
  );

  // ============================================================
  // 핸들러
  // ============================================================

  const handleViewCode = (assessment: ManagedAssessment) => {
    setSelectedAssessment(assessment);
    setIsCodeModalOpen(true);
  };

  const handleExcelUpload = useCallback(async (assessment: ManagedAssessment, file: File) => {
    if (!assessment.dgnssId) return;
    setIsProcessing(true);
    try {
      await uploadAnswersExcel(assessment.dgnssId, file);
      setAlertModal({
        isOpen: true,
        title: '업로드 완료',
        message: '엑셀 파일이 성공적으로 업로드되었습니다.',
      });
    } catch {
      setAlertModal({
        isOpen: true,
        title: '업로드 실패',
        message: '엑셀 파일 업로드에 실패했습니다. 파일 형식을 확인해주세요.',
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handlePreviewConfirm = useCallback(async () => {
    const { pendingData, pendingClaId } = previewModal;
    if (!pendingData || !pendingClaId) return;

    setPreviewModal((prev) => ({ ...prev, isOpen: false }));
    setIsCreateModalOpen(false);
    await doCreateExam(pendingData, pendingClaId);
  }, [previewModal, doCreateExam]);

  const handleTemplateDownload = useCallback(async (assessment: ManagedAssessment) => {
    if (!assessment.dgnssId) return;
    setIsProcessing(true);
    try {
      await downloadSampleExcel(assessment.dgnssId);
    } catch {
      setAlertModal({
        isOpen: true,
        title: '다운로드 실패',
        message: '양식 파일 다운로드에 실패했습니다.',
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // ============================================================
  // 렌더링
  // ============================================================

  return (
    <PageContainer>
      {/* 페이지 헤더 */}
      <HeaderSection>
        <PageTitle>검사하기</PageTitle>
        <PageSubtitle>
          검사 코드를 생성하여 학생들에게 배포하거나, 기존 결과를 업로드하세요.
        </PageSubtitle>
      </HeaderSection>

      {/* 에러 메시지 */}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* 처리 중 오버레이 */}
      {isProcessing && (
        <ProcessingOverlay>
          <ProcessingCard>
            <ProcessingSpinner />
            <ProcessingText>처리 중...</ProcessingText>
          </ProcessingCard>
        </ProcessingOverlay>
      )}

      {/* 그룹 없음 경고 */}
      {!isGroupsLoading && groups.length === 0 && (
        <WarningBanner>
          <WarningIcon />
          <span>등록된 학급이 없습니다. 먼저 그룹을 생성해주세요.</span>
        </WarningBanner>
      )}

      {/* 로딩 상태 */}
      {(isGroupsLoading || isLoading) && (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>불러오는 중...</LoadingText>
        </LoadingContainer>
      )}

      {/* 검사 관리 섹션 */}
      {!isLoading && groups.length > 0 && (
        <GeneralSection
          assessments={assessments}
          onCreateClick={() => setIsCreateModalOpen(true)}
          onViewCode={handleViewCode}
          onEndExam={handleEndExam}
          onCancelExam={handleCancelExam}
          onRestartExam={handleRestartExam}
          onExcelUpload={handleExcelUpload}
          onTemplateDownload={handleTemplateDownload}
        />
      )}

      {/* 모달 */}
      <CreateAssessmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateAssessment}
        groups={groups}
      />
      <AssessmentCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        assessment={selectedAssessment}
      />

      {/* 2회차 출제 사전 검증 모달 */}
      <ExamStartPreviewModal
        isOpen={previewModal.isOpen}
        preview={previewModal.preview}
        ordNo={2}
        paperIdx='1'
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handlePreviewConfirm}
      />

      {/* 알럿 모달 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type='warning'
      />
    </PageContainer>
  );
};
