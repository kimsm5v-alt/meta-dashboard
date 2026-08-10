import styled from '@emotion/styled';
import { Card } from '@shared/components';

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Columns = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const Column = styled.div`
  flex: 1;
  min-width: 0;
`;

const Divider = styled.div`
  width: 1px;
  background: ${({ theme }) => theme.colors.gray[200]};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ColumnTitle = styled.h4`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ColumnCount = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const EmptyText = styled.p`
  margin: 0;
  padding: 24px 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

/**
 * 수업 이력/예정 데이터는 별도 담당(타 팀)의 소켓·API 연동 이후 채워진다.
 * 지금은 프로토타입과 동일한 레이아웃만 UI 셸로 제공한다(0건 상태).
 */
export const LessonStatusSection = () => (
  <Card>
    <Title>수업 현황</Title>
    <Columns>
      <Column>
        <ColumnHeader>
          <ColumnTitle>최근 완료</ColumnTitle>
          <ColumnCount>0건</ColumnCount>
        </ColumnHeader>
        <EmptyText>아직 진행한 수업이 없습니다</EmptyText>
      </Column>
      <Divider />
      <Column>
        <ColumnHeader>
          <ColumnTitle>예정</ColumnTitle>
          <ColumnCount>0건</ColumnCount>
        </ColumnHeader>
        <EmptyText>예정된 수업이 없습니다</EmptyText>
      </Column>
    </Columns>
  </Card>
);
