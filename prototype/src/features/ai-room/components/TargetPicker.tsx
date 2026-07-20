import { useEffect, useState } from 'react';
import { Check, Minus, X, Search, Users } from 'lucide-react';
import { MOCK_CLASSES } from '../data/mockClasses';
import { emptySelection, getClass, getSelectedStudents } from '../utils/targets';

/** 대상 선택: 학급 id → 선택된 학생 id 목록 (다중 학급 지원) */
export interface TargetSelection {
  byClass: Record<string, string[]>;
}

interface TargetPickerProps {
  selection: TargetSelection;
  onChange: (next: TargetSelection) => void;
  onClose: () => void;
  title?: string;
}

/**
 * 대상 선택 모달 (다중 학급 + 대인원 학생 대응)
 * - 좌: 학급 목록(전체 체크 · 부분선택 표시 · 인원수), 클릭 시 우측에 학생 노출
 * - 우: 선택 학급의 학생 그리드 + 검색 + 현재 목록 전체 선택
 */
export const TargetPicker: React.FC<TargetPickerProps> = ({ selection, onChange, onClose, title = '대상 선택' }) => {
  const [focusedId, setFocusedId] = useState<string>(MOCK_CLASSES[0].id);
  const [search, setSearch] = useState('');

  const focusedClass = getClass(focusedId);
  const idsOf = (classId: string) => selection.byClass[classId] ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setClassIds = (classId: string, ids: string[]) => {
    const next = { ...selection.byClass };
    if (ids.length) next[classId] = ids;
    else delete next[classId];
    onChange({ byClass: next });
  };

  const toggleWholeClass = (classId: string) => {
    const cls = getClass(classId);
    const cur = idsOf(classId);
    setClassIds(classId, cur.length === cls.students.length ? [] : cls.students.map((s) => s.id));
  };

  const toggleStudent = (classId: string, sid: string) => {
    const cur = idsOf(classId);
    setClassIds(classId, cur.includes(sid) ? cur.filter((x) => x !== sid) : [...cur, sid]);
  };

  const focusedIds = idsOf(focusedId);
  const filtered = focusedClass.students.filter((s) => s.name.includes(search.trim()));
  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => focusedIds.includes(s.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setClassIds(focusedId, focusedIds.filter((id) => !filtered.some((s) => s.id === id)));
    } else {
      setClassIds(focusedId, Array.from(new Set([...focusedIds, ...filtered.map((s) => s.id)])));
    }
  };

  const totalSelected = getSelectedStudents(selection).length;
  const totalStudents = MOCK_CLASSES.reduce((n, c) => n + c.students.length, 0);
  const allClassesSelected = totalStudents > 0 && MOCK_CLASSES.every((c) => idsOf(c.id).length === c.students.length);
  const toggleAllClasses = () => {
    if (allClassesSelected) onChange(emptySelection());
    else onChange({ byClass: Object.fromEntries(MOCK_CLASSES.map((c) => [c.id, c.students.map((s) => s.id)])) });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[720px] max-w-full h-[560px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" title="닫기">
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* 본문 2단 */}
        <div className="flex-1 flex min-h-0">
          {/* 좌: 학급 목록 */}
          <div className="w-[210px] flex-shrink-0 border-r border-gray-100 overflow-y-auto py-2">
            <div className="text-[11px] font-bold text-gray-400 tracking-wide px-4 mb-1">학급</div>
            {/* 전체 학급 선택 */}
            <div
              onClick={toggleAllClasses}
              className="flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <CheckboxView checked={allClassesSelected} indeterminate={totalSelected > 0 && !allClassesSelected} />
              <span className="flex-1 text-[13.5px] font-bold text-gray-800">전체 학급</span>
              <span className="text-[11px] text-gray-400 flex-shrink-0">{totalStudents}</span>
            </div>
            <div className="border-t border-gray-100 mx-3 my-1.5" />
            {MOCK_CLASSES.map((cls) => {
              const ids = idsOf(cls.id);
              const whole = ids.length > 0 && ids.length === cls.students.length;
              const partial = ids.length > 0 && !whole;
              const isFocused = focusedId === cls.id;
              return (
                <div
                  key={cls.id}
                  onClick={() => setFocusedId(cls.id)}
                  className={`flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg cursor-pointer ${
                    isFocused ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWholeClass(cls.id);
                    }}
                    className="flex-shrink-0"
                    title="학급 전체 선택"
                  >
                    <CheckboxView checked={whole} indeterminate={partial} />
                  </button>
                  <span className={`flex-1 text-[13.5px] truncate ${isFocused ? 'font-bold text-primary-700' : 'font-medium text-gray-800'}`}>
                    {cls.name}
                  </span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    {ids.length ? `${ids.length}/` : ''}
                    {cls.students.length}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 우: 학생 그리드 */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`${focusedClass.name} 학생 검색`}
                  className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-1 focus:ring-primary-200"
                />
              </div>
              <button
                onClick={toggleSelectAllFiltered}
                disabled={filtered.length === 0}
                className="text-[12px] font-semibold text-primary-600 hover:bg-primary-50 disabled:opacity-40 px-2.5 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0"
              >
                {allFilteredSelected ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {filtered.length === 0 ? (
                <div className="text-center text-gray-400 text-[13px] py-12">검색 결과가 없습니다</div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {filtered.map((s) => {
                    const checked = focusedIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleStudent(focusedId, s.id)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left ${
                          checked ? 'bg-primary-50 border-primary-200' : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <CheckboxView checked={checked} />
                        <span className="text-[11px] text-gray-400 w-4 text-right flex-shrink-0">{s.no}</span>
                        <span className="text-[13px] text-gray-700 truncate">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[12.5px] text-gray-500">
            <Users className="w-3.5 h-3.5" />
            {totalSelected > 0 ? (
              <span>
                선택 <b className="text-primary-600">{totalSelected}</b>명
              </span>
            ) : (
              '선택된 대상 없음'
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalSelected > 0 && (
              <button onClick={() => onChange(emptySelection())} className="text-[13px] text-gray-500 hover:text-gray-700 px-3 py-1.5">
                전체 해제
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[13px] font-semibold text-white bg-primary-500 hover:bg-primary-600 px-4 py-1.5 rounded-lg"
            >
              완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckboxView: React.FC<{ checked: boolean; indeterminate?: boolean }> = ({ checked, indeterminate }) => (
  <span
    className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center flex-shrink-0 transition-colors ${
      checked || indeterminate ? 'bg-primary-500 border-primary-500' : 'bg-white border-gray-300'
    }`}
  >
    {checked ? (
      <Check className="w-3 h-3 text-white" strokeWidth={3} />
    ) : indeterminate ? (
      <Minus className="w-3 h-3 text-white" strokeWidth={3} />
    ) : null}
  </span>
);
