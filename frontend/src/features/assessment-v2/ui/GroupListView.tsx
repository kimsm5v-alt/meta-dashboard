import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { GroupCard } from './GroupCard';
import type { GroupWithExamState } from '../types';

interface GroupListViewProps {
  groups: GroupWithExamState[];
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
  onEditGroup: (group: GroupWithExamState) => void;
  onDeleteGroup: (group: GroupWithExamState) => void;
}

export const GroupListView = ({
  groups,
  onSelectGroup,
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
}: GroupListViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return groups;
    const term = searchTerm.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        (g.schoolName && g.schoolName.toLowerCase().includes(term)),
    );
  }, [groups, searchTerm]);

  const showSearch = groups.length > 3;

  return (
    <div className="vj">
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {showSearch && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 10,
            }}
          >
            <Search size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="그룹명, 학교명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: 13,
                color: '#111827',
                outline: 'none',
              }}
            />
          </div>
        )}
        <button className="btn primary" onClick={onCreateGroup} style={{ flexShrink: 0 }}>
          <Plus size={15} />
          새 그룹
        </button>
      </div>

      {/* 그리드 */}
      <div className="vj-grid">
        {filteredGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onSelect={onSelectGroup}
            onEdit={onEditGroup}
            onDelete={onDeleteGroup}
          />
        ))}
      </div>

      {filteredGroups.length === 0 && searchTerm && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 13 }}>
          검색 결과가 없습니다
        </div>
      )}
    </div>
  );
};
