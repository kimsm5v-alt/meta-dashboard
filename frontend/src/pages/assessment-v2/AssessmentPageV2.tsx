import '@app/styles/vj.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@features/auth/model/AuthContext';
import {
  EmptyState,
  GroupListView,
  GroupDetailView,
  GroupFormModal,
  DeleteGroupModal,
} from '@features/assessment-v2/ui';
import { ExamStartPreviewModal } from '@features/assessment/ui';
import { EXAM_SLOTS } from '@features/assessment-v2/constants';
import { getExamSlots } from '@features/assessment-v2/api/examSlotService';
import {
  startExam,
  endExam,
  cancelExam,
  restartExam,
  uploadAnswersExcel,
  downloadSampleExcel,
  previewExamStart,
} from '@features/assessment/api/assessmentService';
import type { ExamStartPreviewResponse } from '@features/assessment/api/assessmentService';
import {
  getMyGroups,
  getGroupDetail,
  createGroup,
  updateGroup,
  deleteGroup,
  kickMember,
  sendEmailInvitation,
} from '@features/groups/api/groupService';
import type {
  GroupWithExamState,
  GroupMember,
  ViewMode,
  ModalType,
  GroupFormData,
  ExamSlotState,
} from '@features/assessment-v2/types';
import type { Group, SchoolLevelCode } from '@shared/types';

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
  EXAM_SLOTS.map((def) => ({ slotId: def.id, status: 'not_started' as const, submittedCount: 0, totalCount: 0 }));

// ============================================================
// 스타일
// ============================================================

const Wrapper = styled.div`
  min-height: 100%;
`;

const LoadingBox = styled.div`
  display: flex; align-items: center; justify-content: center;
  min-height: 60vh;
`;

const ErrorBox = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 60vh; text-align: center; gap: 14px;
`;

// ============================================================
// 컴포넌트
// ============================================================

export const AssessmentPageV2 = () => {
  const navigate = useNavigate();
  const { groupId: urlGroupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();

  const [groups, setGroups] = useState<GroupWithExamState[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalGroup, setModalGroup] = useState<GroupWithExamState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  // ============================================================
  // 데이터 로딩
  // ============================================================

  const loadGroups = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const rawGroups = await getMyGroups(user.id);
      const enriched = await Promise.all(
        rawGroups.map(async (g) => {
          try {
            const slots = await getExamSlots(g.claId, user.id);
            return buildGroupWithExamState(g, slots);
          } catch {
            return buildGroupWithExamState(g, emptySlots());
          }
        }),
      );
      setGroups(enriched);
    } catch {
      setError('그룹 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadMembers = useCallback(async (groupId: string) => {
    if (!user?.id) return;
    try {
      const result = await getGroupDetail(groupId, user.id);
      setMembers(result?.members ?? []);
    } catch {
      setMembers([]);
    }
  }, [user?.id]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // 그룹 로드 완료 후 URL groupId → state 동기화
  // - found: 해당 그룹 상세 뷰로 전환
  // - not-found: /assessment로 fallback (잘못된 URL, 삭제된 그룹 등)
  useEffect(() => {
    if (isLoading) return;
    if (!urlGroupId) return;
    const exists = groups.some((g) => g.id === urlGroupId);
    if (exists) {
      setSelectedGroupId(urlGroupId);
      setViewMode('detail');
    } else {
      navigate('/assessment', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, urlGroupId]);

  useEffect(() => {
    if (selectedGroupId) loadMembers(selectedGroupId);
  }, [selectedGroupId, loadMembers]);

  // ============================================================
  // 그룹 선택 / 전환 / 뒤로
  // ============================================================

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setViewMode('detail');
    navigate(`/assessment/${groupId}`);
  };

  const handleSwitchGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    loadMembers(groupId);
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedGroupId(null);
    setMembers([]);
    navigate('/assessment', { replace: true });
  };

  // ============================================================
  // 그룹 CRUD
  // ============================================================

  const handleCreateGroup = () => { setModalGroup(null); setModalType('create_group'); };
  const handleEditGroup = (group: GroupWithExamState) => { setModalGroup(group); setModalType('edit_group'); };
  const handleDeleteGroup = (group: GroupWithExamState) => { setModalGroup(group); setModalType('delete_group'); };
  const handleCloseModal = () => { setModalType(null); setModalGroup(null); };

  const handleSubmitGroupForm = async (data: GroupFormData) => {
    if (!user?.id || !user?.name) return;

    setIsProcessing(true);
    try {
      if (modalType === 'create_group') {
        const newGroup = await createGroup(
          { name: data.name, schoolLevel: data.schoolLevel, grade: data.grade, classNumber: data.classNumber, description: data.description, schoolName: data.schoolName },
          user.id,
          user.name,
        );
        const enriched = buildGroupWithExamState(newGroup, emptySlots());
        setGroups((prev) => [...prev, enriched]);
        setSelectedGroupId(newGroup.id);
        setViewMode('detail');
        navigate(`/assessment/${newGroup.id}`);
      } else if (modalType === 'edit_group' && modalGroup) {
        const updated = await updateGroup(modalGroup.id, { name: data.name, description: data.description, schoolName: data.schoolName }, user.id);
        if (updated) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === modalGroup.id
                ? { ...g, ...updated, examSlots: g.examSlots, inProgressCount: g.inProgressCount, completedCount: g.completedCount, activeMemberCount: g.activeMemberCount }
                : g,
            ),
          );
        }
      }
      handleCloseModal();
    } catch {
      // 에러는 무시 (사용자에게 별도 피드백 없음)
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user?.id || !modalGroup) return;

    setIsProcessing(true);
    try {
      const ok = await deleteGroup(modalGroup.id, user.id);
      if (ok) {
        setGroups((prev) => prev.filter((g) => g.id !== modalGroup.id));
        if (selectedGroupId === modalGroup.id) handleBack();
      }
      handleCloseModal();
    } catch {
      // noop
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // 멤버 관리
  // ============================================================

  const handleInviteMember = async (email: string) => {
    if (!user?.id || !selectedGroupId) return;
    try {
      await sendEmailInvitation({ groupId: selectedGroupId, email }, user.id);
    } catch {
      // noop
    }
  };

  const handleKickMember = async (memberId: string) => {
    if (!user?.id || !selectedGroupId) return;
    try {
      const ok = await kickMember(selectedGroupId, memberId, user.id);
      if (ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setGroups((prev) =>
          prev.map((g) =>
            g.id === selectedGroupId
              ? { ...g, memberCount: g.memberCount - 1, activeMemberCount: g.activeMemberCount - 1 }
              : g,
          ),
        );
      }
    } catch {
      // noop
    }
  };

  // ============================================================
  // 초대 코드 관련
  // ============================================================

  const handleCopyInviteCode = () => {
    if (!selectedGroup) return;
    navigator.clipboard.writeText(selectedGroup.inviteCode);
  };

  const handleShowQR = () => {
    // TODO: QR 모달
  };

  const handleCopyInviteLink = () => {
    if (!selectedGroup) return;
    navigator.clipboard.writeText(`${window.location.origin}/join/${selectedGroup.inviteCode}`);
  };

  // ============================================================
  // 슬롯 상태 업데이트 헬퍼
  // ============================================================

  const updateGroupSlot = (groupId: string, slotId: string, patch: Partial<ExamSlotState>) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const newSlots = g.examSlots.map((s) => (s.slotId === slotId ? { ...s, ...patch } : s));
        return buildGroupWithExamState(g, newSlots);
      }),
    );
  };

  // ============================================================
  // 검사 액션
  // ============================================================

  const doStartExam = useCallback(async (slotId: string, claId: string, ordNo: number, paperIdx: string) => {
    if (!user?.id || !selectedGroup) return;

    try {
      const res = await startExam(claId, user.id, ordNo, schoolLevelToGrade(selectedGroup.schoolLevel), paperIdx);
      updateGroupSlot(selectedGroup.id, slotId, {
        dgnssId: res.dgnssId,
        status: 'in_progress',
        submittedCount: res.stSubmCnt,
        totalCount: res.stTotalCnt,
        startDate: new Date(res.dgnssStDt),
      });
    } catch {
      // noop
    }
  }, [user?.id, selectedGroup]);

  const handleStartExam = useCallback(async (slotId: string) => {
    if (!selectedGroup) return;

    const slotDef = EXAM_SLOTS.find((s) => s.id === slotId);
    if (!slotDef) return;

    const claId = selectedGroup.claId;
    const { ordNo, paperIdx } = slotDef;

    // 출제 전 사전 검증 (1·2회차 공통)
    try {
      const preview = await previewExamStart(claId, paperIdx, ordNo);
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
    } catch {
      // 검증 실패 시 그냥 진행
    }

    await doStartExam(slotId, claId, ordNo, paperIdx);
  }, [selectedGroup, doStartExam]);

  const handlePreviewConfirm = useCallback(async () => {
    const { pendingSlotId, pendingClaId, pendingOrdNo, pendingPaperIdx } = previewModal;
    setPreviewModal((prev) => ({ ...prev, isOpen: false }));
    if (pendingSlotId && pendingClaId && pendingOrdNo && pendingPaperIdx) {
      await doStartExam(pendingSlotId, pendingClaId, pendingOrdNo, pendingPaperIdx);
    }
  }, [previewModal, doStartExam]);

  const handleEndExam = useCallback(async (slotId: string, dgnssId: number) => {
    if (!selectedGroup) return;
    try {
      await endExam(dgnssId);
      updateGroupSlot(selectedGroup.id, slotId, { status: 'completed', endDate: new Date() });
    } catch {
      // noop
    }
  }, [selectedGroup]);

  const handleCancelExam = useCallback(async (slotId: string, dgnssId: number) => {
    if (!selectedGroup) return;
    try {
      await cancelExam(dgnssId);
      updateGroupSlot(selectedGroup.id, slotId, {
        dgnssId: undefined,
        status: 'not_started',
        submittedCount: 0,
        startDate: undefined,
        endDate: undefined,
      });
    } catch {
      // noop
    }
  }, [selectedGroup]);

  const handleViewResult = (_slotId: string, _dgnssId: number) => {
    navigate('/dashboard');
  };

  const handleRestartExam = useCallback(async (slotId: string, dgnssId: number) => {
    if (!user?.id || !selectedGroup) return;
    try {
      await restartExam(dgnssId, selectedGroup.claId, schoolLevelToGrade(selectedGroup.schoolLevel));
      updateGroupSlot(selectedGroup.id, slotId, { status: 'in_progress', endDate: undefined });
    } catch {
      // noop
    }
  }, [user?.id, selectedGroup]);

  const handleExcelUpload = useCallback(async (_slotId: string, dgnssId: number, file: File) => {
    try {
      await uploadAnswersExcel(dgnssId, file);
    } catch {
      // noop
    }
  }, []);

  const handleTemplateDownload = useCallback(async (_slotId: string, dgnssId: number) => {
    try {
      await downloadSampleExcel(dgnssId);
    } catch {
      // noop
    }
  }, []);

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
        <button
          className="btn primary"
          onClick={loadGroups}
        >
          다시 시도
        </button>
      </ErrorBox>
    );
  }

  return (
    <Wrapper>
      {/* 리스트 뷰 또는 빈 상태 */}
      {viewMode === 'list' && (
        groups.length === 0
          ? <EmptyState onCreateGroup={handleCreateGroup} />
          : (
            <GroupListView
              groups={groups}
              onSelectGroup={handleSelectGroup}
              onCreateGroup={handleCreateGroup}
              onEditGroup={handleEditGroup}
              onDeleteGroup={handleDeleteGroup}
            />
          )
      )}

      {/* 상세 뷰 */}
      {viewMode === 'detail' && selectedGroup && (
        <GroupDetailView
          group={selectedGroup}
          members={members}
          allGroups={groups}
          onBack={handleBack}
          onSwitchGroup={handleSwitchGroup}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
          onInviteMember={handleInviteMember}
          onKickMember={handleKickMember}
          onCopyInviteCode={handleCopyInviteCode}
          onShowQR={handleShowQR}
          onCopyInviteLink={handleCopyInviteLink}
          onStartExam={handleStartExam}
          onEndExam={handleEndExam}
          onCancelExam={handleCancelExam}
          onViewResult={handleViewResult}
          onRestartExam={handleRestartExam}
          onExcelUpload={handleExcelUpload}
          onTemplateDownload={handleTemplateDownload}
        />
      )}

      {/* 그룹 생성/수정 모달 */}
      <GroupFormModal
        isOpen={modalType === 'create_group' || modalType === 'edit_group'}
        mode={modalType === 'create_group' ? 'create' : 'edit'}
        initialData={
          modalType === 'edit_group' && modalGroup
            ? {
                name: modalGroup.name,
                schoolLevel: modalGroup.schoolLevel,
                grade: modalGroup.grade,
                classNumber: modalGroup.classNumber,
                description: modalGroup.description,
                schoolName: modalGroup.schoolName,
              }
            : undefined
        }
        onClose={handleCloseModal}
        onSubmit={handleSubmitGroupForm}
        isLoading={isProcessing}
      />

      {/* 그룹 삭제 모달 */}
      {modalGroup && (
        <DeleteGroupModal
          isOpen={modalType === 'delete_group'}
          group={modalGroup}
          memberCount={modalGroup.activeMemberCount || modalGroup.memberCount}
          completedExamCount={modalGroup.completedCount}
          inProgressExamCount={modalGroup.inProgressCount}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
          isLoading={isProcessing}
        />
      )}

      {/* 검사 출제 사전 검증 모달 */}
      <ExamStartPreviewModal
        isOpen={previewModal.isOpen}
        preview={previewModal.preview}
        ordNo={previewModal.pendingOrdNo ?? 1}
        paperIdx={previewModal.pendingPaperIdx ?? '1'}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handlePreviewConfirm}
      />
    </Wrapper>
  );
};

export default AssessmentPageV2;
