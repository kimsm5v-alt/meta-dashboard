import { useState } from 'react';
import { Check, X, Users } from 'lucide-react';
import { Modal, Button } from '@/shared/components';
import { TYPE_COLORS } from '@/shared/data/lpaProfiles';
import type { Class, Student } from '@/shared/types';

interface StudentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: Class[];
  selectedStudents: Student[];
  onConfirm: (students: Student[]) => void;
}

export const StudentPickerModal: React.FC<StudentPickerModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedStudents,
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState(classes[0]?.id || '');
  const [localSelection, setLocalSelection] = useState<Student[]>(selectedStudents);

  const activeClass = classes.find((c) => c.id === activeTab);
  const students = activeClass?.students || [];

  const isSelected = (student: Student) =>
    localSelection.some((s) => s.id === student.id);

  const toggleStudent = (student: Student) => {
    if (isSelected(student)) {
      setLocalSelection((prev) => prev.filter((s) => s.id !== student.id));
    } else {
      setLocalSelection((prev) => [...prev, student]);
    }
  };

  const handleConfirm = () => {
    onConfirm(localSelection);
    onClose();
  };

  const handleClear = () => {
    setLocalSelection([]);
  };

  const getStudentType = (student: Student): string => {
    const latestAssessment = student.assessments[student.assessments.length - 1];
    return latestAssessment?.predictedType || '미실시';
  };

  // 선택된 학생들을 반별로 그룹화
  const selectionByClass = localSelection.reduce((acc, student) => {
    const cls = classes.find((c) => c.id === student.classId);
    const key = cls ? `${cls.grade}-${cls.classNumber}반` : '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="학생 선택" size="full">
      <div className="flex gap-6 h-[65vh]">
        {/* 좌측: 반별 탭 + 학생 그리드 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 반 탭 */}
          <div className="flex gap-1 mb-4 border-b border-gray-200">
            {classes.map((cls) => {
              const isActive = activeTab === cls.id;
              const classSelectedCount = localSelection.filter(
                (s) => s.classId === cls.id
              ).length;
              return (
                <button
                  key={cls.id}
                  onClick={() => setActiveTab(cls.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>
                    {cls.grade}-{cls.classNumber}반
                  </span>
                  {classSelectedCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
                      {classSelectedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 학생 그리드 */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-6 gap-3">
              {students.map((student) => {
                const selected = isSelected(student);
                const type = getStudentType(student);
                return (
                  <button
                    key={student.id}
                    onClick={() => toggleStudent(student)}
                    className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      selected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-1 text-white"
                      style={{
                        backgroundColor: selected
                          ? '#8b5cf6'
                          : TYPE_COLORS[type] || '#9CA3AF',
                      }}
                    >
                      {student.number}
                    </div>
                    <span className="text-xs font-medium text-gray-900 truncate w-full text-center">
                      {student.name}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {type === '미실시' ? '미실시' : type.slice(0, 4)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 우측: 선택된 학생 목록 */}
        <div className="w-72 flex flex-col border-l border-gray-200 pl-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">
              선택됨 ({localSelection.length}명)
            </h4>
            {localSelection.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                전체 해제
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {Object.entries(selectionByClass).map(([className, students]) => (
              <div key={className}>
                <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {className}
                </p>
                <div className="space-y-1">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-700">
                          {student.number}.
                        </span>
                        <span className="text-sm text-gray-900 truncate">
                          {student.name}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleStudent(student)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {localSelection.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">학생을 선택하세요</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-3 mt-4 pt-4 border-t">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          취소
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={localSelection.length === 0}
          className="flex-1"
        >
          {localSelection.length}명 선택 완료
        </Button>
      </div>
    </Modal>
  );
};
