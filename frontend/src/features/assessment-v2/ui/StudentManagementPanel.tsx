import { useState, useMemo } from 'react';
import { Search, Users, Info } from 'lucide-react';
import type { GroupMember } from '../types';

// 미동의(NOT_CONSENTED) 학생 마스킹 시 (i) 툴팁 문구 — 기획 고정
const CONSENT_PENDING_TOOLTIP =
  '학습심리정서검사를 아직 시작하지 않은 학생입니다.\n' +
  '학생이 최초 1회 로그인하여, 사이트 사용에 동의할 수 있게 안내해주세요.\n' +
  '자세한 내용은 그룹 관리에서 확인할 수 있습니다.';

/**
 * 학생 관리 패널 — group-from-idp 전환 후 "조회 전용".
 * 학생 초대(이메일)·강퇴는 mypage(SSO)로 이관되어 제거됨. 멤버 목록 표시/검색만 유지.
 */
interface StudentManagementPanelProps {
  members: GroupMember[];
}

export const StudentManagementPanel = ({ members }: StudentManagementPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const activeMembers = useMemo(() => members.filter((m) => m.status === 'active'), [members]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return activeMembers;
    const term = searchTerm.toLowerCase();
    return activeMembers.filter(
      (m) =>
        (m.name ?? '').toLowerCase().includes(term) ||
        (m.email && m.email.toLowerCase().includes(term)),
    );
  }, [activeMembers, searchTerm]);

  const showSearch = activeMembers.length >= 9;

  return (
    <div className="vj-section vj-mem-panel">
      <h3>
        <Users size={16} style={{ color: '#7C3AED' }} />
        학생 관리
        <span className="sub">{activeMembers.length}명</span>
      </h3>

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
            <MemberRow key={member.id} member={member} index={idx + 1} />
          ))
        ) : (
          <div className="vj-mem-empty">
            {searchTerm ? (
              <p>검색 결과가 없습니다</p>
            ) : (
              <p>아직 학생이 없어요. 마이페이지에서 학생을 초대해 보세요.</p>
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
}

const MemberRow = ({ member, index }: MemberRowProps) => {
  // 학심정 미동의 학생 — 이름/이메일 전체 마스킹 + 안내 툴팁 (group-from-idp)
  const consentPending = member.maskedReason === 'NOT_CONSENTED';

  return (
    <div className="vj-mem-row">
      <span className="num">{member.memberNo ?? index}</span>
      <div className="info">
        <p className="name" style={consentPending ? { color: '#9CA3AF' } : undefined}>
          {consentPending ? '****' : member.name}
          {consentPending && (
            <span
              title={CONSENT_PENDING_TOOLTIP}
              aria-label={CONSENT_PENDING_TOOLTIP}
              style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4, color: '#9CA3AF', cursor: 'help', verticalAlign: 'middle' }}
            >
              <Info size={13} />
            </span>
          )}
          {!consentPending && member.memberType === 'guest' && (
            <span className="guest-badge">게스트</span>
          )}
        </p>
        {consentPending
          ? <p className="email" style={{ color: '#9CA3AF' }}>****@****</p>
          : member.email && <p className="email">{member.email}</p>}
      </div>
    </div>
  );
};
