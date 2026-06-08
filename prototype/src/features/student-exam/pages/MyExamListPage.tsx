/**
 * 학생용 검사 목록 페이지 (나의 검사)
 *
 * 2종(학습종합검사, 자기조절학습검사) × 2회차 구조
 * 세로 섹션 스택 레이아웃
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Info } from 'lucide-react';
import { Button } from '@/shared/components';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ExamSection, EmptyExamList, ExamCardSkeleton } from '../components';
import type {
  StudentExamListItem,
  ExamSection as ExamSectionType,
  ExamType,
  ExamStatus,
} from '../types';
import { EXAM_TYPE_INFO } from '../types';

// [PROTOTYPE MOCK] 2종 × 2회차 목업 데이터
const MOCK_EXAMS: StudentExamListItem[] = [
  // 학습종합검사 (comp)
  {
    dgnssId: 1001,
    dgnssResultId: 5001,
    type: 'comp',
    round: 1,
    name: '1차 학습종합검사',
    status: 'result',
    progress: 100,
    answeredCount: 124,
    totalQuestions: 124,
    submittedAt: '2026-03-20',
    hasResult: true,
    recommendedMonth: '3월',
  },
  {
    dgnssId: 1002,
    dgnssResultId: 5002,
    type: 'comp',
    round: 2,
    name: '2차 학습종합검사',
    status: 'progress',
    progress: 45,
    answeredCount: 56,
    totalQuestions: 124,
    submittedAt: null,
    hasResult: false,
    recommendedMonth: '9월',
  },
  // 자기조절학습검사 (self)
  {
    dgnssId: 2001,
    dgnssResultId: 6001,
    type: 'self',
    round: 1,
    name: '1차 자기조절학습검사',
    status: 'ready',
    progress: 0,
    answeredCount: 0,
    totalQuestions: 80,
    submittedAt: null,
    hasResult: false,
    recommendedMonth: '6월',
  },
  {
    dgnssId: 2002,
    dgnssResultId: 6002,
    type: 'self',
    round: 2,
    name: '2차 자기조절학습검사',
    status: 'locked', // 1차 미제출로 잠김
    progress: 0,
    answeredCount: 0,
    totalQuestions: 80,
    submittedAt: null,
    hasResult: false,
    recommendedMonth: '12월',
  },
];

/** 완료 상태 판정 (awaiting/result 중 하나면 완료로 간주) */
const isCompleted = (status: ExamStatus): boolean =>
  status === 'awaiting' || status === 'result';

/** 검사 목록을 섹션으로 그룹화 */
const groupByType = (exams: StudentExamListItem[]): ExamSectionType[] => {
  const typeOrder: ExamType[] = ['comp', 'self'];

  return typeOrder.map((type) => {
    const typeExams = exams
      .filter((e) => e.type === type)
      .sort((a, b) => a.round - b.round);

    const completedCount = typeExams.filter((e) => isCompleted(e.status)).length;

    return {
      type,
      typeInfo: EXAM_TYPE_INFO[type],
      exams: typeExams,
      completedCount,
      totalCount: typeExams.length,
    };
  }).filter((section) => section.exams.length > 0);
};

export const MyExamListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<StudentExamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 섹션으로 그룹화
  const sections = useMemo(() => groupByType(exams), [exams]);

  // 검사 목록 로드
  const loadExams = async (showRefreshIndicator = false) => {
    if (!user) return;

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // [PROTOTYPE MOCK] 목업 데이터 우선 사용
      setExams(MOCK_EXAMS);
      setIsLoading(false);
      setIsRefreshing(false);
      return;

      /* 실제 API 연동 코드 (주석 처리)
      if (!user.stdtId) {
        console.warn('[MyExamListPage] stdtId가 없습니다:', user);
        setExams([]);
        return;
      }

      if (!user.classId) {
        console.info('[MyExamListPage] 그룹 미가입 상태');
        setExams([]);
        return;
      }

      const data = await getStudentExamList(user.classId, user.stdtId);
      setExams(data);
      */
    } catch (error) {
      console.error('[MyExamListPage] 검사 목록 로드 실패:', error);
      setExams([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [user]);

  // 검사 응시 시작
  const handleStartExam = (exam: StudentExamListItem) => {
    navigate(`/exam/student`, {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.round,
        examName: exam.name,
        examType: exam.type,
      },
    });
  };

  // 검사 이어하기
  const handleResumeExam = (exam: StudentExamListItem) => {
    navigate(`/exam/student`, {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.round,
        examName: exam.name,
        examType: exam.type,
        resume: true,
      },
    });
  };

  // 검사 새로하기 (처음부터 다시)
  const handleRestartExam = (exam: StudentExamListItem) => {
    navigate(`/exam/student`, {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.round,
        examName: exam.name,
        examType: exam.type,
        restart: true,
      },
    });
  };

  // 결과 보기
  const handleViewResult = (exam: StudentExamListItem) => {
    navigate(`/student/result/${exam.dgnssResultId}`);
  };

  // 새로고침
  const handleRefresh = () => {
    loadExams(true);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6" style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: 24 }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1E2230' }}>
              나의 검사
            </h1>
            <p className="mt-1" style={{ color: '#565C6E' }}>
              검사 현황을 확인하고 응시하세요
            </p>
          </div>
        </div>

        {/* 스켈레톤 */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <ExamCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: 24 }}>
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1E2230' }}>
            나의 검사
          </h1>
          <p className="mt-1" style={{ color: '#565C6E' }}>
            검사 현황을 확인하고 응시하세요
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-gray-500"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 검사 섹션 목록 */}
      {sections.length === 0 ? (
        <EmptyExamList />
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <ExamSection
              key={section.type}
              section={section}
              onStartExam={handleStartExam}
              onResumeExam={handleResumeExam}
              onRestartExam={handleRestartExam}
              onViewResult={handleViewResult}
            />
          ))}
        </div>
      )}

      {/* 안내 배너 */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{
          backgroundColor: '#E7F0FE',
          border: '1px solid #BCD4FC',
        }}
      >
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#2563EB' }} />
        <p className="text-sm" style={{ color: '#1E40AF' }}>
          선생님이 검사를 시작하면 응시할 수 있고, 중간에 멈춰도 저장되어 이어서 할 수 있어요.
          제출 후 선생님이 검사를 종료하면 결과를 확인할 수 있어요.
        </p>
      </div>
    </div>
  );
};
