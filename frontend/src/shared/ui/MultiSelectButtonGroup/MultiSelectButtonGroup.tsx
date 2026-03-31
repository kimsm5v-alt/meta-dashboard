import styled from '@emotion/styled';

interface MultiSelectButtonGroupProps<T extends string> {
  label: string;
  required?: boolean;
  items: T[];
  selected: T[];
  onToggle: (item: T) => void;
  labelMap: Record<T, string>;
  alertKey?: T;
  size?: 'sm' | 'md';
}

const Container = styled.div``;

const Label = styled.label<{ $size: 'sm' | 'md' }>`
  display: block;
  font-size: ${({ $size, theme }) =>
    $size === 'sm' ? theme.typography.fontSize.xs : theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $size, theme }) =>
    $size === 'sm' ? theme.colors.text.secondary : theme.colors.text.primary};
  margin-bottom: ${({ $size, theme }) => ($size === 'sm' ? '6px' : theme.spacing.sm)};
`;

const Required = styled.span`
  color: ${({ theme }) => theme.colors.error.main};
`;

const Hint = styled.span<{ $size: 'sm' | 'md' }>`
  font-size: ${({ $size }) => ($size === 'sm' ? '10px' : '12px')};
  color: ${({ theme }) => theme.colors.gray[400]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const ButtonsWrapper = styled.div<{ $size: 'sm' | 'md' }>`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ $size, theme }) => ($size === 'sm' ? '6px' : theme.spacing.sm)};
`;

const SelectButton = styled.button<{
  $selected: boolean;
  $isAlert: boolean;
  $size: 'sm' | 'md';
}>`
  padding: ${({ $size }) => ($size === 'sm' ? '4px 10px' : '6px 12px')};
  font-size: ${({ $size, theme }) =>
    $size === 'sm' ? theme.typography.fontSize.xs : theme.typography.fontSize.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ $selected, $isAlert, theme }) => {
    if ($selected) {
      if ($isAlert) {
        return `
          background-color: ${theme.colors.error.main};
          color: white;
        `;
      }
      return `
        background-color: ${theme.colors.primary[500]};
        color: white;
      `;
    }
    return `
      background-color: ${theme.colors.gray[100]};
      color: ${theme.colors.gray[600]};
      &:hover {
        background-color: ${theme.colors.gray[200]};
      }
    `;
  }}
`;

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
  return (
    <Container>
      <Label $size={size}>
        {label}
        {required && <Required> *</Required>} <Hint $size={size}>(복수 선택)</Hint>
      </Label>
      <ButtonsWrapper $size={size}>
        {items.map((item) => (
          <SelectButton
            key={item}
            onClick={() => onToggle(item)}
            $selected={selected.includes(item)}
            $isAlert={item === alertKey}
            $size={size}
            type='button'
          >
            {labelMap[item]}
          </SelectButton>
        ))}
      </ButtonsWrapper>
    </Container>
  );
}
