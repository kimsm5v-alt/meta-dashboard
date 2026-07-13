/**
 * 검사 페이지 (GNB: 검사)
 *
 * - 반 미선택: 전체 현황 (요약 카드, 검사 현황 테이블) - 화면 1번
 * - 반 선택 + 검사관리: 응시 현황, 회차 관리, 학생 목록 - 화면 2번
 *
 * LayoutV2의 context를 사용하여 LNB와 상태 동기화
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 */

import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SummaryCards, ExamOverviewTable, ExamManagementView } from '../components';
import {
  MOCK_EXAM_OVERVIEW_SUMMARY,
  MOCK_EXAM_OVERVIEW_ROWS,
  MOCK_CLASS_EXAM_DATA,
} from '../mock-data';
import type { ExamOverviewRow } from '../types';
import { useLayoutContext } from '@/app/LayoutV2';
import { ResultOverviewView } from '@/features/class-dashboard';

export const AssessmentPage = () => {
  const location = useLocation();
  // LayoutV2 context 사용
  const { selectedClass, setSelectedClass, activeSubTab, setActiveSubTab } = useLayoutContext();

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
  }, [setSelectedClass]);

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

        {/* 안내 메시지 */}
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 text-center">
          <p className="text-primary-700">
            좌측 메뉴에서 <span className="font-semibold">반을 선택</span>하면 검사 관리를 시작할 수 있습니다.
          </p>
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

  // 반 선택 상태: 검사관리 (화면 2번)
  const classData = MOCK_CLASS_EXAM_DATA[selectedClass.id];

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
