import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { MOCK_CLASSES } from '../data/mockClasses';
import type { ClassItem } from '../types';

export interface TargetSelection {
  classId: string;
  /** 선택된 학생 id 집합 */
  studentIds: string[];
  /** 학급 전체 선택 여부 */
  wholeClass: boolean;
}

interface TargetPickerProps {
  selection: TargetSelection;
  onChange: (next: TargetSelection) => void;
  onClose: () => void;
  /** 단일 선택 모드 (생활기록부 - 여러 명 담되 최종 1명 지정은 상위에서) */
  title?: string;
}

/** 학급/학생 선택 피커 팝오버 (264px) */
export const TargetPicker: React.FC<TargetPickerProps> = ({ selection, onChange, onClose, title = '대상 선택' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  const currentClass: ClassItem = MOCK_CLASSES.find((c) => c.id === selection.classId) ?? MOCK_CLASSES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const setClass = (classId: string) => {
    onChange({ classId, studentIds: [], wholeClass: false });
    setClassDropdownOpen(false);
  };

  const toggleWhole = () => {
    if (selection.wholeClass) {
      onChange({ ...selection, wholeClass: false, studentIds: [] });
    } else {
      onChange({ ...selection, wholeClass: true, studentIds: currentClass.students.map((s) => s.id) });
    }
  };

  const toggleStudent = (id: string) => {
    const has = selection.studentIds.includes(id);
    const nextIds = has ? selection.studentIds.filter((x) => x !== id) : [...selection.studentIds, id];
    const whole = nextIds.length === currentClass.students.length;
    onChange({ ...selection, studentIds: nextIds, wholeClass: whole });
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 w-[264px] bg-white rounded-xl shadow-xl border border-gray-200 z-30 overflow-hidden"
    >
      <div className="px-3.5 py-2.5 border-b border-gray-100 text-[12.5px] font-semibold text-gray-700">{title}</div>

      {/* 학급 드롭다운 */}
      <div className="px-3 pt-3 pb-2 relative">
        <button
          onClick={() => setClassDropdownOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg"
        >
          {currentClass.name}
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        {classDropdownOpen && (
          <div className="absolute left-3 right-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {MOCK_CLASSES.map((c) => (
              <button
                key={c.id}
                onClick={() => setClass(c.id)}
                className="w-full text-left px-3 py-2 text-[13px] text-gray-700 hover:bg-primary-50 first:rounded-t-lg last:rounded-b-lg"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 학급 전체 */}
      <div className="px-3">
        <label className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <Checkbox checked={selection.wholeClass} onChange={toggleWhole} />
          <span className="text-[13px] font-semibold text-gray-800">학급 전체</span>
        </label>
      </div>

      <div className="border-t border-gray-100 my-1.5" />

      {/* 학생 목록 */}
      <div className="max-h-[200px] overflow-y-auto px-3 pb-3">
        {currentClass.students.map((s) => (
          <label
            key={s.id}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <Checkbox checked={selection.studentIds.includes(s.id)} onChange={() => toggleStudent(s.id)} />
            <span className="text-[12px] text-gray-400 w-4 text-right">{s.no}</span>
            <span className="text-[13px] text-gray-700 flex-1">{s.name}</span>
            {s.tag === '관심' && (
              <span className="text-[10.5px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">관심</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

const Checkbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center flex-shrink-0 transition-colors ${
      checked ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-300'
    }`}
  >
    {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
  </button>
);
