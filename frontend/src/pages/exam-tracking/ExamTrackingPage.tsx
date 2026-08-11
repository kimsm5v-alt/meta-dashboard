import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';
import { TrackingEmptyState, ClassTrackingSection } from '@widgets/exam-tracking';

/**
 * 학생 스코프(scope.level === 'student')는 아직 렌더링하지 않는다 — LNB가 넘기는
 * scope.studentId는 그룹/명부 서비스의 GroupMember.id인데, useTeacherClasses()가
 * 만드는 Student.id는 DGNSS 검사 시스템의 stdtId라 서로 다른 식별자 체계다. 이 둘을
 * 잇는 매핑이 아직 없어 학생을 못 찾는다(항상 "찾을 수 없습니다" 상태가 됨). 매핑
 * 인프라가 생기기 전까지는 classId만으로 반 스코프 화면을 보여준다 — 학생을 클릭해도
 * 최소한 그 학생이 속한 반의 실데이터는 볼 수 있다.
 */
export const ExamTrackingPage = () => {
  const { scope } = useLayoutContext();

  if (scope.classId) {
    return <ClassTrackingSection classId={scope.classId} />;
  }

  return <TrackingEmptyState />;
};

export default ExamTrackingPage;
