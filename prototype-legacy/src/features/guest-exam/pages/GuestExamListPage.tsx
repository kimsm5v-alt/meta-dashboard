/**
 * 게스트용 검사 목록 페이지
 *
 * 그룹 가입 후 해당 그룹의 검사 목록을 표시
 * LNB 없이 심플한 UI
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { GuestExamCard } from '../components';
import { getGuestExamList } from '../services/guestExamService';
import type { StudentExamListItem } from '@/features/student-exam/types';

export const GuestExamListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [exams, setExams] = useState<StudentExamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 검사 목록 로드
  useEffect(() => {
    const loadExams = async () => {
      if (!user?.stdtId || !user?.classId) {
        console.warn('[GuestExamListPage] 게스트 정보 없음:', user);
        setExams([]);
        setIsLoading(false);
        return;
      }

      try {
        const data = await getGuestExamList(user.classId, user.stdtId);
        setExams(data);
      } catch (error) {
        console.error('[GuestExamListPage] 검사 목록 로드 실패:', error);
        setExams([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExams();
  }, [user]);

  // 검사 시작
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

  // 검사 이어하기
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

  // 검사 새로하기
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

  // 종료 (로그아웃)
  const handleExit = () => {
    logout();
    navigate('/');
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">검사 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 p-4">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8 pt-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-4">
            <GraduationCap className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">학습심리정서검사</h1>
          <p className="text-gray-600">
            안녕하세요, <span className="font-semibold">{user?.name}</span>님
          </p>
        </div>

        {/* 검사 목록 */}
        {exams.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-500 mb-4">현재 응시 가능한 검사가 없습니다.</p>
            <button
              onClick={handleExit}
              className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
            >
              종료
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <GuestExamCard
                key={exam.dgnssResultId}
                exam={exam}
                onStartExam={handleStartExam}
                onResumeExam={handleResumeExam}
                onRestartExam={handleRestartExam}
              />
            ))}
          </div>
        )}

        {/* 종료 버튼 */}
        <div className="mt-8 text-center">
          <button
            onClick={handleExit}
            className="inline-flex items-center gap-2 px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            종료하기
          </button>
        </div>

        {/* 안내 문구 */}
        <p className="text-center text-xs text-gray-400 mt-4 pb-8">
          검사 완료 후 결과는 등록한 이메일로 발송됩니다.
        </p>
      </div>
    </div>
  );
};
