/**
 * 학생용 검사 목록 페이지
 *
 * 학생이 자신의 검사 현황을 확인하고 응시/결과 조회하는 페이지
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ExamCard, EmptyExamList, ExamCardSkeleton } from '../components';
import { getStudentExamList } from '../services/studentExamService';
import type { StudentExamListItem } from '../types';

export const MyExamListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exams, setExams] = useState<StudentExamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 검사 목록 로드
  const loadExams = async (showRefreshIndicator = false) => {
    if (!user) return;

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (!user.stdtId) {
        console.warn('[MyExamListPage] stdtId가 없습니다:', user);
        setExams([]);
        return;
      }

      // classId가 없으면 그룹 미가입 상태 (빈 배열 반환)
      if (!user.classId) {
        console.info('[MyExamListPage] 그룹 미가입 상태');
        setExams([]);
        return;
      }

      const data = await getStudentExamList(user.classId, user.stdtId);
      setExams(data);
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
    // 로그인된 학생은 dgnssResultId를 state로 전달
    navigate(`/exam/student`, {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.ordNo,
        examName: exam.name,
      }
    });
  };

  // 검사 이어하기
  const handleResumeExam = (exam: StudentExamListItem) => {
    navigate(`/exam/student`, {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.ordNo,
        examName: exam.name,
        resume: true, // 이어하기 플래그 - 안내 페이지 스킵
      }
    });
  };

  // 검사 새로하기 (처음부터 다시)
  const handleRestartExam = (exam: StudentExamListItem) => {
    // TODO: 새로 시작 확인 모달 추가 필요
    navigate(`/exam/student`, {
      state: {
        dgnssResultId: exam.dgnssResultId,
        dgnssId: exam.dgnssId,
        ordNo: exam.ordNo,
        examName: exam.name,
        restart: true, // 새로 시작 플래그
      }
    });
  };

  // 결과 보기
  const handleViewResult = (exam: StudentExamListItem) => {
    // TODO: 학생용 결과 페이지로 이동
    navigate(`/student/result/${exam.dgnssResultId}`);
  };

  // 새로고침
  const handleRefresh = () => {
    loadExams(true);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">나의 검사</h1>
            <p className="text-gray-500 mt-1">검사 현황을 확인하고 응시하세요</p>
          </div>
        </div>

        {/* 스켈레톤 */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <ExamCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">나의 검사</h1>
            <p className="text-gray-500 mt-0.5">검사 현황을 확인하고 응시하세요</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-gray-500"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 검사 목록 */}
      {exams.length === 0 ? (
        <EmptyExamList />
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <ExamCard
              key={exam.dgnssResultId}
              exam={exam}
              onStartExam={handleStartExam}
              onResumeExam={handleResumeExam}
              onRestartExam={handleRestartExam}
              onViewResult={handleViewResult}
            />
          ))}
        </div>
      )}

      {/* 안내 문구 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>안내:</strong> 검사는 중간에 저장되므로, 나중에 이어서 응시할 수 있습니다.
          모든 문항에 응답한 후 제출하면 결과를 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
