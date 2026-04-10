import type React from 'react';
import styled from '@emotion/styled';

interface LikertScaleProps {
  questionId: string;
  selectedValue: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  customChoices?: string[]; // 커스텀 선택지 (120-124번 문항용)
}

const LIKERT_OPTIONS = [
  { value: '1', label: '전혀 그렇지 않다' },
  { value: '2', label: '그렇지 않다' },
  { value: '3', label: '보통이다' },
  { value: '4', label: '그렇다' },
  { value: '5', label: '매우 그렇다' },
];

const Container = styled.div`
  display: flex;
`;

const Label = styled.label<{ $disabled: boolean }>`
  width: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  @media (min-width: 768px) {
    width: 5rem;
  }
`;

const RadioInput = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  border-color: ${({ theme }) => theme.colors.gray[300]};
  cursor: pointer;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
  }

  @media (min-width: 768px) {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const LabelText = styled.span<{ $isSelected: boolean }>`
  font-size: 10px;
  text-align: center;
  line-height: 1.25;
  color: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[600] : theme.colors.gray[500]};
  font-weight: ${({ $isSelected, theme }) =>
    $isSelected ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal};

  @media (min-width: 768px) {
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
  }
`;

export const LikertScale: React.FC<LikertScaleProps> = ({
  questionId,
  selectedValue,
  onSelect,
  disabled = false,
  customChoices,
}) => {
  // 커스텀 선택지가 있으면 사용, 없으면 기본 Likert 척도 사용
  const options = customChoices
    ? customChoices.map((label, idx) => ({ value: String(idx + 1), label }))
    : LIKERT_OPTIONS;

  return (
    <Container>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        const inputId = `${questionId}-${option.value}`;
        return (
          <Label key={option.value} htmlFor={inputId} $disabled={disabled}>
            <RadioInput
              type='radio'
              id={inputId}
              name={questionId}
              value={option.value}
              checked={isSelected}
              onChange={() => onSelect(option.value)}
              disabled={disabled}
            />
            <LabelText $isSelected={isSelected}>{option.label}</LabelText>
          </Label>
        );
      })}
    </Container>
  );
};

/** @deprecated 라디오 버튼 아래에 레이블이 포함되어 더 이상 필요 없음 */
export const LikertHeader: React.FC = () => null;
