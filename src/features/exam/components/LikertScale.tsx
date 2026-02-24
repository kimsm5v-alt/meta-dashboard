interface LikertScaleProps {
  selectedValue: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

const LIKERT_OPTIONS = [
  { value: '1', label: '전혀 그렇지 않다', shortLabel: '①' },
  { value: '2', label: '그렇지 않다', shortLabel: '②' },
  { value: '3', label: '보통이다', shortLabel: '③' },
  { value: '4', label: '그렇다', shortLabel: '④' },
  { value: '5', label: '매우 그렇다', shortLabel: '⑤' },
];

export const LikertScale: React.FC<LikertScaleProps> = ({
  selectedValue,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="flex gap-1 md:gap-3">
      {LIKERT_OPTIONS.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            disabled={disabled}
            className={`
              flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 md:px-3 rounded-lg transition-all
              min-h-[60px] md:min-h-[72px]
              ${isSelected
                ? 'bg-primary-500 text-white shadow-md scale-105'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            aria-label={`${option.label} 선택`}
            aria-pressed={isSelected}
          >
            <span className="text-lg md:text-xl font-bold">{option.shortLabel}</span>
            <span className="text-[10px] md:text-xs text-center leading-tight hidden sm:block whitespace-nowrap">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const LikertHeader: React.FC = () => (
  <div className="hidden md:flex gap-3 mb-2 px-4">
    <div className="w-12" /> {/* 번호 자리 */}
    <div className="flex-1" /> {/* 질문 자리 */}
    <div className="flex gap-3">
      {LIKERT_OPTIONS.map((option) => (
        <div
          key={option.value}
          className="flex-1 min-w-[60px] text-center text-xs text-gray-500"
        >
          {option.label}
        </div>
      ))}
    </div>
  </div>
);
