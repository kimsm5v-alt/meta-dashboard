import { useState, useRef } from 'react';
import {
  Lock,
  Play,
  Square,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  Upload,
  Download,
} from 'lucide-react';
import { fetchNotSubmittedStudents } from '@features/assessment/api/assessmentService';
import { EXAM_STATUS_LABELS } from '../constants';
import { calculateProgress, formatDateRange, getSlotStatus } from '../utils';
import type { ExamSlotState, ExamSlotDefinition, ExamSlotStatus } from '../types';

interface ExamTimelineCardProps {
  slotDef: ExamSlotDefinition;
  slotState?: ExamSlotState;
  allSlots: ExamSlotState[];
  onStartExam: (slotId: string) => void;
  onEndExam: (slotId: string, dgnssId: number) => void;
  onCancelExam: (slotId: string, dgnssId: number) => void;
  onViewResult: (slotId: string, dgnssId: number) => void;
  onRestartExam: (slotId: string, dgnssId: number) => void;
  onExcelUpload?: (slotId: string, dgnssId: number, file: File) => void;
  onTemplateDownload?: (slotId: string, dgnssId: number) => void;
  isActionPending?: boolean;
}

export const ExamTimelineCard = ({
  slotDef,
  slotState,
  allSlots,
  onStartExam,
  onEndExam,
  onCancelExam,
  onViewResult,
  onRestartExam,
  onExcelUpload,
  onTemplateDownload,
  isActionPending = false,
}: ExamTimelineCardProps) => {
  const [showMissing, setShowMissing] = useState(false);
  const [fetchedStudents, setFetchedStudents] = useState<string[] | null>(null);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = getSlotStatus(slotDef.id, slotState, allSlots);
  const isLocked = status === 'locked';
  const progress = slotState
    ? calculateProgress(slotState.submittedCount, slotState.totalCount)
    : 0;

  const missingCount = Math.max(0, (slotState?.totalCount ?? 0) - (slotState?.submittedCount ?? 0));
  const hasMissing = (status === 'in_progress' || status === 'completed') && missingCount > 0;

  const handleToggleMissing = async () => {
    const next = !showMissing;
    setShowMissing(next);
    if (next && fetchedStudents === null && slotState?.dgnssId) {
      setIsFetchingStudents(true);
      try {
        const result = await fetchNotSubmittedStudents(slotState.dgnssId);
        setFetchedStudents(result.map((s) => s.nickname));
      } catch {
        setFetchedStudents([]);
      } finally {
        setIsFetchingStudents(false);
      }
    }
  };

  const isComingSoon = slotDef.isComingSoon;

  const cardClass = [
    'vj-tc v2',
    slotDef.kind,
    status === 'in_progress' ? 'live' : '',
    status === 'completed' ? 'done' : '',
    isLocked ? 'locked' : '',
    isComingSoon ? 'coming-soon' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      {/* Coming Soon 오버레이 */}
      {isComingSoon && (
        <div className='vj-tc2-coming-soon'>
          <span>Coming Soon</span>
        </div>
      )}

      {/* 좌측 컬러바 */}
      <div className='vj-tc2-bar' />

      {/* 메인 콘텐츠 */}
      <div className='vj-tc2-main'>
        {/* 헤더 */}
        <div className='vj-tc2-head'>
          <div className='vj-tc2-title'>
            <div className='t1'>
              <span className='nm'>{slotDef.shortLabel}</span>
              <span className='rnd'>· {slotDef.round}회차</span>
            </div>
            <div className='t2'>
              권장 {slotDef.recommendedMonth} · {slotDef.semester}
            </div>
          </div>
          <span
            className={`vj-tc2-badge ${
              status === 'in_progress'
                ? 'live'
                : status === 'completed'
                  ? 'done'
                  : status === 'locked'
                    ? 'locked'
                    : 'none'
            }`}
          >
            {status === 'locked' && <Lock size={10} style={{ marginRight: 3 }} />}
            {EXAM_STATUS_LABELS[status]}
          </span>
        </div>

        {/* 본문 */}
        <div className='vj-tc2-body'>
          <div className='vj-tc2-desc'>
            {isLocked ? (
              <>
                <Lock size={12} />
                1차 검사가 종료되어야 시작할 수 있어요.
              </>
            ) : (
              slotDef.description
            )}
          </div>

          {(status === 'in_progress' || status === 'completed') && slotState ? (
            <>
              <div className='vj-tc2-prog'>
                <div className='progress'>
                  <i style={{ width: `${progress}%` }} />
                </div>
                <span className='pct'>{progress}%</span>
              </div>
              <div className='vj-tc2-stats'>
                {hasMissing ? (
                  <button className='vj-tc2-missing-toggle' onClick={handleToggleMissing}>
                    <Users size={12} />
                    <b>{slotState.submittedCount}</b>/{slotState.totalCount}명 제출
                    {showMissing ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                ) : (
                  <span>
                    <Users size={12} />
                    <b>{slotState.submittedCount}</b>/{slotState.totalCount}명 제출
                  </span>
                )}
                <span className='sep'>·</span>
                <span>
                  <Calendar size={12} />
                  {formatDateRange(slotState.startDate, slotState.endDate)}
                </span>

                {status === 'in_progress' && slotState.dgnssId && (
                  <div className='vj-tc2-excel-row'>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='.xlsx,.xls'
                      style={{ display: 'none' }}
                      disabled={isActionPending}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && slotState.dgnssId) {
                          onExcelUpload?.(slotDef.id, slotState.dgnssId, file);
                        }
                        e.target.value = '';
                      }}
                    />
                    <button
                      className='vj-tc2-excel-btn'
                      onClick={() => !isActionPending && fileInputRef.current?.click()}
                      disabled={isActionPending}
                    >
                      <Upload size={11} />
                      엑셀 업로드
                    </button>
                    <button
                      className='vj-tc2-excel-btn'
                      onClick={() =>
                        !isActionPending &&
                        slotState.dgnssId &&
                        onTemplateDownload?.(slotDef.id, slotState.dgnssId)
                      }
                      disabled={isActionPending}
                    >
                      <Download size={11} />
                      양식 다운로드
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            !isLocked && (
              <>
                <div className='vj-tc2-prog skeleton'>
                  <div className='progress'>
                    <i style={{ width: '0%' }} />
                  </div>
                  <span className='pct'>—</span>
                </div>
                <div className='vj-tc2-stats skeleton'>
                  <span>
                    <Calendar size={12} />
                    시작 전
                  </span>
                </div>
              </>
            )
          )}
        </div>
      </div>

      {/* 우측 액션 */}
      <div className='vj-tc2-actions'>
        <ActionButtons
          status={status}
          slotId={slotDef.id}
          dgnssId={slotState?.dgnssId}
          submittedCount={slotState?.submittedCount ?? 0}
          onStartExam={onStartExam}
          onEndExam={onEndExam}
          onCancelExam={onCancelExam}
          onViewResult={onViewResult}
          onRestartExam={onRestartExam}
          isActionPending={isActionPending}
        />
      </div>

      {/* 미제출 학생 영역 */}
      {hasMissing && showMissing && (
        <div className='vj-tc2-missing'>
          <div className='vj-tc2-missing-h'>
            미제출 <b>{fetchedStudents !== null ? fetchedStudents.length : missingCount}</b>명
          </div>
          <div className='vj-tc2-missing-list'>
            {isFetchingStudents ? (
              <span className='vj-tc2-missing-empty'>불러오는 중...</span>
            ) : fetchedStudents && fetchedStudents.length > 0 ? (
              fetchedStudents.map((name, idx) => (
                <span key={idx} className='vj-tc2-missing-tag'>
                  {name}
                </span>
              ))
            ) : fetchedStudents !== null ? (
              <span className='vj-tc2-missing-empty'>미제출 학생 목록을 불러올 수 없습니다</span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

interface ActionButtonsProps {
  status: ExamSlotStatus;
  slotId: string;
  dgnssId?: number;
  submittedCount: number;
  onStartExam: (slotId: string) => void;
  onEndExam: (slotId: string, dgnssId: number) => void;
  onCancelExam: (slotId: string, dgnssId: number) => void;
  onViewResult: (slotId: string, dgnssId: number) => void;
  onRestartExam: (slotId: string, dgnssId: number) => void;
  isActionPending: boolean;
}

const ActionButtons = ({
  status,
  slotId,
  dgnssId,
  submittedCount,
  onStartExam,
  onEndExam,
  onCancelExam,
  onViewResult,
  onRestartExam,
  isActionPending,
}: ActionButtonsProps) => {
  switch (status) {
    case 'not_started':
      return (
        <button
          className='btn sm primary'
          onClick={() => onStartExam(slotId)}
          disabled={isActionPending}
        >
          <Play size={12} />
          검사 시작
        </button>
      );

    case 'in_progress':
      return (
        <>
          <button
            className='btn sm primary'
            onClick={() => dgnssId && submittedCount > 0 && onEndExam(slotId, dgnssId)}
            disabled={isActionPending || submittedCount === 0}
          >
            <Square size={12} />
            검사 종료
          </button>
          <button
            className='btn sm ghost'
            onClick={() => dgnssId && onCancelExam(slotId, dgnssId)}
            disabled={isActionPending}
          >
            <X size={12} />
            취소
          </button>
        </>
      );

    case 'completed':
      return (
        <>
          <button
            className='btn sm primary'
            onClick={() => dgnssId && onViewResult(slotId, dgnssId)}
          >
            결과 보기
          </button>
          <button
            className='btn sm ghost'
            onClick={() => dgnssId && onRestartExam(slotId, dgnssId)}
            disabled={isActionPending}
          >
            <RefreshCw size={12} />
            추가 진행
          </button>
        </>
      );

    case 'locked':
      return (
        <button className='btn sm disabled' disabled>
          <Lock size={12} />
          검사 시작
        </button>
      );

    default:
      return null;
  }
};
