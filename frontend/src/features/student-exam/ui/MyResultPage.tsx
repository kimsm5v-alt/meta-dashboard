/**
 * 학생용 결과 조회 페이지
 * 학생 본인의 검사 결과 열람 (추후 API 연동)
 */

import { BarChart3 } from 'lucide-react';
import styled from '@emotion/styled';

const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const HeaderIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: #dcfce7;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: #16a34a;
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

const Placeholder = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 64px ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const PlaceholderIconCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #dcfce7;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  svg {
    width: 32px;
    height: 32px;
    color: #16a34a;
  }
`;

const PlaceholderTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const PlaceholderDesc = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const MyResultPage: React.FC = () => {
  return (
    <PageRoot>
      <PageHeader>
        <HeaderIconBox><BarChart3 /></HeaderIconBox>
        <div>
          <PageTitle>대시보드</PageTitle>
          <PageSubtitle>나의 검사 결과를 확인하세요</PageSubtitle>
        </div>
      </PageHeader>

      <Placeholder>
        <PlaceholderIconCircle><BarChart3 /></PlaceholderIconCircle>
        <PlaceholderTitle>결과 준비 중</PlaceholderTitle>
        <PlaceholderDesc>검사를 완료하면 결과를 확인할 수 있습니다.</PlaceholderDesc>
      </Placeholder>
    </PageRoot>
  );
};
