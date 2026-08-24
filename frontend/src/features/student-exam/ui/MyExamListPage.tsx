/**
 * 학생용 검사 목록 페이지
 * 학생이 자신의 검사 현황을 확인하고 응시/결과 조회하는 페이지
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  RefreshCw,
  Play,
  RotateCcw,
  RefreshCw as Restart,
  CheckCircle2,
  Clock,
  Lock,
  XCircle,
  Brain,
} from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useAuth } from '@features/auth/model/AuthContext';
import { getMyGroups } from '@features/groups/api/groupService';
import {
  getStudentExamList,
  getStatusLabel,
  getStatusColor,
  getStatusMessage,
} from '../api/studentExamService';
import type { StudentExamListItem } from '../types';

// ============================================================
// 검사 섹션 정의
// ============================================================

interface ExamSectionDef {
  paperIdx: string;
  label: string;
  desc: string;
  color: string;
  bgColor: string;
  borderColor: string;
  resultPath: (exam: StudentExamListItem) => string;
}

const EXAM_SECTIONS: ExamSectionDef[] = [
  {
    paperIdx: '1',
    label: '학습종합검사',
    desc: '학습심리·정서 38개 요인 종합 분석',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    borderColor: '#c4b5fd',
    resultPath: (e) => `/student/result/comprehensive/${e.dgnssResultId}`,
  },
  {
    paperIdx: '2',
    label: '자기조절학습검사',
    desc: '자기조절 학습전략 20개 요인 분석',
    color: '#009F88',
    bgColor: '#f0fdf4',
    borderColor: '#86efac',
    resultPath: (e) => `/student/result/selfreg/${e.dgnssResultId}`,
  },
];

// ============================================================
// Styled Components
// ============================================================

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const HeaderIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: #ede9fe;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 2px;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SkeletonStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SkeletonCard = styled.div`
  height: 120px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const EmptyState = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 48px ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const EmptyIconCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.gray[100]};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  svg {
    width: 32px;
    height: 32px;
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const EmptyDesc = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const ExamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ExamCardRoot = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ExamIconBox = styled.div<{ $status: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ $status }) =>
    $status === 'completed' || $status === 'result_ready'
      ? '#dcfce7'
      : $status === 'in_progress'
        ? '#fef3c7'
        : '#ede9fe'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ $status }) =>
      $status === 'completed' || $status === 'result_ready'
        ? '#16a34a'
        : $status === 'in_progress'
          ? '#d97706'
          : '#7c3aed'};
  }
`;

const ExamCardBody = styled.div`
  flex: 1;
`;

const ExamCardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ExamName = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const RecommendedMonthTag = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

/** 같은 회차(ordNo)의 검사가 2개 이상(N:N 다중 그룹 소속) 조회될 때만 표시되는 소속 반 보조 라벨 */
const GroupLabelTag = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

const StatusMessage = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const StatusBadge = styled.span<{ $bg: string; $text: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const ExamActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  border: none;
  background: ${({ $variant, theme }) =>
    $variant === 'success'
      ? '#dcfce7'
      : $variant === 'secondary'
        ? theme.colors.gray[100]
        : theme.colors.primary[600]};
  color: ${({ $variant, theme }) =>
    $variant === 'success'
      ? '#15803d'
      : $variant === 'secondary'
        ? theme.colors.gray[700]
        : 'white'};

  &:hover {
    background: ${({ $variant, theme }) =>
      $variant === 'success'
        ? '#bbf7d0'
        : $variant === 'secondary'
          ? theme.colors.gray[200]
          : theme.colors.primary[700]};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const HintBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #1d4ed8;
`;

const SectionBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const SectionHeader = styled.div<{ $color: string; $bg: string; $border: string }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ $bg }) => $bg};
  border: 1px solid ${({ $border }) => $border};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const SectionIconBox = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ $color }) => $color}22;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
    color: ${({ $color }) => $color};
  }
`;

const SectionLabel = styled.span<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $color }) => $color};
`;

const SectionDesc = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

const SectionCount = styled.span<{ $color: string }>`
  margin-left: auto;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ $color }) => $color};
`;

const SectionsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

// ============================================================
// ExamCard
// ============================================================

interface ExamCardProps {
  exam: StudentExamListItem;
  /** 같은 회차 검사가 여러 그룹(N:N 소속)에서 조회될 때만 전달되는 소속 반 표시 (예: "6학년 2반") */
  groupLabel?: string;
  onStartExam: (exam: StudentExamListItem) => void;
  onResumeExam: (exam: StudentExamListItem) => void;
  onRestartExam: (exam: StudentExamListItem) => void;
  onViewResult: (exam: StudentExamListItem) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  groupLabel,
  onStartExam,
  onResumeExam,
  onRestartExam,
  onViewResult,
}) => {
  const statusColor = getStatusColor(exam.status);
  const statusLabel = getStatusLabel(exam.status);
  const statusMessage = getStatusMessage(exam.status);

  const renderStatusIcon = () => {
    switch (exam.status) {
      case 'waiting':
        return <Clock />;
      case 'in_progress':
        return <RotateCcw />;
      case 'completed':
      case 'result_ready':
        return <CheckCircle2 />;
      case 'not_submitted':
        return <XCircle />;
      case 'locked':
        return <Lock />;
      default:
        return null;
    }
  };

  const renderActions = () => {
    switch (exam.status) {
      case 'waiting':
        return (
          <ActionButton onClick={() => onStartExam(exam)}>
            <Play />
            검사 시작
          </ActionButton>
        );
      case 'in_progress':
        return (
          <>
            <ActionButton onClick={() => onResumeExam(exam)}>
              <RotateCcw />
              이어하기
            </ActionButton>
            <ActionButton $variant='secondary' onClick={() => onRestartExam(exam)}>
              <Restart />
              새로하기
            </ActionButton>
          </>
        );
      case 'completed':
        return (
          <ActionButton $variant='secondary' disabled>
            결과 대기 중
          </ActionButton>
        );
      case 'result_ready':
        return (
          <ActionButton
            $variant='success'
            onClick={() => {
              onViewResult(exam);
            }}
          >
            <CheckCircle2 />
            결과 보기
          </ActionButton>
        );
      default:
        return null;
    }
  };

  return (
    <ExamCardRoot>
      <ExamIconBox $status={exam.status}>
        <ClipboardList />
      </ExamIconBox>
      <ExamCardBody>
        <ExamCardTop>
          <div>
            <ExamName>{exam.name}</ExamName>
            {groupLabel && <GroupLabelTag>{groupLabel}</GroupLabelTag>}
            {exam.recommendedMonth && (
              <RecommendedMonthTag>권장 {exam.recommendedMonth}</RecommendedMonthTag>
            )}
          </div>
          <StatusBadge $bg={statusColor.bg} $text={statusColor.text}>
            {renderStatusIcon()}
            {statusLabel}
          </StatusBadge>
        </ExamCardTop>
        <ExamActions>{renderActions()}</ExamActions>
        {statusMessage && <StatusMessage>{statusMessage}</StatusMessage>}
      </ExamCardBody>
    </ExamCardRoot>
  );
};

// ============================================================
// Page Component
// ============================================================

interface ExamGroupInfo {
  schoolName?: string;
  schoolCode?: string;
  schoolLevel?: string;
  grade?: number;
  classNumber?: number;
  /** 본인 출석번호 — 검사 시작 화면 번호칸 prefill 용 */
  memberNo?: number;
}

export const MyExamListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<StudentExamListItem[]>([]);
  const [examGroupMap, setExamGroupMap] = useState<Map<number, ExamGroupInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // paperIdx 기준 섹션 그룹화 (존재하는 섹션만)
  const sections = useMemo(
    () =>
      EXAM_SECTIONS.map((def) => ({
        def,
        exams: exams.filter((e) => e.paperIdx === def.paperIdx).sort((a, b) => a.ordNo - b.ordNo),
      })).filter((s) => s.exams.length > 0),
    [exams],
  );

  const loadExams = useCallback(
    async (showRefreshIndicator = false) => {
      if (!user) return;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        if (!user.stdtId) {
          setExams([]);
          return;
        }

        const groups = await getMyGroups(user.id, true);

        if (groups.length === 0) {
          setExams([]);
          return;
        }

        const resultsWithGroups = await Promise.all(
          groups.map(async (g) => ({
            group: g,
            exams: await getStudentExamList(g.claId, user.stdtId!),
          })),
        );

        // 중복 제거 (dgnssResultId 기준) + 그룹 매핑 구축
        const seen = new Set<number>();
        const flat: StudentExamListItem[] = [];
        const groupMap = new Map<number, ExamGroupInfo>();

        for (const { group, exams: groupExams } of resultsWithGroups) {
          for (const e of groupExams) {
            if (!seen.has(e.dgnssResultId)) {
              seen.add(e.dgnssResultId);
              flat.push(e);
              groupMap.set(e.dgnssResultId, {
                schoolName: group.schoolName,
                schoolCode: group.schoolCode,
                schoolLevel: group.schoolLevel as string | undefined,
                grade: group.grade,
                classNumber: group.classNumber,
                memberNo: group.memberNo,
              });
            }
          }
        }

        setExamGroupMap(groupMap);
        setExams(flat);
      } catch {
        setExams([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user],
  );

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const navigate2Exam = (exam: StudentExamListItem, extra?: Record<string, unknown>) => {
    navigate('/exam/student', {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.ordNo,
        paperIdx: exam.paperIdx,
        examName: exam.name,
        groupInfo: examGroupMap.get(exam.dgnssResultId),
        ...extra,
      },
    });
  };

  if (isLoading) {
    return (
      <PageRoot>
        <PageHeader>
          <div>
            <PageTitle>나의 검사</PageTitle>
            <PageSubtitle>검사 현황을 확인하고 응시하세요</PageSubtitle>
          </div>
        </PageHeader>
        <SkeletonStack>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </SkeletonStack>
      </PageRoot>
    );
  }

  return (
    <PageRoot>
      <PageHeader>
        <HeaderLeft>
          <HeaderIconBox>
            <ClipboardList />
          </HeaderIconBox>
          <div>
            <PageTitle>나의 검사</PageTitle>
            <PageSubtitle>검사 현황을 확인하고 응시하세요</PageSubtitle>
          </div>
        </HeaderLeft>
        <RefreshButton onClick={() => loadExams(true)} disabled={isRefreshing}>
          <RefreshCw />
          새로고침
        </RefreshButton>
      </PageHeader>

      {sections.length === 0 ? (
        <EmptyState>
          <EmptyIconCircle>
            <ClipboardList />
          </EmptyIconCircle>
          <EmptyTitle>현재 응시할 검사가 없습니다</EmptyTitle>
          <EmptyDesc>선생님이 검사를 시작하면 여기에 표시됩니다.</EmptyDesc>
        </EmptyState>
      ) : (
        <SectionsStack>
          {sections.map(({ def, exams: sectionExams }) => {
            const completedCount = sectionExams.filter(
              (e) => e.status === 'completed' || e.status === 'result_ready',
            ).length;
            // 같은 회차(ordNo)가 2건 이상이면 N:N 다중 그룹 소속으로 같은 회차 검사가
            // 여러 반에서 각각 조회된 것 — 카드 구분을 위해 소속 반 라벨을 붙인다.
            const ordNoCounts = new Map<number, number>();
            for (const e of sectionExams) {
              ordNoCounts.set(e.ordNo, (ordNoCounts.get(e.ordNo) ?? 0) + 1);
            }
            return (
              <SectionBlock key={def.paperIdx}>
                <SectionHeader $color={def.color} $bg={def.bgColor} $border={def.borderColor}>
                  <SectionIconBox $color={def.color}>
                    {def.paperIdx === '2' ? <Brain /> : <ClipboardList />}
                  </SectionIconBox>
                  <div>
                    <SectionLabel $color={def.color}>{def.label}</SectionLabel>
                    <SectionDesc>{def.desc}</SectionDesc>
                  </div>
                  <SectionCount $color={def.color}>
                    {completedCount}/{sectionExams.length} 완료
                  </SectionCount>
                </SectionHeader>
                <ExamList>
                  {sectionExams.map((exam) => {
                    const isDuplicateRound = (ordNoCounts.get(exam.ordNo) ?? 0) > 1;
                    const groupInfo = examGroupMap.get(exam.dgnssResultId);
                    const groupLabel =
                      isDuplicateRound && groupInfo?.grade && groupInfo?.classNumber
                        ? `${groupInfo.grade}학년 ${groupInfo.classNumber}반`
                        : undefined;
                    return (
                      <ExamCard
                        key={exam.dgnssResultId}
                        exam={exam}
                        groupLabel={groupLabel}
                        onStartExam={(e) => navigate2Exam(e)}
                        onResumeExam={(e) => navigate2Exam(e, { resume: true })}
                        onRestartExam={(e) => navigate2Exam(e, { restart: true })}
                        onViewResult={(e) => navigate(def.resultPath(e))}
                      />
                    );
                  })}
                </ExamList>
              </SectionBlock>
            );
          })}
        </SectionsStack>
      )}

      <HintBox>
        선생님이 검사를 시작하면 응시할 수 있고, 중간에 멈춰도 저장되어 이어서 할 수 있어요. 제출 후
        선생님이 검사를 종료하면 결과를 확인할 수 있어요.
      </HintBox>
    </PageRoot>
  );
};
