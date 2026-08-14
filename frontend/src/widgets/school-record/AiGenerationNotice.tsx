import styled from '@emotion/styled';
import { Sparkles } from 'lucide-react';

const Box = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  text-align: center;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px dashed ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const Title = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Description = styled.p`
  margin: 0;
  max-width: 420px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: 1.6;
`;

const SubText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

interface AiGenerationNoticeProps {
  /** 추가 안내(예: 활성화 조건 미충족 사유) */
  subText?: string;
}

export const AiGenerationNotice = ({ subText }: AiGenerationNoticeProps) => (
  <Box>
    <Sparkles size={20} color='#9CA3AF' />
    <Title>AI 문구 생성은 준비 중입니다</Title>
    <Description>
      관찰 입력은 임시저장되며, 연동이 완료되면 이 화면에서 AI 참고 문구를 생성할 수 있습니다.
    </Description>
    {subText && <SubText>{subText}</SubText>}
  </Box>
);
