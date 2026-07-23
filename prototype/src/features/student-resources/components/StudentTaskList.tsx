/**
 * 학생 과제 목록 (목업 renderStudent 의 studentTasks).
 */
import { STUDENT_TASKS } from '../mock-data';
import { StudentTaskCard } from './StudentTaskCard';

export const StudentTaskList = () => (
  <div className="flex flex-col gap-2.5">
    {STUDENT_TASKS.map((task, i) => (
      <StudentTaskCard key={i} task={task} />
    ))}
  </div>
);
