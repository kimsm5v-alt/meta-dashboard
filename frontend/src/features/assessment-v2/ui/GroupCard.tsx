import { Settings, Trash2, Users, ChevronRight } from 'lucide-react';
import { getGroupStatusSummary } from '../utils';
import type { GroupWithExamState } from '../types';
import type { SchoolLevelCode } from '@shared/types';

const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

interface GroupCardProps {
  group: GroupWithExamState;
  onSelect: (groupId: string) => void;
  onEdit: (group: GroupWithExamState) => void;
  onDelete: (group: GroupWithExamState) => void;
}

export const GroupCard = ({ group, onSelect, onEdit, onDelete }: GroupCardProps) => {
  const status = getGroupStatusSummary(group);
  const levelLabel = SCHOOL_LEVEL_LABELS[group.schoolLevel] ?? group.schoolLevel;

  return (
    <div className="vj-card" onClick={() => onSelect(group.id)}>
      {/* 수정/삭제 버튼 */}
      <div className="vj-card-actions">
        <button
          className="vj-gicon"
          onClick={(e) => { e.stopPropagation(); onEdit(group); }}
          aria-label="그룹 정보 수정"
          title="그룹 정보 수정"
        >
          <Settings size={14} />
        </button>
        <button
          className="vj-gicon danger"
          onClick={(e) => { e.stopPropagation(); onDelete(group); }}
          aria-label="그룹 삭제"
          title="그룹 삭제"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* 그룹명 */}
      <div>
        <div className="nm">
          <span className="truncate">{group.name}</span>
        </div>
        <div className="mt">
          <span>{levelLabel} {group.grade}학년 {group.classNumber}반</span>
          {group.schoolName && (
            <>
              <span className="dot" />
              <span>{group.schoolName}</span>
            </>
          )}
        </div>
      </div>

      {/* 상태 박스 */}
      <div className={`vj-status ${status.className}`}>
        <div className="top">
          <span className="badge">{status.label}</span>
          <span className="name">{group.name}</span>
        </div>
        <div className="mid">
          <Users size={12} />
          학생 <b>{group.activeMemberCount || group.memberCount}</b>명
          {group.inProgressCount > 0 && (
            <>
              <span className="dot" style={{ width: 3, height: 3, background: '#D1D5DB', borderRadius: '50%' }} />
              진행 중 <b>{group.inProgressCount}</b>개
            </>
          )}
          {group.completedCount > 0 && group.inProgressCount === 0 && (
            <>
              <span className="dot" style={{ width: 3, height: 3, background: '#D1D5DB', borderRadius: '50%' }} />
              완료 <b>{group.completedCount}</b>개
            </>
          )}
        </div>
        {group.inProgressCount === 0 && group.completedCount === 0 && (
          <p className="empty-line">아직 진행된 검사가 없습니다</p>
        )}
      </div>

      {/* 하단 액션 */}
      <div className="vj-cta">
        <span>{group.inviteCode}</span>
        <button className="vj-detail-btn">
          상세 보기 <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};
