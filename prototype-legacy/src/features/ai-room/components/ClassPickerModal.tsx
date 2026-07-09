import { Check, Users } from 'lucide-react';
import { Modal, Button } from '@/shared/components';
import type { Class } from '@/shared/types';

interface ClassPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Class[];
  selectedClass: Class | null;
  onSelect: (cls: Class) => void;
}

export const ClassPickerModal: React.FC<ClassPickerModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClass,
  onSelect,
}) => {
  const handleSelect = (cls: Class) => {
    onSelect(cls);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="반 선택" size="sm">
      <div className="space-y-2">
        {classes.map((cls) => {
          const isSelected = selectedClass?.id === cls.id;
          const stats = cls.stats;
          return (
            <button
              key={cls.id}
              onClick={() => handleSelect(cls)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">
                  {cls.grade}학년 {cls.classNumber}반
                </p>
                <p className="text-sm text-gray-500">
                  학생 {stats?.totalStudents || 0}명
                </p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t">
        <Button variant="secondary" onClick={onClose} className="w-full justify-center">
          닫기
        </Button>
      </div>
    </Modal>
  );
};
