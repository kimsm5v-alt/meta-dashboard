/** 타이핑 인디케이터 - 점 3개 bounce + 라벨 */
export const TypingIndicator: React.FC<{ label?: string }> = ({ label = '분석 중' }) => (
  <div className="flex items-center gap-2 text-gray-400">
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
    <span className="text-[12.5px]">{label}</span>
  </div>
);
