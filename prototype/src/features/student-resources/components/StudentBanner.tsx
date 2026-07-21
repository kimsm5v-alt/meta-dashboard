/**
 * 학생 진행중 배너 (목업 renderStudent 의 stu-banner).
 */
import { useStudentResource } from '../store/StudentResourceContext';

export const StudentBanner = () => {
  const { toast } = useStudentResource();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <span className="h-2.5 w-2.5 flex-none animate-pulse rounded-full bg-emerald-500" />
      <div className="flex-1">
        <div className="text-sm font-bold text-gray-900">🟢 수업이 진행 중이에요</div>
        <div className="text-xs text-gray-600">감정 체크인 활동 · 김민지 선생님</div>
      </div>
      <button
        onClick={() => toast('활동 뷰어 접속 (QR/링크 · SSO 자동식별)')}
        className="flex-none rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        참여하기
      </button>
    </div>
  );
};
