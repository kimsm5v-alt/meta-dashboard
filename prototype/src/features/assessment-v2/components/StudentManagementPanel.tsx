/**
 * 학생 관리 패널 - 그룹 상세 화면 우측
 */

import { useState, useMemo } from 'react';
import { Search, Mail, X, Plus, Users } from 'lucide-react';
import type { GroupMember } from '../types';

interface StudentManagementPanelProps {
  members: GroupMember[];
  isOwner: boolean;
  onInvite: (email: string) => void;
  onKick: (memberId: string) => void;
}

export const StudentManagementPanel: React.FC<StudentManagementPanelProps> = ({
  members,
  isOwner,
  onInvite,
  onKick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // 활성 멤버만 필터링
  const activeMembers = useMemo(() => {
    return members.filter((m) => m.status === 'active');
  }, [members]);

  // 검색 필터링
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return activeMembers;
    const term = searchTerm.toLowerCase();
    return activeMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.email && m.email.toLowerCase().includes(term))
    );
  }, [activeMembers, searchTerm]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await onInvite(inviteEmail.trim());
      setInviteEmail('');
    } finally {
      setIsInviting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInvite();
    }
  };

  // 검색바 표시 조건: 학생 9명 이상
  const showSearch = activeMembers.length >= 9;

  return (
    <div className="vj-section vj-mem-panel">
      {/* 헤더 - 검사 진행 현황과 동일한 스타일 */}
      <h3>
        <Users size={16} style={{ color: '#7C3AED' }} />
        학생 관리
        <span className="sub">{activeMembers.length}명</span>
      </h3>

      {/* 이메일 초대 (방장만) */}
      {isOwner && (
        <div className="vj-mem-invite">
          <div className="vj-mem-invite-row">
            <div className="vj-mem-input-wrap">
              <Mail size={14} />
              <input
                type="email"
                placeholder="이메일 주소 입력"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || isInviting}
              className="btn primary sm"
            >
              <Plus size={14} />
              초대
            </button>
          </div>
        </div>
      )}

      {/* 검색 (9명 이상일 때만) */}
      {showSearch && (
        <div className="vj-mem-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="이름, 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <span className="count">{filteredMembers.length}명</span>
          )}
        </div>
      )}

      {/* 멤버 목록 */}
      <div className="vj-mem-list">
        {filteredMembers.length > 0 ? (
          <>
            {filteredMembers.map((member, idx) => (
              <MemberRow
                key={member.id}
                member={member}
                index={idx + 1}
                isOwner={isOwner}
                onKick={onKick}
              />
            ))}
          </>
        ) : (
          <div className="vj-mem-empty">
            {searchTerm ? (
              <p>검색 결과가 없습니다</p>
            ) : (
              <p>아직 학생이 없어요. 위에서 초대해 보세요.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 멤버 행
interface MemberRowProps {
  member: GroupMember;
  index: number;
  isOwner: boolean;
  onKick: (memberId: string) => void;
}

const MemberRow: React.FC<MemberRowProps> = ({
  member,
  index,
  isOwner,
  onKick,
}) => {
  return (
    <div className="vj-mem-row">
      {/* 번호 */}
      <span className="num">{member.studentNumber || index}</span>

      {/* 이름 + 이메일 */}
      <div className="info">
        <p className="name">
          {member.name}
          {member.memberType === 'guest' && (
            <span className="guest-badge">게스트</span>
          )}
        </p>
        {member.email && <p className="email">{member.email}</p>}
      </div>

      {/* 강퇴 버튼 (방장만) */}
      {isOwner && (
        <button
          onClick={() => onKick(member.id)}
          className="kick-btn"
          title="강퇴"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default StudentManagementPanel;
