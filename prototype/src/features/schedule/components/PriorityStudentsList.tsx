/**
 * 학생 상담 - 반 전체 - 우선순위 추천
 *
 * 상담 우선, 감정활용 추천, 신뢰도 주의 학생
 */

import { AlertTriangle, Heart, AlertCircle, ChevronRight, Clock } from 'lucide-react';
import type { PriorityStudent, PriorityCategory } from '../types';
import { PRIORITY_CATEGORY_LABELS } from '../types';

interface PriorityStudentsListProps {
  students: PriorityStudent[];
  onStudentClick: (studentId: string) => void;
}

/** 카테고리별 스타일 */
const CATEGORY_STYLES: Record<PriorityCategory, { icon: React.ReactNode; bg: string; border: string; iconBg: string }> = {
  attention: {
    icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconBg: 'bg-red-100',
  },
  emotion: {
    icon: <Heart className="w-4 h-4 text-pink-600" />,
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    iconBg: 'bg-pink-100',
  },
  reliability: {
    icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
  },
};

/** 날짜 포맷팅 */
const formatLastCounseling = (date?: Date): string => {
  if (!date) return '상담 이력 없음';

  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7) return `${diff}일 전`;
  if (diff < 30) return `${Math.floor(diff / 7)}주 전`;

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const PriorityStudentsList: React.FC<PriorityStudentsListProps> = ({
  students,
  onStudentClick,
}) => {
  // 카테고리별 그룹화
  const groupedStudents = students.reduce<Record<PriorityCategory, PriorityStudent[]>>(
    (acc, student) => {
      if (!acc[student.category]) acc[student.category] = [];
      acc[student.category].push(student);
      return acc;
    },
    { attention: [], emotion: [], reliability: [] }
  );

  const categories: PriorityCategory[] = ['attention', 'emotion', 'reliability'];

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">우선순위 추천</h3>
        <p className="text-sm text-gray-500 mt-1">검사 결과를 기반으로 상담이 필요한 학생을 추천합니다.</p>
      </div>

      {/* 카테고리별 목록 */}
      <div className="divide-y divide-gray-100">
        {categories.map((category) => {
          const categoryStudents = groupedStudents[category];
          if (categoryStudents.length === 0) return null;

          const style = CATEGORY_STYLES[category];

          return (
            <div key={category} className="p-4">
              {/* 카테고리 헤더 */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full ${style.iconBg} flex items-center justify-center`}>
                  {style.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {PRIORITY_CATEGORY_LABELS[category]}
                </span>
                <span className="text-xs text-gray-400">({categoryStudents.length}명)</span>
              </div>

              {/* 학생 목록 */}
              <div className="space-y-2">
                {categoryStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => onStudentClick(student.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 ${style.bg} border ${style.border} rounded-xl hover:opacity-90 transition-opacity text-left`}
                  >
                    <span className="w-8 h-8 rounded-full bg-white text-gray-700 text-sm font-medium flex items-center justify-center flex-shrink-0">
                      {student.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{student.name}</span>
                        {student.lpaType && (
                          <span className="text-xs text-gray-500">{student.lpaType}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{student.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatLastCounseling(student.lastCounselingAt)}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {students.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">추천 대상 학생이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default PriorityStudentsList;
