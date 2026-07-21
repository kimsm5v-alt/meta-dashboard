/**
 * 학생 모드 화면 (목업 renderStudent). 진행중 배너 + 배포된 과제 목록.
 */
import { StudentBanner } from './StudentBanner';
import { StudentTaskList } from './StudentTaskList';

export const StudentView = () => (
  <div className="mt-5 flex flex-col gap-5">
    <StudentBanner />
    <div>
      <h2 className="mb-3 text-lg font-extrabold tracking-tight text-gray-900">나에게 배포된 활동</h2>
      <StudentTaskList />
    </div>
  </div>
);
