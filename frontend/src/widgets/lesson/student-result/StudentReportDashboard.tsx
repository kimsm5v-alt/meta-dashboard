import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, ChevronRight } from 'lucide-react';
import {
  getStudentReportList,
  hasStudentReportDetail,
  type StudentReportListItem,
} from '@features/lesson';
import { StudentResultStatusBadge } from './studentResultBadges';

const Heading = styled.h2`
  margin: 0 0 12px;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
  letter-spacing: -0.02em;
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Row = styled.button<{ $hasDetail: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.background.paper};
  text-align: left;
  cursor: pointer;
  opacity: ${({ $hasDetail }) => ($hasDetail ? 1 : 0.8)};
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  ${({ $hasDetail, theme }) =>
    $hasDetail &&
    `
    &:hover {
      border-color: ${theme.colors.primary[200]};
      background: ${theme.colors.primary[50]};
    }
  `}
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const Title = styled.span`
  overflow: hidden;
  color: ${({ theme }) => theme.colors.gray[900]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Due = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const DueIcon = styled(Calendar)`
  width: 14px;
  height: 14px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const Rate = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.success.dark};
`;

const NoRate = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const Chevron = styled(ChevronRight)`
  flex: none;
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const handleRow = (item: StudentReportListItem, open: (id: string) => void) => {
  if (hasStudentReportDetail(item.id)) open(item.id);
  else toast.message('아직 제출하지 않은 활동이에요.');
};

export const StudentReportDashboard = () => {
  const navigate = useNavigate();
  const items = getStudentReportList();

  const open = (id: string) => {
    navigate(`/student/lesson/result/${id}`);
  };

  return (
    <section>
      <Heading>나의 수업 결과</Heading>
      <List>
        {items.map((item) => {
          const hasDetail = hasStudentReportDetail(item.id);
          const showRate = item.status === '완료' && typeof item.correctRate === 'number';
          return (
            <Row
              key={item.id}
              type='button'
              $hasDetail={hasDetail}
              onClick={() => handleRow(item, open)}
            >
              <Body>
                <TitleRow>
                  <Title>{item.title}</Title>
                  <StudentResultStatusBadge status={item.status} />
                </TitleRow>
                <Meta>
                  <Due>
                    <DueIcon />
                    마감 {item.due}
                  </Due>
                  {showRate ? <Rate>정답률 {item.correctRate}%</Rate> : null}
                  {item.status === '완료' && item.correctRate == null ? (
                    <NoRate>정답 없는 활동</NoRate>
                  ) : null}
                </Meta>
              </Body>
              {hasDetail ? <Chevron /> : null}
            </Row>
          );
        })}
      </List>
    </section>
  );
};
