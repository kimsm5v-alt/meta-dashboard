/**
 * 검사관리 (반 전체) - 메인 뷰
 *
 * 화면 2번: 반 선택 + 반 전체 상태에서 검사관리 서브탭
 * - 제목: %그룹명%
 * - 부제: %학교명% · %교과급% n학년 n반
 * - 1차/2차: 카드 형태로 나란히 배치, 클릭 시 하단 상세 표시
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 */

import { useState, useCallback } from 'react';
import { ArrowLeft, Bell, ChevronRight } from 'lucide-react';
import { StudentStatusTable } from './StudentStatusTable';
import type { ExamStatus, StudentExamStatus } from '../types';
import { EXAM_STATUS_LABELS, EXAM_STATUS_STYLES } from '../types';

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

// Mock 학교 정보 (실제로는 API에서 가져옴)
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
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);
  const [showNotSubmittedOnly, setShowNotSubmittedOnly] = useState(false);

  // 현재 선택된 회차 데이터
  const currentRoundData = rounds.find((r) => r.round === selectedRound) || rounds[0];

  // 회차 선택
  const handleRoundSelect = useCallback((round: 1 | 2) => {
    setSelectedRound(round);
    setShowNotSubmittedOnly(false);
  }, []);

  // 응시율 계산
  const calculateRate = (submitted: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((submitted / total) * 100);
  };

  // 미응시 학생 필터
  const getNotSubmittedStudents = (students: StudentExamStatus[]): StudentExamStatus[] => {
    return students.filter((s) => !s.submitted);
  };

  // 학년/반 파싱 (예: "2-3반" -> "2학년 3반")
  const parseClassName = (name: string) => {
    const match = name.match(/(\d+)-(\d+)/);
    if (match) {
      return `${match[1]}학년 ${match[2]}반`;
    }
    return name;
  };

  // 알림 전송 핸들러
  const handleSendNotification = useCallback(() => {
    const notSubmitted = getNotSubmittedStudents(currentRoundData.students);
    console.log('미응시 학생 알림 전송:', notSubmitted.map(s => s.name));
    // TODO: API 호출
  }, [currentRoundData.students]);

  // 결과보기 핸들러
  const handleViewResult = useCallback(() => {
    console.log('결과보기:', selectedRound);
    // TODO: 결과보기 페이지로 이동
  }, [selectedRound]);

  // 추가 진행 핸들러
  const handleContinueExam = useCallback(() => {
    console.log('추가 진행:', selectedRound);
    // TODO: API 호출
  }, [selectedRound]);

  const notSubmittedStudents = getNotSubmittedStudents(currentRoundData.students);
  const displayStudents = showNotSubmittedOnly ? notSubmittedStudents : currentRoundData.students;

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
          <h1 className="text-2xl font-bold text-gray-900">{className}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {MOCK_SCHOOL_INFO.schoolName} · {MOCK_SCHOOL_INFO.eduLevel} {parseClassName(className)}
          </p>
        </div>
      </div>

      {/* 1차/2차 검사 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rounds.map((roundInfo) => {
          const isSelected = roundInfo.round === selectedRound;
          const rate = calculateRate(roundInfo.submittedCount, roundInfo.totalCount);
          const statusStyle = EXAM_STATUS_STYLES[roundInfo.status];
          const notSubmitted = getNotSubmittedStudents(roundInfo.students);

          return (
            <button
              key={roundInfo.round}
              onClick={() => handleRoundSelect(roundInfo.round)}
              className={`relative bg-white rounded-xl border-2 p-5 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 ring-2 ring-primary-100'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* 카드 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">
                    {roundInfo.round}차 검사
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    {EXAM_STATUS_LABELS[roundInfo.status]}
                  </span>
                </div>
                <ChevronRight className={`w-5 h-5 transition-colors ${isSelected ? 'text-primary-500' : 'text-gray-300'}`} />
              </div>

              {/* 응시 현황 */}
              <div className="flex items-center gap-4 mb-4">
                {/* 원형 프로그레스 */}
                <div className="w-14 h-14 relative flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="4"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke={
                        roundInfo.status === 'completed' ? '#10B981' :
                        roundInfo.status === 'in_progress' ? '#6366F1' : '#9CA3AF'
                      }
                      strokeWidth="4"
                      strokeDasharray={`${(rate / 100) * 151} 151`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">{rate}%</span>
                  </div>
                </div>

                {/* 수치 */}
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-gray-400">전체</p>
                    <p className="text-sm font-semibold text-gray-900">{roundInfo.totalCount}명</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">완료</p>
                    <p className="text-sm font-semibold text-green-600">{roundInfo.submittedCount}명</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">미응시</p>
                    <p className="text-sm font-semibold text-orange-500">{notSubmitted.length}명</p>
                  </div>
                </div>
              </div>

              {/* 검사 일자 */}
              <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
                {roundInfo.status === 'not_started' ? (
                  <span>검사 시작 전</span>
                ) : (
                  <div className="flex items-center gap-4">
                    <span>시작: {formatDate(roundInfo.startedAt)}</span>
                    {roundInfo.endedAt && <span>종료: {formatDate(roundInfo.endedAt)}</span>}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택된 회차 상세 영역 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 상세 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-gray-900">
              {selectedRound}차 검사 관리
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${EXAM_STATUS_STYLES[currentRoundData.status].bg} ${EXAM_STATUS_STYLES[currentRoundData.status].text}`}>
              {EXAM_STATUS_LABELS[currentRoundData.status]}
            </span>
          </div>

          {/* 상태별 액션 버튼 */}
          <div className="flex items-center gap-2">
            {currentRoundData.status === 'not_started' && (
              <button
                onClick={() => onStartExam(selectedRound)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                검사 시작
              </button>
            )}
            {currentRoundData.status === 'in_progress' && (
              <>
                <button
                  onClick={() => onEndExam(selectedRound)}
                  disabled={currentRoundData.submittedCount === 0}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  검사 종료
                </button>
                <button
                  onClick={() => onCancelExam(selectedRound)}
                  className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  검사 취소
                </button>
              </>
            )}
            {currentRoundData.status === 'completed' && (
              <>
                <button
                  onClick={handleViewResult}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  결과 보기
                </button>
                <button
                  onClick={handleContinueExam}
                  className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  추가 진행
                </button>
              </>
            )}
          </div>
        </div>

        {/* 미응시 학생 알림 영역 */}
        {notSubmittedStudents.length > 0 && currentRoundData.status === 'in_progress' && (
          <div className="p-4 bg-orange-50 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-orange-700">
                    미응시 학생 {notSubmittedStudents.length}명
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {notSubmittedStudents.slice(0, 5).map((student) => (
                      <span
                        key={student.id}
                        className="px-2 py-0.5 bg-white text-orange-700 text-xs rounded border border-orange-200"
                      >
                        {student.number}. {student.name}
                      </span>
                    ))}
                    {notSubmittedStudents.length > 5 && (
                      <span className="px-2 py-0.5 text-orange-600 text-xs">
                        외 {notSubmittedStudents.length - 5}명
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSendNotification}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                알림 전송
              </button>
            </div>
          </div>
        )}

        {/* 학생 필터 토글 */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              학생 현황 ({displayStudents.length}명)
            </span>
            {notSubmittedStudents.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNotSubmittedOnly}
                  onChange={(e) => setShowNotSubmittedOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">미응시만 보기</span>
              </label>
            )}
          </div>
        </div>

        {/* 학생 응시 현황 테이블 */}
        <StudentStatusTable students={displayStudents} />
      </div>
    </div>
  );
};

export default ExamManagementView;
