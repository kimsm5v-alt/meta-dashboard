import styled from '@emotion/styled';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Subtitle = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const NoticeBox = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  text-align: center;
`;

const NoticeMain = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.primary[700]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const NoticeSub = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const TrackingEmptyState = () => (
  <Wrapper>
    <Title>변화추적</Title>
    <Subtitle>학생들의 검사 결과 변화를 추적할 수 있습니다.</Subtitle>
    <NoticeBox>
      <NoticeMain>변화추적을 확인하려면 좌측 LNB에서 반을 선택해주세요.</NoticeMain>
      <NoticeSub>1차/2차 검사가 완료된 반의 학생 변화를 추적할 수 있습니다.</NoticeSub>
    </NoticeBox>
  </Wrapper>
);
