/**
 * 검사관리 (반 전체) - 메인 뷰 (Handoff 기준 리뉴얼)
 *
 * 변경점:
 * - 기존 1차/2차 요약 카드 2개 제거
 * - Pill 스타일 세그먼트 탭으로 회차 전환
 * - 탭 자체에 상태 뱃지 + 진행률 표시
 * - 단일 패널에 통계·기간·액션 버튼·학생 테이블 배치
 *
 * @see prototype/design_handoff_raon_character/README.md
 */

import { useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { SegmentedRoundTabs } from './SegmentedRoundTabs';
import { StudentStatusTable } from './StudentStatusTable';
import type { ExamStatus, StudentExamStatus } from '../types';
import { EXAM_STATUS_LABELS } from '../types';

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
  onViewResult?: (round: 1 | 2) => void;
  onContinueExam?: (round: 1 | 2) => void;
}

// Mock 학교 정보
const MOCK_SCHOOL_INFO = {
  schoolName: '한빛중학교',
  eduLevel: '중학교',
};

// 날짜 포맷팅
const formatDate = (date?: Date): string => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/** 상태별 뱃지 스타일 */
const getStatusBadgeStyle = (status: ExamStatus) => {
  switch (status) {
    case 'not_started':
      return 'bg-[#F0EEF6] text-[#8A8798]';
    case 'in_progress':
      return 'bg-[#FFF3DD] text-[#C47B1D]';
    case 'completed':
      return 'bg-[#E6F7EE] text-[#12915C]';
    case 'cancelled':
      return 'bg-[#FDEAEA] text-[#D6453D]';
    default:
      return 'bg-[#F0EEF6] text-[#8A8798]';
  }
};

export const ExamManagementView: React.FC<ExamManagementViewProps> = ({
  className,
  groupId,
  rounds,
  onBack,
  onStartExam,
  onEndExam,
  onCancelExam,
  onRestartExam,
  onViewResult,
  onContinueExam,
}) => {
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);

  // 현재 선택된 회차 데이터
  const currentRoundData = rounds.find((r) => r.round === selectedRound) || rounds[0];

  // 2차 시작 가능 여부 (1차 completed 여부)
  const round1 = rounds.find((r) => r.round === 1);
  const canStartRound2 = round1?.status === 'completed';

  // 회차 선택
  const handleRoundSelect = useCallback((round: 1 | 2) => {
    setSelectedRound(round);
  }, []);

  // 진행률 계산
  const calculateProgress = (submitted: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((submitted / total) * 100);
  };

  // 미제출 학생 필터
  const getNotSubmittedStudents = (students: StudentExamStatus[]): StudentExamStatus[] => {
    return students.filter((s) => !s.submitted);
  };

  // 학년/반 파싱
  const parseClassName = (name: string) => {
    const match = name.match(/(\d+)-(\d+)/);
    if (match) {
      return `${match[1]}학년 ${match[2]}반`;
    }
    return name;
  };

  // 알림 전송
  const handleSendNotification = useCallback(() => {
    const notSubmitted = getNotSubmittedStudents(currentRoundData.students);
    console.log('미제출 학생 알림 전송:', notSubmitted.map((s) => s.name));
    // TODO: API 호출
  }, [currentRoundData.students]);

  const notSubmittedStudents = getNotSubmittedStudents(currentRoundData.students);
  const progress = calculateProgress(
    currentRoundData.submittedCount,
    currentRoundData.totalCount
  );

  // Pill 탭용 rounds 데이터
  const roundsForTabs = rounds.map((r) => ({
    ...r,
    canStart: r.round === 2 ? canStartRound2 : true,
  }));

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{className}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {MOCK_SCHOOL_INFO.schoolName} · {MOCK_SCHOOL_INFO.eduLevel}{' '}
          {parseClassName(className)}
        </p>
      </div>

      {/* Pill 스타일 세그먼트 탭 */}
      <SegmentedRoundTabs
        rounds={roundsForTabs}
        currentRound={selectedRound}
        onRoundChange={handleRoundSelect}
      />

      {/* 검사 관리 패널 (단일 카드) */}
      <div className="bg-white rounded-2xl border border-[#ECECF1]">
        {/* 헤더 행 */}
        <div className="border-b border-[#ECECF1]">
          {/* 첫 번째 행: 제목 + 상태 뱃지 + 도넛 + 통계 + 액션 버튼 */}
          <div className="flex items-center justify-between px-5 py-3">
            {/* 좌측: 제목 + 상태 뱃지 + 도넛 + 통계 */}
            <div className="flex items-center gap-4">
              {/* 제목 + 상태 */}
              <div className="flex items-center gap-3">
                <h2 className="text-[17px] font-extrabold text-gray-900">
                  {selectedRound}차 검사 관리
                </h2>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(currentRoundData.status)}`}
                >
                  {EXAM_STATUS_LABELS[currentRoundData.status]}
                </span>
                {/* 구분선 */}
                <div className="w-px h-5 bg-gray-300" />
              </div>

              {/* 도넛 차트 */}
              <div className="w-[46px] h-[46px] relative flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="23"
                    cy="23"
                    r="20"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="4"
                  />
                  <circle
                    cx="23"
                    cy="23"
                    r="20"
                    fill="none"
                    stroke="#6B46F2"
                    strokeWidth="4"
                    strokeDasharray={`${(progress / 100) * 126} 126`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-900">{progress}%</span>
                </div>
              </div>

              {/* 수치 */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  전체 <span className="font-semibold text-gray-900">{currentRoundData.totalCount}명</span>
                </span>
                <span style={{ color: '#6B46F2' }}>
                  제출{' '}
                  <span className="font-semibold">{currentRoundData.submittedCount}명</span>
                </span>
                {notSubmittedStudents.length > 0 && (
                  <span style={{ color: '#E8890C' }}>
                    미제출{' '}
                    <span className="font-semibold">{notSubmittedStudents.length}명</span>
                  </span>
                )}
              </div>
            </div>

            {/* 우측: 상태별 액션 버튼 */}
          <div className="flex items-center gap-2">
            {/* 시작 전 */}
            {currentRoundData.status === 'not_started' && (
              <div>
                <button
                  onClick={() => onStartExam(selectedRound)}
                  disabled={selectedRound === 2 && !canStartRound2}
                  className="min-w-[120px] px-6 py-[9px] rounded-[9px] text-[13.5px] font-bold transition-colors disabled:cursor-not-allowed"
                  style={{
                    backgroundColor:
                      selectedRound === 2 && !canStartRound2 ? '#E3E1EC' : '#6B46F2',
                    color: selectedRound === 2 && !canStartRound2 ? '#A09DB0' : '#FFF',
                  }}
                >
                  검사 시작
                </button>
                {selectedRound === 2 && !canStartRound2 && (
                  <p className="text-xs text-gray-500 mt-1">
                    1차 검사 완료 후 시작할 수 있어요
                  </p>
                )}
              </div>
            )}

            {/* 진행중 */}
            {currentRoundData.status === 'in_progress' && (
              <>
                <button
                  onClick={() => onEndExam(selectedRound)}
                  className="min-w-[120px] px-6 py-[9px] rounded-[9px] text-[13.5px] font-bold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#6B46F2' }}
                >
                  검사 종료
                </button>
                <button
                  onClick={() => onCancelExam(selectedRound)}
                  className="min-w-[120px] px-6 py-[9px] rounded-[9px] text-[13.5px] font-bold bg-white border border-[#E3E1EC] hover:bg-gray-50 transition-colors"
                  style={{ color: '#55525F' }}
                >
                  검사 취소
                </button>
              </>
            )}

            {/* 완료 */}
            {currentRoundData.status === 'completed' && (
              <>
                <button
                  onClick={() => onViewResult?.(selectedRound)}
                  className="min-w-[120px] px-6 py-[9px] rounded-[9px] text-[13.5px] font-bold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#6B46F2' }}
                >
                  결과 보기
                </button>
                <button
                  onClick={() => onContinueExam?.(selectedRound)}
                  className="min-w-[120px] px-6 py-[9px] rounded-[9px] text-[13.5px] font-bold bg-white border border-[#E3E1EC] hover:bg-gray-50 transition-colors"
                  style={{ color: '#55525F' }}
                >
                  추가 진행
                </button>
              </>
            )}

            {/* 취소됨 */}
            {currentRoundData.status === 'cancelled' && (
              <button
                onClick={() => onRestartExam(selectedRound)}
                className="min-w-[120px] px-6 py-[9px] rounded-[9px] text-[13.5px] font-bold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#6B46F2' }}
              >
                다시 진행하기
              </button>
            )}
            </div>
          </div>

          {/* 두 번째 행: 기간 텍스트 */}
          {(currentRoundData.startedAt || currentRoundData.endedAt) && (
            <div className="px-5 pb-3 flex items-center gap-3 text-xs text-gray-500">
              {currentRoundData.startedAt && (
                <span>시작: {formatDate(currentRoundData.startedAt)}</span>
              )}
              {currentRoundData.endedAt && (
                <span>종료: {formatDate(currentRoundData.endedAt)}</span>
              )}
            </div>
          )}
        </div>

        {/* 미제출 배너 (진행중 + 미응시>0) */}
        {currentRoundData.status === 'in_progress' && notSubmittedStudents.length > 0 && (
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{ backgroundColor: '#FFF8EF', borderColor: '#FDEEEA' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: '#C47B1D' }}>
                미제출 학생 {notSubmittedStudents.length}명
              </span>
              <div className="flex flex-wrap gap-1.5">
                {notSubmittedStudents.slice(0, 5).map((student) => (
                  <span
                    key={student.id}
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: '#FFF',
                      color: '#C47B1D',
                      border: '1px solid #FDEEEA',
                    }}
                  >
                    {student.number}. {student.name}
                  </span>
                ))}
                {notSubmittedStudents.length > 5 && (
                  <span className="px-2 py-1 text-xs" style={{ color: '#C47B1D' }}>
                    외 {notSubmittedStudents.length - 5}명
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleSendNotification}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8890C' }}
            >
              <Bell className="w-4 h-4" />
              알림 전송
            </button>
          </div>
        )}

        {/* 취소됨 상태: 빈 상태 화면 */}
        {currentRoundData.status === 'cancelled' && (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">검사가 취소되었습니다.</p>
            <p className="text-sm text-gray-400">
              '다시 진행하기' 버튼을 눌러 검사를 재시작하세요.
            </p>
          </div>
        )}

        {/* 학생 제출 현황 (취소됨이 아닐 때만) */}
        {currentRoundData.status !== 'cancelled' && (
          <StudentStatusTable students={currentRoundData.students} />
        )}
      </div>
    </div>
  );
};

export default ExamManagementView;
