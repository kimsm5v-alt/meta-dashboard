import styled from '@emotion/styled';
import { useState, useMemo } from 'react';
import { Calendar, Users, GraduationCap } from 'lucide-react';
import { Modal, Button } from '@shared/components';
import type { Group } from '@shared/types';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormField = styled.div``;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.375rem;
`;

const OptionalText = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const Select = styled.select<{ $disabled?: boolean }>`
  width: 100%;
  padding: 0.625rem ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.lg};
  outline: none;
  transition: ${({ theme }) => theme.transitions.fast};
  background: ${({ $disabled, theme }) => ($disabled ? theme.colors.gray[50] : theme.colors.background.paper)};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'default')};

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const Input = styled.input<{ $disabled?: boolean }>`
  width: 100%;
  padding: 0.625rem ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.lg};
  outline: none;
  transition: ${({ theme }) => theme.transitions.fast};
  background: ${({ $disabled, theme }) => ($disabled ? theme.colors.gray[50] : theme.colors.background.paper)};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'default')};

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const HelperText = styled.p`
  margin-top: 0.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const SchoolLevelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
`;

const SchoolLevelButton = styled.button<{ $isActive: boolean; $disabled?: boolean }>`
  padding: 0.625rem ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: ${({ theme }) => theme.transitions.fast};
  background: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[500] : theme.colors.background.paper};
  color: ${({ $isActive, theme }) => ($isActive ? '#ffffff' : theme.colors.gray[700])};
  border-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[500] : theme.colors.gray[300]};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};

  &:hover {
    background: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[500] : theme.colors.gray[50])};
  }
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
`;

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: AssessmentFormData) => void;
  groups: Group[]; // 실제 그룹 데이터는 API에서 받아올 예정
}

/** 학교급 타입 */
export type SchoolLevel = 'elementary' | 'middle' | 'high';

/** 학교급별 학년 범위 */
const GRADE_OPTIONS: Record<SchoolLevel, number[]> = {
  elementary: [1, 2, 3, 4, 5, 6],
  middle: [1, 2, 3],
  high: [1, 2, 3],
};

/** 학교급 라벨 */
const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
};

export interface AssessmentFormData {
  name: string;
  groupId: string | null;
  schoolLevel: SchoolLevel;
  grade: number;
  classNumber: number;
  studentCount: number;
  round: 1 | 2;
  startDate: string;
  endDate: string;
}

const generateDefaultDates = () => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);

  return {
    startDate: today.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

export const CreateAssessmentModal: React.FC<CreateAssessmentModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  groups = [],
}) => {
  const defaultDates = generateDefaultDates();
  const [formData, setFormData] = useState<AssessmentFormData>({
    name: '',
    groupId: null,
    schoolLevel: 'elementary',
    grade: 1,
    classNumber: 1,
    studentCount: 30,
    round: 1,
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
  });

  // 선택된 그룹 정보
  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === formData.groupId) || null;
  }, [formData.groupId]);

  // 그룹 선택 시 학교급, 학년, 반, 학생 수 자동 설정
  const handleGroupChange = (groupId: string) => {
    if (groupId === '') {
      setFormData((prev) => ({
        ...prev,
        groupId: null,
      }));
      return;
    }

    const group = groups.find((g) => g.id === groupId);
    if (group) {
      setFormData((prev) => ({
        ...prev,
        groupId: group.id,
        schoolLevel: group.schoolLevel,
        grade: group.grade,
        classNumber: group.classNumber,
        studentCount: group.memberCount,
      }));
    }
  };

  // 학교급 변경 시 학년 초기화
  const handleSchoolLevelChange = (schoolLevel: SchoolLevel) => {
    setFormData((prev) => ({
      ...prev,
      groupId: null, // 그룹 선택 해제
      schoolLevel,
      grade: 1, // 학교급 변경 시 1학년으로 초기화
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    onClose();
  };

  const handleChange = (field: keyof AssessmentFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='새 검사 만들기' size='3xl'>
      <Form onSubmit={handleSubmit}>
        {/* 그룹 선택 */}
        <FormField>
          <Label>
            <Users className='inline w-4 h-4 mr-1' />
            그룹 선택 <OptionalText>(선택)</OptionalText>
          </Label>
          <Select value={formData.groupId || ''} onChange={(e) => handleGroupChange(e.target.value)}>
            <option value=''>직접 입력</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.memberCount}명)
              </option>
            ))}
          </Select>
          {selectedGroup && (
            <HelperText>그룹 정보로 학교급, 학년, 반, 학생 수가 자동 설정됩니다.</HelperText>
          )}
        </FormField>

        {/* 검사 이름 */}
        <FormField>
          <Label>검사 이름</Label>
          <Input
            type='text'
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder='예: 3학년 2반 1차 검사'
            required
          />
        </FormField>

        {/* 학교급 */}
        <FormField>
          <Label>
            <GraduationCap className='inline w-4 h-4 mr-1' />
            학교급
          </Label>
          <SchoolLevelGrid>
            {(Object.keys(SCHOOL_LEVEL_LABELS) as SchoolLevel[]).map((level) => (
              <SchoolLevelButton
                key={level}
                type='button'
                onClick={() => handleSchoolLevelChange(level)}
                disabled={!!selectedGroup}
                $isActive={formData.schoolLevel === level}
                $disabled={!!selectedGroup}
              >
                {SCHOOL_LEVEL_LABELS[level]}
              </SchoolLevelButton>
            ))}
          </SchoolLevelGrid>
        </FormField>

        {/* 학년/반 */}
        <TwoColumnGrid>
          <FormField>
            <Label>학년</Label>
            <Select
              value={formData.grade}
              onChange={(e) => handleChange('grade', parseInt(e.target.value))}
              disabled={!!selectedGroup}
              $disabled={!!selectedGroup}
            >
              {GRADE_OPTIONS[formData.schoolLevel].map((g) => (
                <option key={g} value={g}>
                  {g}학년
                </option>
              ))}
            </Select>
          </FormField>
          <FormField>
            <Label>반</Label>
            <Select
              value={formData.classNumber}
              onChange={(e) => handleChange('classNumber', parseInt(e.target.value))}
              disabled={!!selectedGroup}
              $disabled={!!selectedGroup}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                <option key={c} value={c}>
                  {c}반
                </option>
              ))}
            </Select>
          </FormField>
        </TwoColumnGrid>

        {/* 학생 수 / 차수 */}
        <TwoColumnGrid>
          <FormField>
            <Label>학생 수</Label>
            <Input
              type='number'
              min={1}
              max={50}
              value={formData.studentCount}
              onChange={(e) => handleChange('studentCount', parseInt(e.target.value))}
              disabled={!!selectedGroup}
              $disabled={!!selectedGroup}
            />
          </FormField>
          <FormField>
            <Label>검사 차수</Label>
            <Select
              value={formData.round}
              onChange={(e) => handleChange('round', parseInt(e.target.value) as 1 | 2)}
            >
              <option value={1}>1차 검사</option>
              <option value={2}>2차 검사</option>
            </Select>
          </FormField>
        </TwoColumnGrid>

        {/* 검사 기간 */}
        {/* <FormField>
          <Label>
            <Calendar className='inline w-4 h-4 mr-1' />
            검사 기간
          </Label>
          <TwoColumnGrid>
            <Input
              type='date'
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
            />
            <Input
              type='date'
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              min={formData.startDate}
            />
          </TwoColumnGrid>
        </FormField> */}

        {/* 버튼 */}
        <ButtonGroup>
          <Button type='button' variant='secondary' onClick={onClose} className='flex-1'>
            취소
          </Button>
          <Button type='submit' className='flex-1'>
            검사 생성
          </Button>
        </ButtonGroup>
      </Form>
    </Modal>
  );
};
