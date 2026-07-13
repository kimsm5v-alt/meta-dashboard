/**
 * 검사관리 (반 전체) - 메인 뷰
 *
 * 화면 2번: 반 선택 + 반 전체 상태에서 검사관리 서브탭
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 */

import { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ExamStatusCard } from './ExamStatusCard';
import { RoundTabs } from './RoundTabs';
import { StudentStatusTable } from './StudentStatusTable';
import type { ExamStatus, StudentExamStatus } from '../types';

interface RoundData {
  round: 1 | 2;
  status: ExamStatus;
  submittedCount: number;
  totalCount: number;
  startedAt?: Date;
  endedAt?: Date;
  students: StudentExamStatus[];
}

interface ExamManagementViewProps {
  className: string;
  groupId: string;
  rounds: RoundData[];
  onBack: () => void;
  onStartExam: (round: 1 | 2) => void;
  onEndExam: (round: 1 | 2) => void;
  onCancelExam: (round: 1 | 2) => void;
  onRestartExam: (round: 1 | 2) => void;
}

export const ExamManagementView: React.FC<ExamManagementViewProps> = ({
  className,
  groupId,
  rounds,
  onBack,
  onStartExam,
  onEndExam,
  onCancelExam,
  onRestartExam,
}) => {
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);

  // 현재 회차 데이터
  const currentRoundData = rounds.find((r) => r.round === currentRound) || rounds[0];

  // 회차 변경
  const handleRoundChange = useCallback((round: 1 | 2) => {
    setCurrentRound(round);
  }, []);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">검사관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            {className} · META 학습심리정서검사
          </p>
        </div>
      </div>

      {/* 회차 탭 */}
      <RoundTabs
        rounds={rounds.map((r) => ({
          round: r.round,
          status: r.status,
          submittedCount: r.submittedCount,
          totalCount: r.totalCount,
        }))}
        currentRound={currentRound}
        onRoundChange={handleRoundChange}
      />

      {/* 응시 현황 카드 */}
      <ExamStatusCard
        className={className}
        round={currentRound}
        status={currentRoundData.status}
        submittedCount={currentRoundData.submittedCount}
        totalCount={currentRoundData.totalCount}
        students={currentRoundData.students}
        onStartExam={() => onStartExam(currentRound)}
        onEndExam={() => onEndExam(currentRound)}
        onCancelExam={() => onCancelExam(currentRound)}
        onRestartExam={() => onRestartExam(currentRound)}
      />

      {/* 학생 응시 현황 테이블 */}
      <StudentStatusTable students={currentRoundData.students} />
    </div>
  );
};

export default ExamManagementView;
