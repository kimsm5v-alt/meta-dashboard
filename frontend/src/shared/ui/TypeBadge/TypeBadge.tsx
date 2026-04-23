import styled from '@emotion/styled';

// LPA 유형별 색상 매핑
const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  자원소진형: { bg: '#fef2f2', text: '#E74C3C', border: '#fecaca' },
  '안전 균형형': { bg: '#eff8ff', text: '#3498DB', border: '#bfdbfe' },
  '몰입자원 풍부형': { bg: '#f0fdf4', text: '#2ECC71', border: '#bbf7d0' },
  '냉소적 무기력형': { bg: '#fef2f2', text: '#E74C3C', border: '#fecaca' },
  '정서조절 취약형': { bg: '#fffbeb', text: '#F39C12', border: '#fde68a' },
  '자기주도 몰입형': { bg: '#f0fdf4', text: '#2ECC71', border: '#bbf7d0' },
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
