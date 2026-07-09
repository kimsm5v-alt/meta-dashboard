import { useState } from 'react';
import { GraduationCap, Building2 } from 'lucide-react';
import { Modal, Button } from '@/shared/components';
import type { SchoolLevelCode } from '@/shared/types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: GroupFormData) => void;
}

/** 학교급별 학년 범위 */
const GRADE_OPTIONS: Record<SchoolLevelCode, number[]> = {
  elementary: [1, 2, 3, 4, 5, 6],
  middle: [1, 2, 3],
  high: [1, 2, 3],
};

/** 학교급 라벨 */
const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
};

export interface GroupFormData {
  name: string;
  schoolLevel: SchoolLevelCode;
  grade: number;
  classNumber: number;
  description: string;
  schoolName: string;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    schoolLevel: 'elementary',
    grade: 1,
    classNumber: 1,
    description: '',
    schoolName: '',
  });

  // 학교급 변경 시 학년 초기화
  const handleSchoolLevelChange = (schoolLevel: SchoolLevelCode) => {
    setFormData((prev) => ({
      ...prev,
      schoolLevel,
      grade: 1,
    }));
  };

  // 학년/반 변경 시 그룹명 자동 생성
  const handleGradeClassChange = (field: 'grade' | 'classNumber', value: number) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // 이름이 비어있거나 자동 생성된 형식이면 자동 업데이트
      const autoName = `${prev.grade}학년 ${prev.classNumber}반`;
      if (!prev.name || prev.name === autoName) {
        newData.name = `${field === 'grade' ? value : prev.grade}학년 ${field === 'classNumber' ? value : prev.classNumber}반`;
      }
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    // 폼 초기화
    setFormData({
      name: '',
      schoolLevel: 'elementary',
      grade: 1,
      classNumber: 1,
      description: '',
      schoolName: '',
    });
    onClose();
  };

  const handleChange = (field: keyof GroupFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 그룹 만들기" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 학교급 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <GraduationCap className="w-4 h-4 inline mr-1" />
            학교급
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SCHOOL_LEVEL_LABELS) as SchoolLevelCode[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => handleSchoolLevelChange(level)}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  formData.schoolLevel === level
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {SCHOOL_LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        {/* 학년/반 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              학년
            </label>
            <select
              value={formData.grade}
              onChange={(e) => handleGradeClassChange('grade', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            >
              {GRADE_OPTIONS[formData.schoolLevel].map((g) => (
                <option key={g} value={g}>
                  {g}학년
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              반
            </label>
            <select
              value={formData.classNumber}
              onChange={(e) => handleGradeClassChange('classNumber', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                <option key={c} value={c}>
                  {c}반
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 그룹 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            그룹 이름
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="예: 6학년 2반"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            required
          />
        </div>

        {/* 설명 (선택) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            설명 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="예: 2024학년도 6학년 2반"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors resize-none"
            rows={2}
          />
        </div>

        {/* 학교명 (선택) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Building2 className="w-4 h-4 inline mr-1" />
            학교명 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <input
            type="text"
            value={formData.schoolName}
            onChange={(e) => handleChange('schoolName', e.target.value)}
            placeholder="예: 서울초등학교"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
          />
        </div>

        {/* 안내 문구 */}
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <p>그룹을 생성하면 학생 초대 코드가 자동으로 발급됩니다.</p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button type="submit" className="flex-1">
            그룹 생성
          </Button>
        </div>
      </form>
    </Modal>
  );
};
