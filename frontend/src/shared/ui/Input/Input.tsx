import styled from '@emotion/styled';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const StyledInput = styled.input<{ $hasError: boolean }>`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.background.elevated};
  border: 1px solid
    ${({ $hasError, theme }) => ($hasError ? theme.colors.error.main : theme.colors.gray[300])};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    outline: none;
    border-color: ${({ $hasError, theme }) =>
      $hasError ? theme.colors.error.main : theme.colors.primary[500]};
    box-shadow: 0 0 0 3px
      ${({ $hasError, theme }) =>
        $hasError ? theme.colors.error.main : theme.colors.primary[500]}30;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.disabled};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.error.main};
`;

export const Input = ({ error, ...props }: InputProps) => {
  return (
    <>
      <StyledInput $hasError={!!error} {...props} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </>
  );
};
