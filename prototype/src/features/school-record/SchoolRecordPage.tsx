/**
 * 생활기록부 작성 페이지 (검사 > 생활기록부 작성 탭)
 *
 * - 학급 선택: 좌측 LNB(스코프)의 selectedClass 사용
 * - 본문: 선택 학급의 작성 현황 / 학생별 작성 / 일괄 생성
 */
import { useLayoutContext } from '@/app/LayoutV2';
import { SchoolRecordView } from './SchoolRecordView';

export const SchoolRecordPage = () => {
  const { selectedClass, selectedStudent, selectAll, selectClass, selectStudent } = useLayoutContext();
  return (
    <SchoolRecordView
      selectedClassId={selectedClass?.id ?? null}
      selectedStudentName={selectedStudent?.name ?? null}
      onSelectStudent={(scopeId) => selectedClass && selectStudent(selectedClass.id, scopeId)}
      onBackToAll={selectAll}
      onBackToClass={() => selectedClass && selectClass(selectedClass.id)}
    />
  );
};
