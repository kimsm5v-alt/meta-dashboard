import styled from '@emotion/styled';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, FormField } from '@shared/ui';

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  padding: ${({ theme }) => theme.spacing['2xl']};
`;

const Logo = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background: ${({ theme }) => theme.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.lg} 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.gray[200]};
  }
`;

const DividerText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.disabled};
`;

export const LoginPage = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (_data: LoginFormData) => {
    // TODO: 실제 로그인 API 연동
    navigate('/dashboard');
  };

  const handleDemoLogin = () => {
    navigate('/dashboard');
  };

  return (
    <PageWrapper>
      <LoginCard variant='glass'>
        <Logo>META</Logo>
        <Subtitle>학습 진단 대시보드에 로그인하세요</Subtitle>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormField label='이메일' htmlFor='email'>
            <Input
              id='email'
              type='email'
              placeholder='teacher@school.ac.kr'
              error={errors.email?.message}
              {...register('email')}
            />
          </FormField>
          <FormField label='비밀번호' htmlFor='password'>
            <Input
              id='password'
              type='password'
              placeholder='비밀번호를 입력하세요'
              error={errors.password?.message}
              {...register('password')}
            />
          </FormField>
          <Button type='submit' fullWidth disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
        </Form>

        <Divider>
          <DividerText>또는</DividerText>
        </Divider>

        <Button variant='outline' fullWidth onClick={handleDemoLogin}>
          데모 계정으로 체험하기
        </Button>
      </LoginCard>
    </PageWrapper>
  );
};
