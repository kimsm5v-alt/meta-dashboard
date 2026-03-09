import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, QrCode, Crown, User, LogIn } from 'lucide-react';
import { Card, Button } from '@/shared/components';
import { CreateGroupModal, GroupInviteModal, JoinCodeModal } from '../components';
import { groupService } from '../services/groupService';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { Group, GroupRole, SchoolLevelCode } from '@/shared/types';
import type { GroupFormData } from '../components/CreateGroupModal';

/** 학교급 라벨 */
const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

/** 역할 배지 컴포넌트 */
const RoleBadge: React.FC<{ role: GroupRole }> = ({ role }) => {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <Crown className="w-3 h-3" />
        방장
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      <User className="w-3 h-3" />
      참가자
    </span>
  );
};

/** 온보딩 화면 (그룹 없는 사용자) */
const OnboardingView: React.FC<{
  onCreateClick: () => void;
  onJoinClick: () => void;
}> = ({ onCreateClick, onJoinClick }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-6">
          <Users className="w-10 h-10 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">학습심리정서검사 시작하기</h1>
        <p className="text-gray-500">그룹을 만들거나 참가하여 검사를 시작하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* 그룹 만들기 */}
        <Card hoverable onClick={onCreateClick} className="cursor-pointer">
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <Crown className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">그룹 만들기</h3>
            <p className="text-sm text-gray-500 mb-4">
              학급을 만들고 학생들을 초대하세요.<br />
              검사를 생성하고 결과를 확인할 수 있습니다.
            </p>
            <Button className="w-full justify-center">
              <Plus className="w-4 h-4 mr-2" />
              시작하기
            </Button>
          </div>
        </Card>

        {/* 그룹 참가 */}
        <Card hoverable onClick={onJoinClick} className="cursor-pointer">
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">그룹 참가</h3>
            <p className="text-sm text-gray-500 mb-4">
              초대 코드로 그룹에 가입하세요.<br />
              선생님이 시작한 검사에 참여할 수 있습니다.
            </p>
            <Button variant="secondary" className="w-full justify-center">
              <QrCode className="w-4 h-4 mr-2" />
              참가하기
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

/** 그룹 카드 스켈레톤 */
const GroupCardSkeleton: React.FC = () => (
  <Card>
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
          <div>
            <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-6 w-14 bg-gray-200 rounded-full" />
      </div>
      <div className="h-4 w-32 bg-gray-200 rounded" />
    </div>
  </Card>
);

export const GroupListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // 그룹 목록 로드
  useEffect(() => {
    const loadGroups = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const data = await groupService.getMyGroups(user.id);
        setGroups(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [user]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = async (data: GroupFormData) => {
    if (!user) return;

    try {
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

      // 생성 후 그룹 상세 화면으로 이동
      navigate(`/groups/${newGroup.id}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create group:', error);
    }
  };

  const handleOpenInviteModal = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setIsInviteModalOpen(true);
  };

  const handleJoinSuccess = (groupId: string) => {
    // 가입 성공 시 그룹 목록 새로고침
    if (user) {
      groupService.getMyGroups(user.id).then(setGroups);
    }
    navigate(`/groups/${groupId}`);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">그룹 관리</h1>
            <p className="text-gray-500 mt-1">학급(그룹)을 생성하고 학생을 초대하세요</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // 그룹이 없으면 온보딩 화면
  if (groups.length === 0) {
    return (
      <>
        <OnboardingView
          onCreateClick={() => setIsCreateModalOpen(true)}
          onJoinClick={() => setIsJoinCodeModalOpen(true)}
        />

        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateGroup}
        />

        <JoinCodeModal
          isOpen={isJoinCodeModalOpen}
          onClose={() => setIsJoinCodeModalOpen(false)}
          onJoinSuccess={handleJoinSuccess}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">그룹 관리</h1>
          <p className="text-gray-500 mt-1">학급(그룹)을 생성하고 학생을 초대하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsJoinCodeModalOpen(true)}>
            <LogIn className="w-4 h-4 mr-2" />
            그룹 참가
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            그룹 생성
          </Button>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="그룹 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* 그룹 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => (
          <Card key={group.id} hoverable onClick={() => navigate(`/groups/${group.id}`)}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-500">
                    {SCHOOL_LEVEL_LABELS[group.schoolLevel]} {group.grade}학년
                  </p>
                </div>
              </div>
              <RoleBadge role={group.myRole} />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  멤버 <span className="font-semibold text-gray-900">{group.memberCount}명</span>
                </span>
                {group.myRole === 'owner' && (
                  <span className="text-xs font-mono text-gray-400">{group.inviteCode}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {group.myRole === 'owner' && (
                  <button
                    onClick={(e) => handleOpenInviteModal(group, e)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="초대 코드"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  상세보기
                </span>
              </div>
            </div>

            {/* 멤버가 아닌 경우 방장 이름 표시 */}
            {group.myRole === 'member' && group.ownerName && (
              <p className="text-xs text-gray-400 mt-2">방장: {group.ownerName}</p>
            )}
          </Card>
        ))}

        {/* 검색 결과 없음 */}
        {filteredGroups.length === 0 && searchTerm && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">"{searchTerm}"에 대한 검색 결과가 없습니다</p>
          </div>
        )}
      </div>

      {/* 모달 */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGroup}
      />

      {selectedGroup && (
        <GroupInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          group={{
            id: selectedGroup.id,
            name: selectedGroup.name,
            grade: selectedGroup.grade,
            classNumber: selectedGroup.classNumber,
            inviteCode: selectedGroup.inviteCode,
            studentCount: selectedGroup.memberCount,
          }}
        />
      )}

      <JoinCodeModal
        isOpen={isJoinCodeModalOpen}
        onClose={() => setIsJoinCodeModalOpen(false)}
        onJoinSuccess={handleJoinSuccess}
      />
    </div>
  );
};
