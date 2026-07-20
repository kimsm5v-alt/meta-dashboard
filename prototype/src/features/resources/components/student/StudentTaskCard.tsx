/**
 * 학생 과제 카드 (목업 renderStudent 의 lcard).
 * 완료 → dim + ✓ + 다시보기 / 미제출 → 📝 + 풀기.
 */
import { useResources } from '../../store/ResourcesContext';
import type { StudentTask } from '../../types';

export const StudentTaskCard = ({ task }: { task: StudentTask }) => {
  const { toast } = useResources();
  const done = task.st === '완료';

  return (
    <div className={`flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${done ? 'opacity-60' : ''}`}>
      <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg text-lg text-white ${done ? 'bg-gray-400' : 'bg-amber-500'}`}>
        {done ? '✓' : '📝'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
          {task.t}
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${done ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-600'}`}>{task.st}</span>
        </div>
        <div className="mt-0.5 text-xs text-gray-500">마감 {task.dd}</div>
      </div>
      <button
        onClick={() => toast(done ? '내 응답 다시보기(읽기전용)' : '활동 뷰어 → 답안 작성 → 제출')}
        className={`flex-none rounded-lg px-3 py-1.5 text-sm font-semibold ${done ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-primary-500 text-white hover:bg-primary-600'}`}
      >
        {done ? '다시보기 ›' : '풀기 ›'}
      </button>
    </div>
  );
};
