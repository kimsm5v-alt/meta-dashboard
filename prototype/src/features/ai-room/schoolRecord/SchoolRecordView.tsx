import { useState } from 'react';
import { ClassStatusView } from './ClassStatusView';
import { StudentWritingView } from './StudentWritingView';
import { BulkGenerateView } from './BulkGenerateView';
import { MOCK_RECORD_CLASSES } from './data';
import type { GenerationSource, RecordClass, RecordStudent } from './types';

type View = 'class' | 'student' | 'bulk';

/**
 * 생활기록부 작성 지원 — 복수 학급 오케스트레이터
 * 학급 선택 → 화면1 학급 현황 → 화면3 학생별 작성 / 화면2 일괄 생성
 */
export const SchoolRecordView: React.FC = () => {
  const [classes, setClasses] = useState<RecordClass[]>(MOCK_RECORD_CLASSES);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0].id);
  const [view, setView] = useState<View>('class');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bulkIds, setBulkIds] = useState<string[]>([]);

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? classes[0];
  const students = selectedClass.students;

  const patchStudent = (id: string, patch: Partial<RecordStudent>) =>
    setClasses((prev) =>
      prev.map((c) =>
        c.id === selectedClassId ? { ...c, students: c.students.map((s) => (s.id === id ? { ...s, ...patch } : s)) } : c,
      ),
    );

  const selectClass = (id: string) => {
    setSelectedClassId(id);
    setView('class');
    setActiveId(null);
    setBulkIds([]);
  };

  const openStudent = (id: string) => {
    setActiveId(id);
    setView('student');
  };

  const handleBulk = (ids: string[]) => {
    if (ids.length <= 1) {
      if (ids[0]) openStudent(ids[0]);
      return;
    }
    setBulkIds(ids);
    setView('bulk');
  };

  const applyBulk = (updates: { id: string; text: string; source: GenerationSource }[]) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id !== selectedClassId
          ? c
          : {
              ...c,
              students: c.students.map((s) => {
                const u = updates.find((x) => x.id === s.id);
                return u ? { ...s, savedText: u.text, generatedText: u.text, status: 'DRAFT', source: u.source, savedAt: '방금' } : s;
              }),
            },
      ),
    );
    setView('class');
  };

  const active = students.find((s) => s.id === activeId);
  const bulkStudents = students.filter((s) => bulkIds.includes(s.id));

  if (view === 'student' && active) {
    return <StudentWritingView key={active.id} student={active} onBack={() => setView('class')} onPatch={(p) => patchStudent(active.id, p)} />;
  }
  if (view === 'bulk') {
    return <BulkGenerateView students={bulkStudents} onBack={() => setView('class')} onApply={applyBulk} onEditStudent={openStudent} />;
  }
  return (
    <ClassStatusView
      classes={classes}
      selectedClassId={selectedClassId}
      onSelectClass={selectClass}
      students={students}
      onOpenStudent={openStudent}
      onBulk={handleBulk}
    />
  );
};
