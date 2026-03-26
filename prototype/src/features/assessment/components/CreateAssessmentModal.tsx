import { useState } from 'react';
import { Calendar, Users, GraduationCap, AlertCircle } from 'lucide-react';
import { Modal, Button } from '@/shared/components';
import type { Group } from '@/shared/types';

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AssessmentFormData) => void;
  groups: Group[];
  isLoadingGroups: boolean;
}

/** 학교급 타입 */
export type SchoolLevel = 'elementary' | 'middle' | 'high';

/** 학교급별 학년 범위 */
const GRADE_OPTIONS: Record<SchoolLevel, number[]> = {
  elementary: [1, 2, 3, 4, 5, 6],
  middle: [1, 2, 3],
  high: [1, 2, 3],
};

/** 학교급 라벨 */
const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
};

export interface AssessmentFormData {
  name: string;
  groupId: string;
  claId: string;
  schoolLevel: SchoolLevel;
  grade: number;
  classNumber: number;
  studentCount: number;
  round: 1 | 2;
  startDate: string;
  endDate: string;
}

const generateDefaultDates = () => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);

  return {
    startDate: today.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

export const CreateAssessmentModal: React.FC<CreateAssessmentModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  groups,
  isLoadingGroups,
}) => {
  const defaultDates = generateDefaultDates();
  const [formData, setFormData] = useState<AssessmentFormData>({
    name: '',
    groupId: '',
    claId: '',
    schoolLevel: 'elementary',
    grade: 1,
    classNumber: 1,
    studentCount: 30,
    round: 1,
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
  });

  // 그룹 선택 시 학교급, 학년, 반, 학생 수 자동 설정
  const handleGroupChange = (groupId: string) => {
    if (groupId === '') {
      setFormData(prev => ({
        ...prev,
        groupId: '',
        claId: '',
      }));
      return;
    }

    const group = groups.find(g => g.id === groupId);
    if (group) {
      setFormData(prev => ({
        ...prev,
        groupId: group.id,
        claId: group.claId,
        schoolLevel: (group.schoolLevel || 'elementary') as SchoolLevel,
        grade: group.grade,
        classNumber: group.classNumber,
        studentCount: group.memberCount || 30,
        name: prev.name || `${group.name} ${prev.round}차 검사`,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupId) return;
    onCreate(formData);
    onClose();
  };

  const handleChange = (field: keyof AssessmentFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isGroupSelected = !!formData.groupId;
  const hasNoGroups = !isLoadingGroups && groups.length === 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 검사 만들기" size="3xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 그룹 선택 (필수) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Users className="w-4 h-4 inline mr-1" />
            그룹 선택 <span className="text-red-500">*</span>
          </label>
          {hasNoGroups ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                등록된 그룹이 없습니다.{' '}
                <a href="/groups" className="text-primary-500 hover:text-primary-600 font-medium underline">
                  그룹 관리
                </a>
                에서 먼저 그룹을 만들어주세요.
              </span>
            </div>
          ) : (
            <select
              value={formData.groupId}
              onChange={(e) => handleGroupChange(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            >
              <option value="" disabled>
                {isLoadingGroups ? '그룹 목록 불러오는 중...' : '그룹을 선택하세요'}
              </option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.memberCount}명)
                </option>
              ))}
            </select>
          )}
          {isGroupSelected && (
            <p className="mt-1 text-xs text-primary-600">
              그룹 정보로 학교급, 학년, 반, 학생 수가 자동 설정됩니다.
            </p>
          )}
        </div>

        {/* 검사 이름 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            검사 이름
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="예: 3학년 2반 1차 검사"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            required
          />
        </div>

        {/* 학교급 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <GraduationCap className="w-4 h-4 inline mr-1" />
            학교급
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SCHOOL_LEVEL_LABELS) as SchoolLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                disabled
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  formData.schoolLevel === level
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300'
                } opacity-60 cursor-not-allowed`}
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
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed outline-none"
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
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                <option key={c} value={c}>
                  {c}반
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 학생 수 / 차수 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              학생 수
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={formData.studentCount}
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              검사 차수
            </label>
            <select
              value={formData.round}
              onChange={(e) => handleChange('round', parseInt(e.target.value) as 1 | 2)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            >
              <option value={1}>1차 검사</option>
              <option value={2}>2차 검사</option>
            </select>
          </div>
        </div>

        {/* 검사 기간 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Calendar className="w-4 h-4 inline mr-1" />
            검사 기간
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            />
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              min={formData.startDate}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={!isGroupSelected || hasNoGroups}>
            검사 생성
          </Button>
        </div>
      </form>
    </Modal>
  );
};
