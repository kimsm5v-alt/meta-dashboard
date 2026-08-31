import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type {
  ActivityProgress,
  ArticleNature,
  ReportGridItem,
  ResponseOverlayAxis,
} from '@features/lesson';
import {
  cellFromPageParticipationItem,
  fmtDateTime,
  fmtDurationMs,
  gradingSourceLabel,
  participationItemByArticleId,
  participationItemOf,
  usePatchParticipationGradingMutation,
  useTeacherParticipationQuery,
} from '@features/lesson';
import type { LmsErrata } from '@features/lesson/api/lmsActivityService';
import { ParticipationStatusBadge } from './ReportBadge';
import { ResponseMark, ResponseNatureBadge, ResponseSummary } from './ResponseGridSummary';

export type ResponseDetailOverlayProps = {
  axis: ResponseOverlayAxis;
  activityId: string;
  activityTitle: string;
  siblings: ReportGridItem[];
  initialIndex: number;
  onClose: () => void;
  progress?: ActivityProgress;
  fixedPage?: { seq: number; title: string; nature?: ArticleNature };
  fixedStudentName?: string;
};

const GRADE_BUTTONS: { errata: LmsErrata; label: string }[] = [
  { errata: 'CORRECT', label: 'O 잘함' },
  { errata: 'PARTIAL', label: '△ 보통' },
  { errata: 'INCORRECT', label: 'X 미흡' },
];

const Shell = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.gray[900]};
`;

const Header = styled.div`
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[800]};
  padding: 10px 16px;
`;

const CloseBtn = styled.button`
  display: flex;
  padding: 6px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[800]};
  }
`;

const HeaderTitle = styled.div`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.background.paper};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const HeaderSub = styled.span`
  margin-left: 8px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Nav = styled.div`
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
`;

const NavCount = styled.span`
  margin-right: 4px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-variant-numeric: tabular-nums;
`;

const NavBtn = styled.button`
  display: flex;
  padding: 6px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[300]};
  cursor: pointer;

  &:disabled {
    color: ${({ theme }) => theme.colors.gray[700]};
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray[800]};
  }
`;

const Main = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: row;
  }
`;

const CapturePane = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 16px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    padding: 32px;
  }
`;

const CaptureImg = styled.img`
  max-height: 100%;
  max-width: 100%;
  border-radius: ${({ theme }) => theme.radius.xl};
  object-fit: contain;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
`;

const EmptyCapture = styled.div`
  border: 1px dashed ${({ theme }) => theme.colors.gray[700]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 96px 64px;
  text-align: center;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Sidebar = styled.aside`
  display: flex;
  width: 100%;
  flex: none;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[800]};
  background: ${({ theme }) => theme.colors.background.paper};
  padding: 20px;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    width: 340px;
    border-top: none;
    border-left: 1px solid ${({ theme }) => theme.colors.gray[800]};
  }
`;

const StudentName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
`;

const MetaLine = styled.div`
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const PageBox = styled.div`
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const PageTitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const PageTitle = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const SectionLabel = styled.div`
  margin-bottom: 6px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ErrataRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ErrataLabel = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const SourceLabel = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const GradingSection = styled.div`
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const GradingTitle = styled.div`
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const GradingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const GradeBtn = styled.button<{ $active: boolean; $tone: 'info' | 'warning' | 'error' }>`
  padding: 8px 4px;
  border: 2px solid
    ${({ theme, $active, $tone }) =>
      $active
        ? $tone === 'info'
          ? theme.colors.info.main
          : $tone === 'warning'
            ? theme.colors.warning.main
            : theme.colors.error.main
        : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme, $active, $tone }) =>
    $active
      ? $tone === 'info'
        ? theme.colors.info.light
        : $tone === 'warning'
          ? theme.colors.warning.light
          : theme.colors.error.light
      : theme.colors.background.paper};
  color: ${({ theme, $active, $tone }) =>
    $active
      ? $tone === 'info'
        ? theme.colors.info.dark
        : $tone === 'warning'
          ? theme.colors.warning.dark
          : theme.colors.error.dark
      : theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Hint = styled.div`
  margin-top: 8px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: 11px;
`;

const gradeTone = (errata: LmsErrata): 'info' | 'warning' | 'error' => {
  if (errata === 'CORRECT') return 'info';
  if (errata === 'PARTIAL') return 'warning';
  return 'error';
};

const resolveProgressStatus = (
  progress: ActivityProgress | undefined,
  participantSub: string | undefined,
) => {
  if (!progress || !participantSub) return undefined;
  return progress.rows.find((row) => row.participant === participantSub)?.status;
};

export const ResponseDetailOverlay = ({
  axis,
  activityId,
  activityTitle,
  siblings,
  initialIndex,
  onClose,
  progress,
  fixedPage,
  fixedStudentName,
}: ResponseDetailOverlayProps) => {
  const [index, setIndex] = useState(initialIndex);
  const gradingMutation = usePatchParticipationGradingMutation();

  const safeIndex = Math.min(Math.max(index, 0), Math.max(siblings.length - 1, 0));
  const current = siblings[safeIndex];

  const participationQuery = useTeacherParticipationQuery(activityId, current?.participationId);

  const participationItem = useMemo(() => {
    const result = participationQuery.data;
    if (!result || !current) return undefined;
    if (current.activityItemId) {
      return participationItemOf(result, current.activityItemId);
    }
    if (current.lcmsArticleId) {
      return participationItemByArticleId(result, current.lcmsArticleId);
    }
    return undefined;
  }, [current, participationQuery.data]);

  const cell = cellFromPageParticipationItem(participationItem);
  const nature = axis === 'page' ? fixedPage?.nature : current?.nature;
  const studentName = current?.studentName ?? fixedStudentName ?? '';
  const status =
    resolveProgressStatus(progress, current?.participantSub) ?? current?.participationStatus;

  const timeSpentMs = participationItem?.timeSpentMs ?? current?.timeSpentMs;
  const submittedAt = participationQuery.data?.submittedAt ?? current?.submittedAt;
  const gradedBySource = participationItem?.gradedBySource ?? current?.gradedBySource;

  const headerSub =
    axis === 'student' ? fixedStudentName : (fixedPage?.title ?? current?.pageTitle);

  const pageSeq = axis === 'student' ? current?.pageSeq : fixedPage?.seq;
  const pageTitle = axis === 'student' ? current?.title : (fixedPage?.title ?? current?.pageTitle);
  const pageNature = axis === 'student' ? current?.nature : fixedPage?.nature;

  const showErrataBlock = nature === '활동' || nature === '문항';
  const showManualGrading = nature === '활동' && Boolean(current?.activityItemId);

  const go = useCallback(
    (delta: number) => {
      setIndex((prev) => {
        const next = prev + delta;
        if (next < 0 || next >= siblings.length) return prev;
        return next;
      });
    },
    [siblings.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  if (!current || siblings.length === 0) return null;

  const handleGrade = (errata: LmsErrata) => {
    if (!current.participationId || !current.activityItemId) return;
    gradingMutation.mutate({
      activityId,
      participationId: current.participationId,
      activityItemId: current.activityItemId,
      errata,
      idempotencyKey: crypto.randomUUID(),
    });
  };

  const activeErrata = participationItem?.errata;

  return createPortal(
    <Shell role='dialog' aria-modal='true' aria-label='응답 상세'>
      <Header>
        <CloseBtn type='button' onClick={onClose} aria-label='닫기'>
          <X size={20} />
        </CloseBtn>
        <HeaderTitle>
          {activityTitle}
          {headerSub ? <HeaderSub>{headerSub}</HeaderSub> : null}
        </HeaderTitle>
        <Nav>
          <NavCount>
            {safeIndex + 1} / {siblings.length}
          </NavCount>
          <NavBtn type='button' onClick={() => go(-1)} disabled={safeIndex <= 0} aria-label='이전'>
            <ChevronLeft size={20} />
          </NavBtn>
          <NavBtn
            type='button'
            onClick={() => go(1)}
            disabled={safeIndex >= siblings.length - 1}
            aria-label='다음'
          >
            <ChevronRight size={20} />
          </NavBtn>
        </Nav>
      </Header>

      <Main>
        <CapturePane>
          {current.capture ? (
            <CaptureImg src={current.capture} alt={`${studentName} 제출 캡처`} />
          ) : (
            <EmptyCapture>제출 캡처가 없습니다.</EmptyCapture>
          )}
        </CapturePane>

        <Sidebar>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StudentName>{studentName}</StudentName>
              {status ? <ParticipationStatusBadge status={status} /> : null}
            </div>
            <MetaLine>
              {timeSpentMs != null ? <>활동 {fmtDurationMs(timeSpentMs)}</> : null}
              {submittedAt ? <> · 제출 {fmtDateTime(submittedAt)}</> : null}
            </MetaLine>
          </div>

          <PageBox>
            <PageTitleRow>
              {pageSeq != null ? (
                <PageTitle>
                  {pageSeq}. {pageTitle}
                </PageTitle>
              ) : (
                <PageTitle>{pageTitle}</PageTitle>
              )}
              {pageNature ? <ResponseNatureBadge nature={pageNature} /> : null}
            </PageTitleRow>
          </PageBox>

          <div>
            <SectionLabel>제출 답안</SectionLabel>
            <ResponseSummary cell={cell} mode={current.mode} nature={nature} />
            {showErrataBlock && cell.submitted ? (
              <ErrataRow>
                <ResponseMark cell={cell} nature={nature} />
                {gradedBySource ? (
                  <>
                    <ErrataLabel>·</ErrataLabel>
                    <SourceLabel>{gradingSourceLabel(gradedBySource)}</SourceLabel>
                  </>
                ) : null}
              </ErrataRow>
            ) : null}
          </div>

          {showManualGrading ? (
            <GradingSection>
              <GradingTitle>교사 채점</GradingTitle>
              <GradingGrid>
                {GRADE_BUTTONS.map((btn) => (
                  <GradeBtn
                    key={btn.errata}
                    type='button'
                    $active={activeErrata === btn.errata}
                    $tone={gradeTone(btn.errata)}
                    disabled={gradingMutation.isPending}
                    onClick={() => handleGrade(btn.errata)}
                  >
                    {btn.label}
                  </GradeBtn>
                ))}
              </GradingGrid>
              <Hint>← → 키로 다음 제출물로 넘어갈 수 있어요.</Hint>
            </GradingSection>
          ) : null}
        </Sidebar>
      </Main>
    </Shell>,
    document.body,
  );
};
