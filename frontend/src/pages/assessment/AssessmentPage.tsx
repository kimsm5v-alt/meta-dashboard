import '@app/styles/vj.css';
import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@features/auth/model/AuthContext';
import { useMyGroupsQuery } from '@features/api';
import { useGroupMembersQuery } from '@features/groups';
import {
  EmptyState,
  ExamManagementOverview,
  GroupListView,
  GroupDetailView,
  ExamStartPreviewModal,
} from '@features/assessment/ui';
import { AlertModal } from '@shared/ui/AlertModal/AlertModal';
import { FEATURES } from '@shared/config/features';
import { EXAM_SLOTS } from '@features/assessment/constants';
import {
  useAssessmentSlotsQueries,
  useCancelExamMutation,
  useDownloadSampleExcelMutation,
  useEndExamMutation,
  usePreviewExamStartMutation,
  useRestartExamMutation,
  useStartExamMutation,
  useUploadAnswersExcelMutation,
} from '@features/assessment/api/queries';
import type { ExamStartPreviewResponse } from '@features/assessment/api/assessmentService';
import type { GroupWithExamState, ViewMode, ExamSlotState } from '@features/assessment/types';
import type { Group, SchoolLevelCode } from '@shared/types';
import { useOptionalLayoutContext } from '@widgets/layout/v2/LayoutContext';

// ============================================================
// 헬퍼
// ============================================================

const schoolLevelToGrade = (schoolLevel: SchoolLevelCode): 'el' | 'mi' | 'hi' => {
  if (schoolLevel === 'elementary') return 'el';
  if (schoolLevel === 'middle') return 'mi';
  return 'hi';
};

const buildGroupWithExamState = (group: Group, examSlots: ExamSlotState[]): GroupWithExamState => ({
  ...group,
  examSlots,
  inProgressCount: examSlots.filter((s) => s.status === 'in_progress').length,
  completedCount: examSlots.filter((s) => s.status === 'completed').length,
  activeMemberCount: group.memberCount,
});

const emptySlots = (): ExamSlotState[] =>
  EXAM_SLOTS.map((def) => ({
    slotId: def.id,
    status: 'not_started' as const,
    submittedCount: 0,
    totalCount: 0,
  }));

// ============================================================
// 스타일
// ============================================================

const Wrapper = styled.div`
  min-height: 100%;
`;

const LoadingBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`;

const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  gap: 14px;
`;

// ============================================================
// 컴포넌트
// ============================================================

export const AssessmentPage = () => {
  const navigate = useNavigate();
  const { groupId: urlGroupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const v2Layout = useOptionalLayoutContext();
  const isV2Management = FEATURES.IA_V2 && v2Layout !== null;

  // 그룹 목록: groupKeys.myGroups 캐시 공유 (사이드바 useTeacherClassList와 동일 캐시)
  const {
    data: rawGroups = [],
    isLoading: isGroupsLoading,
    error: groupsQueryError,
    refetch: refetchGroups,
  } = useMyGroupsQuery();

  const slotsQueryState = useAssessmentSlotsQueries(rawGroups, user?.id);
  const isBaseLoading = isGroupsLoading || slotsQueryState.isLoading;
  const slotError = slotsQueryState.error ? '검사 현황을 불러오는데 실패했습니다.' : null;

  // rawGroups + slot queries -> GroupWithExamState[]
  const groups = useMemo<GroupWithExamState[]>(
    () =>
      rawGroups.map((g: Group) =>
        buildGroupWithExamState(g, slotsQueryState.dataByClaId.get(g.claId) ?? emptySlots()),
      ),
    [rawGroups, slotsQueryState.dataByClaId],
  );

  // 그룹 생성/수정/삭제·QR 모달 state 제거 — mypage(SSO)로 이관 (group-from-idp)

  // URL 기반 derived state (React Compiler 최적화: useEffect 내 setState 방지)
  const selectedGroupId = useMemo(() => {
    const requestedGroupId = isV2Management ? v2Layout.scope.classId : urlGroupId;
    if (!requestedGroupId || isBaseLoading) return null;
    const exists = groups.some((g) => g.id === requestedGroupId);
    return exists ? requestedGroupId : null;
  }, [isV2Management, v2Layout, urlGroupId, groups, isBaseLoading]);

  const membersQuery = useGroupMembersQuery(selectedGroupId, user?.id);
  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const isMembersLoading = !!selectedGroupId && membersQuery.isLoading;
  const isLoading = isBaseLoading;
  const error = groupsQueryError
    ? '그룹 목록을 불러오는데 실패했습니다.'
    : slotError || (membersQuery.error ? '학생 목록을 불러오는데 실패했습니다.' : null);

  const viewMode = useMemo<ViewMode>(() => {
    return selectedGroupId ? 'detail' : 'list';
  }, [selectedGroupId]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  // 2회차 사전 검증 모달
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    preview: ExamStartPreviewResponse | null;
    pendingSlotId: string | null;
    pendingClaId: string | null;
    pendingOrdNo: number | null;
    pendingPaperIdx: string | null;
  }>({
    isOpen: false,
    preview: null,
    pendingSlotId: null,
    pendingClaId: null,
    pendingOrdNo: null,
    pendingPaperIdx: null,
  });

  // HSJ-70, HSJ-66: 알럿/확인 모달
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const activeStudentCount = useMemo(() => {
    return members.filter((m) => m.status === 'active').length;
  }, [members]);

  // ============================================================
  // 그룹 선택 / 전환 / 뒤로
  // ============================================================

  const handleSelectGroup = (groupId: string) => {
    if (isV2Management) {
      v2Layout.selectClass(groupId);
      return;
    }
    navigate(`/assessment/${groupId}`);
  };

  const handleSwitchGroup = (groupId: string) => {
    if (isV2Management) {
      v2Layout.selectClass(groupId);
      return;
    }
    navigate(`/assessment/${groupId}`, { replace: true });
  };

  const handleBack = () => {
    if (isV2Management) {
      v2Layout.selectAll();
      return;
    }
    navigate('/assessment', { replace: true });
  };

  // ============================================================
  // 그룹 CRUD
  // ============================================================

  // 그룹 생성/수정/삭제·학생 초대/강퇴·초대코드/QR/링크 핸들러 제거 — mypage(SSO)로 이관 (group-from-idp)

  // ============================================================
  // 재시도
  // ============================================================

  const handleRetry = useCallback(() => {
    if (groupsQueryError) {
      void refetchGroups();
      return;
    }
    if (membersQuery.error) {
      void membersQuery.refetch();
      return;
    }
    slotsQueryState.refetchAll();
  }, [groupsQueryError, refetchGroups, membersQuery, slotsQueryState]);

  // ============================================================
  // 검사 액션
  // ============================================================

  const startExamMutation = useStartExamMutation();
  const endExamMutation = useEndExamMutation();
  const cancelExamMutation = useCancelExamMutation();
  const restartExamMutation = useRestartExamMutation();
  const previewExamStartMutation = usePreviewExamStartMutation();
  const uploadAnswersExcelMutation = useUploadAnswersExcelMutation();
  const downloadSampleExcelMutation = useDownloadSampleExcelMutation();
  const isExamActionPending =
    startExamMutation.isPending ||
    endExamMutation.isPending ||
    cancelExamMutation.isPending ||
    restartExamMutation.isPending ||
    previewExamStartMutation.isPending ||
    uploadAnswersExcelMutation.isPending ||
    downloadSampleExcelMutation.isPending;

  const doStartExam = useCallback(
    async (_slotId: string, claId: string, ordNo: number, paperIdx: string) => {
      if (!user?.id || !selectedGroup || startExamMutation.isPending) return;

      try {
        await startExamMutation.mutateAsync({
          claId,
          tcId: user.id,
          ordNo,
          grade: schoolLevelToGrade(selectedGroup.schoolLevel),
          paperIdx,
        });
      } catch (err) {
        console.error('[doStartExam] Failed to start exam:', err);
      }
    },
    [user, selectedGroup, startExamMutation],
  );

  const handleStartExam = useCallback(
    async (slotId: string) => {
      if (!selectedGroup || startExamMutation.isPending || previewExamStartMutation.isPending)
        return;

      // HSJ-70: 학생이 없을 경우 팝업 표시
      if (activeStudentCount === 0) {
        setAlertModal({
          isOpen: true,
          title: '그룹에 가입된 학생이 없습니다',
          message:
            '검사를 시작하려면 먼저 학생을 초대해주세요.\n코드 복사, QR코드, 링크 공유 기능으로 학생을 초대할 수 있습니다.',
        });
        return;
      }

      const slotDef = EXAM_SLOTS.find((s) => s.id === slotId);
      if (!slotDef) return;

      const claId = selectedGroup.claId;
      const { ordNo, paperIdx } = slotDef;

      // 출제 전 사전 검증 (1·2회차 공통)
      try {
        const preview = await previewExamStartMutation.mutateAsync({ claId, paperIdx, ordNo });
        if (!preview.canStart || preview.blockedStudents.length > 0) {
          setPreviewModal({
            isOpen: true,
            preview,
            pendingSlotId: slotId,
            pendingClaId: claId,
            pendingOrdNo: ordNo,
            pendingPaperIdx: paperIdx,
          });
          return;
        }
      } catch (err) {
        console.error('[handleStartExam] Preview validation failed:', err);
        // 검증 실패 시 그냥 진행
      }

      await doStartExam(slotId, claId, ordNo, paperIdx);
    },
    [
      selectedGroup,
      activeStudentCount,
      startExamMutation.isPending,
      previewExamStartMutation,
      doStartExam,
    ],
  );

  const handlePreviewConfirm = useCallback(async () => {
    const { pendingSlotId, pendingClaId, pendingOrdNo, pendingPaperIdx } = previewModal;
    setPreviewModal((prev) => ({ ...prev, isOpen: false }));
    if (pendingSlotId && pendingClaId && pendingOrdNo && pendingPaperIdx) {
      await doStartExam(pendingSlotId, pendingClaId, pendingOrdNo, pendingPaperIdx);
    }
  }, [previewModal, doStartExam]);

  const handleEndExam = useCallback(
    async (_slotId: string, dgnssId: number) => {
      if (!selectedGroup || !user?.id) return;

      // HSJ-66: 검사 종료 확인 모달
      setAlertModal({
        isOpen: true,
        title: '검사를 종료하시겠습니까?',
        message:
          '해당 검사를 종료하면 미제출자는 검사지를 제출할 수 없습니다.\n(제출자의 검사지만 결과에 포함됨)',
        onConfirm: async () => {
          if (endExamMutation.isPending) return;
          try {
            await endExamMutation.mutateAsync({
              dgnssId,
              claId: selectedGroup.claId,
              userId: user.id,
            });
          } catch {
            // noop
          }
        },
      });
    },
    [selectedGroup, user, endExamMutation],
  );

  const handleCancelExam = useCallback(
    async (_slotId: string, dgnssId: number) => {
      if (!selectedGroup || !user?.id) return;

      // HSJ-66: 검사 취소 확인 모달
      setAlertModal({
        isOpen: true,
        title: '검사를 취소하시겠습니까?',
        message: '검사를 취소하면 제출자의 내역도 사라집니다.',
        onConfirm: async () => {
          if (cancelExamMutation.isPending) return;
          try {
            await cancelExamMutation.mutateAsync({
              dgnssId,
              claId: selectedGroup.claId,
              userId: user.id,
            });
          } catch {
            // noop
          }
        },
      });
    },
    [selectedGroup, user, cancelExamMutation],
  );

  const handleViewResult = (_slotId: string, _dgnssId: number) => {
    if (isV2Management && selectedGroup) {
      navigate(`/exam/result?class=${encodeURIComponent(selectedGroup.id)}`);
      return;
    }
    navigate('/dashboard');
  };

  const handleViewGroupResult = (groupId: string) => {
    navigate(`/exam/result?class=${encodeURIComponent(groupId)}`);
  };

  const handleRestartExam = useCallback(
    async (_slotId: string, dgnssId: number) => {
      if (!user?.id || !selectedGroup || restartExamMutation.isPending) return;
      try {
        await restartExamMutation.mutateAsync({
          dgnssId,
          claId: selectedGroup.claId,
          userId: user.id,
          grade: schoolLevelToGrade(selectedGroup.schoolLevel),
        });
      } catch {
        // noop
      }
    },
    [user, selectedGroup, restartExamMutation],
  );

  const handleExcelUpload = useCallback(
    async (_slotId: string, dgnssId: number, file: File) => {
      if (!selectedGroup || !user?.id || uploadAnswersExcelMutation.isPending) return;
      try {
        await uploadAnswersExcelMutation.mutateAsync({
          dgnssId,
          file,
          claId: selectedGroup.claId,
          userId: user.id,
        });
      } catch {
        // noop
      }
    },
    [selectedGroup, user, uploadAnswersExcelMutation],
  );

  const handleTemplateDownload = useCallback(
    async (_slotId: string, dgnssId: number) => {
      if (downloadSampleExcelMutation.isPending) return;
      try {
        await downloadSampleExcelMutation.mutateAsync({ dgnssId });
      } catch {
        // noop
      }
    },
    [downloadSampleExcelMutation],
  );

  // ============================================================
  // 렌더링
  // ============================================================

  if (isLoading) {
    return (
      <LoadingBox>
        <Loader2 size={36} style={{ color: '#7C3AED', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </LoadingBox>
    );
  }

  if (error) {
    return (
      <ErrorBox>
        <p style={{ color: '#EF4444', margin: 0 }}>{error}</p>
        <button className='btn primary' onClick={handleRetry}>
          다시 시도
        </button>
      </ErrorBox>
    );
  }

  return (
    <Wrapper>
      {/* 리스트 뷰 또는 빈 상태 */}
      {viewMode === 'list' &&
        (groups.length === 0 ? (
          <EmptyState />
        ) : isV2Management ? (
          <ExamManagementOverview
            groups={groups}
            onManageExam={handleSelectGroup}
            onViewResult={handleViewGroupResult}
          />
        ) : (
          <GroupListView groups={groups} onSelectGroup={handleSelectGroup} />
        ))}

      {/* 상세 뷰 */}
      {viewMode === 'detail' && selectedGroup && (
        <GroupDetailView
          group={selectedGroup}
          members={members}
          allGroups={groups}
          onBack={handleBack}
          onSwitchGroup={handleSwitchGroup}
          onStartExam={handleStartExam}
          onEndExam={handleEndExam}
          onCancelExam={handleCancelExam}
          onViewResult={handleViewResult}
          onRestartExam={handleRestartExam}
          onExcelUpload={handleExcelUpload}
          onTemplateDownload={handleTemplateDownload}
          isMembersLoading={isMembersLoading}
          isActionPending={isExamActionPending}
        />
      )}

      {/* 그룹 생성/수정/삭제 모달 제거 — mypage(SSO)로 이관 (group-from-idp) */}

      {/* 검사 출제 사전 검증 모달 */}
      <ExamStartPreviewModal
        isOpen={previewModal.isOpen}
        preview={previewModal.preview}
        ordNo={previewModal.pendingOrdNo ?? 1}
        paperIdx={previewModal.pendingPaperIdx ?? '1'}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handlePreviewConfirm}
      />

      {/* HSJ-70, HSJ-66: 알럿/확인 모달 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, title: '', message: '' })}
        title={alertModal.title}
        message={alertModal.message}
        type='warning'
        onConfirm={alertModal.onConfirm}
      />

      {/* QR 코드 초대 모달 제거 — mypage(SSO)로 이관 (group-from-idp) */}
    </Wrapper>
  );
};

export default AssessmentPage;
