interface ExamProgressProps {
  currentPage: number;
  totalPages: number;
  answeredCount: number;
  totalQuestions: number;
}

export const ExamProgress: React.FC<ExamProgressProps> = ({
  currentPage,
  totalPages,
  answeredCount,
  totalQuestions,
}) => {
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto">
        {/* 상단 정보 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            검사 진행 현황
          </span>
          <span className="text-sm font-bold text-primary-600">
            {answeredCount}/{totalQuestions}
          </span>
        </div>

        {/* 진행률 바 */}
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 페이지 인디케이터 */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => {
            const displayNum = i + 1;
            const isActive = i === currentPage;
            const isPast = i < currentPage;

            return (
              <div
                key={displayNum}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-primary-500 text-white scale-110 shadow-md'
                    : isPast
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}
              >
                {displayNum}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
