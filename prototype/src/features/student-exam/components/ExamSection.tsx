/**
 * 검사 섹션 컴포넌트
 *
 * 검사 종류별로 그룹화된 섹션 UI
 * - 섹션 헤더: 포인트 컬러 점 + 종류명 + n/2 완료 칩
 * - 카드 목록: ExamCard 컴포넌트 사용
 */

import type { ExamSection as ExamSectionType, StudentExamListItem } from '../types';
import { ExamCard } from './ExamCard';

interface ExamSectionProps {
  section: ExamSectionType;
  onStartExam: (exam: StudentExamListItem) => void;
  onResumeExam: (exam: StudentExamListItem) => void;
  onRestartExam: (exam: StudentExamListItem) => void;
  onViewResult: (exam: StudentExamListItem) => void;
}

export const ExamSection: React.FC<ExamSectionProps> = ({
  section,
  onStartExam,
  onResumeExam,
  onRestartExam,
  onViewResult,
}) => {
  const { typeInfo, exams, completedCount, totalCount } = section;

  return (
    <section className="space-y-3">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3">
        {/* 포인트 컬러 점 (ring) */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: typeInfo.color }}
        />

        {/* 종류명 */}
        <h2 className="text-lg font-bold text-gray-900">
          {typeInfo.name}
        </h2>

        {/* n/n 완료 칩 */}
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {completedCount}/{totalCount} 완료
        </span>

        {/* 구분선 */}
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 카드 목록 */}
      <div className="space-y-3">
        {exams.map((exam) => (
          <ExamCard
            key={`${exam.type}-${exam.round}`}
            exam={exam}
            onStartExam={onStartExam}
            onResumeExam={onResumeExam}
            onRestartExam={onRestartExam}
            onViewResult={onViewResult}
          />
        ))}
      </div>
    </section>
  );
};
