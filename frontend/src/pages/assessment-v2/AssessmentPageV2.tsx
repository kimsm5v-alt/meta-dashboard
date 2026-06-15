import '@app/styles/vj.css';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@features/auth/model/AuthContext';
import {
  EmptyState,
  GroupListView,
  GroupDetailView,
} from '@features/assessment-v2/ui';
import { ExamStartPreviewModal } from '@features/assessment/ui';
import { AlertModal } from '@shared/ui/AlertModal/AlertModal';
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
} from '@features/groups/api/groupService';
import type {
  GroupWithExamState,
  GroupMember,
  ViewMode,
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
  // 그룹 생성/수정/삭제·QR 모달 state 제거 — mypage(SSO)로 이관 (group-from-idp)

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

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  const activeStudentCount = useMemo(() => {
    return members.filter((m) => m.status === 'active').length;
  }, [members]);

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
  }, [user]);

  const loadMembers = useCallback(
    async (groupId: string) => {
      if (!user?.id) return;
      try {
        const result = await getGroupDetail(groupId, user.id);
        setMembers(result?.members ?? []);
      } catch {
        setMembers([]);
      }
    },
    [user],
  );

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
  }, [isLoading, urlGroupId, groups, navigate]);

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

  // 그룹 생성/수정/삭제·학생 초대/강퇴·초대코드/QR/링크 핸들러 제거 — mypage(SSO)로 이관 (group-from-idp)

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

  const doStartExam = useCallback(
    async (slotId: string, claId: string, ordNo: number, paperIdx: string) => {
      if (!user?.id || !selectedGroup) return;

      try {
        const res = await startExam(
          claId,
          user.id,
          ordNo,
          schoolLevelToGrade(selectedGroup.schoolLevel),
          paperIdx,
        );
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
    },
    [user, selectedGroup],
  );

  const handleStartExam = useCallback(
    async (slotId: string) => {
      if (!selectedGroup) return;

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
    },
    [selectedGroup, activeStudentCount, doStartExam],
  );

  const handlePreviewConfirm = useCallback(async () => {
    const { pendingSlotId, pendingClaId, pendingOrdNo, pendingPaperIdx } = previewModal;
    setPreviewModal((prev) => ({ ...prev, isOpen: false }));
    if (pendingSlotId && pendingClaId && pendingOrdNo && pendingPaperIdx) {
      await doStartExam(pendingSlotId, pendingClaId, pendingOrdNo, pendingPaperIdx);
    }
  }, [previewModal, doStartExam]);

  const handleEndExam = useCallback(
    async (slotId: string, dgnssId: number) => {
      if (!selectedGroup) return;

      // HSJ-66: 검사 종료 확인 모달
      setAlertModal({
        isOpen: true,
        title: '검사를 종료하시겠습니까?',
        message:
          '해당 검사를 종료하면 미제출자는 검사지를 제출할 수 없습니다.\n(제출자의 검사지만 결과에 포함됨)',
        onConfirm: async () => {
          try {
            await endExam(dgnssId);
            updateGroupSlot(selectedGroup.id, slotId, { status: 'completed', endDate: new Date() });
          } catch {
            // noop
          }
        },
      });
    },
    [selectedGroup],
  );

  const handleCancelExam = useCallback(
    async (slotId: string, dgnssId: number) => {
      if (!selectedGroup) return;

      // HSJ-66: 검사 취소 확인 모달
      setAlertModal({
        isOpen: true,
        title: '검사를 취소하시겠습니까?',
        message: '검사를 취소하면 제출자의 내역도 사라집니다.',
        onConfirm: async () => {
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
        },
      });
    },
    [selectedGroup],
  );

  const handleViewResult = (_slotId: string, _dgnssId: number) => {
    navigate('/dashboard');
  };

  const handleRestartExam = useCallback(
    async (slotId: string, dgnssId: number) => {
      if (!user?.id || !selectedGroup) return;
      try {
        await restartExam(
          dgnssId,
          selectedGroup.claId,
          schoolLevelToGrade(selectedGroup.schoolLevel),
        );
        updateGroupSlot(selectedGroup.id, slotId, { status: 'in_progress', endDate: undefined });
      } catch {
        // noop
      }
    },
    [user, selectedGroup],
  );

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
        <button className='btn primary' onClick={loadGroups}>
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
        ) : (
          <GroupListView
            groups={groups}
            onSelectGroup={handleSelectGroup}
          />
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

export default AssessmentPageV2;
