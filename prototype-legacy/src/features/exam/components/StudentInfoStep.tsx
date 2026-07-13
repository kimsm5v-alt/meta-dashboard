/**
 * 학생 정보 입력 단계 - Apple 미니멀 디자인
 *
 * 검사 시작 전에 학생의 기본 정보를 입력받습니다.
 * - 회원/게스트 모두 사용
 * - 학교명, 학년, 반, 번호, 이름, 성별 입력
 */

import { useState, useEffect } from 'react';

export interface StudentInfo {
  schoolName: string;
  grade: string;
  classNumber: string;
  studentNumber: string;
  name: string;
  gender: 'M' | 'F' | '';
}

type SchoolLevel = 'elementary' | 'middle' | 'high' | '';

interface StudentInfoStepProps {
  examName: string;
  initialData?: Partial<StudentInfo>;
  onSubmit: (info: StudentInfo) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export const StudentInfoStep: React.FC<StudentInfoStepProps> = ({
  examName,
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('');
  const [formData, setFormData] = useState<StudentInfo>({
    schoolName: initialData?.schoolName || '',
    grade: initialData?.grade || '',
    classNumber: initialData?.classNumber || '',
    studentNumber: initialData?.studentNumber || '',
    name: initialData?.name || '',
    gender: initialData?.gender || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StudentInfo, string>>>({});
  const [focusedField, setFocusedField] = useState<string>('');

  // 학교급 변경 시 학년 초기화
  useEffect(() => {
    if (schoolLevel) {
      setFormData(prev => ({ ...prev, grade: '' }));
    }
  }, [schoolLevel]);

  const handleChange = (field: keyof StudentInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSchoolLevelChange = (level: SchoolLevel) => {
    setSchoolLevel(level);
  };

  const getGradeOptions = (): string[] => {
    switch (schoolLevel) {
      case 'elementary':
        return ['초1', '초2', '초3', '초4', '초5', '초6'];
      case 'middle':
        return ['중1', '중2', '중3'];
      case 'high':
        return ['고1', '고2', '고3'];
      default:
        return [];
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentInfo, string>> = {};

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = '학교명을 입력해주세요';
    }
    if (!formData.grade) {
      newErrors.grade = '학년을 선택해주세요';
    }
    if (!formData.classNumber.trim()) {
      newErrors.classNumber = '반을 입력해주세요';
    }
    if (!formData.studentNumber.trim()) {
      newErrors.studentNumber = '번호를 입력해주세요';
    }
    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요';
    }
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData as StudentInfo);
    }
  };

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center px-4 py-12"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
    >
      <div className="w-full max-w-lg">
        {/* 헤더 */}
        <div className="mb-16 animate-fade-up">
          <h1
            className="text-gray-900 font-bold mb-3"
            style={{
              fontSize: '34px',
              lineHeight: '1.2',
              letterSpacing: '-0.025em'
            }}
          >
            {examName}.
          </h1>
          <p className="text-primary-600 font-semibold text-sm">
            검사를 시작하기 전에 기본 정보를 입력해주세요
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* 학교명 */}
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              학교명
            </label>
            <input
              type="text"
              value={formData.schoolName}
              onChange={(e) => handleChange('schoolName', e.target.value)}
              onFocus={() => setFocusedField('schoolName')}
              onBlur={() => setFocusedField('')}
              placeholder="학교 이름을 입력하세요"
              disabled={isLoading}
              className="w-full bg-transparent border-0 border-b-2 pb-3 text-xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-colors"
              style={{
                borderBottomColor: focusedField === 'schoolName' ? 'rgb(var(--primary-500))' : errors.schoolName ? '#ef4444' : '#e5e7eb',
              }}
            />
            {errors.schoolName && (
              <p className="text-red-500 text-xs mt-2">{errors.schoolName}</p>
            )}
          </div>

          {/* 학교급 */}
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              학교급
            </label>
            <div className="flex gap-3">
              {[
                { value: 'elementary', label: '초등학교' },
                { value: 'middle', label: '중학교' },
                { value: 'high', label: '고등학교' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSchoolLevelChange(option.value as SchoolLevel)}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 rounded-full font-medium text-sm transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: schoolLevel === option.value ? 'rgb(var(--primary-500))' : '#f3f4f6',
                    color: schoolLevel === option.value ? '#ffffff' : '#6b7280',
                    transform: schoolLevel === option.value ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: schoolLevel === option.value ? '0 4px 12px rgba(var(--primary-500), 0.25)' : 'none',
                  }}
                  onMouseDown={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = schoolLevel === option.value ? 'scale(1.02)' : 'scale(1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = schoolLevel === option.value ? 'scale(1.02)' : 'scale(1)';
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 학년 · 반 · 번호 */}
          <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              학년 · 반 · 번호
            </label>
            <div className="flex gap-4">
              {/* 학년 드롭다운 (flex:2) */}
              <div style={{ flex: 2 }}>
                <select
                  value={formData.grade}
                  onChange={(e) => handleChange('grade', e.target.value)}
                  onFocus={() => setFocusedField('grade')}
                  onBlur={() => setFocusedField('')}
                  disabled={isLoading || getGradeOptions().length === 0}
                  className="w-full py-4 px-4 text-center text-lg font-medium rounded-2xl border-2 focus:outline-none transition-colors"
                  style={{
                    borderColor: focusedField === 'grade' ? 'rgb(var(--primary-500))' : errors.grade ? '#ef4444' : '#e5e7eb',
                    backgroundColor: '#fafafa',
                    appearance: 'none',
                    cursor: getGradeOptions().length === 0 ? 'not-allowed' : 'pointer',
                    backgroundImage: getGradeOptions().length === 0 ? 'none' : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b7280' d='M1.41 0L6 4.58 10.59 0 12 1.41l-6 6-6-6z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                  }}
                >
                  <option value="">
                    {getGradeOptions().length === 0 ? '학교급 선택 필요' : '학년 선택'}
                  </option>
                  {getGradeOptions().map((grade) => (
                    <option key={grade} value={grade}>
                      {grade.replace('초', '').replace('중', '').replace('고', '')}학년
                    </option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.grade}</p>
                )}
              </div>

              {/* 반 (flex:1) */}
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={formData.classNumber}
                  onChange={(e) => handleChange('classNumber', e.target.value)}
                  onFocus={() => setFocusedField('classNumber')}
                  onBlur={() => setFocusedField('')}
                  placeholder="반"
                  disabled={isLoading}
                  className="w-full py-4 px-4 text-center text-lg font-medium rounded-2xl border-2 focus:outline-none transition-colors"
                  style={{
                    borderColor: focusedField === 'classNumber' ? 'rgb(var(--primary-500))' : errors.classNumber ? '#ef4444' : '#e5e7eb',
                    backgroundColor: '#fafafa',
                  }}
                />
                {errors.classNumber && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.classNumber}</p>
                )}
              </div>

              {/* 번호 (flex:1) */}
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={formData.studentNumber}
                  onChange={(e) => handleChange('studentNumber', e.target.value)}
                  onFocus={() => setFocusedField('studentNumber')}
                  onBlur={() => setFocusedField('')}
                  placeholder="번호"
                  disabled={isLoading}
                  className="w-full py-4 px-4 text-center text-lg font-medium rounded-2xl border-2 focus:outline-none transition-colors"
                  style={{
                    borderColor: focusedField === 'studentNumber' ? 'rgb(var(--primary-500))' : errors.studentNumber ? '#ef4444' : '#e5e7eb',
                    backgroundColor: '#fafafa',
                  }}
                />
                {errors.studentNumber && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.studentNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* 디바이더 */}
          <div
            className="animate-fade-up"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="h-px bg-gray-200"></div>
          </div>

          {/* 이름 */}
          <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              이름
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField('')}
              placeholder="홍길동"
              disabled={isLoading}
              className="w-full bg-transparent border-0 border-b-2 pb-3 text-xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-colors"
              style={{
                borderBottomColor: focusedField === 'name' ? 'rgb(var(--primary-500))' : errors.name ? '#ef4444' : '#e5e7eb',
              }}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-2">{errors.name}</p>
            )}
          </div>

          {/* 성별 */}
          <div className="animate-fade-up" style={{ animationDelay: '0.7s' }}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              성별
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleChange('gender', 'M')}
                disabled={isLoading}
                className="py-4 px-4 rounded-2xl font-medium text-base transition-all disabled:opacity-50"
                style={{
                  backgroundColor: formData.gender === 'M' ? 'rgb(var(--primary-500))' : '#f3f4f6',
                  color: formData.gender === 'M' ? '#ffffff' : '#6b7280',
                  transform: formData.gender === 'M' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: formData.gender === 'M' ? '0 4px 12px rgba(var(--primary-500), 0.25)' : 'none',
                }}
                onMouseDown={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = formData.gender === 'M' ? 'scale(1.02)' : 'scale(1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = formData.gender === 'M' ? 'scale(1.02)' : 'scale(1)';
                  }
                }}
              >
                남자
              </button>
              <button
                type="button"
                onClick={() => handleChange('gender', 'F')}
                disabled={isLoading}
                className="py-4 px-4 rounded-2xl font-medium text-base transition-all disabled:opacity-50"
                style={{
                  backgroundColor: formData.gender === 'F' ? 'rgb(var(--primary-500))' : '#f3f4f6',
                  color: formData.gender === 'F' ? '#ffffff' : '#6b7280',
                  transform: formData.gender === 'F' ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: formData.gender === 'F' ? '0 4px 12px rgba(var(--primary-500), 0.25)' : 'none',
                }}
                onMouseDown={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = formData.gender === 'F' ? 'scale(1.02)' : 'scale(1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = formData.gender === 'F' ? 'scale(1.02)' : 'scale(1)';
                  }
                }}
              >
                여자
              </button>
            </div>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-2">{errors.gender}</p>
            )}
          </div>

          {/* CTA 버튼 */}
          <div className="animate-fade-up pt-8" style={{ animationDelay: '0.8s' }}>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 rounded-2xl font-semibold text-base text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'rgb(var(--primary-500))',
                filter: isLoading ? 'brightness(0.9)' : 'brightness(1)',
                boxShadow: '0 8px 24px rgba(var(--primary-500), 0.35)',
                transform: 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.filter = 'brightness(1.05)';
                  e.currentTarget.style.transform = 'scale(1.01)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.filter = 'brightness(1)';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              onMouseDown={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'scale(0.99)';
                }
              }}
              onMouseUp={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'scale(1.01)';
                }
              }}
            >
              {isLoading ? '처리 중...' : '검사 시작하기'}
            </button>
          </div>
        </form>

        {/* 안내 */}
        <div className="mt-12 text-center animate-fade-up" style={{ animationDelay: '0.9s' }}>
          <p className="text-gray-400 text-xs">
            입력하신 정보는 검사 결과 분석 및 통계 자료로 활용됩니다
          </p>
        </div>
      </div>

      {/* 애니메이션 스타일 */}
      <style>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-up {
          animation: fade-up 0.6s ease-out both;
        }

        /* CSS 변수 기반 primary 색상 */
        :root {
          --primary-500: 109 40 217; /* #6d28d9 (Visang Purple) */
        }
      `}</style>
    </div>
  );
};
