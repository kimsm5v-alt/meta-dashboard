import styled from '@emotion/styled';
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const FormField = ({ label, htmlFor, children }: FormFieldProps) => {
  return (
    <Wrapper>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </Wrapper>
  );
};
