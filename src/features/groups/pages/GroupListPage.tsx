import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, QrCode } from 'lucide-react';
import { Card, Button } from '@/shared/components';
import { CreateGroupModal, GroupInviteModal, type GroupFormData, type Group } from '../components';

// 임시 Mock 데이터
const initialMockGroups: Group[] = [
  { id: '1', name: '6학년 2반', grade: 6, classNumber: 2, studentCount: 28, inviteCode: 'ABC123' },
  { id: '2', name: '6학년 3반', grade: 6, classNumber: 3, studentCount: 25, inviteCode: 'DEF456' },
];

// 랜덤 초대 코드 생성
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const GroupListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState<Group[]>(initialMockGroups);

  // 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = (data: GroupFormData) => {
    const newGroup: Group = {
      id: String(Date.now()),
      name: data.name,
      grade: data.grade,
      classNumber: data.classNumber,
      studentCount: 0,
      inviteCode: generateInviteCode(),
    };
    setGroups([...groups, newGroup]);

    // 생성 후 초대 모달 자동 오픈
    setSelectedGroup(newGroup);
    setIsInviteModalOpen(true);
  };

  const handleOpenInviteModal = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setIsInviteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">그룹 관리</h1>
          <p className="text-gray-500 mt-1">학급(그룹)을 생성하고 학생을 초대하세요</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          그룹 생성
        </Button>
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
          <Card
            key={group.id}
            hoverable
            onClick={() => navigate(`/groups/${group.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.grade}학년</p>
                </div>
              </div>
              <button
                onClick={(e) => handleOpenInviteModal(group, e)}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="초대 코드"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  학생 <span className="font-semibold text-gray-900">{group.studentCount}명</span>
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {group.inviteCode}
                </span>
              </div>
              <span className="text-primary-600 hover:text-primary-700 font-medium">
                상세보기
              </span>
            </div>
          </Card>
        ))}

        {/* 빈 상태 */}
        {filteredGroups.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm ? '검색 결과가 없습니다' : '생성된 그룹이 없습니다'}
            </p>
            {!searchTerm && (
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                첫 그룹 만들기
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 모달 */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGroup}
      />

      <GroupInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        group={selectedGroup}
      />
    </div>
  );
};
