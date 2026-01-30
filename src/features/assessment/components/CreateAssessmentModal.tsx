import { useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import { Modal, Button } from '@/shared/components';

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AssessmentFormData) => void;
}

export interface AssessmentFormData {
  name: string;
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
    grade: 1,
    classNumber: 1,
    studentCount: 30,
    round: 1,
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
  });

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

        {/* 학년/반 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Users className="w-4 h-4 inline mr-1" />
              학년
            </label>
            <select
              value={formData.grade}
              onChange={(e) => handleChange('grade', parseInt(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            >
              {[1, 2, 3, 4, 5, 6].map((g) => (
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
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
