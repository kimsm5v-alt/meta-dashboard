/**
 * 그룹 카드 컴포넌트 - vj-card 디자인 스타일
 * 디자인 핸드오프: Variant J (vj-card + vj-status)
 */

import { ChevronRight, Users } from 'lucide-react';
import type { GroupWithExamState, GroupStatusSummary } from '../types';
import { getGroupStatusSummary } from '../utils';

interface GroupCardProps {
  group: GroupWithExamState;
  onSelect: (groupId: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onSelect,
}) => {
  const status = getGroupStatusSummary(group);

  return (
    <div
      className="vj-card"
      onClick={() => onSelect(group.id)}
    >

      {/* 그룹명 + 메타정보 */}
      <div>
        <div className="nm">
          <span className="truncate">{group.name}</span>
        </div>
        <div className="mt">
          <span><Users size={12} /> 학생 {group.activeMemberCount || group.memberCount}명</span>
          <span className="dot" />
          <span>초대 코드 {group.inviteCode}</span>
        </div>
      </div>

      {/* 상태 박스 (vj-status) */}
      <StatusBox status={status} />

      {/* 하단: 상세 보기 버튼 */}
      <div className="vj-cta">
        <button className="vj-detail-btn" style={{ marginLeft: 'auto' }}>
          상세 보기
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// vj-status 서브 컴포넌트
const StatusBox: React.FC<{ status: GroupStatusSummary }> = ({ status }) => {
  // 진행중
  if (status.type === 'in_progress') {
    const progress = status.progress || 0;
    return (
      <div className="vj-status live">
        <div className="top">
          <span className="badge">진행중</span>
          <span className="name">
            {status.examName}{' '}
            <span style={{ color: '#6B7280', fontWeight: 700 }}>· {status.examRound}회차</span>
          </span>
        </div>
        <div className="progress warn" style={{ background: '#EDE9FE' }}>
          <i style={{ width: `${progress}%`, background: 'var(--primary)' }} />
        </div>
        <div className="mid">
          <b>{status.submittedCount}명</b> / {status.totalCount}명 제출{' '}
          <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 800 }}>
            {progress}%
          </span>
        </div>
      </div>
    );
  }

  // 모두 완료
  if (status.type === 'all_done') {
    return (
      <div className="vj-status alldone">
        <div className="top">
          <span className="badge">완료</span>
          <span className="name">올해 검사 4회차 모두 종료</span>
        </div>
        <div className="empty-line">결과 보기에서 학생별 리포트를 확인하세요.</div>
      </div>
    );
  }

  // 대기 (기본)
  return (
    <div className="vj-status none">
      <div className="top">
        <span className="badge">대기</span>
        <span className="name">진행중인 검사가 없어요</span>
      </div>
      <div className="empty-line">상세 페이지에서 검사를 시작할 수 있어요.</div>
    </div>
  );
};

export default GroupCard;
