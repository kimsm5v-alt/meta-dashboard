import styled from '@emotion/styled';
import { ClipboardList } from 'lucide-react';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Subtitle = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const NoticeCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding: 64px 24px;
  text-align: center;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const NoticeTitle = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const NoticeSub = styled.p`
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

export const RecordEmptyState = () => (
  <Wrapper>
    <Title>생활기록부 작성</Title>
    <Subtitle>행동특성 및 종합의견 작성을 지원합니다.</Subtitle>
    <NoticeCard>
      <ClipboardList size={36} color='#D1D5DB' />
      <NoticeTitle>좌측에서 반을 선택해 주세요.</NoticeTitle>
      <NoticeSub>
        선택한 반의 학생별 검사 결과를 바탕으로 생활기록부 문구 작성을 지원합니다.
      </NoticeSub>
    </NoticeCard>
  </Wrapper>
);
