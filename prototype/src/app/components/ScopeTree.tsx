/**
 * ScopeTree - LNB 아코디언 트리 컴포넌트
 *
 * 구조:
 * - 그룹관리 버튼
 * - "전체" 항목 (항상 최상단)
 * - 반 목록 (아코디언)
 *   - 반 헤더 (▸/▾ + 반 이름)
 *   - 펼침 시: 반 전체 + 학생 검색 + 학생 목록
 */

import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronRight,
  Search,
} from 'lucide-react';
import type { Scope, MenuScopeConfig } from '../scope';
import { getMenuKeyFromPath } from '../scope';

// ============================================
// Types
// ============================================

export interface ClassInfo {
  id: string;
  name: string;
  status?: string;
}

export interface StudentInfo {
  id: string;
  name: string;
}

interface ScopeTreeProps {
  /** 반 목록 */
  classes: ClassInfo[];
  /** 학생 목록 (현재 확장된 반의 학생들) */
  students: StudentInfo[];
  /** 현재 스코프 */
  scope: Scope;
  /** 현재 메뉴의 스코프 지원 설정 */
  menuConfig: MenuScopeConfig;
  /** 현재 펼쳐진 반 ID */
  expandedClassId: string | null;
  /** 현재 메뉴 경로 */
  currentPath: string;
  /** 전체 선택 핸들러 */
  onSelectAll: () => void;
  /** 반 선택 핸들러 */
  onSelectClass: (classId: string) => void;
  /** 학생 선택 핸들러 */
  onSelectStudent: (classId: string, studentId: string) => void;
  /** 반 펼침/접힘 핸들러 */
  onToggleExpand: (classId: string) => void;
}

// ============================================
// ScopeTree Component
// ============================================

export const ScopeTree: React.FC<ScopeTreeProps> = ({
  classes,
  students,
  scope,
  menuConfig,
  expandedClassId,
  currentPath,
  onSelectAll,
  onSelectClass,
  onSelectStudent,
  onToggleExpand,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // 현재 메뉴 키
  const currentMenuKey = getMenuKeyFromPath(currentPath);
  const isCoachingClass = currentMenuKey === 'coaching/class';
  const isCoachingIndividual = currentMenuKey === 'coaching/individual';
  const isCoachingMenu = isCoachingClass || isCoachingIndividual;

  // 학생 필터링
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    return students.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  // 학생 레벨 지원 여부
  const isStudentSupported = menuConfig.student;
  // 반 레벨 지원 여부
  const isClassSupported = menuConfig.class;

  // 스코프 파라미터를 유지하면서 이동
  const navigateWithScope = (path: string, classId: string, studentId?: string) => {
    const params = new URLSearchParams();
    params.set('class', classId);
    if (studentId) {
      params.set('student', studentId);
    }
    navigate(`${path}?${params.toString()}`);
  };

  // 코칭 메뉴에서 반 선택 시 핸들러
  const handleClassSelect = (classId: string) => {
    if (isCoachingIndividual) {
      // 개별코칭에서 반 전체 클릭 → 학급코칭으로 이동
      navigateWithScope('/coaching/class', classId);
    } else {
      onSelectClass(classId);
    }
  };

  // 코칭 메뉴에서 학생 선택 시 핸들러
  const handleStudentSelect = (classId: string, studentId: string) => {
    console.log('[ScopeTree] handleStudentSelect:', { classId, studentId, isCoachingClass });
    if (isCoachingClass) {
      // 학급코칭에서 학생 클릭 → 개별코칭으로 이동
      navigateWithScope('/coaching/individual', classId, studentId);
    } else {
      onSelectStudent(classId, studentId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 그룹관리 버튼 */}
      <button
        onClick={() => navigate('/group-management')}
        className="flex items-center w-full px-[10px] py-[9px] text-[13.5px] font-semibold text-gray-900 hover:bg-gray-100 rounded-[9px] mb-2"
      >
        <span>그룹관리</span>
      </button>

      <div className="border-t border-gray-200 my-2" />

      {/* 전체 항목 */}
      <button
        onClick={onSelectAll}
        className={`flex items-center justify-between w-full px-[10px] py-[9px] text-[13.5px] font-semibold rounded-[9px] mb-1 ${
          scope.level === 'all'
            ? 'bg-primary-100 text-primary-600'
            : 'text-gray-900 hover:bg-gray-100'
        }`}
      >
        <span>전체</span>
        {scope.level === 'all' && (
          <span className="w-2 h-2 rounded-full bg-primary-500" />
        )}
      </button>

      <div className="border-t border-gray-200 my-2" />

      {/* 반 목록 (스크롤 영역) */}
      <div className="flex-1 overflow-y-auto">
        <div className="text-[11px] font-bold text-gray-400 tracking-wide px-[10px] mb-[6px]">
          반 목록
        </div>

        <ul className="space-y-[2px]">
          {classes.map((cls) => {
            const isExpanded = expandedClassId === cls.id;
            const isClassSelected =
              scope.level === 'class' && scope.classId === cls.id;
            const isStudentInClass =
              scope.level === 'student' && scope.classId === cls.id;
            const isActive = isClassSelected || isStudentInClass;

            return (
              <li key={cls.id}>
                {/* 반 헤더 */}
                <button
                  onClick={() => {
                    if (isStudentSupported) {
                      // 학생 지원 메뉴: 토글 + 반 전체 자동 선택
                      onToggleExpand(cls.id);
                      if (!isExpanded) {
                        onSelectClass(cls.id);
                      }
                    } else {
                      // 학생 미지원 메뉴: 바로 반 선택
                      onSelectClass(cls.id);
                    }
                  }}
                  className={`flex items-center gap-[6px] w-full px-[10px] py-[9px] text-left rounded-[9px] transition-colors ${
                    isActive && !isStudentSupported
                      ? 'bg-primary-100 text-primary-600 font-semibold'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {/* 화살표 - 학생 지원 메뉴에서만 표시 */}
                  {isStudentSupported ? (
                    <ChevronRight
                      className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  ) : (
                    <span className="w-4" />
                  )}

                  <span
                    className={`text-[13.5px] ${
                      isActive ? 'font-semibold text-primary-600' : 'font-medium text-gray-900'
                    }`}
                  >
                    {cls.name}
                  </span>

                  {/* 선택 인디케이터 (학생 미지원 + 선택됨) */}
                  {isActive && !isStudentSupported && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-primary-500" />
                  )}
                </button>

                {/* 펼쳐진 학생 목록 (학생 지원 메뉴에서만) */}
                {isExpanded && isStudentSupported && (
                  <div className="ml-4 mt-1 space-y-[2px] border-l-2 border-gray-100 pl-2">
                    {/* 반 전체 */}
                    <button
                      onClick={() => handleClassSelect(cls.id)}
                      className={`flex items-center justify-between w-full px-[10px] py-[8px] text-[13px] rounded-[8px] ${
                        isClassSelected
                          ? 'bg-primary-100 text-primary-600 font-semibold'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span>반 전체</span>
                      {isClassSelected && (
                        <span className="w-2 h-2 rounded-full bg-primary-500" />
                      )}
                    </button>

                    {/* 학생 검색 */}
                    <div className="px-[10px] py-[6px]">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="학생 검색..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 text-[12px] border border-gray-200 rounded-[6px] focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100"
                        />
                      </div>
                    </div>

                    {/* 학생 목록 (스크롤) */}
                    <div className="max-h-[360px] overflow-y-auto">
                      {filteredStudents.length === 0 ? (
                        <div className="px-[10px] py-[8px] text-[12px] text-gray-400">
                          {searchQuery ? '검색 결과 없음' : '학생 없음'}
                        </div>
                      ) : (
                        filteredStudents.map((student) => {
                          const isStudentSelected =
                            scope.level === 'student' &&
                            scope.studentId === student.id;

                          return (
                            <button
                              key={student.id}
                              onClick={() => handleStudentSelect(cls.id, student.id)}
                              className={`flex items-center justify-between w-full px-[10px] py-[8px] text-[13px] rounded-[8px] ${
                                isStudentSelected
                                  ? 'bg-primary-100 text-primary-600 font-semibold'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <span>{student.name}</span>
                              {isStudentSelected && (
                                <span className="w-2 h-2 rounded-full bg-primary-500" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ScopeTree;
