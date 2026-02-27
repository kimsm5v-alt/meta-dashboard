import { PlayCircle, RefreshCw, Loader2 } from 'lucide-react';

interface ResumeChoiceStepProps {
  examName: string;
  answeredCount: number;
  totalQuestions: number;
  onResume: () => void;
  onRestart: () => void;
  isLoading: boolean;
}

export const ResumeChoiceStep: React.FC<ResumeChoiceStepProps> = ({
  examName,
  answeredCount,
  totalQuestions,
  onResume,
  onRestart,
  isLoading,
}) => {
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 검사 정보 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary-100 text-primary-600 text-sm font-medium mb-4">
            META 학습종합검사
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{examName}</h1>
          <p className="text-gray-600">이전에 응답한 내용이 있습니다</p>
        </div>

        {/* 진행 상황 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-primary-600 mb-1">
              {answeredCount}<span className="text-2xl text-gray-400">/{totalQuestions}</span>
            </div>
            <p className="text-sm text-gray-500">문항 응답 완료</p>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">{progressPercent}% 완료</p>
        </div>

        {/* 선택 버튼 */}
        <div className="space-y-3">
          <button
            onClick={onResume}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <PlayCircle className="w-5 h-5" />
            )}
            이어하기
          </button>

          <button
            onClick={onRestart}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            새로하기
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          새로하기를 선택하면 기존 응답이 모두 삭제됩니다
        </p>
      </div>
    </div>
  );
};
