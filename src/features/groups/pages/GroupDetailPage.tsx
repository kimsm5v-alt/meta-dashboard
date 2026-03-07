import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, QrCode, Settings, UserPlus } from 'lucide-react';
import { Card, Button } from '@/shared/components';
import { GroupInviteModal, type Group } from '../components';

export const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // 임시 Mock 데이터
  const group: Group & { description: string; students: Array<{ id: string; name: string; number: number; joinedAt: string }> } = {
    id: groupId || '1',
    name: '6학년 2반',
    grade: 6,
    classNumber: 2,
    description: '2024학년도 6학년 2반',
    inviteCode: 'ABC123',
    studentCount: 3,
    students: [
      { id: '1', name: '김민준', number: 1, joinedAt: '2024-03-01' },
      { id: '2', name: '이서연', number: 2, joinedAt: '2024-03-01' },
      { id: '3', name: '박지호', number: 3, joinedAt: '2024-03-02' },
    ],
  };

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
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-500">{group.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsInviteModalOpen(true)}>
            <QrCode className="w-4 h-4 mr-2" />
            초대 코드
          </Button>
          <Button variant="secondary">
            <Settings className="w-4 h-4 mr-2" />
            설정
          </Button>
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
              <p className="text-sm text-gray-500">전체 학생</p>
              <p className="text-xl font-semibold">{group.students.length}명</p>
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
              <UserPlus className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">초대 링크</p>
              <button className="text-sm text-primary-600 hover:underline">
                링크 복사
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* 학생 목록 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">학생 목록</h2>
          <Button size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            학생 추가
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">번호</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">이름</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">가입일</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {group.students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{student.number}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{student.joinedAt}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sm text-red-600 hover:text-red-700">
                      제외
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 초대 모달 */}
      <GroupInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        group={group}
      />
    </div>
  );
};
