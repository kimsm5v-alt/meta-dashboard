interface FactorBarProps {
  score: number;
  color: string;
  height?: 'sm' | 'md';
}

const getBarPercent = (score: number) => Math.max(0, Math.min(100, ((score - 20) / 60) * 100));
const REF_LINE_POS = getBarPercent(50);

export const FactorBar: React.FC<FactorBarProps> = ({ score, color, height = 'md' }) => {
  const h = height === 'sm' ? 'h-[14px]' : 'h-5';

  return (
    <div className={`flex-1 relative ${h} bg-gray-100 rounded-full overflow-hidden`}>
      {/* T=50 기준선 */}
      <div
        className="absolute top-0 bottom-0 w-px border-l border-dashed border-gray-400 z-10"
        style={{ left: `${REF_LINE_POS}%` }}
      />
      {/* 막대 */}
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${getBarPercent(score)}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};
