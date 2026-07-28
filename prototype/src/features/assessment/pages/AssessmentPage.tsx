/**
 * 검사 페이지 (GNB: 검사)
 *
 * - 반 미선택: 전체 현황 (요약 카드, 검사 현황 테이블) - 화면 1번
 * - 반 선택 + 검사관리: 응시 현황, 회차 관리, 학생 목록 - 화면 2번
 *
 * LayoutV2의 context를 사용하여 LNB와 상태 동기화
 * examType에 따라 학습종합검사(comp) / 자기조절학습검사(self) 분기
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 */

import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SummaryCards, ExamOverviewTable, ExamManagementView, ClassResultView, StudentResultView } from '../components';
import { SelfregAssessmentPage } from './SelfregAssessmentPage';
import {
  MOCK_EXAM_OVERVIEW_SUMMARY,
  MOCK_EXAM_OVERVIEW_ROWS,
  MOCK_CLASS_EXAM_DATA,
  MOCK_STUDENT_RESULTS,
} from '../mock-data';
import type { ExamOverviewRow, StudentExamResult } from '../types';
import { useLayoutContext } from '@/app/LayoutV2';
import { ResultOverviewView, MOCK_CLASS_RESULT } from '@/features/class-dashboard';
import { StudentHeader } from '@/shared/components';

export const AssessmentPage = () => {
  const location = useLocation();
  // LayoutV2 context 사용
  const { selectedClass, setSelectedClass, selectedStudent, setSelectedStudent, activeSubTab, setActiveSubTab, prototypeMode } = useLayoutContext();

  // 자기조절학습검사인 경우 별도 페이지 렌더링
  if (prototypeMode.examType === 'self') {
    return <SelfregAssessmentPage />;
  }

  // 학생 결과 상태
  const [selectedStudentResult, setSelectedStudentResult] = useState<StudentExamResult | null>(null);


  // URL path에 따라 activeSubTab 동기화
  useEffect(() => {
    const path = location.pathname;
    if (path === '/exam/management' || path === '/exam') {
      setActiveSubTab('management');
    } else if (path === '/exam/result') {
      setActiveSubTab('result');
    } else if (path === '/exam/tracking') {
      setActiveSubTab('tracking');
    }
  }, [location.pathname, setActiveSubTab]);

  // LNB에서 학생 선택 시 selectedStudentResult 자동 설정
  useEffect(() => {
    if (selectedStudent && selectedClass && activeSubTab === 'result') {
      const results = MOCK_STUDENT_RESULTS[selectedClass.id];
      // LNB의 학생 ID (s1, s2...)를 MOCK_STUDENT_RESULTS의 ID (sr1-1, sr2-1...)와 매칭
      // LNB 학생 이름으로 찾기
      const studentResult = results?.find(r => r.name === selectedStudent.name);
      if (studentResult) {
        setSelectedStudentResult(studentResult);
      }
    }
  }, [selectedStudent, selectedClass, activeSubTab]);

  // 결과보기 클릭 핸들러
  const handleViewResult = useCallback((row: ExamOverviewRow) => {
    // 반 선택 + 결과보기 서브탭으로 이동
    setSelectedClass({ id: row.groupId, name: row.className, status: '' });
  }, [setSelectedClass]);

  // 검사관리 클릭 핸들러
  const handleManageExam = useCallback((row: ExamOverviewRow) => {
    setSelectedClass({ id: row.groupId, name: row.className, status: '' });
  }, [setSelectedClass]);

  // 전체 현황으로 돌아가기
  const handleBackToOverview = useCallback(() => {
    setSelectedClass(null);
    setSelectedStudent(null);
    setSelectedStudentResult(null);
  }, [setSelectedClass, setSelectedStudent]);

  // 반 결과로 돌아가기 (학생 결과에서)
  const handleBackToClassResult = useCallback(() => {
    setSelectedStudent(null);
    setSelectedStudentResult(null);
  }, [setSelectedStudent]);

  // 학생 클릭 핸들러 (결과보기 > 반에서 학생 선택 시)
  // MOCK_STUDENT_RESULTS의 id(sr1-1)와 LNB의 MOCK_STUDENTS id(s1)가 다름
  // 학생 번호(number)를 기반으로 s{number} 형태로 변환하여 LNB와 동기화
  const handleStudentClick = useCallback((studentId: string) => {
    if (!selectedClass) return;
    const results = MOCK_STUDENT_RESULTS[selectedClass.id];
    const studentResult = results?.find(r => r.id === studentId);
    if (studentResult) {
      // LNB MOCK_STUDENTS와 호환되는 id 형태로 변환 (s1, s2, ...)
      const lnbStudentId = `s${studentResult.number}`;
      setSelectedStudent({ id: lnbStudentId, name: studentResult.name });
      setSelectedStudentResult(studentResult);
      // 학생 결과보기로 이동 시 스크롤 최상단으로
      window.scrollTo(0, 0);
    }
  }, [selectedClass, setSelectedStudent]);

  // 학생 네비게이션 핸들러 (이전/다음 학생 이동)
  const handleNavigateStudent = useCallback((studentId: string) => {
    handleStudentClick(studentId);
    // handleStudentClick 내부에서 scrollTo 처리됨
  }, [handleStudentClick]);

  // 이전/다음 학생 계산
  const getAdjacentStudents = useCallback(() => {
    if (!selectedClass || !selectedStudentResult) return { prev: undefined, next: undefined };
    const results = MOCK_STUDENT_RESULTS[selectedClass.id] || [];
    const currentIdx = results.findIndex(r => r.id === selectedStudentResult.id);
    return {
      prev: currentIdx > 0 ? { id: results[currentIdx - 1].id, name: results[currentIdx - 1].name } : undefined,
      next: currentIdx < results.length - 1 ? { id: results[currentIdx + 1].id, name: results[currentIdx + 1].name } : undefined,
    };
  }, [selectedClass, selectedStudentResult]);

  // 검사 시작/종료/취소/재검사 핸들러
  const handleStartExam = useCallback((round: 1 | 2) => {
    console.log('검사 시작:', round);
    // TODO: API 호출
  }, []);

  const handleEndExam = useCallback((round: 1 | 2) => {
    console.log('검사 종료:', round);
    // TODO: API 호출
  }, []);

  const handleCancelExam = useCallback((round: 1 | 2) => {
    console.log('검사 취소:', round);
    // TODO: API 호출
  }, []);

  const handleRestartExam = useCallback((round: 1 | 2) => {
    console.log('재검사:', round);
    // TODO: API 호출
  }, []);

  // 서브탭별 페이지 제목 및 설명
  const getPageInfo = () => {
    switch (activeSubTab) {
      case 'result':
        return { title: '결과보기', desc: '반별 검사 결과를 확인할 수 있습니다.' };
      case 'tracking':
        return { title: '변화추적', desc: '학생들의 검사 결과 변화를 추적할 수 있습니다.' };
      case 'management':
      default:
        return { title: '검사관리', desc: '반별 검사 현황을 확인하고 관리할 수 있습니다.' };
    }
  };

  const pageInfo = getPageInfo();

  // 반 클릭 핸들러 (결과보기 전체 현황에서 반 선택 시)
  const handleClassClick = useCallback((classId: string, className: string) => {
    setSelectedClass({ id: classId, name: className, status: '' });
  }, [setSelectedClass]);

  // 반 미선택 상태: 서브탭별 전체 현황
  if (!selectedClass) {
    // 결과보기 서브탭: 화면 3번 - ResultOverviewView 렌더링
    if (activeSubTab === 'result') {
      return (
        <div className="p-6">
          <ResultOverviewView onClassClick={handleClassClick} />
        </div>
      );
    }

    // 변화추적 서브탭: 화면 6번 (추후 구현)
    if (activeSubTab === 'tracking') {
      return (
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{pageInfo.desc}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-center">
            <p className="text-amber-700">
              변화추적 전체 현황 화면은 추후 구현 예정입니다.
            </p>
          </div>
        </div>
      );
    }

    // 검사관리 서브탭: 화면 1번
    return (
      <div className="p-6 space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{pageInfo.desc}</p>
        </div>

        {/* 요약 카드 */}
        <SummaryCards summary={MOCK_EXAM_OVERVIEW_SUMMARY} />

        {/* 검사 현황 테이블 */}
        <ExamOverviewTable
          rows={MOCK_EXAM_OVERVIEW_ROWS}
          onViewResult={handleViewResult}
          onManageExam={handleManageExam}
        />
      </div>
    );
  }

  // 반 선택 상태: 서브탭별 분기
  const classData = MOCK_CLASS_EXAM_DATA[selectedClass.id];

  // 결과보기 서브탭 + 반 선택: ClassResultView (화면 3-1) 또는 StudentResultView (화면 5번)
  if (activeSubTab === 'result') {
    // 학생 선택 상태: StudentResultView (화면 5번)
    if (selectedStudent && selectedStudentResult) {
      const { prev, next } = getAdjacentStudents();
      return (
        <div className="p-6">
          <StudentResultView
            result={selectedStudentResult}
            className={selectedClass.name}
            onBack={handleBackToClassResult}
            prevStudent={prev}
            nextStudent={next}
            onNavigateStudent={handleNavigateStudent}
          />
        </div>
      );
    }

    // Mock 데이터에서 className을 사용하여 결과 데이터 생성
    const classResultData = {
      ...MOCK_CLASS_RESULT,
      className: selectedClass.name,
    };

    return (
      <div className="p-6">
        <ClassResultView
          className={selectedClass.name}
          onBack={handleBackToOverview}
          resultData={classResultData}
          onStudentClick={handleStudentClick}
          students={MOCK_STUDENT_RESULTS[selectedClass.id]}
        />
      </div>
    );
  }

  // 변화추적 서브탭 + 반 선택 (추후 구현)
  if (activeSubTab === 'tracking') {
    // 학생 선택 시 학생 헤더 표시
    if (selectedStudent && selectedStudentResult) {
      return (
        <div className="p-6 space-y-6">
          <StudentHeader
            studentNumber={selectedStudentResult.number}
            studentName={selectedStudentResult.name}
            lpaType={selectedStudentResult.predictedType}
            className={selectedClass.name}
            onBack={handleBackToClassResult}
          />
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-center">
            <p className="text-amber-700">
              변화추적 학생 상세 화면은 추후 구현 예정입니다.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToOverview}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← 전체 현황
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedClass.name} 변화추적</h1>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 text-center">
          <p className="text-amber-700">
            변화추적 반별 상세 화면은 추후 구현 예정입니다.
          </p>
        </div>
      </div>
    );
  }

  // 검사관리 서브탭 + 반 선택: ExamManagementView (화면 2)
  if (!classData) {
    return (
      <div className="p-6">
        <button
          onClick={handleBackToOverview}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← 전체 현황
        </button>
        <p className="mt-4 text-gray-500">해당 반의 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ExamManagementView
        className={classData.className}
        groupId={classData.groupId}
        rounds={classData.rounds}
        onBack={handleBackToOverview}
        onStartExam={handleStartExam}
        onEndExam={handleEndExam}
        onCancelExam={handleCancelExam}
        onRestartExam={handleRestartExam}
      />
    </div>
  );
};

export default AssessmentPage;
