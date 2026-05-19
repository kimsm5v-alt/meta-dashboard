/**
 * 검사하기 V2 페이지 - 그룹 관리 + 검사하기 통합
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth';
import {
  EmptyState,
  GroupListView,
  GroupDetailView,
  GroupFormModal,
  DeleteGroupModal,
} from '../components';
import { EXAM_SLOTS } from '../constants';
import type {
  GroupWithExamState,
  GroupMember,
  ViewMode,
  ModalType,
  GroupFormData,
  ExamSlotState,
} from '../types';
import type { Group, SchoolLevelCode } from '@/shared/types';

// 개발 환경 체크
const isDev = import.meta.env.DEV;

// ============================================================
// Mock 데이터 (개발 환경용) - 다양한 상태 테스트용
// ============================================================

const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: '6학년 1반',
    schoolLevel: 'elementary',
    grade: 6,
    classNumber: 1,
    description: '검사가 진행 중인 그룹입니다.',
    inviteCode: 'LIVE01',
    memberCount: 28,
    createdAt: new Date('2024-03-01'),
    teacherId: 'dev-teacher-1',
    teacherName: '김선생',
    schoolName: '비상초등학교',
  },
  {
    id: 'g2',
    name: '6학년 2반',
    schoolLevel: 'elementary',
    grade: 6,
    classNumber: 2,
    description: '아직 검사를 시작하지 않은 그룹입니다.',
    inviteCode: 'WAIT02',
    memberCount: 30,
    createdAt: new Date('2024-03-01'),
    teacherId: 'dev-teacher-1',
    teacherName: '김선생',
    schoolName: '비상초등학교',
  },
  {
    id: 'g3',
    name: '5학년 3반',
    schoolLevel: 'elementary',
    grade: 5,
    classNumber: 3,
    description: '모든 검사가 완료된 그룹입니다.',
    inviteCode: 'DONE03',
    memberCount: 25,
    createdAt: new Date('2024-02-15'),
    teacherId: 'dev-teacher-1',
    teacherName: '김선생',
    schoolName: '비상초등학교',
  },
  {
    id: 'g4',
    name: '중등 1학년 1반',
    schoolLevel: 'middle',
    grade: 1,
    classNumber: 1,
    description: '중학교 1학년 그룹입니다.',
    inviteCode: 'MID104',
    memberCount: 32,
    createdAt: new Date('2024-02-01'),
    teacherId: 'dev-teacher-1',
    teacherName: '김선생',
    schoolName: '비상중학교',
  },
  {
    id: 'g5',
    name: '고등 2학년 5반',
    schoolLevel: 'high',
    grade: 2,
    classNumber: 5,
    description: '고등학교 2학년 그룹입니다.',
    inviteCode: 'HIGH05',
    memberCount: 35,
    createdAt: new Date('2024-01-15'),
    teacherId: 'dev-teacher-1',
    teacherName: '김선생',
    schoolName: '비상고등학교',
  },
];

const MOCK_MEMBERS: GroupMember[] = [
  { id: 'm1', name: '김철수', email: 'student1@test.com', joinedAt: new Date('2024-03-01'), status: 'active' },
  { id: 'm2', name: '이영희', email: 'student2@test.com', joinedAt: new Date('2024-03-01'), status: 'active' },
  { id: 'm3', name: '박지민', email: 'student3@test.com', joinedAt: new Date('2024-03-02'), status: 'active' },
  { id: 'm4', name: '정수현', email: 'student4@test.com', joinedAt: new Date('2024-03-02'), status: 'active' },
  { id: 'm5', name: '최민준', email: 'student5@test.com', joinedAt: new Date('2024-03-03'), status: 'active' },
  { id: 'm6', name: '강서연', email: 'student6@test.com', joinedAt: new Date('2024-03-03'), status: 'active' },
  { id: 'm7', name: '윤도현', email: 'student7@test.com', joinedAt: new Date('2024-03-04'), status: 'active' },
  { id: 'm8', name: '임하늘', email: 'student8@test.com', joinedAt: new Date('2024-03-04'), status: 'active' },
  { id: 'm9', name: '조은우', email: 'student9@test.com', joinedAt: new Date('2024-03-05'), status: 'active' },
  { id: 'm10', name: '한소희', email: 'student10@test.com', joinedAt: new Date('2024-03-05'), status: 'active' },
  { id: 'm11', name: '홍길동', email: 'student11@test.com', joinedAt: new Date('2024-03-06'), status: 'active' },
  { id: 'm12', name: '임꺽정', email: 'student12@test.com', joinedAt: new Date('2024-03-06'), status: 'active' },
  { id: 'm13', name: '장보고', email: 'student13@test.com', joinedAt: new Date('2024-03-07'), status: 'active' },
  { id: 'm14', name: '이순신', email: 'student14@test.com', joinedAt: new Date('2024-03-07'), status: 'active' },
  { id: 'm15', name: '유관순', email: 'student15@test.com', joinedAt: new Date('2024-03-08'), status: 'active' },
  { id: 'm16', name: '안중근', email: 'student16@test.com', joinedAt: new Date('2024-03-08'), status: 'active' },
  { id: 'm17', name: '윤봉길', email: 'student17@test.com', joinedAt: new Date('2024-03-09'), status: 'active' },
  { id: 'm18', name: '김구', email: 'student18@test.com', joinedAt: new Date('2024-03-09'), status: 'active' },
  { id: 'm19', name: '신사임당', email: 'student19@test.com', joinedAt: new Date('2024-03-10'), status: 'active' },
  { id: 'm20', name: '세종대왕', email: 'student20@test.com', joinedAt: new Date('2024-03-10'), status: 'active' },
  { id: 'm21', name: '이황', email: 'student21@test.com', joinedAt: new Date('2024-03-11'), status: 'active' },
  { id: 'm22', name: '이이', email: 'student22@test.com', joinedAt: new Date('2024-03-11'), status: 'active' },
  { id: 'm23', name: '정약용', email: 'student23@test.com', joinedAt: new Date('2024-03-12'), status: 'active' },
  { id: 'm24', name: '김정희', email: 'student24@test.com', joinedAt: new Date('2024-03-12'), status: 'active' },
  { id: 'm25', name: '허균', email: 'student25@test.com', joinedAt: new Date('2024-03-13'), status: 'active' },
  { id: 'm26', name: '허난설헌', email: 'student26@test.com', joinedAt: new Date('2024-03-13'), status: 'active' },
  { id: 'm27', name: '김홍도', email: 'student27@test.com', joinedAt: new Date('2024-03-14'), status: 'active' },
  { id: 'm28', name: '신윤복', email: 'student28@test.com', joinedAt: new Date('2024-03-14'), status: 'active' },
  { id: 'm29', name: '장영실', email: 'student29@test.com', joinedAt: new Date('2024-03-15'), status: 'active' },
  { id: 'm30', name: '최무선', email: 'student30@test.com', joinedAt: new Date('2024-03-15'), status: 'active' },
  { id: 'm31', name: '문익점', email: 'student31@test.com', joinedAt: new Date('2024-03-16'), status: 'active' },
  { id: 'm32', name: '이천', email: 'student32@test.com', joinedAt: new Date('2024-03-16'), status: 'active' },
  { id: 'm33', name: '허준', email: 'student33@test.com', joinedAt: new Date('2024-03-17'), status: 'active' },
  { id: 'm34', name: '정철', email: 'student34@test.com', joinedAt: new Date('2024-03-17'), status: 'active' },
  { id: 'm35', name: '송시열', email: 'student35@test.com', joinedAt: new Date('2024-03-18'), status: 'active' },
];

// ============================================================
// Mock 데이터 생성 (실제 API 연동 전) - 그룹별 다양한 상태 시뮬레이션
// ============================================================
const createMockExamSlots = (group: Group): ExamSlotState[] => {
  const totalCount = group.memberCount || 0;

  // 그룹별로 다른 검사 상태 시나리오 적용
  switch (group.id) {
    // ========================================
    // g1: 진행중 그룹 - L1 완료, S1 진행중
    // ========================================
    case 'g1':
      return [
        {
          slotId: 'L1',
          status: 'completed',
          submittedCount: totalCount,
          totalCount,
          dgnssId: 1001,
          startDate: new Date('2024-03-15'),
          endDate: new Date('2024-03-20'),
        },
        {
          slotId: 'S1',
          status: 'in_progress',
          submittedCount: Math.floor(totalCount * 0.6), // 60% 제출
          totalCount,
          dgnssId: 1002,
          startDate: new Date('2024-06-01'),
          notSubmittedStudents: ['김철수', '이영희', '박지민', '정수현', '최민준'],
        },
        {
          slotId: 'L2',
          status: 'not_started',
          submittedCount: 0,
          totalCount,
        },
        {
          slotId: 'S2',
          status: 'not_started',
          submittedCount: 0,
          totalCount,
        },
      ];

    // ========================================
    // g2: 대기 그룹 - 모든 검사 시작 전
    // ========================================
    case 'g2':
      return EXAM_SLOTS.map((def) => ({
        slotId: def.id,
        status: 'not_started' as const,
        submittedCount: 0,
        totalCount,
      }));

    // ========================================
    // g3: 완료 그룹 - 모든 4개 검사 완료
    // ========================================
    case 'g3':
      return [
        {
          slotId: 'L1',
          status: 'completed',
          submittedCount: totalCount,
          totalCount,
          dgnssId: 2001,
          startDate: new Date('2024-03-10'),
          endDate: new Date('2024-03-15'),
        },
        {
          slotId: 'S1',
          status: 'completed',
          submittedCount: totalCount,
          totalCount,
          dgnssId: 2002,
          startDate: new Date('2024-06-01'),
          endDate: new Date('2024-06-05'),
        },
        {
          slotId: 'L2',
          status: 'completed',
          submittedCount: totalCount,
          totalCount,
          dgnssId: 2003,
          startDate: new Date('2024-09-10'),
          endDate: new Date('2024-09-15'),
        },
        {
          slotId: 'S2',
          status: 'completed',
          submittedCount: totalCount,
          totalCount,
          dgnssId: 2004,
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-05'),
        },
      ];

    // ========================================
    // g4: 중등 - 1차 완료, 2차 진행중 (L2 locked 해제됨)
    // ========================================
    case 'g4':
      return [
        {
          slotId: 'L1',
          status: 'completed',
          submittedCount: totalCount,
          totalCount,
          dgnssId: 3001,
          startDate: new Date('2024-03-12'),
          endDate: new Date('2024-03-18'),
        },
        {
          slotId: 'S1',
          status: 'completed',
          submittedCount: totalCount,
          totalCount,
          dgnssId: 3002,
          startDate: new Date('2024-06-05'),
          endDate: new Date('2024-06-10'),
        },
        {
          slotId: 'L2',
          status: 'in_progress',
          submittedCount: Math.floor(totalCount * 0.3), // 30% 제출
          totalCount,
          dgnssId: 3003,
          startDate: new Date('2024-09-15'),
          notSubmittedStudents: ['홍길동', '임꺽정', '장보고', '이순신', '유관순', '안중근', '윤봉길'],
        },
        {
          slotId: 'S2',
          status: 'not_started',
          submittedCount: 0,
          totalCount,
        },
      ];

    // ========================================
    // g5: 고등 - 학습종합 둘 다 완료, 자기조절 미시작 (locked 상태 보이도록)
    // ========================================
    case 'g5':
      return [
        {
          slotId: 'L1',
          status: 'completed',
          submittedCount: totalCount,
          totalCount,
          dgnssId: 4001,
          startDate: new Date('2024-03-20'),
          endDate: new Date('2024-03-25'),
        },
        {
          slotId: 'S1',
          status: 'not_started', // S1은 L1 완료 후 시작 가능
          submittedCount: 0,
          totalCount,
        },
        {
          slotId: 'L2',
          status: 'completed',
          submittedCount: totalCount,
          totalCount,
          dgnssId: 4002,
          startDate: new Date('2024-09-20'),
          endDate: new Date('2024-09-25'),
        },
        {
          slotId: 'S2',
          status: 'not_started', // S2는 L2 완료 후 시작 가능
          submittedCount: 0,
          totalCount,
        },
      ];

    // ========================================
    // 기본값 (새로 생성되는 그룹 등)
    // ========================================
    default:
      return EXAM_SLOTS.map((def) => ({
        slotId: def.id,
        status: 'not_started' as const,
        submittedCount: 0,
        totalCount,
      }));
  }
};

const transformToGroupWithExamState = (group: Group): GroupWithExamState => {
  const examSlots = createMockExamSlots(group);
  const inProgressCount = examSlots.filter(
    (s) => s.status === 'in_progress'
  ).length;
  const completedCount = examSlots.filter(
    (s) => s.status === 'completed'
  ).length;

  return {
    ...group,
    examSlots,
    inProgressCount,
    completedCount,
    activeMemberCount: group.memberCount,
  };
};

export const AssessmentPageV2: React.FC = () => {
  const navigate = useNavigate();
  const { user, credentials } = useAuth();

  // 상태
  const [groups, setGroups] = useState<GroupWithExamState[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalGroup, setModalGroup] = useState<GroupWithExamState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 선택된 그룹
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  // ============================================================
  // 데이터 로드
  // ============================================================

  const loadGroups = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // 개발 환경: Mock 데이터 사용
      if (isDev) {
        await new Promise((r) => setTimeout(r, 300)); // 로딩 시뮬레이션
        const enrichedGroups = MOCK_GROUPS.map(transformToGroupWithExamState);
        setGroups(enrichedGroups);
        return;
      }

      // 프로덕션: 실제 API 호출
      const { groupService } = await import('@/features/groups/services/groupService');
      const rawGroups = await groupService.getMyGroups(user.id);
      const enrichedGroups = rawGroups.map(transformToGroupWithExamState);
      setGroups(enrichedGroups);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError('그룹 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadMembers = useCallback(async (groupId: string) => {
    if (!user?.id) return;

    try {
      // 개발 환경: Mock 데이터 사용
      if (isDev) {
        await new Promise((r) => setTimeout(r, 200));
        const group = MOCK_GROUPS.find((g) => g.id === groupId);
        const count = group?.memberCount || 10;
        setMembers(MOCK_MEMBERS.slice(0, Math.min(count, MOCK_MEMBERS.length)));
        return;
      }

      // 프로덕션: 실제 API 호출
      const { groupService } = await import('@/features/groups/services/groupService');
      const memberList = await groupService.getGroupMembers(groupId, user.id);
      setMembers(memberList);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      loadMembers(selectedGroupId);
    }
  }, [selectedGroupId, loadMembers]);

  // ============================================================
  // 그룹 선택/전환
  // ============================================================

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setViewMode('detail');
  };

  const handleSwitchGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    loadMembers(groupId);
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedGroupId(null);
    setMembers([]);
  };

  // ============================================================
  // 그룹 CRUD
  // ============================================================

  const handleCreateGroup = () => {
    setModalGroup(null);
    setModalType('create_group');
  };

  const handleEditGroup = (group: GroupWithExamState) => {
    setModalGroup(group);
    setModalType('edit_group');
  };

  const handleDeleteGroup = (group: GroupWithExamState) => {
    setModalGroup(group);
    setModalType('delete_group');
  };

  const handleCloseModal = () => {
    setModalType(null);
    setModalGroup(null);
  };

  const handleSubmitGroupForm = async (data: GroupFormData) => {
    if (!user?.id || !user?.name) return;

    setIsProcessing(true);
    try {
      if (modalType === 'create_group') {
        // 개발 환경: Mock 생성
        if (isDev) {
          await new Promise((r) => setTimeout(r, 300));
          const newGroup: Group = {
            id: `g${Date.now()}`,
            name: data.name,
            schoolLevel: data.schoolLevel,
            grade: data.grade,
            classNumber: data.classNumber,
            description: data.description,
            inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            memberCount: 0,
            createdAt: new Date(),
            teacherId: user.id,
            teacherName: user.name,
            schoolName: data.schoolName,
          };
          const enriched = transformToGroupWithExamState(newGroup);
          setGroups((prev) => [...prev, enriched]);
          setSelectedGroupId(newGroup.id);
          setViewMode('detail');
        } else {
          // 프로덕션: 실제 API 호출
          const { groupService } = await import('@/features/groups/services/groupService');
          const newGroup = await groupService.createGroup(
            {
              name: data.name,
              schoolLevel: data.schoolLevel,
              grade: data.grade,
              classNumber: data.classNumber,
              description: data.description,
              schoolName: data.schoolName,
            },
            user.id,
            user.name
          );
          const enriched = transformToGroupWithExamState(newGroup);
          setGroups((prev) => [...prev, enriched]);
          setSelectedGroupId(newGroup.id);
          setViewMode('detail');
        }
      } else if (modalType === 'edit_group' && modalGroup) {
        // 개발 환경: Mock 수정
        if (isDev) {
          await new Promise((r) => setTimeout(r, 300));
          setGroups((prev) =>
            prev.map((g) =>
              g.id === modalGroup.id
                ? { ...g, name: data.name, description: data.description, schoolName: data.schoolName }
                : g
            )
          );
        } else {
          // 프로덕션: 실제 API 호출
          const { groupService } = await import('@/features/groups/services/groupService');
          const updated = await groupService.updateGroup(
            modalGroup.id,
            {
              name: data.name,
              description: data.description,
              schoolName: data.schoolName,
            },
            user.id
          );
          if (updated) {
            setGroups((prev) =>
              prev.map((g) =>
                g.id === modalGroup.id
                  ? { ...g, ...updated, examSlots: g.examSlots }
                  : g
              )
            );
          }
        }
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save group:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user?.id || !modalGroup) return;

    setIsProcessing(true);
    try {
      // 개발 환경: Mock 삭제
      if (isDev) {
        await new Promise((r) => setTimeout(r, 300));
        setGroups((prev) => prev.filter((g) => g.id !== modalGroup.id));
        if (selectedGroupId === modalGroup.id) {
          handleBack();
        }
      } else {
        // 프로덕션: 실제 API 호출
        const { groupService } = await import('@/features/groups/services/groupService');
        const success = await groupService.deleteGroup(modalGroup.id, user.id);
        if (success) {
          setGroups((prev) => prev.filter((g) => g.id !== modalGroup.id));
          if (selectedGroupId === modalGroup.id) {
            handleBack();
          }
        }
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to delete group:', err);
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
      // 개발 환경: Mock
      if (isDev) {
        console.log('Mock: Invite member', email, 'to group', selectedGroupId);
        alert(`${email}로 초대 이메일을 발송했습니다. (Mock)`);
        return;
      }

      const { groupService } = await import('@/features/groups/services/groupService');
      await groupService.sendEmailInvitation(
        { groupId: selectedGroupId, email },
        user.id
      );
    } catch (err) {
      console.error('Failed to invite member:', err);
    }
  };

  const handleKickMember = async (memberId: string) => {
    if (!user?.id || !selectedGroupId) return;

    try {
      // 개발 환경: Mock
      if (isDev) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setGroups((prev) =>
          prev.map((g) =>
            g.id === selectedGroupId
              ? { ...g, memberCount: g.memberCount - 1, activeMemberCount: g.activeMemberCount - 1 }
              : g
          )
        );
        return;
      }

      const { groupService } = await import('@/features/groups/services/groupService');
      const success = await groupService.kickMember(
        selectedGroupId,
        memberId,
        user.id
      );
      if (success) {
        loadMembers(selectedGroupId);
        setGroups((prev) =>
          prev.map((g) =>
            g.id === selectedGroupId
              ? { ...g, memberCount: g.memberCount - 1, activeMemberCount: g.activeMemberCount - 1 }
              : g
          )
        );
      }
    } catch (err) {
      console.error('Failed to kick member:', err);
    }
  };

  // ============================================================
  // 초대 코드 관련
  // ============================================================

  const handleCopyInviteCode = () => {
    if (!selectedGroup) return;
    navigator.clipboard.writeText(selectedGroup.inviteCode);
    // TODO: 토스트 메시지
  };

  const handleShowQR = () => {
    // TODO: QR 모달
  };

  const handleCopyInviteLink = () => {
    if (!selectedGroup) return;
    const link = `${window.location.origin}/join/${selectedGroup.inviteCode}`;
    navigator.clipboard.writeText(link);
    // TODO: 토스트 메시지
  };

  // ============================================================
  // 검사 액션 (TODO: 실제 API 연동)
  // ============================================================

  const handleStartExam = (slotId: string) => {
    console.log('Start exam:', slotId);
    // TODO: 검사 시작 API
  };

  const handleEndExam = (slotId: string, dgnssId: number) => {
    console.log('End exam:', slotId, dgnssId);
    // TODO: 검사 종료 API
  };

  const handleCancelExam = (slotId: string, dgnssId: number) => {
    console.log('Cancel exam:', slotId, dgnssId);
    // TODO: 검사 취소 API
  };

  const handleViewResult = (slotId: string, dgnssId: number) => {
    console.log('View result:', slotId, dgnssId);
    navigate('/dashboard');
  };

  const handleRestartExam = (slotId: string, dgnssId: number) => {
    console.log('Restart exam:', slotId, dgnssId);
    // TODO: 검사 재시작 API
  };

  // ============================================================
  // 렌더링
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadGroups}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 리스트 뷰 또는 빈 상태 */}
      {viewMode === 'list' && (
        groups.length === 0 ? (
          <EmptyState onCreateGroup={handleCreateGroup} />
        ) : (
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
        />
      )}

      {/* 그룹 생성/수정 모달 */}
      <GroupFormModal
        isOpen={modalType === 'create_group' || modalType === 'edit_group'}
        mode={modalType === 'create_group' ? 'create' : 'edit'}
        group={modalGroup || undefined}
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
    </div>
  );
};

export default AssessmentPageV2;
