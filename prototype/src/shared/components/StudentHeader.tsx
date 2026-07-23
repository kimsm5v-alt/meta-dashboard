/**
 * 공통 학생 헤더 컴포넌트
 *
 * 검사 > 결과보기, 학생 상담, 변화추적 3개 서브탭에서
 * 학생 선택 시 동일한 헤더를 표시합니다.
 *
 * 형식:
 * - n번 {학생명} (+ 유형 배지: showTypeBadge=true일 때만)
 * - 한빛중학교 · 중학교 2학년 3반
 */

import { ArrowLeft } from 'lucide-react';
import { TYPE_COLORS } from '@/shared/data/lpaProfiles';

// Mock 학교 정보 (추후 API에서 가져올 데이터)
const MOCK_SCHOOL_INFO = {
  schoolName: '한빛중학교',
  eduLevel: '중학교',
  grade: 2,
};

export interface StudentHeaderProps {
  /** 학생 번호 */
  studentNumber: number;
  /** 학생 이름 */
  studentName: string;
  /** 학습 유형 (LPA) */
  lpaType?: string;
  /** 반 이름 (예: "2-3반") */
  className: string;
  /** 뒤로가기 핸들러 */
  onBack: () => void;
  /** 추가 우측 컨텐츠 (보고서 버튼 등) */
  rightContent?: React.ReactNode;
  /** 유형 배지 표시 여부 (기본값: false) */
  showTypeBadge?: boolean;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  studentNumber,
  studentName,
  lpaType,
  className,
  onBack,
  rightContent,
  showTypeBadge = false,
}) => {
  // className에서 반 번호 추출 (예: "2-3반" -> "3반")
  const classDisplayName = className.includes('-') ? className.split('-')[1] : className;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {studentNumber}번 {studentName}
            </h1>
            {/* 유형 배지 (showTypeBadge=true일 때만 표시) */}
            {showTypeBadge && lpaType && (
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: TYPE_COLORS[lpaType] || '#6B7280' }}
              >
                {lpaType}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {MOCK_SCHOOL_INFO.schoolName} · {MOCK_SCHOOL_INFO.eduLevel} {MOCK_SCHOOL_INFO.grade}학년 {classDisplayName}
          </p>
        </div>
      </div>

      {/* 우측 컨텐츠 */}
      {rightContent && (
        <div className="flex items-center gap-3">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default StudentHeader;
