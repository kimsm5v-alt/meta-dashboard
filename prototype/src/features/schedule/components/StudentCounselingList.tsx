/**
 * 학생 상담 - 반 전체 - 학생 목록
 *
 * 상담 기준 필터에 따른 학생 목록 + 상담 이유 태그
 */

import { useState } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import type { CounselingStudentItem, CounselingFilter } from '../types';
import {
  COUNSELING_FILTER_LABELS,
  COUNSELING_FILTER_DESCRIPTIONS,
  COUNSELING_REASON_TAG_LABELS,
  COUNSELING_REASON_TAG_COLORS,
} from '../types';

interface StudentCounselingListProps {
  students: CounselingStudentItem[];
  onStudentClick: (studentId: string) => void;
}

/** LPA 유형별 색상 */
const LPA_COLORS: Record<string, string> = {
  '자원소진형': '#EF4444',
  '안전 균형형': '#10B981',
  '몰입자원 풍부형': '#3B82F6',
  '냉소적 무기력형': '#EF4444',
  '정서조절 취약형': '#F59E0B',
  '자기주도 몰입형': '#3B82F6',
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

export const StudentCounselingList: React.FC<StudentCounselingListProps> = ({
  students,
  onStudentClick,
}) => {
  const [activeFilter, setActiveFilter] = useState<CounselingFilter>('all');

  // 필터링된 학생 목록
  const filteredStudents = students.filter((student) => {
    switch (activeFilter) {
      case 'priority':
        return student.tags.includes('burden') || student.tags.includes('obstacle');
      case 'reliability':
        return student.tags.includes('reliability');
      case 'strength':
        return student.tags.includes('strength');
      default:
        return true;
    }
  });

  // 필터별 학생 수
  const filterCounts: Record<CounselingFilter, number> = {
    all: students.length,
    priority: students.filter((s) => s.tags.includes('burden') || s.tags.includes('obstacle')).length,
    reliability: students.filter((s) => s.tags.includes('reliability')).length,
    strength: students.filter((s) => s.tags.includes('strength')).length,
  };

  const filters: CounselingFilter[] = ['all', 'priority', 'reliability', 'strength'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* 필터 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-1">상담 기준 필터</h3>
        <p className="text-sm text-gray-500 mb-4">상담 목적에 따라 볼 학생을 빠르게 좁힐 수 있습니다.</p>

        {/* 필터 버튼들 */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{COUNSELING_FILTER_LABELS[filter]}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeFilter === filter ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {filterCounts[filter]}
              </span>
            </button>
          ))}
        </div>

        {/* 현재 필터 설명 */}
        <p className="mt-3 text-xs text-gray-500">
          {COUNSELING_FILTER_DESCRIPTIONS[activeFilter]}
        </p>
      </div>

      {/* 학생 목록 */}
      <div className="divide-y divide-gray-100">
        {filteredStudents.map((student) => {
          const lpaColor = LPA_COLORS[student.lpaType] || '#6B7280';
          // 대표 태그 1개만 표시 (우선순위: burden > obstacle > reliability > strength)
          const primaryTag = student.tags.find((t) => t === 'burden') ||
            student.tags.find((t) => t === 'obstacle') ||
            student.tags.find((t) => t === 'reliability') ||
            student.tags.find((t) => t === 'strength');

          return (
            <button
              key={student.id}
              onClick={() => onStudentClick(student.id)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              {/* 번호 */}
              <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-medium flex items-center justify-center flex-shrink-0">
                {student.number}
              </span>

              {/* 학생 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{student.name}</span>
                  <span className="text-sm text-gray-500">{student.lpaType}</span>
                  {primaryTag && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${COUNSELING_REASON_TAG_COLORS[primaryTag].bg} ${COUNSELING_REASON_TAG_COLORS[primaryTag].text}`}
                    >
                      {COUNSELING_REASON_TAG_LABELS[primaryTag]}
                    </span>
                  )}
                </div>
              </div>

              {/* T점수 */}
              <div className="text-right flex-shrink-0">
                <span
                  className={`text-lg font-bold ${
                    student.avgTScore >= 50 ? 'text-green-600' : student.avgTScore >= 40 ? 'text-amber-600' : 'text-red-600'
                  }`}
                >
                  T{student.avgTScore}
                </span>
              </div>

              {/* 마지막 상담 */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0 w-20 justify-end">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatLastCounseling(student.lastCounselingAt)}</span>
              </div>

              {/* 화살표 */}
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">해당 필터에 맞는 학생이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default StudentCounselingList;
