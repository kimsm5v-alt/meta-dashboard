/**
 * 학생 상담 - 학생 선택 - 개인학습현황 카드
 *
 * 학습종합검사 문항 120~124번 응답값 표시
 * - 학업성취도 (자신의 성적 수준)
 * - 성적만족도 (현재 성적 만족 정도)
 * - 학습동기 (공부하는 주된 이유)
 * - 혼공시간 (하루 평균 혼자 공부 시간)
 * - 학습고민상담사 (학습 고민을 주로 상담하는 대상)
 */

import { BookOpen, Clock, Target, MessageCircle, TrendingUp } from 'lucide-react';
import type { LearningStatus } from '../types';
import {
  ACADEMIC_ACHIEVEMENT_LABELS,
  GRADE_SATISFACTION_LABELS,
  LEARNING_MOTIVATION_LABELS,
  SELF_STUDY_TIME_LABELS,
  LEARNING_COUNSELOR_LABELS,
} from '../types';

interface LearningStatusCardProps {
  learningStatus: LearningStatus;
  studentName: string;
}

/** 성적만족도에 따른 색상 */
const getSatisfactionColor = (satisfaction: string): string => {
  switch (satisfaction) {
    case 'very_satisfied':
      return 'text-green-600';
    case 'satisfied':
      return 'text-green-500';
    case 'neutral':
      return 'text-gray-600';
    case 'dissatisfied':
      return 'text-amber-600';
    case 'very_dissatisfied':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

/** 학업성취도에 따른 색상 */
const getAchievementColor = (achievement: string): string => {
  switch (achievement) {
    case 'top10':
      return 'text-blue-600';
    case 'top30':
      return 'text-blue-500';
    case 'middle':
      return 'text-gray-600';
    case 'bottom30':
      return 'text-amber-600';
    case 'bottom10':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

/** 혼공시간에 따른 색상 */
const getStudyTimeColor = (time: string): string => {
  switch (time) {
    case 'over3h':
      return 'text-green-600';
    case '2to3h':
      return 'text-green-500';
    case '1to2h':
      return 'text-gray-600';
    case 'under1h':
      return 'text-amber-600';
    case 'none':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const LearningStatusCard: React.FC<LearningStatusCardProps> = ({
  learningStatus,
  studentName,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">개인학습현황</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {studentName} 학생이 직접 응답한 학습 환경 및 습관 정보입니다.
        </p>
      </div>

      {/* 내용 */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 학업성취도 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">학업성취도</span>
            </div>
            <p className={`text-sm font-semibold ${getAchievementColor(learningStatus.academicAchievement)}`}>
              {ACADEMIC_ACHIEVEMENT_LABELS[learningStatus.academicAchievement]}
            </p>
          </div>

          {/* 성적만족도 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">성적만족도</span>
            </div>
            <p className={`text-sm font-semibold ${getSatisfactionColor(learningStatus.gradeSatisfaction)}`}>
              {GRADE_SATISFACTION_LABELS[learningStatus.gradeSatisfaction]}
            </p>
          </div>

          {/* 학습동기 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">학습동기</span>
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {LEARNING_MOTIVATION_LABELS[learningStatus.learningMotivation]}
            </p>
          </div>

          {/* 혼공시간 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">혼공시간</span>
            </div>
            <p className={`text-sm font-semibold ${getStudyTimeColor(learningStatus.selfStudyTime)}`}>
              {SELF_STUDY_TIME_LABELS[learningStatus.selfStudyTime]}
            </p>
          </div>

          {/* 학습고민상담사 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">학습고민 상담</span>
            </div>
            <p className="text-sm font-semibold text-gray-800">
              {LEARNING_COUNSELOR_LABELS[learningStatus.learningCounselor]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningStatusCard;
