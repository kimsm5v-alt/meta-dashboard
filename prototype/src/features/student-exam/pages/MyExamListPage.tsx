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
      // TODO: 실제 claId, stdtId를 user 정보에서 가져와야 함
      const claId = user.classId || 'mock-class';
      const stdtId = user.stdtId || 'mock-student';
      const data = await getStudentExamList(claId, stdtId, true); // Mock 모드
      setExams(data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load exams:', error);
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
    // TODO: 실제 검사 시작 로직
    // 현재는 검사 응시 페이지로 이동
    navigate(`/exam/META-${exam.dgnssId}`);
  };

  // 검사 이어하기
  const handleResumeExam = (exam: StudentExamListItem) => {
    navigate(`/exam/META-${exam.dgnssId}`);
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
