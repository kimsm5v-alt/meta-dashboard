import { useState, useMemo } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { GroupCard } from './GroupCard';
import { openMypageGroups } from '@shared/lib/mypage';
import type { GroupWithExamState } from '../types';

interface GroupListViewProps {
  groups: GroupWithExamState[];
  onSelectGroup: (groupId: string) => void;
}

export const GroupListView = ({
  groups,
  onSelectGroup,
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
      {/* 안내 문구 — 그룹 관리가 mypage(SSO)로 이관됨 (group-from-idp) */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>검사하기</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
          학급(그룹)을 만들고 학생을 초대하여 그룹별 검사 진행을 한 곳에서 관리해보세요.
        </p>
      </div>

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
        {/* 그룹 관리(생성/수정/삭제/초대)는 mypage(SSO)로 이관 — group-from-idp */}
        <button className="btn primary" onClick={() => openMypageGroups('list')} style={{ flexShrink: 0 }}>
          그룹 관리
          <ExternalLink size={15} />
        </button>
      </div>

      {/* 그리드 */}
      <div className="vj-grid">
        {filteredGroups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onSelect={onSelectGroup}
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
