import { useState, useMemo } from 'react';
import { Search, Mail, X, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { GroupMember } from '../types';

interface StudentManagementPanelProps {
  members: GroupMember[];
  isOwner: boolean;
  onInvite: (email: string) => Promise<void>;
  onKick: (memberId: string) => void;
}

export const StudentManagementPanel = ({
  members,
  isOwner,
  onInvite,
  onKick,
}: StudentManagementPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const activeMembers = useMemo(() => members.filter((m) => m.status === 'active'), [members]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return activeMembers;
    const term = searchTerm.toLowerCase();
    return activeMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.email && m.email.toLowerCase().includes(term)),
    );
  }, [activeMembers, searchTerm]);

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setIsInviting(true);
    setInviteEmail('');
    toast.success(`${email}로 초대 이메일을 발송했습니다.`);
    try {
      await onInvite(email);
    } catch {
      toast.error('초대 이메일 발송에 실패했습니다.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleInvite();
  };

  const showSearch = activeMembers.length >= 9;

  return (
    <div className="vj-section vj-mem-panel">
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

      {/* 검색 (9명 이상) */}
      {showSearch && (
        <div className="vj-mem-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="이름, 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <span className="count">{filteredMembers.length}명</span>}
        </div>
      )}

      {/* 멤버 목록 */}
      <div className="vj-mem-list">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member, idx) => (
            <MemberRow
              key={member.id}
              member={member}
              index={idx + 1}
              isOwner={isOwner}
              onKick={onKick}
            />
          ))
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

interface MemberRowProps {
  member: GroupMember;
  index: number;
  isOwner: boolean;
  onKick: (memberId: string) => void;
}

const MemberRow = ({ member, index, isOwner, onKick }: MemberRowProps) => (
  <div className="vj-mem-row">
    <span className="num">{member.memberNo ?? index}</span>
    <div className="info">
      <p className="name">
        {member.name}
        {member.memberType === 'guest' && (
          <span className="guest-badge">게스트</span>
        )}
      </p>
      {member.email && <p className="email">{member.email}</p>}
    </div>
    {isOwner && (
      <button onClick={() => onKick(member.id)} className="kick-btn" title="강퇴">
        <X size={14} />
      </button>
    )}
  </div>
);
