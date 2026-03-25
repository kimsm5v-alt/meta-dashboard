/**
 * 그룹 관리 서비스
 * - 백엔드 API 연동 완료 (그룹 CRUD, 멤버 관리)
 * - 이메일 초대는 백엔드 미구현으로 Mock 유지
 */

import { apiRequest } from '@/shared/services/apiClient';
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
} from '@/shared/types';

// ============================================================
// 백엔드 응답 → 프론트 타입 변환
// ============================================================

/** 필드 매핑: 백엔드 그룹 목록 응답 → 프론트 Group */
interface BackendGroupListItem {
  claId: string;
  groupNm: string;
  inviteCode: string;
  memberCount: number;
  myRole: 'HOST' | 'STUDENT';
  schoolLevel: string;
  grade: string;
  classNumber: string;
  schoolName?: string;
  groupDesc?: string;
  createdAt: string;
}

/** 필드 매핑: 백엔드 그룹 생성 응답 */
interface BackendGroupCreateResponse {
  groupId: number;
  claId: string;
  groupNm: string;
  inviteCode: string;
  hostUserNo: number;
  hostNickname: string;
}

/** 필드 매핑: 백엔드 그룹 상세 멤버 */
interface BackendGroupMember {
  id: number;
  userNo: number | null;
  stdtId: string;
  nickname: string;
  gender: string;
  email?: string;
  memberNo?: number;
  memberType: 'STUDENT' | 'GUEST';
  status: 'ACTIVE' | 'LEFT' | 'KICKED' | 'ARCHIVED';
}

/** 백엔드 참가 응답 */
interface BackendJoinResponse {
  memberId: number;
  groupId: number;
  claId: string;
  groupNm: string;
  role: string;
}

/** 백엔드 게스트 참가 응답 */
interface BackendGuestJoinResponse {
  memberId: number;
  groupId: number;
  claId: string;
  groupNm: string;
  stdtId: string;
  accessToken: string;
  refreshToken: string;
}

/** 백엔드 초대코드 조회 응답 */
interface BackendInviteResponse {
  groupId: number;
  claId: string;
  groupNm: string;
  inviteCode: string;
}

/** 백엔드 그룹 수정 응답 */
interface BackendGroupUpdateResponse {
  groupId: number;
  claId: string;
  groupNm: string;
  groupDesc?: string;
  schoolName?: string;
}

/** 역할 변환: 백엔드 → 프론트 */
function mapRole(backendRole: 'HOST' | 'STUDENT'): 'owner' | 'member' {
  return backendRole === 'HOST' ? 'owner' : 'member';
}

/** 멤버 타입 변환: 백엔드 → 프론트 */
function mapMemberType(backendType: 'STUDENT' | 'GUEST'): 'member' | 'guest' {
  return backendType === 'GUEST' ? 'guest' : 'member';
}

/** 멤버 상태 변환: 백엔드 → 프론트 */
function mapMemberStatus(backendStatus: string): 'active' | 'left' {
  return backendStatus === 'ACTIVE' ? 'active' : 'left';
}

/** 백엔드 목록 항목 → 프론트 Group */
function mapGroupListItem(item: BackendGroupListItem): Group {
  return {
    id: item.claId,
    name: item.groupNm,
    schoolLevel: item.schoolLevel as Group['schoolLevel'],
    grade: Number(item.grade),
    classNumber: Number(item.classNumber),
    description: item.groupDesc,
    schoolName: item.schoolName,
    inviteCode: item.inviteCode,
    claId: item.claId,
    ownerId: '',
    ownerName: '',
    ownerTcId: '',
    memberCount: item.memberCount,
    myRole: mapRole(item.myRole),
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.createdAt),
  };
}

/** 백엔드 멤버 → 프론트 GroupMember */
function mapGroupMember(item: BackendGroupMember, groupId: string): GroupMember {
  return {
    id: String(item.id),
    groupId,
    userId: item.userNo ? String(item.userNo) : null,
    stdtId: item.stdtId,
    name: item.nickname,
    email: item.email,
    studentNumber: item.memberNo,
    memberType: mapMemberType(item.memberType),
    status: mapMemberStatus(item.status),
    joinedAt: new Date(),
  };
}

// ============================================================
// 이메일 초대 Mock (❌ 백엔드 미구현)
// ============================================================

const INVITATIONS_STORAGE_KEY = 'meta_group_invitations';

let mockInvitations: EmailInvitation[] = [];

const initInvitations = () => {
  const stored = localStorage.getItem(INVITATIONS_STORAGE_KEY);
  if (stored) {
    mockInvitations = JSON.parse(stored).map((inv: EmailInvitation) => ({
      ...inv,
      sentAt: new Date(inv.sentAt),
      expiresAt: new Date(inv.expiresAt),
      acceptedAt: inv.acceptedAt ? new Date(inv.acceptedAt) : undefined,
    }));
  }
};

const saveInvitations = () => {
  localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(mockInvitations));
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

initInvitations();

// ============================================================
// 그룹 CRUD API (실제 백엔드 연동)
// ============================================================

/**
 * 그룹 생성
 */
export const createGroup = async (
  input: CreateGroupInput,
  _userId: string,
  _userName: string
): Promise<Group> => {
  const response = await apiRequest<BackendGroupCreateResponse>('/group/create', {
    method: 'POST',
    body: JSON.stringify({
      groupNm: input.name,
      schoolLevel: input.schoolLevel,
      grade: String(input.grade),
      classNumber: String(input.classNumber),
      schoolName: input.schoolName || '',
      groupDesc: input.description || '',
    }),
  });

  const data = response.resultData;

  return {
    id: data.claId,
    name: data.groupNm,
    schoolLevel: input.schoolLevel,
    grade: input.grade,
    classNumber: input.classNumber,
    description: input.description,
    schoolName: input.schoolName,
    inviteCode: data.inviteCode,
    claId: data.claId,
    ownerId: String(data.hostUserNo),
    ownerName: data.hostNickname,
    ownerTcId: '',
    memberCount: 0,
    myRole: 'owner',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * 내 그룹 목록 조회
 */
export const getMyGroups = async (_userId: string): Promise<Group[]> => {
  const response = await apiRequest<BackendGroupListItem[]>('/group/list');
  return response.resultData.map(mapGroupListItem);
};

/**
 * 그룹 상세 조회 (멤버 목록 포함)
 */
export const getGroupById = async (groupId: string, _userId: string): Promise<Group | null> => {
  try {
    const response = await apiRequest<{ members: BackendGroupMember[] }>(
      `/group/detail?claId=${groupId}`
    );
    // 그룹 상세는 멤버 목록만 반환하므로, 그룹 기본 정보는 목록에서 가져와야 함
    // 여기서는 멤버 수만 업데이트하는 용도로 사용
    const members = response.resultData.members || [];
    const activeMembers = members.filter(m => m.status === 'ACTIVE');

    // 목록에서 그룹 정보를 가져오기 위해 list API도 호출
    const listResponse = await apiRequest<BackendGroupListItem[]>('/group/list');
    const groupInfo = listResponse.resultData.find(g => g.claId === groupId);

    if (!groupInfo) return null;

    const group = mapGroupListItem(groupInfo);
    group.memberCount = activeMembers.length;

    return group;
  } catch {
    return null;
  }
};

/**
 * 그룹 수정
 */
export const updateGroup = async (
  groupId: string,
  input: UpdateGroupInput,
  _userId: string
): Promise<Group | null> => {
  try {
    const response = await apiRequest<BackendGroupUpdateResponse>('/group/update', {
      method: 'PUT',
      body: JSON.stringify({
        claId: groupId,
        groupNm: input.name,
        groupDesc: input.description,
        schoolName: input.schoolName,
      }),
    });

    const data = response.resultData;

    // 업데이트된 정보로 그룹 다시 조회
    const listResponse = await apiRequest<BackendGroupListItem[]>('/group/list');
    const groupInfo = listResponse.resultData.find(g => g.claId === groupId);

    if (!groupInfo) return null;

    return mapGroupListItem({
      ...groupInfo,
      groupNm: data.groupNm ?? groupInfo.groupNm,
      groupDesc: data.groupDesc ?? groupInfo.groupDesc,
      schoolName: data.schoolName ?? groupInfo.schoolName,
    });
  } catch {
    return null;
  }
};

/**
 * 그룹 삭제
 */
export const deleteGroup = async (groupId: string, _userId: string): Promise<boolean> => {
  try {
    await apiRequest<null>(`/group/delete?claId=${groupId}`, {
      method: 'DELETE',
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * 초대 코드로 그룹 조회
 */
export const getGroupByInviteCode = async (
  code: string,
  _userId?: string
): Promise<GroupInviteInfo | null> => {
  try {
    const response = await apiRequest<BackendInviteResponse>(
      `/group/invite?code=${code.toUpperCase()}`
    );
    const data = response.resultData;

    return {
      id: data.claId,
      name: data.groupNm,
      schoolLevel: '' as GroupInviteInfo['schoolLevel'],
      grade: 0,
      classNumber: 0,
      ownerName: '',
      memberCount: 0,
      alreadyJoined: false,
    };
  } catch {
    return null;
  }
};

// ============================================================
// 멤버 관리 API (실제 백엔드 연동)
// ============================================================

/**
 * 그룹 가입 (회원)
 */
export const joinGroup = async (
  _groupId: string,
  input: JoinGroupInput,
  _userId: string,
  _userName: string
): Promise<GroupMember> => {
  const response = await apiRequest<BackendJoinResponse>('/group/join', {
    method: 'POST',
    body: JSON.stringify({
      inviteCode: input.inviteCode,
    }),
  });

  const data = response.resultData;

  return {
    id: String(data.memberId),
    groupId: data.claId,
    userId: _userId,
    stdtId: '',
    name: _userName,
    studentNumber: input.studentNumber,
    memberType: 'member',
    status: 'active',
    joinedAt: new Date(),
  };
};

/**
 * 그룹 가입 (게스트)
 */
export const joinGroupAsGuest = async (
  _groupId: string,
  input: GuestJoinGroupInput
): Promise<GroupMember> => {
  const response = await apiRequest<BackendGuestJoinResponse>('/group/join-guest', {
    method: 'POST',
    body: JSON.stringify({
      inviteCode: input.inviteCode,
      nickname: input.name,
      gender: input.gender || 'M',
      email: input.email,
    }),
  });

  const data = response.resultData;

  // 게스트용 토큰 저장
  if (data.accessToken) {
    const { saveAuthTokens } = await import('@/shared/services/apiClient');
    saveAuthTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  }

  return {
    id: String(data.memberId),
    groupId: data.claId,
    userId: null,
    stdtId: data.stdtId,
    name: input.name,
    email: input.email,
    studentNumber: input.studentNumber,
    memberType: 'guest',
    status: 'active',
    joinedAt: new Date(),
  };
};

/**
 * 그룹 멤버 목록 조회
 */
export const getGroupMembers = async (
  groupId: string,
  _userId: string
): Promise<GroupMember[]> => {
  const response = await apiRequest<{ members: BackendGroupMember[] }>(
    `/group/detail?claId=${groupId}`
  );

  return (response.resultData.members || []).map(m => mapGroupMember(m, groupId));
};

/**
 * 멤버 강퇴
 */
export const kickMember = async (
  _groupId: string,
  memberId: string,
  _userId: string
): Promise<boolean> => {
  try {
    await apiRequest<null>('/group/member/kick', {
      method: 'POST',
      body: JSON.stringify({ memberId: Number(memberId) }),
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * 그룹 탈퇴
 */
export const leaveGroup = async (groupId: string, _userId: string): Promise<boolean> => {
  // 내 memberId를 먼저 조회해야 함
  try {
    const members = await getGroupMembers(groupId, _userId);
    const myMember = members.find(m => m.userId === _userId && m.status === 'active');

    if (!myMember) return false;

    await apiRequest<null>('/group/member/leave', {
      method: 'POST',
      body: JSON.stringify({ memberId: Number(myMember.id) }),
    });
    return true;
  } catch {
    return false;
  }
};

// ============================================================
// 이메일 초대 API (Mock - ❌ 백엔드 미구현)
// ============================================================

/**
 * 이메일로 멤버 초대 (Mock)
 */
export const sendEmailInvitation = async (
  input: SendEmailInvitationInput,
  userId: string
): Promise<EmailInvitation> => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const newInvitation: EmailInvitation = {
    id: generateId(),
    groupId: input.groupId,
    email: input.email,
    invitedBy: userId,
    status: 'sent',
    sentAt: now,
    expiresAt,
  };

  mockInvitations.push(newInvitation);
  saveInvitations();

  return newInvitation;
};

/**
 * 그룹의 이메일 초대 목록 조회 (Mock)
 */
export const getGroupInvitations = async (
  groupId: string,
  _userId: string
): Promise<EmailInvitation[]> => {
  return mockInvitations
    .filter((inv) => inv.groupId === groupId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
};

/**
 * 이메일 초대 취소 (Mock)
 */
export const cancelEmailInvitation = async (
  invitationId: string,
  _userId: string
): Promise<boolean> => {
  mockInvitations = mockInvitations.filter((inv) => inv.id !== invitationId);
  saveInvitations();
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
// 게스트 전환 API (실제 백엔드 연동)
// ============================================================

/** 백엔드 게스트 기록 응답 */
interface BackendGuestRecord {
  memberId: number;
  claId: string;
  stdtId: string;
  nickname: string;
  gender: string;
  email: string;
  groupNm: string;
  grade: string;
  joinedAt: string;
}

/** 백엔드 게스트 전환 응답 */
interface BackendGuestConvertResponse {
  userNo: number;
  email: string;
  stdtId: string;
  mergedCount: number;
}

/**
 * 게스트 기록 조회 (회원가입 시)
 */
export const getGuestRecords = async (email: string): Promise<GuestRecord[]> => {
  try {
    const response = await apiRequest<BackendGuestRecord[]>(
      `/guest/check?email=${encodeURIComponent(email)}`
    );

    return response.resultData.map((record) => ({
      guestId: String(record.memberId),
      email: record.email,
      groupName: record.groupNm,
      examResults: [],
    }));
  } catch {
    return [];
  }
};

/**
 * 게스트 기록 연동
 */
export const linkGuestRecords = async (
  guestIds: string[],
  _userId: string,
  _userName: string
): Promise<boolean> => {
  try {
    // 각 게스트에 대해 전환 API 호출
    for (const guestId of guestIds) {
      await apiRequest<BackendGuestConvertResponse>('/guest/convert', {
        method: 'POST',
        body: JSON.stringify({
          memberId: Number(guestId),
          mergeYn: 'Y',
        }),
      });
    }
    return true;
  } catch {
    return false;
  }
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

  // 이메일 초대 (Mock)
  sendEmailInvitation,
  getGroupInvitations,
  cancelEmailInvitation,
  generateInviteLink,

  // 게스트 전환
  getGuestRecords,
  linkGuestRecords,
};

export default groupService;
