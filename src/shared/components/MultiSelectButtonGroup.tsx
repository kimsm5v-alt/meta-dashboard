interface MultiSelectButtonGroupProps<T extends string> {
  label: string;
  required?: boolean;
  items: T[];
  selected: T[];
  onToggle: (item: T) => void;
  labelMap: Record<T, string>;
  /** 선택 시 빨간색으로 표시할 항목 키 (예: 'urgent') */
  alertKey?: T;
  /** 버튼 크기 */
  size?: 'sm' | 'md';
}

export function MultiSelectButtonGroup<T extends string>({
  label,
  required,
  items,
  selected,
  onToggle,
  labelMap,
  alertKey,
  size = 'md',
}: MultiSelectButtonGroupProps<T>) {
  const sizeClass = size === 'sm'
    ? 'px-2.5 py-1 text-xs'
    : 'px-3 py-1.5 text-sm';

  const labelClass = size === 'sm'
    ? 'text-xs font-medium text-gray-500 mb-1.5'
    : 'text-sm font-medium text-gray-700 mb-2';

  return (
    <div>
      <label className={`block ${labelClass}`}>
        {label}
        {required && <span className="text-red-500"> *</span>}
        {' '}
        <span className={`${size === 'sm' ? 'text-[10px]' : 'text-xs'} text-gray-400 font-normal`}>
          (복수 선택)
        </span>
      </label>
      <div className={`flex flex-wrap ${size === 'sm' ? 'gap-1.5' : 'gap-2'}`}>
        {items.map(item => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={`${sizeClass} rounded-full font-medium transition-colors ${
              selected.includes(item)
                ? item === alertKey
                  ? 'bg-red-500 text-white'
                  : 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {labelMap[item]}
          </button>
        ))}
      </div>
    </div>
  );
}
