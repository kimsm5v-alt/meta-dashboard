interface LikertScaleProps {
  questionId: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

const LIKERT_OPTIONS = [
  { value: '1', label: '전혀 그렇지 않다' },
  { value: '2', label: '그렇지 않다' },
  { value: '3', label: '보통이다' },
  { value: '4', label: '그렇다' },
  { value: '5', label: '매우 그렇다' },
];

export const LikertScale: React.FC<LikertScaleProps> = ({
  questionId,
  selectedValue,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="flex">
      {LIKERT_OPTIONS.map((option) => {
        const isSelected = selectedValue === option.value;
        const inputId = `${questionId}-${option.value}`;
        return (
          <label
            key={option.value}
            htmlFor={inputId}
            className={`
              w-16 md:w-20 flex flex-col items-center gap-1.5 cursor-pointer select-none
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              id={inputId}
              name={questionId}
              value={option.value}
              checked={isSelected}
              onChange={() => onSelect(option.value)}
              disabled={disabled}
              className="w-5 h-5 md:w-6 md:h-6 text-primary-500 border-gray-300 focus:ring-primary-500 focus:ring-2 cursor-pointer"
            />
            <span className={`text-[10px] md:text-xs text-center leading-tight ${isSelected ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
};

/** @deprecated 라디오 버튼 아래에 레이블이 포함되어 더 이상 필요 없음 */
export const LikertHeader: React.FC = () => null;
