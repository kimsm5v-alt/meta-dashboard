import styled from '@emotion/styled';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { UnifiedCounselingRecord } from '@shared/types';
import { SCHEDULE_CLASSES, CLASS_COLORS } from '@shared/data/mockUnifiedCounseling';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const ClassCard = styled.button<{ $isSelected: boolean }>`
  position: relative;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 2px solid
    ${({ $isSelected, theme }) => ($isSelected ? theme.colors.primary[500] : theme.colors.gray[200])};
  box-shadow: ${({ $isSelected, theme }) => ($isSelected ? theme.shadows.md : 'none')};
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[300]};
  }
`;

const ClassHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ColorIndicator = styled.div<{ $color: string }>`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background-color: ${({ $color }) => $color};
`;

const ClassName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const CountSection = styled.div`
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.25rem;
`;

const CountUnit = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-left: 0.25rem;
`;

const TagsSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: 0.5rem;
`;

const Tag = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $color }) => $color};
`;

const EmptyTag = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SelectionDot = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[500]};
`;

interface ClassSummaryCardsProps {
  schedules: UnifiedCounselingRecord[];
  onClassClick?: (classId: string) => void;
  selectedClassFilter: string | null;
}

export const ClassSummaryCards: React.FC<ClassSummaryCardsProps> = ({
  schedules,
  onClassClick,
  selectedClassFilter,
}) => {
  // 학급별 통계 계산
  const classStats = SCHEDULE_CLASSES.map((cls) => {
    const classSchedules = schedules.filter((s) => s.classId === cls.id);
    const urgentCount = classSchedules.filter((s) => s.types.includes('urgent')).length;
    const followUpCount = classSchedules.filter((s) => s.types.includes('follow-up')).length;

    return {
      ...cls,
      total: classSchedules.length,
      urgent: urgentCount,
      followUp: followUpCount,
    };
  });

  return (
    <Grid>
      {classStats.map((cls) => {
        const isSelected = selectedClassFilter === cls.id;
        const color = CLASS_COLORS[cls.id] || '#9CA3AF';

        return (
          <ClassCard key={cls.id} onClick={() => onClassClick?.(cls.id)} $isSelected={isSelected}>
            {/* 상단: 반 이름 + 색상 인디케이터 */}
            <ClassHeader>
              <ColorIndicator $color={color} />
              <ClassName>{cls.label}</ClassName>
            </ClassHeader>

            {/* 총 건수 */}
            <CountSection>
              {cls.total}
              <CountUnit>건</CountUnit>
            </CountSection>

            {/* 하단: 긴급/후속 표시 */}
            <TagsSection>
              {cls.urgent > 0 && (
                <Tag $color='#dc2626'>
                  <AlertCircle className='w-3 h-3' />
                  긴급 {cls.urgent}
                </Tag>
              )}
              {cls.followUp > 0 && (
                <Tag $color='#d97706'>
                  <RefreshCw className='w-3 h-3' />
                  후속 {cls.followUp}
                </Tag>
              )}
              {cls.urgent === 0 && cls.followUp === 0 && cls.total > 0 && (
                <EmptyTag>정기상담 위주</EmptyTag>
              )}
              {cls.total === 0 && <EmptyTag>예정된 상담 없음</EmptyTag>}
            </TagsSection>

            {/* 선택 표시 */}
            {isSelected && <SelectionDot />}
          </ClassCard>
        );
      })}
    </Grid>
  );
};
