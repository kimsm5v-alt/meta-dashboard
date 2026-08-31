import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Image as ImageIcon, Play } from 'lucide-react';
import {
  articleTypeToNature,
  fmtDateTime,
  fmtDurationMs,
  formatParticipationAnswer,
  LessonActivityReportEmbed,
  lmsErrataToCd,
  LmsHttpError,
  pct,
  useCmsArticleMapQuery,
  useMyActivitiesQuery,
  useParticipationResultQuery,
} from '@features/lesson';
import type { ArticleNature, ParticipationResult, ParticipationResultItem } from '@features/lesson';
import { ErrataBadge } from '../result/ReportBadge';
import { ResponseNatureBadge } from '../result/ResponseGridSummary';
import { PageLoading } from '@shared/ui/Loading';

interface StudentDetailReportProps {
  activityId: string;
}

interface SummaryTile {
  lbl: string;
  val: string;
}

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[700]};
  }
`;

const BackIcon = styled(ChevronLeft)`
  width: 16px;
  height: 16px;
`;

const Card = styled.div`
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.background.paper};
`;

const Title = styled.div`
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
  letter-spacing: -0.02em;
`;

const TileGrid = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols}, minmax(0, 1fr));
  gap: 12px;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const Tile = styled.div`
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.gray[50]};
`;

const TileLabel = styled.div`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const TileValue = styled.div`
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
`;

const PagesCard = styled(Card)`
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const PagesHeading = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const PageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: ${({ theme }) => theme.spacing.sm} 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const Thumb = styled.div`
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.gray[200]};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ThumbIcon = styled(ImageIcon)`
  width: 16px;
  height: 16px;
`;

const PageBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const PageTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Order = styled.span`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const PageTitle = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AnswerLine = styled.div`
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const MyAnswer = styled.b`
  color: ${({ theme }) => theme.colors.gray[800]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Actions = styled.div`
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
`;

const NeutralMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.gray[300]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ViewButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const PlayIcon = styled(Play)`
  width: 12px;
  height: 12px;
`;

const buildTiles = (result: ParticipationResult): SummaryTile[] => {
  const items = [...result.items].sort((a, b) => a.seq - b.seq);
  const totalPages = items.length;
  const gradedItems = items.filter((item) => item.errata != null);
  const gradedPages = gradedItems.length;
  const correctN = items.filter((item) => item.errata === 'CORRECT').length;
  const totalMs = items.reduce((sum, item) => sum + (item.timeSpentMs ?? 0), 0);

  const tiles: SummaryTile[] = [
    { lbl: '활동 페이지', val: `${gradedPages}/${totalPages} p` },
    {
      lbl: '정답률',
      val: gradedPages > 0 ? `${pct(correctN, gradedPages)}%` : '—',
    },
    { lbl: '맞춘 문제', val: String(correctN) },
    { lbl: '활동 시간', val: fmtDurationMs(totalMs) },
    { lbl: '제출', val: fmtDateTime(result.submittedAt) },
  ];

  return tiles;
};

const answerLine = (nature: ArticleNature | undefined, item: ParticipationResultItem) => {
  const answer = formatParticipationAnswer(item.answer);
  if (nature === '개념') {
    return answer ? '조회함' : '—';
  }
  if (nature === '문항') {
    return (
      <>
        내 답 <MyAnswer>{answer || '—'}</MyAnswer>
      </>
    );
  }
  return answer || '—';
};

export const StudentDetailReport = ({ activityId }: StudentDetailReportProps) => {
  const navigate = useNavigate();
  const [showEmbed, setShowEmbed] = useState(false);
  const activitiesQuery = useMyActivitiesQuery();
  const activity = activitiesQuery.data?.find((item) => item.activityId === activityId);
  const participationId = activity?.status === 'SUBMITTED' ? activity.participationId : undefined;
  const resultQuery = useParticipationResultQuery(participationId);

  const sortedItems = useMemo(
    () => [...(resultQuery.data?.items ?? [])].sort((a, b) => a.seq - b.seq),
    [resultQuery.data?.items],
  );

  const articleIds = useMemo(() => sortedItems.map((item) => item.lcmsArticleId), [sortedItems]);
  const { map: articleMap, isPending: articlesPending } = useCmsArticleMapQuery(articleIds);

  const handleBack = () => {
    navigate('/student/lesson/result');
  };

  useEffect(() => {
    if (!resultQuery.isError) return;
    const err = resultQuery.error;
    if (err instanceof LmsHttpError && (err.status === 403 || err.status === 404)) {
      toast.message('결과를 불러올 수 없어요.');
      navigate('/student/lesson/result');
    }
  }, [resultQuery.isError, resultQuery.error, navigate]);

  if (activitiesQuery.isPending) {
    return (
      <div>
        <BackButton type='button' onClick={handleBack}>
          <BackIcon />
          나의 수업 결과로 돌아가기
        </BackButton>
        <PageLoading text='활동 정보를 불러오는 중...' />
      </div>
    );
  }

  if (!activity) {
    return (
      <div>
        <BackButton type='button' onClick={handleBack}>
          <BackIcon />
          나의 수업 결과로 돌아가기
        </BackButton>
      </div>
    );
  }

  if (resultQuery.isPending || articlesPending) {
    return (
      <div>
        <BackButton type='button' onClick={handleBack}>
          <BackIcon />
          나의 수업 결과로 돌아가기
        </BackButton>
        <PageLoading text='결과를 불러오는 중...' />
      </div>
    );
  }

  if (!resultQuery.data) {
    return (
      <div>
        <BackButton type='button' onClick={handleBack}>
          <BackIcon />
          나의 수업 결과로 돌아가기
        </BackButton>
      </div>
    );
  }

  const tiles = buildTiles(resultQuery.data);

  return (
    <div>
      <BackButton type='button' onClick={handleBack}>
        <BackIcon />
        나의 수업 결과로 돌아가기
      </BackButton>

      <Card>
        <Title>{activity.title}</Title>
        <TileGrid $cols={tiles.length}>
          {tiles.map((t) => (
            <Tile key={t.lbl}>
              <TileLabel>{t.lbl}</TileLabel>
              <TileValue>{t.val}</TileValue>
            </Tile>
          ))}
        </TileGrid>
      </Card>

      <PagesCard>
        <PagesHeading>페이지별 내 활동</PagesHeading>
        <PageList>
          {sortedItems.map((item, index) => {
            const cms = articleMap.get(item.lcmsArticleId);
            const nature = articleTypeToNature(cms?.articleType);
            const pageTitle = activity.title;
            const errataCd = item.errata != null ? lmsErrataToCd(item.errata) : undefined;
            return (
              <PageRow key={item.activityItemId}>
                <Thumb>
                  <ThumbIcon />
                </Thumb>
                <PageBody>
                  <PageTitleRow>
                    <Order>{index + 1}</Order>
                    <ResponseNatureBadge nature={nature} />
                    <PageTitle>{pageTitle}</PageTitle>
                  </PageTitleRow>
                  <AnswerLine>{answerLine(nature, item)}</AnswerLine>
                </PageBody>
                <Actions>
                  {errataCd != null ? (
                    <ErrataBadge errata={errataCd} />
                  ) : (
                    <NeutralMark title='정오 대상 아님'>–</NeutralMark>
                  )}
                  <ViewButton type='button' onClick={() => setShowEmbed(true)}>
                    <PlayIcon />
                    보기
                  </ViewButton>
                </Actions>
              </PageRow>
            );
          })}
        </PageList>
      </PagesCard>

      {showEmbed ? (
        <LessonActivityReportEmbed
          activityId={activityId}
          onExitRequested={() => setShowEmbed(false)}
        />
      ) : null}
    </div>
  );
};
