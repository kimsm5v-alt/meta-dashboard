import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { ClassStatusView } from './ClassStatusView';
import { StudentWritingView } from './StudentWritingView';
import { BulkGenerateView } from './BulkGenerateView';
import { MOCK_RECORD_CLASSES } from './data';
import type { GenerationSource, RecordClass, RecordStudent } from './types';

interface Props {
  /** LNB(스코프)에서 선택된 학급 id — 미선택(전체)이면 null */
  selectedClassId: string | null;
  /** LNB에서 선택된 학생 이름 — 미선택이면 null */
  selectedStudentName: string | null;
  /** LNB(스코프)에서 학생 선택 (표/버튼 클릭 → 사이드바와 동기화) */
  onSelectStudent: (scopeId: string) => void;
  /** 전체(반 미선택)로 돌아가기 */
  onBackToAll: () => void;
  /** 학급 목록으로 돌아가기 (LNB 학생 선택 해제) */
  onBackToClass: () => void;
}

/**
 * 생활기록부 작성 지원 — 검사 > 생활기록부 작성 탭
 * 학급/학생 선택은 좌측 LNB(스코프)에서 수행. 작성 화면 노출은 선택된 학생(컨텍스트) 기준으로 파생한다.
 */
export const SchoolRecordView: React.FC<Props> = ({ selectedClassId, selectedStudentName, onSelectStudent, onBackToAll, onBackToClass }) => {
  const [classes, setClasses] = useState<RecordClass[]>(MOCK_RECORD_CLASSES);
  const [bulkIds, setBulkIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;
  const students = selectedClass?.students ?? [];
  // 작성 화면은 선택된 학생(LNB 스코프) 기준으로 파생 → '반 전체' 클릭 시 자동으로 목록 복귀
  const activeStudent = selectedStudentName ? students.find((s) => s.name === selectedStudentName) ?? null : null;

  // 학급이 바뀌면 일괄 생성 상태 초기화
  useEffect(() => {
    setBulkOpen(false);
    setBulkIds([]);
  }, [selectedClassId]);

  const patchStudent = (id: string, patch: Partial<RecordStudent>) =>
    setClasses((prev) =>
      prev.map((c) =>
        c.id === selectedClassId ? { ...c, students: c.students.map((s) => (s.id === id ? { ...s, ...patch } : s)) } : c,
      ),
    );

  // 표/버튼에서 학생 열기 → LNB 스코프 선택으로 위임 (사이드바 하이라이트 동기화)
  const openStudent = (id: string) => {
    const stu = students.find((s) => s.id === id);
    if (!stu) return;
    setBulkOpen(false);
    onSelectStudent(stu.scopeId);
  };

  const handleBulk = (ids: string[]) => {
    if (ids.length <= 1) {
      if (ids[0]) openStudent(ids[0]);
      return;
    }
    setBulkIds(ids);
    setBulkOpen(true);
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
  };

  // 학급 미선택(전체) — 좌측에서 반 선택 유도
  if (!selectedClass) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">생활기록부 작성</h1>
        <p className="mt-1 text-sm text-gray-500">행동특성 및 종합의견 작성을 지원합니다.</p>
        <div className="mt-6 flex flex-col items-center justify-center text-center bg-white border border-gray-100 rounded-xl py-16 px-6">
          <ClipboardList className="w-9 h-9 text-gray-300 mb-3" />
          <p className="text-[14px] font-semibold text-gray-600">좌측에서 반을 선택해 주세요.</p>
          <p className="text-[12.5px] text-gray-400 mt-1 break-keep">선택한 반의 학생별 검사 결과를 바탕으로 생활기록부 문구 작성을 지원합니다.</p>
        </div>
      </div>
    );
  }

  // 학생 선택 시 작성 화면 (일괄 생성보다 우선)
  if (activeStudent) {
    return <StudentWritingView key={activeStudent.id} student={activeStudent} onBack={onBackToClass} onPatch={(p) => patchStudent(activeStudent.id, p)} />;
  }
  if (bulkOpen) {
    const bulkStudents = students.filter((s) => bulkIds.includes(s.id));
    return <BulkGenerateView students={bulkStudents} onBack={() => { setBulkOpen(false); setBulkIds([]); }} onApply={applyBulk} onEditStudent={openStudent} />;
  }
  return <ClassStatusView selectedClass={selectedClass} students={students} onOpenStudent={openStudent} onBulk={handleBulk} onBackToAll={onBackToAll} />;
};
