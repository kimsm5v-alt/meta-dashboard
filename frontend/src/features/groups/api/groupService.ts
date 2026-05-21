/**
 * 그룹 관리 서비스 — 백엔드 API 연동
 */

import { apiClient } from '@shared/api';
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
  SchoolLevelCode,
} from '@shared/types';

// ============================================================
// 백엔드 응답 전용 타입 (내부 사용)
// ============================================================

/** GET /group/list 응답 배열 항목 */
interface BackendGroupListItem {
  claId: string;
  groupNm: string;
  schoolLevel: SchoolLevelCode;
  grade: string;
  classNumber: number;
  schoolName?: string;
  inviteCode: string;
  myRole: 'HOST' | 'STUDENT';
  memberCount: number;
  createdAt: string;
}

/** GET /group/detail 응답의 groupInfo 필드 (SQL 쿼리 반환값) */
interface BackendGroupInfo {
  groupId: number;
  claId: string;
  hostUserNo: number;
  groupNm: string;
  groupDesc?: string;
  schoolLevel: SchoolLevelCode;
  grade: string;
  classNumber: number;
  schoolName?: string;
  inviteCode: string;
  createdAt: string;
  hostNickname: string;
  myRole?: 'HOST' | 'STUDENT';
}

/** GET /group/detail 응답의 memberList 배열 항목 */
interface BackendGroupMember {
  id: number;
  userNo: number | null;
  stdtId: string;
  nickname: string;
  gender?: string;
  email?: string;
  memberNo?: number;
  memberType: 'STUDENT' | 'GUEST';
  status: 'ACTIVE' | 'LEFT' | 'KICKED' | 'ARCHIVED';
  joinedAt?: string;
  leftAt?: string;
}

interface BackendGroupDetail {
  groupInfo: BackendGroupInfo;
  memberList: BackendGroupMember[];
  page: { page: number; size: number; totalElements: number; totalPages: number };
}

/** POST /group/create 응답 */
interface BackendCreateGroupResult {
  groupId: number;
  claId: string;
  groupNm: string;
  inviteCode: string;
  hostUserNo: number;
  hostNickname: string;
}

/** GET /group/invite?code= 응답 */
interface BackendInviteInfo {
  groupId: number;
  claId: string;
  groupNm: string;
  inviteCode: string;
}

interface BackendEmailInvitation {
  id: number;
  groupId: number;
  email: string;
  status: 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  sentAt: string;
  expiresAt?: string;
}

// ============================================================
// 타입 변환 함수
// ============================================================

const toFrontendGroup = (item: BackendGroupListItem): Group => ({
  id: item.claId,
  claId: item.claId,
  name: item.groupNm,
  schoolLevel: item.schoolLevel,
  grade: parseInt(item.grade, 10),
  classNumber: item.classNumber,
  schoolName: item.schoolName,
  inviteCode: item.inviteCode,
  ownerId: '',
  ownerName: '',
  memberCount: item.memberCount,
  myRole: item.myRole === 'HOST' ? 'owner' : 'member',
  createdAt: new Date(item.createdAt),
});

const toFrontendGroupFromDetail = (info: BackendGroupInfo): Group => ({
  id: info.claId,
  claId: info.claId,
  name: info.groupNm,
  schoolLevel: info.schoolLevel,
  grade: parseInt(info.grade, 10),
  classNumber: info.classNumber,
  description: info.groupDesc,
  schoolName: info.schoolName,
  inviteCode: info.inviteCode,
  ownerId: String(info.hostUserNo),
  ownerName: info.hostNickname,
  memberCount: 0,
  myRole: info.myRole === 'HOST' ? 'owner' : 'member',
  createdAt: new Date(info.createdAt),
});

const toFrontendMember = (m: BackendGroupMember): GroupMember => ({
  id: String(m.id),
  groupId: '',
  userId: m.userNo != null ? String(m.userNo) : null,
  stdtId: m.stdtId,
  name: m.nickname,
  email: m.email,
  gender: m.gender === 'M' || m.gender === 'F' ? m.gender : undefined,
  memberNo: m.memberNo,
  memberType: m.memberType === 'GUEST' ? 'guest' : 'member',
  status: (() => {
    switch (m.status) {
      case 'ACTIVE':
        return 'active';
      case 'LEFT':
        return 'left';
      case 'KICKED':
        return 'kicked';
      case 'ARCHIVED':
        return 'archived';
    }
  })(),
  joinedAt: m.joinedAt ? new Date(m.joinedAt) : new Date(),
  leftAt: m.leftAt ? new Date(m.leftAt) : undefined,
});

// ============================================================
// 그룹 CRUD API
// ============================================================

/**
 * 그룹 생성
 */
export const createGroup = async (
  input: CreateGroupInput,
  _userId: string,
  _userName: string,
): Promise<Group> => {
  const res = await apiClient.post<BackendCreateGroupResult>('/group/create', {
    groupNm: input.name,
    schoolLevel: input.schoolLevel,
    grade: String(input.grade),
    classNumber: input.classNumber,
    schoolName: input.schoolName,
    groupDesc: input.description,
  });

  const data = res.resultData;

  return {
    id: data.claId,
    claId: data.claId,
    name: data.groupNm,
    schoolLevel: input.schoolLevel,
    grade: input.grade,
    classNumber: input.classNumber,
    schoolName: input.schoolName,
    inviteCode: data.inviteCode,
    ownerId: String(data.hostUserNo),
    ownerName: data.hostNickname,
    memberCount: 0,
    myRole: 'owner',
    createdAt: new Date(),
  };
};

/**
 * 내 그룹 목록 조회
 * @param includeInactive true면 탈퇴/방출된 그룹도 포함
 */
export const getMyGroups = async (
  _userId: string,
  includeInactive = false,
): Promise<Group[]> => {
  const url = includeInactive ? '/group/list?includeInactive=true' : '/group/list';
  const res = await apiClient.get<BackendGroupListItem[]>(url);
  return (res.resultData ?? []).map(toFrontendGroup);
};

/**
 * 그룹 상세 (그룹 정보 + 멤버 목록 한 번에) — API 1회 호출
 */
export const getGroupDetail = async (
  groupId: string,
  userId: string,
): Promise<{ group: Group; members: GroupMember[] } | null> => {
  const res = await apiClient.get<BackendGroupDetail>(
    `/group/detail?claId=${groupId}&page=0&size=200`,
  );
  if (!res.resultData) return null;

  const group = toFrontendGroupFromDetail(res.resultData.groupInfo);
  // myRole이 백엔드 응답에 없을 경우 hostUserNo와 현재 userId로 직접 판단
  if (!res.resultData.groupInfo.myRole) {
    const hostUserNo = res.resultData.groupInfo.hostUserNo;
    group.myRole = String(hostUserNo) === String(userId) ? 'owner' : 'member';
  }

  return {
    group,
    members: (res.resultData.memberList ?? []).map(toFrontendMember),
  };
};

/**
 * 그룹 상세 조회 (그룹 정보만)
 */
export const getGroupById = async (groupId: string, userId: string): Promise<Group | null> => {
  const result = await getGroupDetail(groupId, userId);
  return result?.group ?? null;
};

/**
 * 그룹 수정
 */
export const updateGroup = async (
  groupId: string,
  input: UpdateGroupInput,
  _userId: string,
): Promise<Group | null> => {
  await apiClient.put('/group/update', {
    claId: groupId,
    groupNm: input.name,
    groupDesc: input.description,
    schoolName: input.schoolName,
  });

  return getGroupById(groupId, _userId);
};

/**
 * 그룹 삭제
 */
export const deleteGroup = async (groupId: string, _userId: string): Promise<boolean> => {
  await apiClient.delete(`/group/delete?claId=${groupId}`);
  return true;
};

/**
 * 초대 코드로 그룹 조회 (인증 필요 - 레거시)
 * @deprecated 비회원 사용자는 getGuestGroupInfo 사용 권장
 */
export const getGroupByInviteCode = async (
  code: string,
  _userId?: string,
): Promise<GroupInviteInfo | null> => {
  const res = await apiClient.get<BackendInviteInfo>(`/group/invite?code=${code}`);
  if (!res.resultData) return null;

  const data = res.resultData;
  return {
    groupId: String(data.groupId),
    claId: data.claId,
    name: data.groupNm,
    inviteCode: data.inviteCode,
  };
};

/**
 * 게스트 그룹 정보 조회 (인증 불필요, Public API)
 * - 백엔드 spec: GET /guest/exists?inviteCode=xxx&email=xxx
 * - 게스트 프로세스 기반
 */
export interface GuestGroupInfoResponse {
  exists: boolean; // 해당 이메일로 이미 참가했는지 여부
  groupNm: string; // 그룹명
  claId: string; // 학급 ID
}

export const getGuestGroupInfo = async (
  inviteCode: string,
  email: string,
): Promise<GuestGroupInfoResponse | null> => {
  const res = await apiClient.get<GuestGroupInfoResponse>(
    `/guest/exists?inviteCode=${inviteCode}&email=${email}`,
  );
  if (!res.resultData) return null;
  return res.resultData;
};

// ============================================================
// 멤버 관리 API
// ============================================================

/**
 * 그룹 멤버 목록 조회
 */
export const getGroupMembers = async (groupId: string, userId: string): Promise<GroupMember[]> => {
  const result = await getGroupDetail(groupId, userId);
  return result?.members ?? [];
};

/**
 * 그룹 가입 (회원)
 */
export const joinGroup = async (
  input: JoinGroupInput,
  _userId: string,
  _userName: string,
): Promise<GroupMember> => {
  const res = await apiClient.post<{ claId: string; memberId: number; stdtId?: string }>(
    '/group/join',
    {
      inviteCode: input.inviteCode,
    },
  );

  const data = res.resultData;
  return {
    id: String(data.memberId),
    groupId: data.claId,
    userId: _userId,
    stdtId: data.stdtId ?? '',
    name: _userName,
    memberType: 'member',
    status: 'active',
    joinedAt: new Date(),
  };
};

/**
 * 그룹 가입 (게스트)
 */
export const joinGroupAsGuest = async (
  input: GuestJoinGroupInput,
): Promise<GroupMember & { accessToken: string; guestId?: string }> => {
  const res = await apiClient.post<{
    claId: string;
    stdtId: string;
    memberId: number;
    accessToken: string;
    guestId?: string;
  }>('/group/join-guest', {
    inviteCode: input.inviteCode,
    nickname: input.nickname,
    email: input.email,
    gender: input.gender,
  });

  const data = res.resultData;
  return {
    id: String(data.memberId),
    groupId: data.claId,
    userId: null,
    stdtId: data.stdtId,
    name: input.nickname,
    email: input.email,
    gender: input.gender,
    memberType: 'guest',
    status: 'active',
    joinedAt: new Date(),
    accessToken: data.accessToken,
    guestId: data.guestId,
  };
};

/**
 * 멤버 강퇴
 */
export const kickMember = async (
  _groupId: string,
  memberId: string,
  userId: string,
): Promise<boolean> => {
  await apiClient.post('/group/member/kick', {
    memberId: parseInt(memberId, 10),
    hostUserNo: parseInt(userId, 10),
  });
  return true;
};

/**
 * 그룹 탈퇴 — 본인 memberId를 detail API로 먼저 조회
 */
export const leaveGroup = async (groupId: string, userId: string): Promise<boolean> => {
  const members = await getGroupMembers(groupId, userId);
  console.log('Members for leaveGroup:', members, groupId, userId);
  const myMember = members.find((m) => m.userId === userId && m.status === 'active');
  if (!myMember) throw new Error('MEMBER_NOT_FOUND');

  await apiClient.post('/group/member/leave', { memberId: parseInt(myMember.id, 10) });
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
  _userId: string,
): Promise<EmailInvitation> => {
  const res = await apiClient.post<BackendEmailInvitation>('/group/invite/email', {
    claId: input.groupId,
    email: input.email,
  });

  const data = res.resultData;
  return {
    id: String(data.id),
    groupId: String(data.groupId),
    email: data.email,
    invitedBy: _userId,
    status: 'sent',
    sentAt: new Date(data.sentAt),
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 7 * 86400000),
  };
};

/**
 * 그룹의 이메일 초대 목록 조회
 */
export const getGroupInvitations = async (
  groupId: string,
  _userId: string,
): Promise<EmailInvitation[]> => {
  const res = await apiClient.get<BackendEmailInvitation[]>(`/group/invite/list?claId=${groupId}`);

  return (res.resultData ?? []).map((inv) => ({
    id: String(inv.id),
    groupId: String(inv.groupId),
    email: inv.email,
    invitedBy: '',
    status: (() => {
      switch (inv.status) {
        case 'SENT':
          return 'sent' as const;
        case 'ACCEPTED':
          return 'accepted' as const;
        case 'EXPIRED':
          return 'expired' as const;
        case 'CANCELLED':
          return 'cancelled' as const;
        default:
          return 'sent' as const;
      }
    })(),
    sentAt: new Date(inv.sentAt),
    expiresAt: inv.expiresAt ? new Date(inv.expiresAt) : new Date(),
  }));
};

/**
 * 이메일 초대 취소
 */
export const cancelEmailInvitation = async (
  invitationId: string,
  _userId: string,
): Promise<boolean> => {
  await apiClient.delete(`/group/invite/${invitationId}`);
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
// 게스트 전환 API (미구현 — 백엔드 엔드포인트 확인 필요)
// ============================================================

export const getGuestRecords = async (_email: string): Promise<GuestRecord[]> => {
  return [];
};

export const linkGuestRecords = async (
  _guestIds: string[],
  _userId: string,
  _userName: string,
): Promise<boolean> => {
  return true;
};

// ============================================================
// 내보내기
// ============================================================

export const groupService = {
  apiClient, // API 클라이언트 직접 접근용 (이메일 인증 등)
  createGroup,
  getMyGroups,
  getGroupDetail,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupByInviteCode,
  getGuestGroupInfo,
  joinGroup,
  joinGroupAsGuest,
  getGroupMembers,
  kickMember,
  leaveGroup,
  sendEmailInvitation,
  getGroupInvitations,
  cancelEmailInvitation,
  generateInviteLink,
  getGuestRecords,
  linkGuestRecords,
};

export default groupService;
