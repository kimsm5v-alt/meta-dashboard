import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { useMyGroupsQuery } from '@features/api';
import { Card } from '@shared/components';
import { openMypageGroups } from '@shared/lib/mypage';
import { buildScopeQueryString } from '@shared/scope';

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
`;

const LinkButton = styled.button`
  padding: 14px 12px;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-align: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.primary[700]};
    background: ${({ theme }) => theme.colors.primary[50]};
    border-color: ${({ theme }) => theme.colors.primary[200]};
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

export const QuickLinksCard = () => {
  const navigate = useNavigate();
  const { data: groups = [] } = useMyGroupsQuery();
  const firstGroupId = groups[0]?.id;
  const scopeQuery = firstGroupId
    ? buildScopeQueryString({ level: 'class', classId: firstGroupId })
    : '';
  const hasGroups = !!firstGroupId;

  return (
    <Card>
      <Title>바로가기</Title>
      <Stack>
        <LinkButton onClick={() => openMypageGroups('list')}>그룹 관리</LinkButton>
        <Row>
          <LinkButton
            disabled={!hasGroups}
            onClick={() => navigate(`/exam/management${scopeQuery}`)}
          >
            검사 관리
          </LinkButton>
          <LinkButton disabled={!hasGroups} onClick={() => navigate(`/exam/result${scopeQuery}`)}>
            검사 결과
          </LinkButton>
        </Row>
        <Row>
          <LinkButton
            disabled={!hasGroups}
            onClick={() => navigate(`/coaching/class${scopeQuery}`)}
          >
            코칭
          </LinkButton>
          <LinkButton
            disabled={!hasGroups}
            onClick={() => navigate(`/lesson/library${scopeQuery}`)}
          >
            수업 자료실
          </LinkButton>
        </Row>
      </Stack>
    </Card>
  );
};
