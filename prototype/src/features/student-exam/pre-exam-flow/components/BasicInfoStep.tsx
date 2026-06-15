/**
 * 2단계 - 기본 정보 입력 컴포넌트
 *
 * 읽기전용: 학교·학년·반 (그룹 정보)
 * 입력: 번호, 이름, 성별
 */

import { useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import type { ExamTheme, GroupInfo, StudentBasicInfo } from '../types';

interface BasicInfoStepProps {
  /** 테마 */
  theme: ExamTheme;
  /** 그룹 정보 (읽기 전용) */
  groupInfo: GroupInfo;
  /** 초기 데이터 */
  initialData?: Partial<StudentBasicInfo>;
  /** 검사 시작 */
  onSubmit: (info: StudentBasicInfo) => void;
  /** 이전 단계로 */
  onBack: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  theme,
  groupInfo,
  initialData,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<StudentBasicInfo>({
    studentNumber: initialData?.studentNumber || '',
    name: initialData?.name || '',
    gender: initialData?.gender || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof StudentBasicInfo, string>>>({});
  const [focusedField, setFocusedField] = useState<string>('');

  // 필드 변경 핸들러
  const handleChange = (field: keyof StudentBasicInfo, value: string) => {
    // 번호 필드는 숫자만 허용 (최대 3자리)
    if (field === 'studentNumber') {
      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 3);
      setFormData((prev) => ({ ...prev, [field]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // 에러 초기화
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StudentBasicInfo, string>> = {};

    if (!formData.studentNumber.trim()) {
      newErrors.studentNumber = '출석번호를 입력해주세요';
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

  // 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData as StudentBasicInfo);
    }
  };

  // 모든 필드가 채워졌는지 확인
  const isFormComplete = formData.studentNumber && formData.name && formData.gender;

  // 인풋 포커스 스타일
  const getInputBorderColor = (field: string, hasError: boolean) => {
    if (hasError) return '#EF4444';
    if (focusedField === field) return theme.actionColor;
    return '#E5E7EB';
  };

  return (
    <div className="space-y-6">
      {/* 읽기전용 그룹 정보 */}
      <section
        className="bg-white rounded-2xl p-6"
        style={{ border: '1px solid #ECEEF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${theme.actionColor}15` }}
            >
              <Users className="w-5 h-5" style={{ color: theme.actionColor }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {groupInfo.schoolName} · {groupInfo.grade} {groupInfo.classNumber}
              </p>
            </div>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${theme.actionColor}15`,
              color: theme.actionColor,
            }}
          >
            그룹 정보
          </span>
        </div>
      </section>

      {/* 기본 정보 입력 폼 */}
      <section
        className="bg-white rounded-2xl p-6"
        style={{ border: '1px solid #ECEEF2', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">기본 정보 입력</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              출석번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.studentNumber}
              onChange={(e) => handleChange('studentNumber', e.target.value)}
              onFocus={() => setFocusedField('studentNumber')}
              onBlur={() => setFocusedField('')}
              placeholder="출석번호를 입력하세요"
              disabled={isLoading}
              className="w-full bg-transparent border-0 border-b-2 pb-3 text-lg font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-colors"
              style={{
                borderBottomColor: getInputBorderColor('studentNumber', !!errors.studentNumber),
              }}
            />
            {errors.studentNumber && (
              <p className="text-red-500 text-xs mt-2">{errors.studentNumber}</p>
            )}
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField('')}
              placeholder="이름을 입력하세요 (예: 홍길동)"
              disabled={isLoading}
              className="w-full bg-transparent border-0 border-b-2 pb-3 text-lg font-medium text-gray-900 placeholder-gray-400 focus:outline-none transition-colors"
              style={{
                borderBottomColor: getInputBorderColor('name', !!errors.name),
              }}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-2">{errors.name}</p>
            )}
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              성별 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleChange('gender', 'M')}
                disabled={isLoading}
                className="py-4 px-4 rounded-xl font-medium text-base transition-all disabled:opacity-50"
                style={{
                  backgroundColor: formData.gender === 'M' ? theme.actionColor : '#F3F4F6',
                  color: formData.gender === 'M' ? '#FFFFFF' : '#6B7280',
                  boxShadow: formData.gender === 'M' ? `0 4px 12px ${theme.actionColor}40` : 'none',
                }}
              >
                남자
              </button>
              <button
                type="button"
                onClick={() => handleChange('gender', 'F')}
                disabled={isLoading}
                className="py-4 px-4 rounded-xl font-medium text-base transition-all disabled:opacity-50"
                style={{
                  backgroundColor: formData.gender === 'F' ? theme.actionColor : '#F3F4F6',
                  color: formData.gender === 'F' ? '#FFFFFF' : '#6B7280',
                  boxShadow: formData.gender === 'F' ? `0 4px 12px ${theme.actionColor}40` : 'none',
                }}
              >
                여자
              </button>
            </div>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-2">{errors.gender}</p>
            )}
          </div>
        </form>
      </section>

      {/* 푸터 버튼 */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          이전
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormComplete || isLoading}
          className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 text-white font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: isFormComplete ? theme.actionColor : undefined,
          }}
        >
          {isLoading ? '처리 중...' : '검사 시작하기'}
        </button>
      </div>
    </div>
  );
};
