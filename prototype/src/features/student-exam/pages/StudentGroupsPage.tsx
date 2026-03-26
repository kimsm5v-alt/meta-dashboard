/**
 * 학생용 그룹 목록 페이지
 *
 * 학생이 자신이 가입한 그룹 목록을 보고, 새로운 그룹에 초대코드로 참여할 수 있는 페이지
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, RefreshCw, UserPlus, Trash2, LogOut, AlertCircle } from 'lucide-react';
import { Button, Card } from '@/shared/components';
import { useAuth } from '@/features/auth/context/AuthContext';
import { groupService } from '@/features/groups/services/groupService';
import type { Group } from '@/shared/types';

/** 학교급 영문 → 한글 변환 */
const getSchoolLevelLabel = (level: string | undefined): string => {
  if (!level) return '';
  switch (level.toLowerCase()) {
    case 'elementary':
      return '초등학교';
    case 'middle':
      return '중학교';
    case 'high':
      return '고등학교';
    default:
      return level;
  }
};

export const StudentGroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // 그룹 목록 로드
  const loadGroups = async (showRefreshIndicator = false) => {
    if (!user?.id) return;

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await groupService.getMyGroups(user.id);
      // 학생은 member인 그룹만 표시 (owner 제외)
      setGroups(data.filter(g => g.myRole === 'member'));
    } catch (error) {
      console.error('[StudentGroupsPage] 그룹 목록 로드 실패:', error);
      setGroups([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user]);

  // 새로고침
  const handleRefresh = () => {
    loadGroups(true);
  };

  // 초대코드로 가입
  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      setJoinError('초대 코드를 입력해주세요.');
      return;
    }

    if (!user?.id || !user?.name) {
      setJoinError('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    try {
      // 초대 코드로 그룹 조회
      const groupInfo = await groupService.getGroupByInviteCode(inviteCode.trim().toUpperCase());

      if (!groupInfo) {
        setJoinError('유효하지 않은 초대 코드입니다.');
        return;
      }

      if (groupInfo.alreadyJoined) {
        setJoinError('이미 가입한 그룹입니다.');
        return;
      }

      // 그룹 가입
      await groupService.joinGroup(
        groupInfo.id,
        { inviteCode: inviteCode.trim().toUpperCase() },
        user.id,
        user.name
      );

      // 성공 - 모달 닫고 목록 새로고침
      setShowJoinModal(false);
      setInviteCode('');
      loadGroups(true);
    } catch (error) {
      console.error('[StudentGroupsPage] 그룹 가입 실패:', error);
      setJoinError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsJoining(false);
    }
  };

  // 그룹 탈퇴
  const handleLeaveGroup = async (group: Group) => {
    if (!user?.id) return;

    const confirmed = window.confirm(`"${group.name}" 그룹을 탈퇴하시겠습니까?`);
    if (!confirmed) return;

    try {
      await groupService.leaveGroup(group.id, user.id);
      loadGroups(true);
    } catch (error) {
      console.error('[StudentGroupsPage] 그룹 탈퇴 실패:', error);
      alert('그룹 탈퇴에 실패했습니다.');
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">나의 그룹</h1>
            <p className="text-gray-500 mt-1">가입한 그룹을 확인하세요</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">나의 그룹</h1>
            <p className="text-gray-500 mt-0.5">가입한 그룹을 확인하세요</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-gray-500"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button onClick={() => setShowJoinModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            그룹 가입
          </Button>
        </div>
      </div>

      {/* 그룹 목록 */}
      {groups.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">가입한 그룹이 없습니다</h3>
          <p className="text-gray-500 mb-6">
            초대 코드를 입력하여 그룹에 참여하세요
          </p>
          <Button onClick={() => setShowJoinModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            그룹 가입하기
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {group.schoolName && `${group.schoolName} • `}
                      {getSchoolLevelLabel(group.schoolLevel)} {group.grade}학년 {group.classNumber}반
                    </p>
                  </div>
                </div>
              </div>

              {group.description && (
                <p className="text-sm text-gray-600 mb-4">{group.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>멤버 {group.memberCount}명</span>
                  <span>초대코드: {group.inviteCode}</span>
                </div>
                <button
                  onClick={() => handleLeaveGroup(group)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="그룹 탈퇴"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 그룹 가입 모달 */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">그룹 가입</h2>
                <p className="text-sm text-gray-500">초대 코드를 입력하세요</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  초대 코드
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                  placeholder="예: ABC123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                  maxLength={10}
                  autoFocus
                />
              </div>

              {joinError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{joinError}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  선생님이 공유한 초대 코드를 입력하면 그룹에 참여할 수 있습니다.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowJoinModal(false);
                    setInviteCode('');
                    setJoinError('');
                  }}
                  className="flex-1"
                  disabled={isJoining}
                >
                  취소
                </Button>
                <Button
                  onClick={handleJoinGroup}
                  className="flex-1"
                  disabled={isJoining || !inviteCode.trim()}
                >
                  {isJoining ? '가입 중...' : '가입하기'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
