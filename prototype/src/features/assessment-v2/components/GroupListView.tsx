/**
 * 그룹 리스트 화면 - 그룹이 1개 이상일 때 표시
 */

import { useState, useMemo } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { GroupCard } from './GroupCard';
import type { GroupWithExamState } from '../types';

interface GroupListViewProps {
  groups: GroupWithExamState[];
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
}

export const GroupListView: React.FC<GroupListViewProps> = ({
  groups,
  onSelectGroup,
  onCreateGroup,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 검색 필터링
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups;
    const term = searchTerm.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.inviteCode.toLowerCase().includes(term)
    );
  }, [groups, searchTerm]);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">검사하기</h1>
          <p className="mt-1 text-sm text-gray-500">
            학급(그룹)을 만들고 학생을 초대하여 그룹별 검사 진행을 한 곳에서 관리해보세요.
          </p>
        </div>
        <button
          onClick={onCreateGroup}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
        >
          그룹 관리
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* 검색 바 */}
      {groups.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="그룹 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      )}

      {/* 그룹 카드 그리드 (vj-grid) */}
      {filteredGroups.length > 0 ? (
        <div className="vj-grid">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onSelect={onSelectGroup}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? (
            <p>"{searchTerm}"에 해당하는 그룹이 없습니다.</p>
          ) : (
            <p>표시할 그룹이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupListView;
