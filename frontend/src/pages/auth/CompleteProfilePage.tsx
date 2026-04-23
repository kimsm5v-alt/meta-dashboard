import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { Card } from '@shared/components';
import { useSpAuth } from '@shared/hooks/useSpAuth';
import { apiClient } from '@shared/api/client';
import { useAuth } from '@features/auth/model/AuthContext';

// ============================================================
// 스타일
// ============================================================

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    to bottom right,
    ${({ theme }) => theme.colors.gray[50]},
    ${({ theme }) => theme.colors.gray[100]}
  );
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  padding: ${({ theme }) => theme.spacing['2xl']};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Required = styled.span`
  color: ${({ theme }) => theme.colors.error};
  margin-left: 2px;
`;

const OptionGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const OptionButton = styled.button<{ $selected: boolean }>`
  flex: 1;
  padding: 12px;
  border: 2px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.primary[500] : theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary[50] : 'white'};
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary[700] : theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme, $selected }) =>
    $selected ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.normal};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[300]};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

// ============================================================
// 컴포넌트
// ============================================================

export const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { user: spUser } = useSpAuth();
  const { updateUser } = useAuth();
  const [gender, setGender] = useState<'M' | 'F' | ''>('');
  const [roleCode, setRoleCode] = useState<'TEACHER' | 'STUDENT' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const needsRoleSelection = spUser?.userType === 'UNSET';

  // 이미 등록된 사용자면 대시보드로
  useEffect(() => {
    if (!spUser) return;

    apiClient
      .get<{ registered: boolean; roleCode?: string }>('/api/v1/user/status')
      .then((res) => {
        if (res.resultData?.registered) {
          const role = res.resultData.roleCode;
          navigate(role === 'STUDENT' ? '/student/exams' : '/dashboard', { replace: true });
        }
      })
      .catch(() => {
        // 미등록 → 현재 페이지 유지
      });
  }, [spUser, navigate]);

  const handleSubmit = async () => {
    if (!gender) {
      setError('성별을 선택해주세요.');
      return;
    }
    if (needsRoleSelection && !roleCode) {
      setError('역할을 선택해주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const res = await apiClient.post<{
        userNo: number;
        spUserId: string;
        roleCode: string;
        tcId: string | null;
        stdtId: string | null;
      }>('/api/v1/user/complete-profile', {
        gender,
        roleCode: needsRoleSelection ? roleCode : undefined,
      });

      const data = res.resultData;

      // AuthContext에 학심정 서비스 데이터 반영
      updateUser({
        id: String(data.userNo),
        spUserId: data.spUserId,
        roleCode: data.roleCode,
        tcId: data.tcId ?? undefined,
        stdtId: data.stdtId ?? undefined,
      });

      // 역할 기반 리다이렉트 우선 (가입 직후 returnPath로 들어온 /dashboard가 학생에게 적용되는 문제 방지)
      const defaultPath = data.roleCode === 'STUDENT' ? '/student/exams' : '/dashboard';
      const isStudent = data.roleCode === 'STUDENT';
      const redirectValid = redirectTo && (
        isStudent ? redirectTo.startsWith('/student') : !redirectTo.startsWith('/student')
      );
      navigate(redirectValid ? redirectTo : defaultPath, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '프로필 등록에 실패했습니다.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!spUser) return null;

  return (
    <PageContainer>
      <StyledCard>
        <Title>추가 정보 입력</Title>
        <Subtitle>서비스 이용을 위해 정보를 입력해주세요</Subtitle>

        {needsRoleSelection && (
          <>
            <SectionLabel>
              역할 선택 <Required>*</Required>
            </SectionLabel>
            <OptionGroup>
              <OptionButton
                type='button'
                $selected={roleCode === 'TEACHER'}
                onClick={() => setRoleCode('TEACHER')}
              >
                교사
              </OptionButton>
              <OptionButton
                type='button'
                $selected={roleCode === 'STUDENT'}
                onClick={() => setRoleCode('STUDENT')}
              >
                학생
              </OptionButton>
            </OptionGroup>
          </>
        )}

        <SectionLabel>
          성별 <Required>*</Required>
        </SectionLabel>
        <OptionGroup>
          <OptionButton
            type='button'
            $selected={gender === 'M'}
            onClick={() => setGender('M')}
          >
            남
          </OptionButton>
          <OptionButton
            type='button'
            $selected={gender === 'F'}
            onClick={() => setGender('F')}
          >
            여
          </OptionButton>
        </OptionGroup>

        {error && <ErrorText>{error}</ErrorText>}

        <SubmitButton
          onClick={handleSubmit}
          disabled={isSubmitting || !gender || (needsRoleSelection && !roleCode)}
        >
          {isSubmitting ? '등록 중...' : '시작하기'}
        </SubmitButton>
      </StyledCard>
    </PageContainer>
  );
};

export default CompleteProfilePage;
