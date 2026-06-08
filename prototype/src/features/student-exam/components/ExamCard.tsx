/**
 * 검사 카드 컴포넌트 (가로형)
 *
 * 7개 상태 분기 지원:
 * pending, ready, progress, awaiting, result, missed, locked
 */

import {
  ClipboardList,
  Play,
  RotateCcw,
  BarChart3,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { Button } from '@/shared/components';
import type { StudentExamListItem, ExamType } from '../types';
import {
  EXAM_TYPE_INFO,
  EXAM_STATUS_INFO,
  EXAM_STATUS_MESSAGE,
} from '../types';

interface ExamCardProps {
  exam: StudentExamListItem;
  onStartExam: (exam: StudentExamListItem) => void;
  onResumeExam: (exam: StudentExamListItem) => void;
  onRestartExam: (exam: StudentExamListItem) => void;
  onViewResult: (exam: StudentExamListItem) => void;
}

/** 검사 종류별 아이콘 타일 배경색 (인라인 스타일용) */
const getTypeColors = (type: ExamType) => {
  const info = EXAM_TYPE_INFO[type];
  return {
    tileBg: type === 'comp' ? 'rgba(157, 83, 225, 0.12)' : 'rgba(0, 159, 136, 0.12)',
    tileIcon: info.color,
    buttonBg: info.color,
    buttonHover: type === 'comp' ? '#8A45C8' : '#008A76',
  };
};

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onStartExam,
  onResumeExam,
  onRestartExam,
  onViewResult,
}) => {
  const typeInfo = EXAM_TYPE_INFO[exam.type];
  const statusInfo = EXAM_STATUS_INFO[exam.status];
  const statusMessage = EXAM_STATUS_MESSAGE[exam.status];
  const typeColors = getTypeColors(exam.type);

  const isLocked = exam.status === 'locked';
  const isDim = isLocked;

  /** 상태별 액션 버튼 렌더링 */
  const renderActionButton = () => {
    switch (exam.status) {
      case 'pending':
      case 'awaiting':
      case 'missed':
      case 'locked':
        // 버튼 없음 - 안내 문구만 표시
        return null;

      case 'ready':
        return (
          <button
            onClick={() => onStartExam(exam)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{
              backgroundColor: typeColors.buttonBg,
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = typeColors.buttonHover)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = typeColors.buttonBg)}
          >
            <Play className="w-4 h-4" />
            검사 시작
          </button>
        );

      case 'progress':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onResumeExam(exam)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{
                backgroundColor: typeColors.buttonBg,
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = typeColors.buttonHover)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = typeColors.buttonBg)}
            >
              <RotateCcw className="w-4 h-4" />
              이어하기
            </button>
            <Button
              variant="outline"
              onClick={() => onRestartExam(exam)}
              className="text-gray-600"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              새로하기
            </Button>
          </div>
        );

      case 'result':
        return (
          <button
            onClick={() => onViewResult(exam)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
            style={{
              borderColor: '#16A34A',
              color: '#16A34A',
              backgroundColor: 'transparent',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(22, 163, 74, 0.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <BarChart3 className="w-4 h-4" />
            결과 보기
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`
        bg-white rounded-2xl border border-gray-100 p-4
        transition-shadow
        ${isDim ? 'opacity-60' : 'hover:shadow-md'}
      `}
      style={{
        boxShadow: '0 1px 2px rgba(20,24,44,.04), 0 6px 20px rgba(20,24,44,.05)',
      }}
    >
      <div className="flex items-start gap-4">
        {/* 왼쪽: 아이콘 타일 (56px) */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: isLocked ? '#EEF0F4' : typeColors.tileBg,
          }}
        >
          {isLocked ? (
            <Lock className="w-6 h-6 text-gray-400" />
          ) : (
            <ClipboardList
              className="w-6 h-6"
              style={{ color: typeColors.tileIcon }}
            />
          )}
        </div>

        {/* 중앙: 제목 + 권장월 칩 + 액션 영역 */}
        <div className="flex-1 min-w-0">
          {/* 제목 행 */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {exam.round}차 {typeInfo.name}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 whitespace-nowrap">
              권장 {exam.recommendedMonth}
            </span>
          </div>

          {/* 안내 문구 (상태별) */}
          {statusMessage && (
            <p className="text-sm text-gray-500 mt-1 mb-3">
              {statusMessage}
            </p>
          )}

          {/* 액션 영역 */}
          <div className="mt-3">
            {renderActionButton()}
          </div>
        </div>

        {/* 우측 상단: 상태 뱃지 */}
        <div
          className={`
            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0
            ${statusInfo.bgClass} ${statusInfo.textClass}
          `}
        >
          {statusInfo.label}
        </div>
      </div>
    </div>
  );
};
