import styled from '@emotion/styled';

// LPA 유형별 색상 매핑
const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  자원소진형: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  안전균형형: { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  몰입자원풍부형: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  무기력형: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  정서조절취약형: { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  자기주도몰입형: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
};

const DEFAULT_STYLE = { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };

interface TypeBadgeProps {
  type: string;
  count?: number;
  showSuffix?: boolean;
}

const StyledBadge = styled.span<{ $bg: string; $text: string; $border: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  border: 1px solid ${({ $border }) => $border};
`;

export const TypeBadge = ({ type, count, showSuffix = false }: TypeBadgeProps) => {
  const styles = TYPE_STYLES[type] || DEFAULT_STYLE;
  const displayText = showSuffix ? type : type.replace('형', '');

  return (
    <StyledBadge $bg={styles.bg} $text={styles.text} $border={styles.border}>
      {displayText}
      {count !== undefined && `: ${count}명`}
    </StyledBadge>
  );
};
