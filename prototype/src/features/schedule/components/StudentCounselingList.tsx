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

/** LPA 유형별 색상 (TYPE_COLORS와 동일) */
const LPA_COLORS: Record<string, string> = {
  // 초등
  '자원소진형': '#E74C3C',
  '안전 균형형': '#3498DB',
  '몰입자원 풍부형': '#2ECC71',
  // 중등
  '냉소적 무기력형': '#E74C3C',
  '정서조절 취약형': '#F39C12',
  '자기주도 몰입형': '#2ECC71',
};

/** LPA 유형 약어 (UI 공간 절약) */
const LPA_SHORT_NAMES: Record<string, string> = {
  '자원소진형': '자원소진',
  '안전 균형형': '안전균형',
  '몰입자원 풍부형': '몰입풍부',
  '냉소적 무기력형': '냉소무기력',
  '정서조절 취약형': '정서취약',
  '자기주도 몰입형': '자기주도',
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
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-3">학생 목록</h3>

        {/* 필터 버튼들 */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
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
      </div>

      {/* 학생 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* 테이블 헤더 */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 w-16">번호</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-3 w-24">이름</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-3">유형</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-3">상담 이유</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-3 w-32">최근 상담</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
        {filteredStudents.map((student) => {
          // 대표 태그 1개만 표시 (우선순위: burden > obstacle > reliability > strength)
          const primaryTag = student.tags.find((t) => t === 'burden') ||
            student.tags.find((t) => t === 'obstacle') ||
            student.tags.find((t) => t === 'reliability') ||
            student.tags.find((t) => t === 'strength');

          // 1차/2차 유형 (미응시 시 undefined)
          const type1 = student.lpaType1;
          const type2 = student.lpaType2;
          const hasNoAssessment = !type1 && !type2;

          return (
            <tr
              key={student.id}
              onClick={() => onStudentClick(student.id)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {/* 번호 */}
              <td className="px-5 py-4">
                <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-medium flex items-center justify-center">
                  {student.number}
                </span>
              </td>

              {/* 학생 이름 */}
              <td className="py-4">
                <span className="font-semibold text-gray-900 text-base">{student.name}</span>
              </td>

              {/* 1차/2차 유형 */}
              <td className="py-4">
                {hasNoAssessment ? (
                  <span className="text-sm text-gray-400 italic">응시 전</span>
                ) : (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-400">1차</span>
                      {type1 ? (
                        <span
                          className="px-2 py-1 rounded font-medium"
                          style={{
                            backgroundColor: `${LPA_COLORS[type1]}15`,
                            color: LPA_COLORS[type1],
                          }}
                        >
                          {type1}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">응시 전</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-400">2차</span>
                      {type2 ? (
                        <span
                          className="px-2 py-1 rounded font-medium"
                          style={{
                            backgroundColor: `${LPA_COLORS[type2]}15`,
                            color: LPA_COLORS[type2],
                          }}
                        >
                          {type2}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">응시 전</span>
                      )}
                    </span>
                  </div>
                )}
              </td>

              {/* 상담 이유 */}
              <td className="py-4">
                {primaryTag ? (
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${COUNSELING_REASON_TAG_COLORS[primaryTag].bg} ${COUNSELING_REASON_TAG_COLORS[primaryTag].text}`}
                  >
                    {COUNSELING_REASON_TAG_LABELS[primaryTag]}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </td>

              {/* 최근 상담 */}
              <td className="py-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatLastCounseling(student.lastCounselingAt)}</span>
                </div>
              </td>

              {/* 화살표 */}
              <td className="py-4 text-center">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </td>
            </tr>
          );
        })}
          </tbody>
        </table>
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
