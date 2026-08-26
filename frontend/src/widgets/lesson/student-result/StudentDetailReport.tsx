import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Image as ImageIcon, Play } from 'lucide-react';
import { fmtDuration, getStudentReportDetail, pct } from '@features/lesson';
import type { StudentReportArticle, StudentReportDetailView } from '@features/lesson';
import { ErrataBadge, NatureBadge } from '../result/reportBadges';

interface StudentDetailReportProps {
  activityId: string;
}

interface SummaryTile {
  lbl: string;
  val: string;
  sub?: string;
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

const TileSub = styled.div`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
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

const CorrectAnswer = styled.b`
  color: ${({ theme }) => theme.colors.info.dark};
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

const ViewButton = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border: 1px solid ${({ theme, $on }) => ($on ? theme.colors.gray[200] : theme.colors.gray[100])};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme, $on }) => ($on ? theme.colors.gray[600] : theme.colors.gray[300])};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: ${({ $on }) => ($on ? 'pointer' : 'not-allowed')};

  &:hover {
    background: ${({ theme, $on }) => ($on ? theme.colors.gray[50] : 'transparent')};
  }
`;

const PlayIcon = styled(Play)`
  width: 12px;
  height: 12px;
`;

const buildTiles = (d: StudentReportDetailView): SummaryTile[] => {
  const graded = d.summary.gradedN > 0;
  const tiles: SummaryTile[] = [
    { lbl: '활동 페이지', val: `${d.summary.pages}/${d.summary.totalPages} p` },
  ];
  if (graded) {
    tiles.push({
      lbl: '정답률 / 맞춘 문제',
      val: `${pct(d.summary.correctN, d.summary.gradedN)}%`,
      sub: `${d.summary.correctN}/${d.summary.gradedN}개`,
    });
  }
  tiles.push({
    lbl: '활동 시간 / 제출',
    val: fmtDuration(d.summary.durationSec),
    sub: d.summary.submittedAt ?? '미제출',
  });
  return tiles;
};

const answerText = (article: StudentReportArticle, submitAnswer: string | undefined) => {
  if (article.nature === '개념') return '조회함';
  return submitAnswer || '제출함';
};

export const StudentDetailReport = ({ activityId }: StudentDetailReportProps) => {
  const navigate = useNavigate();
  const detail = getStudentReportDetail(activityId);

  const handleBack = () => {
    navigate('/student/lesson/result');
  };

  if (!detail) {
    return (
      <div>
        <BackButton type='button' onClick={handleBack}>
          <BackIcon />
          나의 수업 결과로 돌아가기
        </BackButton>
      </div>
    );
  }

  const tiles = buildTiles(detail);

  return (
    <div>
      <BackButton type='button' onClick={handleBack}>
        <BackIcon />
        나의 수업 결과로 돌아가기
      </BackButton>

      <Card>
        <Title>{detail.title}</Title>
        <TileGrid $cols={tiles.length}>
          {tiles.map((t) => (
            <Tile key={t.lbl}>
              <TileLabel>{t.lbl}</TileLabel>
              <TileValue>{t.val}</TileValue>
              {t.sub ? <TileSub>{t.sub}</TileSub> : null}
            </Tile>
          ))}
        </TileGrid>
      </Card>

      <PagesCard>
        <PagesHeading>페이지별 내 활동</PagesHeading>
        <PageList>
          {detail.articles.map((article) => {
            const resp = detail.responses.find((r) => r.articleId === article.id);
            const isQuestion = article.nature === '문항';
            const showErrata = isQuestion && article.correctAnswer != null && resp != null;
            return (
              <PageRow key={article.id}>
                <Thumb>
                  <ThumbIcon />
                </Thumb>
                <PageBody>
                  <PageTitleRow>
                    <Order>{article.order}</Order>
                    <NatureBadge nature={article.nature} />
                    <PageTitle>{article.title}</PageTitle>
                  </PageTitleRow>
                  {isQuestion && resp ? (
                    <AnswerLine>
                      내 답 <MyAnswer>{resp.submitAnswer || '—'}</MyAnswer>
                      {article.correctAnswer ? (
                        <>
                          {' · '}정답 <CorrectAnswer>{article.correctAnswer}</CorrectAnswer>
                        </>
                      ) : null}
                    </AnswerLine>
                  ) : (
                    <AnswerLine>{answerText(article, resp?.submitAnswer)}</AnswerLine>
                  )}
                </PageBody>
                <Actions>
                  {showErrata && resp ? (
                    <ErrataBadge errata={resp.errata} />
                  ) : (
                    <NeutralMark title='정오 대상 아님'>–</NeutralMark>
                  )}
                  {resp ? (
                    <ViewButton
                      type='button'
                      $on
                      onClick={() => toast.message(`${article.title} 캡처 보기 (목업)`)}
                    >
                      <PlayIcon />
                      보기
                    </ViewButton>
                  ) : (
                    <ViewButton type='button' $on={false} disabled>
                      <PlayIcon />
                      보기
                    </ViewButton>
                  )}
                </Actions>
              </PageRow>
            );
          })}
        </PageList>
      </PagesCard>
    </div>
  );
};
