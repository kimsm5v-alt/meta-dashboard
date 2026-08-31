/**
 * 자기조절학습검사 페이지 (GNB: 검사)
 *
 * 학습종합검사(AssessmentPage)와 유사하나 다음 차이점 있음:
 * - 테마 색상: 틸(#009F88)
 * - LPA 유형 관련 기능 없음
 * - 20개 요인 분석 (3개 영역: 동기전략/인지전략/행동전략)
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChevronRight } from 'lucide-react';
import { SummaryCards, ExamOverviewTable, ExamManagementView, SelfregStudentResultView, SelfregClassTrackingView, SelfregStudentTrackingView } from '../components';
import type { SelfregStudentChangeData, SelfregClassChangeSummary } from '../components';
import {
  MOCK_EXAM_OVERVIEW_SUMMARY,
  MOCK_EXAM_OVERVIEW_ROWS,
  MOCK_CLASS_EXAM_DATA,
  MOCK_STUDENT_RESULTS,
} from '../mock-data';
import type { ExamOverviewRow, StudentExamResult } from '../types';
import { useLayoutContext } from '@/app/LayoutV2';
import { StudentHeader } from '@/shared/components';
import { SelfregClassResultView } from './SelfregClassResultView';
import { SELFREG_DOMAIN_COLORS, type SelfregCategory } from '@/shared/data/selfregFactors';

export const SelfregAssessmentPage = () => {
  const location = useLocation();
  const { selectedClass, setSelectedClass, selectedStudent, setSelectedStudent, activeSubTab, setActiveSubTab } = useLayoutContext();

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

  // LNB에서 학생 선택 시 selectedStudentResult 자동 설정 (결과보기, 변화추적 탭 모두)
  useEffect(() => {
    if (selectedStudent && selectedClass && (activeSubTab === 'result' || activeSubTab === 'tracking')) {
      const results = MOCK_STUDENT_RESULTS[selectedClass.id];
      const studentResult = results?.find(r => r.name === selectedStudent.name);
      if (studentResult) {
        setSelectedStudentResult(studentResult);
      }
    }
  }, [selectedStudent, selectedClass, activeSubTab]);

  // 결과보기 클릭 핸들러
  const handleViewResult = useCallback((row: ExamOverviewRow) => {
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

  // 학생 클릭 핸들러
  const handleStudentClick = useCallback((studentId: string) => {
    if (!selectedClass) return;
    const results = MOCK_STUDENT_RESULTS[selectedClass.id];
    const studentResult = results?.find(r => r.id === studentId);
    if (studentResult) {
      const lnbStudentId = `s${studentResult.number}`;
      setSelectedStudent({ id: lnbStudentId, name: studentResult.name });
      setSelectedStudentResult(studentResult);
      window.scrollTo(0, 0);
    }
  }, [selectedClass, setSelectedStudent]);

  // 학생 네비게이션 핸들러
  const handleNavigateStudent = useCallback((studentId: string) => {
    handleStudentClick(studentId);
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
  }, []);

  const handleEndExam = useCallback((round: 1 | 2) => {
    console.log('검사 종료:', round);
  }, []);

  const handleCancelExam = useCallback((round: 1 | 2) => {
    console.log('검사 취소:', round);
  }, []);

  const handleRestartExam = useCallback((round: 1 | 2) => {
    console.log('재검사:', round);
  }, []);

  // 서브탭별 페이지 제목 및 설명
  const getPageInfo = () => {
    switch (activeSubTab) {
      case 'result':
        return { title: '결과보기', desc: '반별 자기조절학습검사 결과를 확인할 수 있습니다.' };
      case 'tracking':
        return { title: '변화추적', desc: '학생들의 자기조절학습검사 결과 변화를 추적할 수 있습니다.' };
      case 'management':
      default:
        return { title: '검사관리', desc: '반별 자기조절학습검사 현황을 확인하고 관리할 수 있습니다.' };
    }
  };

  const pageInfo = getPageInfo();

  // 반 클릭 핸들러
  const handleClassClick = useCallback((classId: string, className: string) => {
    setSelectedClass({ id: classId, name: className, status: '' });
  }, [setSelectedClass]);

  // 반 미선택 상태: 서브탭별 전체 현황
  if (!selectedClass) {
    // 결과보기 서브탭
    if (activeSubTab === 'result') {
      return (
        <div className="p-6">
          <SelfregResultOverviewView onClassClick={handleClassClick} />
        </div>
      );
    }

    // 변화추적 서브탭
    if (activeSubTab === 'tracking') {
      return (
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{pageInfo.desc}</p>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-6 text-center">
            <p className="text-teal-700">
              변화추적 전체 현황 화면은 추후 구현 예정입니다.
            </p>
          </div>
        </div>
      );
    }

    // 검사관리 서브탭
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{pageInfo.desc}</p>
        </div>

        <SummaryCards summary={MOCK_EXAM_OVERVIEW_SUMMARY} />

        <ExamOverviewTable
          rows={MOCK_EXAM_OVERVIEW_ROWS}
          onViewResult={handleViewResult}
          onManageExam={handleManageExam}
        />
      </div>
    );
  }

  // 반 선택 상태
  const classData = MOCK_CLASS_EXAM_DATA[selectedClass.id];

  // 결과보기 서브탭 + 반 선택
  if (activeSubTab === 'result') {
    // 학생 선택 상태
    if (selectedStudent && selectedStudentResult) {
      const { prev, next } = getAdjacentStudents();
      return (
        <div className="p-6">
          <SelfregStudentResultView
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

    return (
      <div className="p-6">
        <SelfregClassResultView
          className={selectedClass.name}
          onBack={handleBackToOverview}
          onStudentClick={handleStudentClick}
          students={MOCK_STUDENT_RESULTS[selectedClass.id]}
        />
      </div>
    );
  }

  // 변화추적 서브탭 + 반 선택
  if (activeSubTab === 'tracking') {
    // Mock 변화추적 데이터 생성 (고정된 변화 패턴으로 유의미한 변화 표시)
    // 요인별 변화 패턴: 일부는 크게 상승, 일부는 크게 하락, 일부는 유지
    const MOCK_FACTOR_CHANGES = [
      +5, +7, +4,   // 학습원동력: 성장마인드셋+5, 학업효능감+7, 학습동기+4
      +3, +2, +6,   // 정서조절: 성적부담조절+3, 공부부담조절+2, 실패부담조절+6
      -4, +1, +2,   // 메타인지: 계획능력-4, 점검능력+1, 조절능력+2
      +0, -5, -3,   // 인지적 학습기술: 이해기술+0, 기억기술-5, 집중기술-3
      +4, +3, +1,   // 행동조절: 자기칭찬+4, 도움구하기+3, 학습지속성+1
      -6, +2, +3, +1, -4,  // 행동적 학습기술: 공부환경-6, 시간관리+2, 수업태도+3, 노트하기+1, 시험준비-4
    ];

    const trackingStudents: SelfregStudentChangeData[] = (MOCK_STUDENT_RESULTS[selectedClass.id] || []).map((result, studentIdx) => {
      // 1차 점수는 기존 tScores 사용
      const round1Scores = result.tScores.slice(0, 20);
      // 2차 점수는 고정된 변화 패턴 적용 (학생별로 약간의 차이를 주기 위해 studentIdx 활용)
      const studentVariation = (studentIdx % 3) - 1; // -1, 0, 1
      const round2Scores = round1Scores.map((s, idx) => {
        const baseChange = MOCK_FACTOR_CHANGES[idx] || 0;
        const actualChange = baseChange + studentVariation;
        return Math.max(20, Math.min(80, s + actualChange));
      });
      const round1Avg = Math.round(round1Scores.reduce((a, b) => a + b, 0) / round1Scores.length);
      const round2Avg = Math.round(round2Scores.reduce((a, b) => a + b, 0) / round2Scores.length);
      const change = round2Avg - round1Avg;

      return {
        id: result.id,
        number: result.number,
        name: result.name,
        round1Score: round1Avg,
        round2Score: round2Avg,
        change,
        changeDirection: change > 2 ? 'up' as const : change < -2 ? 'down' as const : 'same' as const,
        round1TScores: round1Scores,
        round2TScores: round2Scores,
        round1LearningStatus: {
          academicAchievement: 'mid' as const,
          gradeSatisfaction: 'mid' as const,
          learningMotivation: 'future' as const,
          selfStudyTime: '1-2h' as const,
          learningCounselor: 'family' as const,
        },
        round2LearningStatus: {
          academicAchievement: 'high' as const,
          gradeSatisfaction: 'mid' as const,
          learningMotivation: 'future' as const,
          selfStudyTime: '2-3h' as const,
          learningCounselor: 'teacher' as const,
        },
      };
    });

    const changeSummary: SelfregClassChangeSummary = {
      classId: selectedClass.id,
      className: selectedClass.name,
      round1Avg: Math.round(trackingStudents.reduce((sum, s) => sum + (s.round1Score || 0), 0) / trackingStudents.length),
      round2Avg: Math.round(trackingStudents.reduce((sum, s) => sum + (s.round2Score || 0), 0) / trackingStudents.length),
      avgChange: Math.round(trackingStudents.reduce((sum, s) => sum + (s.change || 0), 0) / trackingStudents.length),
      upCount: trackingStudents.filter(s => s.changeDirection === 'up').length,
      sameCount: trackingStudents.filter(s => s.changeDirection === 'same').length,
      downCount: trackingStudents.filter(s => s.changeDirection === 'down').length,
      totalCount: trackingStudents.length,
      round2Count: trackingStudents.length,
    };

    // 학생 변화추적 클릭 핸들러
    const handleTrackingStudentClick = (studentId: string) => {
      const studentData = trackingStudents.find(s => s.id === studentId);
      const studentResult = (MOCK_STUDENT_RESULTS[selectedClass.id] || []).find(r => r.id === studentId);
      if (studentData && studentResult) {
        const lnbStudentId = `s${studentResult.number}`;
        setSelectedStudent({ id: lnbStudentId, name: studentResult.name });
        setSelectedStudentResult(studentResult);
        window.scrollTo(0, 0);
      }
    };

    if (selectedStudent && selectedStudentResult) {
      // 선택된 학생의 변화추적 데이터 찾기
      const studentTrackingData = trackingStudents.find(s => s.id === selectedStudentResult.id);

      if (studentTrackingData) {
        return (
          <div className="p-6">
            <SelfregStudentTrackingView
              student={studentTrackingData}
              className={selectedClass.name}
              classId={selectedClass.id}
              onBack={handleBackToClassResult}
            />
          </div>
        );
      }
    }

    return (
      <div className="p-6">
        <SelfregClassTrackingView
          className={selectedClass.name}
          onBack={handleBackToOverview}
          changeSummary={changeSummary}
          students={trackingStudents}
          onStudentClick={handleTrackingStudentClick}
        />
      </div>
    );
  }

  // 검사관리 서브탭 + 반 선택
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

// ============================================================
// 자기조절학습검사용 결과 전체 현황 뷰
// ============================================================

interface SelfregClassSummary {
  id: string;
  name: string;
  grade: number;
  classNumber: number;
  totalStudents: number;
  assessedStudents: number;
  avgTScore: number;
  categoryAverages: {
    동기전략: number;
    인지전략: number;
    행동전략: number;
  };
  needsAttentionCount: number;
  round1Completed: boolean;
  round2Completed: boolean;
}

// Mock 데이터 - 자기조절학습검사용
const MOCK_SELFREG_CLASSES: SelfregClassSummary[] = [
  {
    id: 'group-1',
    name: '2-3반',
    grade: 2,
    classNumber: 3,
    totalStudents: 26,
    assessedStudents: 26,
    avgTScore: 52,
    categoryAverages: {
      동기전략: 54,
      인지전략: 51,
      행동전략: 50,
    },
    needsAttentionCount: 4,
    round1Completed: true,
    round2Completed: false,
  },
  {
    id: 'group-2',
    name: '2-4반',
    grade: 2,
    classNumber: 4,
    totalStudents: 28,
    assessedStudents: 25,
    avgTScore: 54,
    categoryAverages: {
      동기전략: 56,
      인지전략: 53,
      행동전략: 52,
    },
    needsAttentionCount: 2,
    round1Completed: true,
    round2Completed: true,
  },
  {
    id: 'group-3',
    name: '2-5반',
    grade: 2,
    classNumber: 5,
    totalStudents: 27,
    assessedStudents: 24,
    avgTScore: 49,
    categoryAverages: {
      동기전략: 48,
      인지전략: 47,
      행동전략: 51,
    },
    needsAttentionCount: 6,
    round1Completed: true,
    round2Completed: false,
  },
];

// 반별 색상
const CLASS_COLORS = ['#009F88', '#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B'];

// 3대 영역 순서
const SELFREG_CATEGORY_ORDER: SelfregCategory[] = ['동기전략', '인지전략', '행동전략'];

interface SelfregResultOverviewViewProps {
  onClassClick: (classId: string, className: string) => void;
}

const SelfregResultOverviewView: React.FC<SelfregResultOverviewViewProps> = ({ onClassClick }) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const classes = MOCK_SELFREG_CLASSES;

  // 전체 통계
  const totalStats = useMemo(
    () => ({
      totalClasses: classes.length,
      totalStudents: classes.reduce((sum, c) => sum + c.totalStudents, 0),
      assessedStudents: classes.reduce((sum, c) => sum + c.assessedStudents, 0),
      avgTScore:
        classes.length > 0
          ? Math.round(classes.reduce((sum, c) => sum + c.avgTScore, 0) / classes.length)
          : 0,
      needsAttentionCount: classes.reduce((sum, c) => sum + c.needsAttentionCount, 0),
    }),
    [classes]
  );

  // 라인 차트 데이터 변환
  const chartData = useMemo(() => {
    return SELFREG_CATEGORY_ORDER.map((category) => {
      const dataPoint: Record<string, string | number> = { category };
      classes.forEach((cls) => {
        const key = `${cls.grade}학년 ${cls.classNumber}반`;
        dataPoint[key] =
          cls.categoryAverages[category as keyof typeof cls.categoryAverages] || 50;
      });
      return dataPoint;
    });
  }, [classes]);

  const completionRate =
    totalStats.totalStudents > 0
      ? Math.round((totalStats.assessedStudents / totalStats.totalStudents) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">결과보기</h1>
        <p className="text-sm text-gray-500 mt-1">
          담당 학급 {classes.length}개 반 · 총 학생 {totalStats.totalStudents}명의 자기조절학습검사 결과를 확인할 수 있습니다.
        </p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500 mb-2">담당 반</p>
          <p className="text-3xl font-bold text-gray-900">
            {totalStats.totalClasses}
            <span className="text-lg font-medium text-gray-400 ml-1">개</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500 mb-2">검사 완료율</p>
          <p className="text-3xl font-bold text-gray-900">
            {completionRate}%
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {totalStats.assessedStudents}/{totalStats.totalStudents}명
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500 mb-2">상담 및 지도 필요</p>
          <p className="text-3xl font-bold text-red-500">
            {totalStats.needsAttentionCount}
            <span className="text-lg font-medium text-gray-400 ml-1">명</span>
          </p>
        </div>
      </div>

      {/* 반별 비교 분석 (라인 차트 + 요약 패널) */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">반별 비교 분석</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              각 반의 3대 전략 영역별 평균 T점수를 비교합니다. 점선(50)은 전국 평균입니다.
            </p>
          </div>
        </div>

        {/* 메인 콘텐츠: 차트 */}
        <div className="p-5">
          {/* 반 선택 칩 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedClassId(null)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                selectedClassId === null
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              전체 ({totalStats.totalStudents}명)
            </button>
            {classes.map((cls, idx) => {
              const color = CLASS_COLORS[idx % CLASS_COLORS.length];
              const isSelected = selectedClassId === cls.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(isSelected ? null : cls.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {cls.grade}학년 {cls.classNumber}반 ({cls.assessedStudents}명)
                </button>
              );
            })}
          </div>

          {/* 라인 차트 */}
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 13, fill: '#374151', fontWeight: 500 }}
                axisLine={{ stroke: '#D1D5DB', strokeWidth: 1.5 }}
                tickLine={false}
                padding={{ left: 60, right: 60 }}
              />
              <YAxis
                domain={[30, 70]}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                axisLine={{ stroke: '#D1D5DB', strokeWidth: 1.5 }}
                tickLine={false}
                ticks={[30, 40, 50, 60, 70]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  padding: '12px 16px',
                  fontSize: '13px',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px', fontSize: '13px', fontWeight: 500 }}
                iconType="line"
              />
              <ReferenceLine
                y={50}
                stroke="#9CA3AF"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: '전국 평균 (50)',
                  position: 'right',
                  fontSize: 11,
                  fill: '#6B7280',
                }}
              />
              {classes.map((cls, idx) => {
                const className = `${cls.grade}학년 ${cls.classNumber}반`;
                const isSelected = selectedClassId === cls.id;
                const hasSelection = selectedClassId !== null;
                const color = CLASS_COLORS[idx % CLASS_COLORS.length];

                return (
                  <Line
                    key={className}
                    type="linear"
                    dataKey={className}
                    stroke={color}
                    strokeWidth={isSelected ? 4 : hasSelection ? 2 : 3}
                    strokeOpacity={isSelected ? 1 : hasSelection ? 0.25 : 0.9}
                    dot={{
                      r: isSelected ? 6 : hasSelection ? 3 : 5,
                      fill: color,
                      strokeWidth: 2,
                      stroke: '#fff',
                    }}
                    activeDot={{ r: 8, fill: color, strokeWidth: 3, stroke: '#fff' }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default SelfregAssessmentPage;
