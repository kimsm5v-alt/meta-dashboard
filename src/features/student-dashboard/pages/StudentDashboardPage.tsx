import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { getClassById, getStudentById } from '../../../shared/data/mockData';
import {
  DiagnosisSummary,
  FactorLineChart,
  TypeClassification,
  TypeDeviations,
  CoachingStrategy,
} from '../components';

export const StudentDashboardPage = () => {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const navigate = useNavigate();
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);
  const [isCoachingOpen, setIsCoachingOpen] = useState(false);

  const classData = classId ? getClassById(classId) : undefined;
  const student = classId && studentId ? getStudentById(classId, studentId) : undefined;

  if (!classData || !student) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">학생을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const r1 = student.assessments.find(a => a.round === 1);
  const r2 = student.assessments.find(a => a.round === 2);
  const current = selectedRound === 2 && r2 ? r2 : r1;

  if (!current) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">검사 결과가 없습니다.</p>
      </div>
    );
  }

  const currentIdx = classData.students.findIndex(s => s.id === studentId);
  const prev = currentIdx > 0 ? classData.students[currentIdx - 1] : null;
  const next = currentIdx < classData.students.length - 1 ? classData.students[currentIdx + 1] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/dashboard/class/${classId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {student.number}번 {student.name}
            </h1>
            <p className="text-gray-500">
              {classData.grade}학년 {classData.classNumber}반
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => prev && navigate(`/dashboard/class/${classId}/student/${prev.id}`)}
            disabled={!prev}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">
            {currentIdx + 1} / {classData.students.length}
          </span>
          <button
            onClick={() => next && navigate(`/dashboard/class/${classId}/student/${next.id}`)}
            disabled={!next}
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Round Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedRound(1)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedRound === 1
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          1차 검사
        </button>
        <button
          onClick={() => setSelectedRound(2)}
          disabled={!r2}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedRound === 2
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          2차 검사
        </button>
      </div>

      {/* 1. 진단결과 한눈에 보기 */}
      <section>
        <h2 className="text-xl font-bold mb-4">진단결과 한눈에 보기</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 총평 */}
          <div className="p-6 border-b border-gray-200">
            <DiagnosisSummary
              tScores={current.tScores}
              studentType={current.predictedType}
            />
          </div>

          {/* 중분류 요인 그래프 */}
          <div className="p-6">
            <FactorLineChart tScores={current.tScores} />
          </div>
        </div>
      </section>

      {/* 2. 학습 유형 알아보기 */}
      <section>
        <h2 className="text-xl font-bold mb-4">학습 유형 알아보기</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 유형 분류 */}
          <div className="p-6 border-b border-gray-200">
            <TypeClassification
              predictedType={current.predictedType}
              typeProbabilities={current.typeProbabilities}
              schoolLevel={student.schoolLevel}
            />
          </div>

          {/* 유형별 특이점 + 코칭 전략 버튼 */}
          <div className="p-6">
            <TypeDeviations
              tScores={current.tScores}
              predictedType={current.predictedType}
              schoolLevel={student.schoolLevel}
              onCoachingClick={() => setIsCoachingOpen(true)}
            />
          </div>
        </div>
      </section>

      {/* 3. 코칭 전략 모달 */}
      <CoachingStrategy
        predictedType={current.predictedType}
        schoolLevel={student.schoolLevel}
        isOpen={isCoachingOpen}
        onClose={() => setIsCoachingOpen(false)}
      />
    </div>
  );
};

export default StudentDashboardPage;
