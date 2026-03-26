import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  QrCode,
  Settings,
  UserPlus,
  Crown,
  User,
  UserX,
  LogOut,
  Loader2,
  AlertCircle,
  Trash2,
  Mail,
  Copy,
  Check,
  Link2,
  Search,
  X,
} from 'lucide-react';
import { Card, Button, Modal } from '@/shared/components';
import { GroupInviteModal } from '../components';
import { groupService } from '../services/groupService';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { Group, GroupMember, GroupMemberType, GroupMemberStatus, SchoolLevelCode, EmailInvitation } from '@/shared/types';

/** 학교급 라벨 */
const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

/** 상대 시간 포맷 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 30) return `${diffDay}일 전`;
  if (diffMonth < 12) return `${diffMonth}개월 전`;
  return new Date(date).toLocaleDateString('ko-KR');
};

/** 멤버 상태 배지 */
const MemberStatusBadge: React.FC<{ type: GroupMemberType; status: GroupMemberStatus }> = ({
  type,
  status,
}) => {
  if (status === 'left') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        탈퇴
      </span>
    );
  }

  if (type === 'guest') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        게스트
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      회원
    </span>
  );
};

/** 스켈레톤 */
const DetailSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-200 rounded-lg" />
      <div>
        <div className="h-7 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-5 w-48 bg-gray-200 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <div className="h-16 bg-gray-100 rounded" />
        </Card>
      ))}
    </div>
    <Card>
      <div className="h-64 bg-gray-100 rounded" />
    </Card>
  </div>
);

export const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [invitations, setInvitations] = useState<EmailInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 검색/필터
  const [searchTerm, setSearchTerm] = useState('');

  // 이메일 초대
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // 링크 복사 상태
  const [copiedLink, setCopiedLink] = useState(false);

  // 모달 상태
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isKickModalOpen, setIsKickModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!groupId || !user) return;

      setIsLoading(true);
      try {
        const [groupData, membersData] = await Promise.all([
          groupService.getGroupById(groupId, user.id),
          groupService.getGroupMembers(groupId, user.id),
        ]);

        if (!groupData) {
          setError('그룹을 찾을 수 없거나 접근 권한이 없습니다.');
          return;
        }

        setGroup(groupData);
        setMembers(membersData);

        // 방장인 경우 초대 목록도 로드
        if (groupData.myRole === 'owner') {
          try {
            const invitationsData = await groupService.getGroupInvitations(groupId, user.id);
            setInvitations(invitationsData);
          } catch {
            // 초대 목록 로드 실패는 무시
          }
        }
      } catch (err) {
        // 401 인증 에러인 경우 로그인 페이지로 리다이렉트
        if (err instanceof Error && err.message.includes('401')) {
          navigate('/login');
          return;
        }
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [groupId, user, navigate]);

  // 멤버 강퇴
  const handleKickMember = async () => {
    if (!selectedMember || !groupId || !user) return;

    setIsProcessing(true);
    try {
      await groupService.kickMember(groupId, selectedMember.id, user.id);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id ? { ...m, status: 'left' as const, leftAt: new Date() } : m
        )
      );
      setIsKickModalOpen(false);
      setSelectedMember(null);
    } catch {
      // 에러 처리
    } finally {
      setIsProcessing(false);
    }
  };

  // 그룹 탈퇴
  const handleLeaveGroup = async () => {
    if (!groupId || !user) return;

    setIsProcessing(true);
    try {
      await groupService.leaveGroup(groupId, user.id);
      navigate('/groups');
    } catch {
      // 에러 처리
    } finally {
      setIsProcessing(false);
    }
  };

  // 그룹 삭제
  const handleDeleteGroup = async () => {
    if (!groupId || !user) return;

    setIsProcessing(true);
    try {
      await groupService.deleteGroup(groupId, user.id);
      navigate('/groups');
    } catch {
      // 에러 처리
    } finally {
      setIsProcessing(false);
    }
  };

  // 이메일 초대 발송
  const handleSendEmailInvite = async () => {
    if (!groupId || !user || !inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError('');
    setInviteSuccess(false);

    try {
      const invitation = await groupService.sendEmailInvitation(
        { groupId, email: inviteEmail.trim() },
        user.id
      );
      setInvitations((prev) => [invitation, ...prev]);
      setInviteEmail('');
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
      switch (errorMessage) {
        case 'INVALID_EMAIL':
          setInviteError('올바른 이메일 형식이 아닙니다.');
          break;
        case 'ALREADY_MEMBER':
          setInviteError('이미 그룹에 가입된 이메일입니다.');
          break;
        case 'ALREADY_INVITED':
          setInviteError('이미 초대 대기 중인 이메일입니다.');
          break;
        default:
          setInviteError('초대 발송에 실패했습니다.');
      }
    } finally {
      setIsInviting(false);
    }
  };

  // 초대 취소
  const handleCancelInvitation = async (invitationId: string) => {
    if (!user) return;

    try {
      await groupService.cancelEmailInvitation(invitationId, user.id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch {
      // 에러 처리
    }
  };

  // 초대 링크 복사
  const handleCopyInviteLink = async () => {
    if (!group) return;

    const link = groupService.generateInviteLink(group.inviteCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // 클립보드 API 실패 시 fallback
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isOwner = group?.myRole === 'owner';
  const activeMembers = members.filter((m) => m.status === 'active');
  const leftMembers = members.filter((m) => m.status === 'left');

  // 검색 필터링
  const filteredMembers = activeMembers.filter((m) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(searchLower) ||
      (m.email && m.email.toLowerCase().includes(searchLower))
    );
  });

  // 대기 중인 초대
  const pendingInvitations = invitations.filter(
    (inv) => (inv.status === 'pending' || inv.status === 'sent') && new Date(inv.expiresAt) > new Date()
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">오류 발생</h2>
        <p className="text-gray-500 mb-6">{error || '그룹을 찾을 수 없습니다.'}</p>
        <Button onClick={() => navigate('/groups')}>그룹 목록으로</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              {isOwner ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <Crown className="w-3 h-3" />
                  방장
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  <User className="w-3 h-3" />
                  참가자
                </span>
              )}
            </div>
            <p className="text-gray-500">
              {SCHOOL_LEVEL_LABELS[group.schoolLevel]} {group.grade}학년 {group.classNumber}반
              {group.description && ` · ${group.description}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <>
              <Button variant="secondary" onClick={() => setIsInviteModalOpen(true)}>
                <QrCode className="w-4 h-4 mr-2" />
                초대 코드
              </Button>
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsLeaveModalOpen(true)}>
              <LogOut className="w-4 h-4 mr-2" />
              탈퇴
            </Button>
          )}
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체 멤버</p>
              <p className="text-xl font-semibold">{activeMembers.length}명</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">초대 코드</p>
              <p className="text-xl font-semibold font-mono">{group.inviteCode}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">방장</p>
              <p className="text-xl font-semibold">{group.ownerName}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 방장 전용: 이메일 초대 섹션 */}
      {isOwner && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">멤버 초대</h2>

          {/* 이메일 초대 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              이메일로 초대
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="email"
                  placeholder="이메일 주소 입력"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendEmailInvite();
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    inviteError ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                {inviteSuccess && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              <Button onClick={handleSendEmailInvite} disabled={isInviting || !inviteEmail.trim()}>
                {isInviting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '초대'
                )}
              </Button>
            </div>
            {inviteError && <p className="mt-1 text-sm text-red-500">{inviteError}</p>}
            {inviteSuccess && <p className="mt-1 text-sm text-green-600">초대가 발송되었습니다.</p>}
          </div>

          {/* 초대 링크 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link2 className="w-4 h-4 inline mr-1" />
              초대 링크
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={group ? groupService.generateInviteLink(group.inviteCode) : ''}
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600"
              />
              <Button variant="secondary" onClick={handleCopyInviteLink}>
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    링크 복사
                  </>
                )}
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              이 링크를 공유하면 회원 또는 게스트로 그룹에 참가할 수 있습니다.
            </p>
          </div>

          {/* 대기 중인 초대 목록 */}
          {pendingInvitations.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                대기 중인 초대 ({pendingInvitations.length})
              </label>
              <div className="space-y-2">
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{inv.email}</span>
                      <span className="text-xs text-gray-400">{formatRelativeTime(inv.sentAt)}</span>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="초대 취소"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 멤버 목록 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">멤버 목록</h2>
          {isOwner && (
            <Button size="sm" onClick={() => setIsInviteModalOpen(true)}>
              <QrCode className="w-4 h-4 mr-2" />
              QR 코드
            </Button>
          )}
        </div>

        {/* 검색 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="이름 또는 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            {searchTerm ? (
              <p className="text-gray-500">"{searchTerm}"에 대한 검색 결과가 없습니다.</p>
            ) : (
              <>
                <p className="text-gray-500 mb-4">아직 멤버가 없습니다.</p>
                {isOwner && (
                  <Button onClick={() => setIsInviteModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    첫 멤버 초대하기
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    가입일
                  </th>
                  {isOwner && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                      관리
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {member.studentNumber ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {member.email || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <MemberStatusBadge type={member.memberType} status={member.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatRelativeTime(member.joinedAt)}
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setIsKickModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="멤버 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 탈퇴 멤버 (방장만 볼 수 있음) */}
        {isOwner && leftMembers.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">탈퇴한 멤버</h3>
            <div className="space-y-2">
              {leftMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm"
                >
                  <span className="text-gray-500">{member.name}</span>
                  <span className="text-xs text-gray-400">
                    {member.leftAt && new Date(member.leftAt).toLocaleDateString('ko-KR')} 탈퇴
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 초대 모달 */}
      <GroupInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        group={{
          id: group.id,
          name: group.name,
          grade: group.grade,
          classNumber: group.classNumber,
          inviteCode: group.inviteCode,
          studentCount: activeMembers.length,
        }}
      />

      {/* 강퇴 확인 모달 */}
      <Modal
        isOpen={isKickModalOpen}
        onClose={() => {
          setIsKickModalOpen(false);
          setSelectedMember(null);
        }}
        title="멤버 강퇴"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <UserX className="w-8 h-8 text-red-500" />
            <div>
              <p className="font-medium text-gray-900">{selectedMember?.name}</p>
              <p className="text-sm text-gray-500">이 멤버를 그룹에서 강퇴하시겠습니까?</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            강퇴된 멤버는 그룹에서 제외되지만, 기존 검사 기록은 유지됩니다.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsKickModalOpen(false);
                setSelectedMember(null);
              }}
              className="flex-1"
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button
              onClick={handleKickMember}
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '강퇴하기'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 탈퇴 확인 모달 */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title="그룹 탈퇴"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
            <LogOut className="w-8 h-8 text-amber-500" />
            <div>
              <p className="font-medium text-gray-900">{group.name}</p>
              <p className="text-sm text-gray-500">이 그룹에서 탈퇴하시겠습니까?</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            탈퇴해도 기존 검사 기록은 유지됩니다. 다시 가입하려면 초대 코드가 필요합니다.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsLeaveModalOpen(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button
              onClick={handleLeaveGroup}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '탈퇴하기'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 그룹 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="그룹 설정"
        size="sm"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">그룹 삭제</h3>
            <p className="text-sm text-gray-500 mb-4">
              그룹을 삭제하면 모든 멤버가 그룹에서 제외됩니다.
              검사 데이터가 있는 경우 데이터는 보관됩니다.
            </p>
            <Button
              onClick={handleDeleteGroup}
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              그룹 삭제
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
