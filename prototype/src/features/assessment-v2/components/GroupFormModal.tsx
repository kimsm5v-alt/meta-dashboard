/**
 * 그룹 생성/수정 모달
 */

import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import {
  SCHOOL_LEVEL_OPTIONS,
  GRADE_OPTIONS,
  CLASS_OPTIONS,
} from '../constants';
import { generateGroupName } from '../utils';
import type { GroupFormData, Group, SchoolLevelCode } from '../types';

interface GroupFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  group?: Group;
  onClose: () => void;
  onSubmit: (data: GroupFormData) => void;
  isLoading?: boolean;
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  mode,
  group,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    schoolLevel: 'elementary',
    grade: 5, // 초등은 5학년부터
    classNumber: 1,
    description: '',
    schoolName: '',
  });

  // 그룹 데이터로 폼 초기화
  useEffect(() => {
    if (mode === 'edit' && group) {
      setFormData({
        name: group.name,
        schoolLevel: group.schoolLevel,
        grade: group.grade,
        classNumber: group.classNumber,
        description: group.description || '',
        schoolName: group.schoolName || '',
      });
    } else if (mode === 'create') {
      setFormData({
        name: generateGroupName(5, 1),
        schoolLevel: 'elementary',
        grade: 5, // 초등은 5학년부터
        classNumber: 1,
        description: '',
        schoolName: '',
      });
    }
  }, [mode, group, isOpen]);

  // 학교급 변경 시 학년 초기화 및 그룹명 자동 생성
  const handleSchoolLevelChange = (schoolLevel: SchoolLevelCode) => {
    // 초등은 5학년부터, 중/고등은 1학년부터
    const newGrade = schoolLevel === 'elementary' ? 5 : 1;
    setFormData((prev) => ({
      ...prev,
      schoolLevel,
      grade: newGrade,
      name: generateGroupName(newGrade, prev.classNumber),
    }));
  };

  // 학년/반 변경 시 그룹명 자동 생성
  const handleGradeChange = (grade: number) => {
    setFormData((prev) => ({
      ...prev,
      grade,
      name: generateGroupName(grade, prev.classNumber),
    }));
  };

  const handleClassChange = (classNumber: number) => {
    setFormData((prev) => ({
      ...prev,
      classNumber,
      name: generateGroupName(prev.grade, classNumber),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const gradeOptions = GRADE_OPTIONS[formData.schoolLevel] || [1, 2, 3];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-gray-900/50 animate-fade-in"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl animate-slide-up">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'create' ? '새 그룹 만들기' : '그룹 정보 수정'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* 학교급 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                학교급
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
                {SCHOOL_LEVEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSchoolLevelChange(option.value as SchoolLevelCode)}
                    className={`py-2.5 text-sm font-semibold rounded-md transition-colors ${
                      formData.schoolLevel === option.value
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 학년 / 반 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  학년
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => handleGradeChange(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}학년
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  반
                </label>
                <select
                  value={formData.classNumber}
                  onChange={(e) => handleClassChange(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}반
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 그룹 이름 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                그룹 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="그룹 이름을 입력하세요"
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* 설명 (선택) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                설명 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="그룹에 대한 간단한 설명"
                rows={2}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 학교명 (선택) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                학교명 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    schoolName: e.target.value,
                  }))
                }
                placeholder="예: 서울초등학교"
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* 안내 메시지 (생성 시만) */}
            {mode === 'create' && (
              <div className="flex items-start gap-2.5 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <Info className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-primary-700">
                  그룹을 생성하면 학생 초대 코드가 자동으로 발급됩니다.
                </p>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || isLoading}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {isLoading
                ? '처리 중...'
                : mode === 'create'
                ? '그룹 생성'
                : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupFormModal;
