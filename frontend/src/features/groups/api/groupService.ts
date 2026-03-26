/**
 * 그룹 관리 서비스
 * - 백엔드 API 연동 전까지 Mock 데이터 사용
 * - API 완성 후 실제 엔드포인트로 교체
 */

import type {
  Group,
  GroupMember,
  CreateGroupInput,
  UpdateGroupInput,
  JoinGroupInput,
  GuestJoinGroupInput,
  GroupInviteInfo,
  GuestRecord,
  EmailInvitation,
  SendEmailInvitationInput,
} from '@shared/types';

// ============================================================
// Mock 데이터 저장소
// ============================================================

const STORAGE_KEY = 'meta_groups';
const MEMBERS_STORAGE_KEY = 'meta_group_members';
const INVITATIONS_STORAGE_KEY = 'meta_group_invitations';

/** Mock 그룹 데이터 */
let mockGroups: Group[] = [];

/** Mock 멤버 데이터 */
let mockMembers: GroupMember[] = [];

/** Mock 이메일 초대 데이터 */
let mockInvitations: EmailInvitation[] = [];

/** 테스트용 샘플 그룹 (localStorage가 비어있을 때 사용) */
const SAMPLE_GROUP: Group = {
  id: 'sample-group-1',
  name: '테스트 6학년 2반',
  schoolLevel: 'elementary',
  grade: 6,
  classNumber: 2,
  description: '게스트 초대 테스트용 샘플 그룹',
  inviteCode: 'TEST01',
  claId: 'CLA_SAMPLE_001',
  ownerId: 'sample-owner-id',
  ownerName: '김선생',
  ownerTcId: 'TC_SAMPLE_001',
  memberCount: 0,
  myRole: 'owner',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** 초기화 */
const initMockData = () => {
  const storedGroups = localStorage.getItem(STORAGE_KEY);
  const storedMembers = localStorage.getItem(MEMBERS_STORAGE_KEY);

  if (storedGroups) {
    mockGroups = JSON.parse(storedGroups).map((g: Group) => ({
      ...g,
      createdAt: new Date(g.createdAt),
      updatedAt: new Date(g.updatedAt),
    }));
  }

  // localStorage에 그룹이 없으면 샘플 그룹 추가 (테스트용)
  if (mockGroups.length === 0) {
    mockGroups.push(SAMPLE_GROUP);
  }

  if (storedMembers) {
    mockMembers = JSON.parse(storedMembers).map((m: GroupMember) => ({
      ...m,
      joinedAt: new Date(m.joinedAt),
      leftAt: m.leftAt ? new Date(m.leftAt) : undefined,
    }));
  }

  const storedInvitations = localStorage.getItem(INVITATIONS_STORAGE_KEY);
  if (storedInvitations) {
    mockInvitations = JSON.parse(storedInvitations).map((inv: EmailInvitation) => ({
      ...inv,
      sentAt: new Date(inv.sentAt),
      expiresAt: new Date(inv.expiresAt),
      acceptedAt: inv.acceptedAt ? new Date(inv.acceptedAt) : undefined,
    }));
  }
};

/** 저장 */
const saveMockData = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockGroups));
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(mockMembers));
  localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(mockInvitations));
};

// 초기화 실행
initMockData();

// ============================================================
// 유틸리티
// ============================================================

/** 6자리 초대 코드 생성 */
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // 중복 체크
  if (mockGroups.some((g) => g.inviteCode === code)) {
    return generateInviteCode();
  }
  return code;
};

/** UUID 생성 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/** claId 생성 (Mock) */
const generateClaId = (): string => {
  return `CLA${Date.now()}`;
};

/** tcId 생성 (Mock) */
const generateTcId = (): string => {
  return `TC${Date.now()}`;
};

/** stdtId 생성 (Mock) */
const generateStdtId = (isGuest: boolean = false): string => {
  const prefix = isGuest ? 'GUEST' : 'STDT';
  return `${prefix}${Date.now()}`;
};

/** API 지연 시뮬레이션 */
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================
// 그룹 CRUD API
// ============================================================

/**
 * 그룹 생성
 */
export const createGroup = async (
  input: CreateGroupInput,
  userId: string,
  userName: string,
): Promise<Group> => {
  await delay();

  const now = new Date();
  const tcId = generateTcId();

  const newGroup: Group = {
    id: generateId(),
    name: input.name,
    schoolLevel: input.schoolLevel,
    grade: input.grade,
    classNumber: input.classNumber,
    description: input.description,
    schoolName: input.schoolName,
    inviteCode: generateInviteCode(),
    claId: generateClaId(),
    ownerId: userId,
    ownerName: userName,
    ownerTcId: tcId,
    memberCount: 0,
    myRole: 'owner',
    myTcId: tcId,
    createdAt: now,
    updatedAt: now,
  };

  mockGroups.push(newGroup);
  saveMockData();

  return newGroup;
};

/**
 * 내 그룹 목록 조회
 */
export const getMyGroups = async (userId: string): Promise<Group[]> => {
  await delay();

  // 방장이거나 멤버인 그룹
  const ownerGroups = mockGroups.filter((g) => g.ownerId === userId);

  const memberGroupIds = mockMembers
    .filter((m) => m.userId === userId && m.status === 'active')
    .map((m) => m.groupId);

  const memberGroups = mockGroups
    .filter((g) => memberGroupIds.includes(g.id) && g.ownerId !== userId)
    .map((g) => ({
      ...g,
      myRole: 'member' as const,
      myStdtId: mockMembers.find((m) => m.groupId === g.id && m.userId === userId)?.stdtId,
    }));

  return [...ownerGroups, ...memberGroups];
};

/**
 * 그룹 상세 조회
 */
export const getGroupById = async (groupId: string, userId: string): Promise<Group | null> => {
  await delay();

  const group = mockGroups.find((g) => g.id === groupId);
  if (!group) return null;

  // 역할 정보 추가
  if (group.ownerId === userId) {
    return { ...group, myRole: 'owner', myTcId: group.ownerTcId };
  }

  const membership = mockMembers.find(
    (m) => m.groupId === groupId && m.userId === userId && m.status === 'active',
  );

  if (membership) {
    return { ...group, myRole: 'member', myStdtId: membership.stdtId };
  }

  return null; // 접근 권한 없음
};

/**
 * 그룹 수정
 */
export const updateGroup = async (
  groupId: string,
  input: UpdateGroupInput,
  userId: string,
): Promise<Group | null> => {
  await delay();

  const groupIndex = mockGroups.findIndex((g) => g.id === groupId);
  if (groupIndex === -1) return null;

  const group = mockGroups[groupIndex];

  // 방장만 수정 가능
  if (group.ownerId !== userId) {
    throw new Error('FORBIDDEN');
  }

  const updatedGroup: Group = {
    ...group,
    name: input.name ?? group.name,
    description: input.description ?? group.description,
    schoolName: input.schoolName ?? group.schoolName,
    updatedAt: new Date(),
  };

  mockGroups[groupIndex] = updatedGroup;
  saveMockData();

  return updatedGroup;
};

/**
 * 그룹 삭제
 */
export const deleteGroup = async (groupId: string, userId: string): Promise<boolean> => {
  await delay();

  const groupIndex = mockGroups.findIndex((g) => g.id === groupId);
  if (groupIndex === -1) return false;

  const group = mockGroups[groupIndex];

  // 방장만 삭제 가능
  if (group.ownerId !== userId) {
    throw new Error('FORBIDDEN');
  }

  // 검사 데이터 있으면 soft delete (실제로는 DB에서 처리)
  mockGroups.splice(groupIndex, 1);

  // 멤버도 삭제
  mockMembers = mockMembers.filter((m) => m.groupId !== groupId);

  saveMockData();

  return true;
};

/**
 * 초대 코드로 그룹 조회
 */
export const getGroupByInviteCode = async (
  code: string,
  userId?: string,
): Promise<GroupInviteInfo | null> => {
  await delay();

  // localStorage에서 최신 데이터 다시 로드 (다른 탭에서 생성된 그룹 반영)
  const storedGroups = localStorage.getItem(STORAGE_KEY);
  if (storedGroups) {
    mockGroups = JSON.parse(storedGroups).map((g: Group) => ({
      ...g,
      createdAt: new Date(g.createdAt),
      updatedAt: new Date(g.updatedAt),
    }));
  }

  // localStorage에 그룹이 없으면 샘플 그룹 추가 (테스트용)
  if (mockGroups.length === 0) {
    mockGroups.push(SAMPLE_GROUP);
  }

  const group = mockGroups.find((g) => g.inviteCode === code.toUpperCase());
  if (!group) return null;

  // 이미 가입 여부 확인
  let alreadyJoined = false;
  if (userId) {
    if (group.ownerId === userId) {
      alreadyJoined = true;
    } else {
      alreadyJoined = mockMembers.some(
        (m) => m.groupId === group.id && m.userId === userId && m.status === 'active',
      );
    }
  }

  return {
    id: group.id,
    name: group.name,
    schoolLevel: group.schoolLevel,
    grade: group.grade,
    classNumber: group.classNumber,
    ownerName: group.ownerName,
    memberCount: group.memberCount,
    alreadyJoined,
  };
};

// ============================================================
// 멤버 관리 API
// ============================================================

/**
 * 그룹 가입 (회원)
 */
export const joinGroup = async (
  groupId: string,
  input: JoinGroupInput,
  userId: string,
  userName: string,
): Promise<GroupMember> => {
  await delay();

  const group = mockGroups.find((g) => g.id === groupId);
  if (!group) {
    throw new Error('GROUP_DELETED');
  }

  // 이미 가입 확인
  const existingMember = mockMembers.find(
    (m) => m.groupId === groupId && m.userId === userId && m.status === 'active',
  );
  if (existingMember || group.ownerId === userId) {
    throw new Error('ALREADY_JOINED');
  }

  const newMember: GroupMember = {
    id: generateId(),
    groupId,
    userId,
    stdtId: generateStdtId(false),
    name: userName,
    studentNumber: input.studentNumber,
    memberType: 'member',
    status: 'active',
    joinedAt: new Date(),
  };

  mockMembers.push(newMember);

  // 그룹 멤버 수 업데이트
  const groupIndex = mockGroups.findIndex((g) => g.id === groupId);
  mockGroups[groupIndex].memberCount += 1;

  saveMockData();

  return newMember;
};

/**
 * 그룹 가입 (게스트)
 */
export const joinGroupAsGuest = async (
  groupId: string,
  input: GuestJoinGroupInput,
): Promise<GroupMember> => {
  await delay();

  const group = mockGroups.find((g) => g.id === groupId);
  if (!group) {
    throw new Error('GROUP_DELETED');
  }

  const newMember: GroupMember = {
    id: generateId(),
    groupId,
    userId: null,
    stdtId: generateStdtId(true),
    name: input.name,
    email: input.email,
    studentNumber: input.studentNumber,
    memberType: 'guest',
    status: 'active',
    joinedAt: new Date(),
  };

  mockMembers.push(newMember);

  // 그룹 멤버 수 업데이트
  const groupIndex = mockGroups.findIndex((g) => g.id === groupId);
  mockGroups[groupIndex].memberCount += 1;

  saveMockData();

  return newMember;
};

/**
 * 그룹 멤버 목록 조회
 */
export const getGroupMembers = async (groupId: string, userId: string): Promise<GroupMember[]> => {
  await delay();

  const group = mockGroups.find((g) => g.id === groupId);
  if (!group) return [];

  // 방장이거나 멤버인 경우만 조회 가능
  const isMember =
    group.ownerId === userId ||
    mockMembers.some((m) => m.groupId === groupId && m.userId === userId && m.status === 'active');

  if (!isMember) {
    throw new Error('FORBIDDEN');
  }

  return mockMembers.filter((m) => m.groupId === groupId);
};

/**
 * 멤버 강퇴
 */
export const kickMember = async (
  groupId: string,
  memberId: string,
  userId: string,
): Promise<boolean> => {
  await delay();

  const group = mockGroups.find((g) => g.id === groupId);
  if (!group) return false;

  // 방장만 강퇴 가능
  if (group.ownerId !== userId) {
    throw new Error('FORBIDDEN');
  }

  const memberIndex = mockMembers.findIndex((m) => m.id === memberId && m.groupId === groupId);
  if (memberIndex === -1) return false;

  // 검사 데이터 있으면 status만 변경 (실제로는 DB에서 처리)
  mockMembers[memberIndex].status = 'left';
  mockMembers[memberIndex].leftAt = new Date();

  // 그룹 멤버 수 업데이트
  const groupIndex = mockGroups.findIndex((g) => g.id === groupId);
  mockGroups[groupIndex].memberCount = Math.max(0, mockGroups[groupIndex].memberCount - 1);

  saveMockData();

  return true;
};

/**
 * 그룹 탈퇴
 */
export const leaveGroup = async (groupId: string, userId: string): Promise<boolean> => {
  await delay();

  const group = mockGroups.find((g) => g.id === groupId);
  if (!group) return false;

  // 방장은 탈퇴 불가
  if (group.ownerId === userId) {
    throw new Error('CANNOT_LEAVE_AS_OWNER');
  }

  const memberIndex = mockMembers.findIndex(
    (m) => m.groupId === groupId && m.userId === userId && m.status === 'active',
  );
  if (memberIndex === -1) return false;

  mockMembers[memberIndex].status = 'left';
  mockMembers[memberIndex].leftAt = new Date();

  // 그룹 멤버 수 업데이트
  const groupIndex = mockGroups.findIndex((g) => g.id === groupId);
  mockGroups[groupIndex].memberCount = Math.max(0, mockGroups[groupIndex].memberCount - 1);

  saveMockData();

  return true;
};

// ============================================================
// 이메일 초대 API
// ============================================================

/**
 * 이메일로 멤버 초대
 */
export const sendEmailInvitation = async (
  input: SendEmailInvitationInput,
  userId: string,
): Promise<EmailInvitation> => {
  await delay();

  const group = mockGroups.find((g) => g.id === input.groupId);
  if (!group) {
    throw new Error('GROUP_NOT_FOUND');
  }

  // 방장만 초대 가능
  if (group.ownerId !== userId) {
    throw new Error('FORBIDDEN');
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new Error('INVALID_EMAIL');
  }

  // 이미 멤버인지 확인
  const existingMember = mockMembers.find(
    (m) => m.groupId === input.groupId && m.email === input.email && m.status === 'active',
  );
  if (existingMember) {
    throw new Error('ALREADY_MEMBER');
  }

  // 이미 초대 대기 중인지 확인
  const existingInvitation = mockInvitations.find(
    (inv) =>
      inv.groupId === input.groupId &&
      inv.email === input.email &&
      inv.status === 'pending' &&
      new Date(inv.expiresAt) > new Date(),
  );
  if (existingInvitation) {
    throw new Error('ALREADY_INVITED');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후 만료

  const newInvitation: EmailInvitation = {
    id: generateId(),
    groupId: input.groupId,
    email: input.email,
    invitedBy: userId,
    status: 'sent', // Mock에서는 바로 sent로 처리
    sentAt: now,
    expiresAt,
  };

  mockInvitations.push(newInvitation);
  saveMockData();

  return newInvitation;
};

/**
 * 그룹의 이메일 초대 목록 조회
 */
export const getGroupInvitations = async (
  groupId: string,
  userId: string,
): Promise<EmailInvitation[]> => {
  await delay();

  const group = mockGroups.find((g) => g.id === groupId);
  if (!group) {
    throw new Error('GROUP_NOT_FOUND');
  }

  // 방장만 조회 가능
  if (group.ownerId !== userId) {
    throw new Error('FORBIDDEN');
  }

  return mockInvitations
    .filter((inv) => inv.groupId === groupId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
};

/**
 * 이메일 초대 취소
 */
export const cancelEmailInvitation = async (
  invitationId: string,
  userId: string,
): Promise<boolean> => {
  await delay();

  const invitation = mockInvitations.find((inv) => inv.id === invitationId);
  if (!invitation) {
    return false;
  }

  const group = mockGroups.find((g) => g.id === invitation.groupId);
  if (!group || group.ownerId !== userId) {
    throw new Error('FORBIDDEN');
  }

  // 초대 삭제
  mockInvitations = mockInvitations.filter((inv) => inv.id !== invitationId);
  saveMockData();

  return true;
};

/**
 * 초대 링크 생성
 */
export const generateInviteLink = (inviteCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/join/${inviteCode}`;
};

// ============================================================
// 게스트 전환 API
// ============================================================

/**
 * 게스트 기록 조회 (회원가입 시)
 */
export const getGuestRecords = async (email: string): Promise<GuestRecord[]> => {
  await delay();

  const guestMembers = mockMembers.filter(
    (m) => m.email === email && m.memberType === 'guest' && m.status === 'active',
  );

  return guestMembers.map((m) => {
    const group = mockGroups.find((g) => g.id === m.groupId);
    return {
      guestId: m.id,
      email: m.email!,
      groupName: group?.name ?? '알 수 없음',
      examResults: [], // Mock: 검사 결과는 별도 연동 필요
    };
  });
};

/**
 * 게스트 기록 연동
 */
export const linkGuestRecords = async (
  guestIds: string[],
  userId: string,
  userName: string,
): Promise<boolean> => {
  await delay();

  guestIds.forEach((guestId) => {
    const memberIndex = mockMembers.findIndex((m) => m.id === guestId);
    if (memberIndex !== -1) {
      mockMembers[memberIndex].userId = userId;
      mockMembers[memberIndex].name = userName;
      mockMembers[memberIndex].memberType = 'member';
    }
  });

  saveMockData();

  return true;
};

// ============================================================
// 내보내기
// ============================================================

export const groupService = {
  // 그룹
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupByInviteCode,

  // 멤버
  joinGroup,
  joinGroupAsGuest,
  getGroupMembers,
  kickMember,
  leaveGroup,

  // 이메일 초대
  sendEmailInvitation,
  getGroupInvitations,
  cancelEmailInvitation,
  generateInviteLink,

  // 게스트 전환
  getGuestRecords,
  linkGuestRecords,
};

export default groupService;
