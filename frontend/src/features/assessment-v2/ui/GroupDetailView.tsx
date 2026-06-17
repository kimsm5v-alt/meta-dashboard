import { useState } from 'react';
import styled from '@emotion/styled';
import {
  ChevronLeft,
  ChevronDown,
  ClipboardList,
} from 'lucide-react';
import { PDF_ICON_SVG_URL } from '@shared/assets/svgIcons';
import { ExamTimelineCard } from './ExamTimelineCard';
import { StudentManagementPanel } from './StudentManagementPanel';
import { EXAM_SLOTS } from '../constants';
import type { GroupWithExamState, GroupMember } from '../types';
import type { SchoolLevelCode } from '@shared/types';

const MANUAL_URL_COMPREHENSIVE = '';
const MANUAL_URL_SELF_REGULATED = '';

const PdfBtn = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 13px;
  font-weight: 500;
  background: white;
  color: #374151;
  border: 1px solid #D1D5DB;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #F9FAFB;
    border-color: #9CA3AF;
  }

  &::before {
    content: '';
    width: 18px;
    height: 22px;
    flex-shrink: 0;
    background-image: ${PDF_ICON_SVG_URL};
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
  }
`;

const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

interface GroupDetailViewProps {
  group: GroupWithExamState;
  members: GroupMember[];
  allGroups: GroupWithExamState[];
  onBack: () => void;
  onSwitchGroup: (groupId: string) => void;
  onStartExam: (slotId: string) => void;
  onEndExam: (slotId: string, dgnssId: number) => void;
  onCancelExam: (slotId: string, dgnssId: number) => void;
  onViewResult: (slotId: string, dgnssId: number) => void;
  onRestartExam: (slotId: string, dgnssId: number) => void;
  onExcelUpload: (slotId: string, dgnssId: number, file: File) => void;
  onTemplateDownload: (slotId: string, dgnssId: number) => void;
}

// 그룹 수정/삭제·학생 초대·초대코드/QR/링크는 mypage(SSO)로 이관 — 조회+검사진행만 유지 (group-from-idp)
export const GroupDetailView = ({
  group,
  members,
  allGroups,
  onBack,
  onSwitchGroup,
  onStartExam,
  onEndExam,
  onCancelExam,
  onViewResult,
  onRestartExam,
  onExcelUpload,
  onTemplateDownload,
}: GroupDetailViewProps) => {
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  const activeMembers = members.filter((m) => m.status === 'active');
  const inProgressCount = group.examSlots.filter((s) => s.status === 'in_progress').length;
  const completedCount = group.examSlots.filter((s) => s.status === 'completed').length;

  const levelLabel = SCHOOL_LEVEL_LABELS[group.schoolLevel] ?? group.schoolLevel;
  const gradeInfo = `${levelLabel} ${group.grade}학년 ${group.classNumber}반`;

  return (
    <div className="vj-d">
      {/* 상단 정보 섹션 */}
      <div className="vj-section" style={{ padding: '18px 22px' }}>
        {/* 헤더 행 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          {/* 돌아가기 */}
          <button
            className="vj-back"
            onClick={onBack}
            aria-label="돌아가기"
            style={{ padding: 8, marginBottom: 2, marginLeft: -4, marginRight: -4 }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* 그룹명 + 전환 + 수정/삭제 */}
          <div className="vj-d-title" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className="vj-gswitch"
                onClick={() => setShowGroupDropdown(!showGroupDropdown)}
              >
                <span className="vj-gswitch-name">{group.name}</span>
                <ChevronDown size={18} />
              </button>
            </div>
            <div className="sub">
              {group.schoolName ? `${group.schoolName} · ${gradeInfo}` : gradeInfo}
            </div>

            {/* 그룹 전환 드롭다운 */}
            {showGroupDropdown && (
              <>
                <div
                  onClick={() => setShowGroupDropdown(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                />
                <div className="vj-gswitch-pop">
                  <div className="vj-gswitch-pop-h">그룹 전환</div>
                  <div className="vj-gswitch-list">
                    {allGroups.map((g) => (
                      <button
                        key={g.id}
                        className={`vj-gswitch-item ${g.id === group.id ? 'active' : ''}`}
                        onClick={() => {
                          onSwitchGroup(g.id);
                          setShowGroupDropdown(false);
                        }}
                      >
                        <div className="vj-gswitch-item-nm">{g.name}</div>
                        <div className="vj-gswitch-item-mt">
                          {SCHOOL_LEVEL_LABELS[g.schoolLevel] ?? g.schoolLevel}{' '}
                          {g.grade}학년 · 학생 {g.activeMemberCount || g.memberCount}명
                        </div>
                        {g.id === group.id && <span className="vj-gswitch-cur">현재</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* PDF 설명서 버튼 */}
          <div className="vj-d-tools">
            <PdfBtn href={MANUAL_URL_COMPREHENSIVE} target="_blank" rel="noopener noreferrer">
              학습종합검사 교사용 설명서
            </PdfBtn>
            <PdfBtn href={MANUAL_URL_SELF_REGULATED} target="_blank" rel="noopener noreferrer">
              자기조절학습검사 교사용 설명서
            </PdfBtn>
          </div>
        </div>

        {/* 통계 카드 4개 */}
        <div className="vj-d-stats">
          <div className="vj-d-stat">
            <div className="lbl">전체 학생</div>
            <div className="val">
              {activeMembers.length}
              <small>명</small>
            </div>
          </div>

          <div className="vj-d-stat">
            <div className="lbl">진행 중 검사</div>
            <div className="val" style={{ color: inProgressCount > 0 ? '#B45309' : undefined }}>
              {inProgressCount}
              <small>개</small>
            </div>
          </div>

          <div className="vj-d-stat">
            <div className="lbl">완료 검사</div>
            <div className="val" style={{ color: completedCount > 0 ? '#047857' : undefined }}>
              {completedCount}
              <small>개</small>
            </div>
          </div>
          {/* 초대 코드/QR/링크 칸 제거 — 학생 초대는 mypage(SSO)로 이관 (group-from-idp) */}
        </div>
      </div>

      {/* 본문: 좌측 검사 타임라인 + 우측 학생 관리 */}
      <div className="vj-d-body">
        {/* 좌측 - 검사 진행 현황 */}
        <div className="vj-section">
          <h3>
            <ClipboardList size={16} style={{ color: '#7C3AED' }} />
            검사 진행 현황
            <span className="sub">총 4개 검사 · 고정</span>
          </h3>

          <div className="vj-rail-v">
            {/* 좌측 축 */}
            <div className="axis">
              <div className="round r1">1회차</div>
              <div className="round r2">2회차</div>
              <div className="axis-inner">
                {EXAM_SLOTS.map((slot) => (
                  <div key={slot.id} className="row">
                    <div className="month">{slot.recommendedMonth.split('~')[0].trim()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 우측 검사 카드들 */}
            <div className="vj-tests vj-tests-stack">
              {EXAM_SLOTS.map((slotDef) => {
                const slotState = group.examSlots.find((s) => s.slotId === slotDef.id);
                return (
                  <ExamTimelineCard
                    key={slotDef.id}
                    slotDef={slotDef}
                    slotState={slotState}
                    allSlots={group.examSlots}
                    onStartExam={onStartExam}
                    onEndExam={onEndExam}
                    onCancelExam={onCancelExam}
                    onViewResult={onViewResult}
                    onRestartExam={onRestartExam}
                    onExcelUpload={onExcelUpload}
                    onTemplateDownload={onTemplateDownload}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측 - 학생 관리 (조회 전용) */}
        <div className="vj-mem-side">
          <StudentManagementPanel members={members} />
        </div>
      </div>
    </div>
  );
};
