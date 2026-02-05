import { useState, useMemo } from 'react';
import { Check, X, Search, Users } from 'lucide-react';
import { Modal, Button } from '@/shared/components';
import type { CounselingStudent } from '@/shared/types';
import { SCHEDULE_CLASSES, SCHEDULE_STUDENTS, CLASS_COLORS } from '@/shared/data/mockUnifiedCounseling';

interface ScheduleStudentPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: CounselingStudent[];
  onConfirm: (students: CounselingStudent[]) => void;
}

export const ScheduleStudentPicker: React.FC<ScheduleStudentPickerProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  onConfirm,
}) => {
  const [activeTab, setActiveTab] = useState(SCHEDULE_CLASSES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelection, setLocalSelection] = useState<CounselingStudent[]>(selectedStudents);

  const students = SCHEDULE_STUDENTS[activeTab] || [];

  // 검색 필터링
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      s => s.name.toLowerCase().includes(query) || s.number.toString().includes(query)
    );
  }, [students, searchQuery]);

  const isSelected = (student: CounselingStudent) =>
    localSelection.some(s => s.id === student.id);

  const toggleStudent = (student: CounselingStudent) => {
    if (isSelected(student)) {
      setLocalSelection(prev => prev.filter(s => s.id !== student.id));
    } else {
      setLocalSelection(prev => [...prev, student]);
    }
  };

  const handleConfirm = () => {
    onConfirm(localSelection);
    onClose();
  };

  const handleClear = () => {
    setLocalSelection([]);
  };

  // 선택된 학생들을 반별로 그룹화
  const selectionByClass = localSelection.reduce((acc, student) => {
    const cls = SCHEDULE_CLASSES.find(c => c.id === student.classId);
    const key = cls ? cls.label : '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(student);
    return acc;
  }, {} as Record<string, CounselingStudent[]>);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="학생 선택" size="3xl">
      <div className="flex gap-6 h-[60vh]">
        {/* 좌측: 반별 탭 + 검색 + 학생 그리드 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 반 탭 */}
          <div className="flex gap-1 mb-3 border-b border-gray-200">
            {SCHEDULE_CLASSES.map(cls => {
              const isActive = activeTab === cls.id;
              const classSelectedCount = localSelection.filter(
                s => s.classId === cls.id
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
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CLASS_COLORS[cls.id] }}
                  />
                  <span>{cls.label}</span>
                  {classSelectedCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
                      {classSelectedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 검색 */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="이름 또는 번호로 검색"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* 학생 그리드 */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {filteredStudents.map(student => {
                const selected = isSelected(student);
                return (
                  <button
                    key={student.id}
                    onClick={() => toggleStudent(student)}
                    className={`relative flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                      selected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{
                        backgroundColor: selected
                          ? '#3351A4'
                          : CLASS_COLORS[student.classId] || '#9CA3AF',
                      }}
                    >
                      {student.number}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {student.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">검색 결과가 없습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 선택된 학생 목록 */}
        <div className="w-56 flex flex-col border-l border-gray-200 pl-4">
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
                  {students.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-1.5 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-medium text-gray-600">
                          {student.number}.
                        </span>
                        <span className="text-sm text-gray-900 truncate">
                          {student.name}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleStudent(student)}
                        className="p-0.5 hover:bg-gray-200 rounded"
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
