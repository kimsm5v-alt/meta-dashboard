/**
 * 결과보기 페이지 (GNB: 검사 > 서브탭: 결과보기)
 *
 * - 반 전체: 종합 결과 요약, 요인별 분포, 위험군, 유형별(LPA), 강점/보완점 - 화면 3번
 * - 학생 선택: 학생 요약, 요인별 점수, 유형 설명, AI 총평, 강점/보완점 - 화면 4번
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 */

import { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  ClassSummaryCard,
  LPADistributionChart,
  RiskStudentsList,
  StrengthWeaknessCard,
  StudentSummaryHeader,
  AISummaryCard,
  TypeDescriptionCard,
} from '../components';
import { MOCK_CLASS_RESULT, MOCK_STUDENTS, getStudentById } from '../mock-data';
import type { StudentResult } from '../types';

export const ClassDashboardPage = () => {
  // 선택된 학생 ID (null = 반 전체)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // 학생 선택 핸들러
  const handleStudentClick = useCallback((studentId: string) => {
    setSelectedStudentId(studentId);
  }, []);

  // 반 전체로 돌아가기
  const handleBackToClass = useCallback(() => {
    setSelectedStudentId(null);
  }, []);

  // 상담하기 클릭
  const handleCounselingClick = useCallback(() => {
    console.log('상담하기:', selectedStudentId);
    // TODO: 상담 페이지로 이동
  }, [selectedStudentId]);

  // 코칭 전략 클릭
  const handleCoachingClick = useCallback(() => {
    console.log('코칭 전략:', selectedStudentId);
    // TODO: 코칭 페이지로 이동
  }, [selectedStudentId]);

  // 학생 선택 상태: 학생 개인 결과 (화면 4번)
  if (selectedStudentId) {
    const student = getStudentById(selectedStudentId);

    if (!student) {
      return (
        <div className="p-6">
          <button
            onClick={handleBackToClass}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            반 전체로 돌아가기
          </button>
          <p className="text-gray-500">해당 학생을 찾을 수 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToClass}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <p className="text-sm text-gray-500">{MOCK_CLASS_RESULT.className} · 결과보기</p>
          </div>
        </div>

        {/* 학생 요약 (상단) */}
        <StudentSummaryHeader
          student={student}
          onCounselingClick={handleCounselingClick}
          onCoachingClick={handleCoachingClick}
        />

        {/* AI 총평 */}
        <AISummaryCard
          summary={student.aiSummary}
          studentName={student.name}
        />

        <div className="grid grid-cols-2 gap-6">
          {/* 유형 설명 */}
          <TypeDescriptionCard
            lpaType={student.lpaType}
            description={student.typeDescription}
            characteristics={student.typeCharacteristics}
          />

          {/* 강점/보완점 */}
          <StrengthWeaknessCard
            strengths={student.strengths.map((s) => s.name)}
            weaknesses={student.weaknesses.map((w) => w.name)}
            title="개인 강점 / 보완점"
          />
        </div>

        {/* TODO: 요인별 점수 차트 (38개 요인 T점수 레이더/바 차트) */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">요인별 점수</h3>
          <p className="text-gray-500 text-sm">요인별 T점수 차트 (개발 예정)</p>
        </div>
      </div>
    );
  }

  // 반 전체 상태: 반 종합 결과 (화면 3번)
  return (
    <div className="p-6 space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">결과보기</h1>
        <p className="mt-1 text-sm text-gray-500">
          반 전체 검사 결과를 확인하고, 학생별 상세 분석을 볼 수 있습니다.
        </p>
      </div>

      {/* 종합 결과 요약 */}
      <ClassSummaryCard summary={MOCK_CLASS_RESULT} />

      <div className="grid grid-cols-2 gap-6">
        {/* LPA 유형 분포 */}
        <LPADistributionChart
          distribution={MOCK_CLASS_RESULT.lpaDistribution}
          totalCount={MOCK_CLASS_RESULT.assessedCount}
        />

        {/* 위험군 현황 */}
        <RiskStudentsList
          students={MOCK_CLASS_RESULT.riskStudents}
          onStudentClick={handleStudentClick}
        />
      </div>

      {/* 강점/보완점 */}
      <StrengthWeaknessCard
        strengths={MOCK_CLASS_RESULT.strengths.map((s) => s.factorName)}
        weaknesses={MOCK_CLASS_RESULT.weaknesses.map((w) => w.factorName)}
        title="반 전체 강점 / 보완점"
      />

      {/* 학생 목록 (간략) */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">학생별 결과</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {MOCK_STUDENTS.map((student) => (
            <button
              key={student.id}
              onClick={() => handleStudentClick(student.id)}
              className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
            >
              <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 text-sm font-medium flex items-center justify-center">
                {student.number}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{student.name}</p>
                <p className="text-xs text-gray-500 truncate">{student.lpaType}</p>
              </div>
              {student.needsAttention && (
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassDashboardPage;
