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
import { Loader2, AlertCircle, ChevronDown } from 'lucide-react';

import { useAuth } from '@features/auth';
import type { ManagedAssessment, Group } from '@shared/types';
import { AlertModal } from '@shared/components';
import {
  GeneralSection,
  CreateAssessmentModal,
  AssessmentCodeModal,
  PdfUploadModal,
  type AssessmentFormData,
} from '@features/assessment/ui';
import { registerExamCode } from '@features/exam/api/examService';
import {
  startExam,
  fetchExamList,
  endExam,
  cancelExam,
  type ExamListItem,
} from '@features/assessment/api/assessmentService';
import { APIError } from '@shared/services/apiClient';
import { generateShortCode, schoolLevelToGradeLevel } from '@features/assessment/config';
import {
  saveAssessmentMeta,
  getAssessmentMeta,
} from '@features/assessment/api/assessmentMetaStorage';
import { groupService } from '@features/groups/api/groupService';

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

const GroupSelectWrapper = styled.div`
  margin-bottom: 1.5rem;
`;

const GroupSelectLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.5rem;
`;

const GroupSelectContainer = styled.div`
  position: relative;
  display: inline-block;
  min-width: 16rem;
`;

const GroupSelect = styled.select`
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.875rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[900]};
  background: white;
  appearance: none;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const GroupSelectIcon = styled(ChevronDown)`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  pointer-events: none;
`;

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
  const { user } = useAuth();

  const tcId = user?.id ?? '';

  // 그룹 목록
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedClaId, setSelectedClaId] = useState('');
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);

  // 상태
  const [assessments, setAssessments] = useState<ManagedAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // 그룹 목록 초기 로드
  useEffect(() => {
    if (!user) return;
    setIsGroupsLoading(true);
    groupService
      .getMyGroups(user.id)
      .then((g) => {
        setGroups(g);
        if (g.length > 0) setSelectedClaId(g[0].claId);
      })
      .catch(() => {})
      .finally(() => setIsGroupsLoading(false));
  }, [user]);

  const loadExamList = useCallback(async () => {
    if (!selectedClaId) return;

    setIsLoading(true);
    setError(null);

    try {
      const items = await fetchExamList(selectedClaId, tcId, '1');
      setAssessments(items.map((item) => convertExamListItem(item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '검사 목록 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClaId, tcId]);

  useEffect(() => {
    loadExamList();
  }, [loadExamList]);

  // ============================================================
  // 검사 생성
  // ============================================================

  const handleCreateAssessment = useCallback(
    async (data: AssessmentFormData) => {
      if (!selectedClaId) return;

      setIsProcessing(true);
      setError(null);

      try {
        const gradeLevel = schoolLevelToGradeLevel(data.schoolLevel);

        const result = await startExam(selectedClaId, tcId, data.round, gradeLevel, '1');

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

        setAssessments((prev) => [newAssessment, ...prev]);
        setSelectedAssessment(newAssessment);
        setIsCodeModalOpen(true);
      } catch (err) {
        if (err instanceof APIError && err.isDuplicateKeyError()) {
          // 해당 차수의 기존 검사 찾기
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
    [user?.id, selectedClaId, tcId, assessments],
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

      {/* 그룹 선택 */}
      {/* {!isGroupsLoading && groups.length > 0 && (
        <GroupSelectWrapper>
          <GroupSelectLabel>학급 선택</GroupSelectLabel>
          <GroupSelectContainer>
            <GroupSelect
              value={selectedClaId}
              onChange={(e) => setSelectedClaId(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.claId} value={g.claId}>
                  {g.name} ({g.grade}학년 {g.classNumber}반)
                </option>
              ))}
            </GroupSelect>
            <GroupSelectIcon />
          </GroupSelectContainer>
        </GroupSelectWrapper>
      )} */}

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
      {!isLoading && selectedClaId && (
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
        groups={groups}
      />
      <AssessmentCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        assessment={selectedAssessment}
      />
      <PdfUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />

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
