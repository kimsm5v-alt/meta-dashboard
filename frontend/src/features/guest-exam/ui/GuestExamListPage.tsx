/**
 * 게스트용 검사 목록 페이지
 * 그룹 가입 후 해당 그룹의 검사 목록 표시 (LNB 없는 심플 UI)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, LogOut } from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useAuth } from '@features/auth/model/AuthContext';
import { GuestExamCard } from './GuestExamCard';
import { getGuestExamList } from '../api/guestExamService';
import type { StudentExamListItem } from '@features/student-exam/types';

// ============================================================
// Styled Components
// ============================================================

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const PageRoot = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, #ede9fe, white, #eef2ff);
  padding: ${({ theme }) => theme.spacing.md};
`;

const Inner = styled.div`
  max-width: 480px;
  margin: 0 auto;
`;

const LoadingCenter = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom right, #ede9fe, white, #eef2ff);
`;

const LoadingContent = styled.div`
  text-align: center;
`;

const SpinnerIcon = styled(Loader2)`
  width: 48px;
  height: 48px;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
  margin: 0 auto ${({ theme }) => theme.spacing.md};
  display: block;
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
  padding-top: ${({ theme }) => theme.spacing['2xl']};
`;

const AvatarCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #ede9fe;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  svg {
    width: 40px;
    height: 40px;
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const WelcomeText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};

  strong {
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  }
`;

const EmptyCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing['2xl']};
  text-align: center;
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const TextButton = styled.button`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.xl}`};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: none;
  border: none;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const ExamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ExitRow = styled.div`
  margin-top: ${({ theme }) => theme.spacing['2xl']};
  text-align: center;
`;

const ExitButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.xl}`};
  color: ${({ theme }) => theme.colors.gray[500]};
  background: none;
  border: none;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[700]};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FooterNote = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

// ============================================================
// Component
// ============================================================

export const GuestExamListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [exams, setExams] = useState<StudentExamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExams = async () => {
      if (!user?.stdtId || !user?.classId) {
        setExams([]);
        setIsLoading(false);
        return;
      }

      try {
        const data = await getGuestExamList(user.classId, user.stdtId);
        setExams(data);
      } catch {
        setExams([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExams();
  }, [user]);

  const handleStartExam = (exam: StudentExamListItem) => {
    navigate('/guest/exam', {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.ordNo,
        examName: exam.name,
      },
    });
  };

  const handleResumeExam = (exam: StudentExamListItem) => {
    navigate('/guest/exam', {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.ordNo,
        examName: exam.name,
        resume: true,
      },
    });
  };

  const handleRestartExam = (exam: StudentExamListItem) => {
    navigate('/guest/exam', {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.ordNo,
        examName: exam.name,
        restart: true,
      },
    });
  };

  const handleExit = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <LoadingCenter>
        <LoadingContent>
          <SpinnerIcon />
          <LoadingText>검사 목록을 불러오는 중...</LoadingText>
        </LoadingContent>
      </LoadingCenter>
    );
  }

  return (
    <PageRoot>
      <Inner>
        <HeroSection>
          <AvatarCircle>
            <GraduationCap />
          </AvatarCircle>
          <PageTitle>학습심리정서검사</PageTitle>
          <WelcomeText>
            안녕하세요, <strong>{user?.name}</strong>님
          </WelcomeText>
        </HeroSection>

        {exams.length === 0 ? (
          <EmptyCard>
            <EmptyText>현재 응시 가능한 검사가 없습니다.</EmptyText>
            <TextButton onClick={handleExit}>종료</TextButton>
          </EmptyCard>
        ) : (
          <ExamList>
            {exams.map((exam) => (
              <GuestExamCard
                key={exam.dgnssResultId}
                exam={exam}
                onStartExam={handleStartExam}
                onResumeExam={handleResumeExam}
                onRestartExam={handleRestartExam}
              />
            ))}
          </ExamList>
        )}

        <ExitRow>
          <ExitButton onClick={handleExit}>
            <LogOut />
            종료하기
          </ExitButton>
        </ExitRow>

        <FooterNote>검사 완료 후 결과는 등록한 이메일로 발송됩니다.</FooterNote>
      </Inner>
    </PageRoot>
  );
};
