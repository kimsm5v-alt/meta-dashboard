import { useState, useMemo } from 'react';
import { Calendar, Users, GraduationCap } from 'lucide-react';
import { Modal, Button } from '@/shared/components';

// Mock 그룹 데이터 (나중에 API로 대체)
interface GroupOption {
  id: string;
  name: string;
  grade: number;
  classNumber: number;
  schoolLevel: SchoolLevel;
  studentCount: number;
}

const mockGroups: GroupOption[] = [
  { id: '1', name: '6학년 2반', grade: 6, classNumber: 2, schoolLevel: 'elementary', studentCount: 28 },
  { id: '2', name: '6학년 3반', grade: 6, classNumber: 3, schoolLevel: 'elementary', studentCount: 25 },
  { id: '3', name: '5학년 1반', grade: 5, classNumber: 1, schoolLevel: 'elementary', studentCount: 30 },
];

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AssessmentFormData) => void;
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
  groupId: string | null;
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
}) => {
  const defaultDates = generateDefaultDates();
  const [formData, setFormData] = useState<AssessmentFormData>({
    name: '',
    groupId: null,
    schoolLevel: 'elementary',
    grade: 1,
    classNumber: 1,
    studentCount: 30,
    round: 1,
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
  });

  // 선택된 그룹 정보
  const selectedGroup = useMemo(() => {
    return mockGroups.find(g => g.id === formData.groupId) || null;
  }, [formData.groupId]);

  // 그룹 선택 시 학교급, 학년, 반, 학생 수 자동 설정
  const handleGroupChange = (groupId: string) => {
    if (groupId === '') {
      setFormData(prev => ({
        ...prev,
        groupId: null,
      }));
      return;
    }

    const group = mockGroups.find(g => g.id === groupId);
    if (group) {
      setFormData(prev => ({
        ...prev,
        groupId: group.id,
        schoolLevel: group.schoolLevel,
        grade: group.grade,
        classNumber: group.classNumber,
        studentCount: group.studentCount,
      }));
    }
  };

  // 학교급 변경 시 학년 초기화
  const handleSchoolLevelChange = (schoolLevel: SchoolLevel) => {
    setFormData((prev) => ({
      ...prev,
      groupId: null, // 그룹 선택 해제
      schoolLevel,
      grade: 1, // 학교급 변경 시 1학년으로 초기화
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    onClose();
  };

  const handleChange = (field: keyof AssessmentFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 검사 만들기" size="3xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 그룹 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Users className="w-4 h-4 inline mr-1" />
            그룹 선택 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <select
            value={formData.groupId || ''}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
          >
            <option value="">직접 입력</option>
            {mockGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.studentCount}명)
              </option>
            ))}
          </select>
          {selectedGroup && (
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
                onClick={() => handleSchoolLevelChange(level)}
                disabled={!!selectedGroup}
                className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  formData.schoolLevel === level
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${selectedGroup ? 'opacity-60 cursor-not-allowed' : ''}`}
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
              onChange={(e) => handleChange('grade', parseInt(e.target.value))}
              disabled={!!selectedGroup}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${
                selectedGroup ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''
              }`}
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
              onChange={(e) => handleChange('classNumber', parseInt(e.target.value))}
              disabled={!!selectedGroup}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${
                selectedGroup ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''
              }`}
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
              onChange={(e) => handleChange('studentCount', parseInt(e.target.value))}
              disabled={!!selectedGroup}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors ${
                selectedGroup ? 'bg-gray-50 opacity-60 cursor-not-allowed' : ''
              }`}
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
          <Button type="submit" className="flex-1">
            검사 생성
          </Button>
        </div>
      </form>
    </Modal>
  );
};
