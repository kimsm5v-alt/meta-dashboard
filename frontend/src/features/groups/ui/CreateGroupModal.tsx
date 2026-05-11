import styled from '@emotion/styled';
import { useState } from 'react';
import { GraduationCap, Building2 } from 'lucide-react';
import { Modal, Button } from '@shared/components';
import type { SchoolLevelCode } from '@shared/types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: GroupFormData) => void;
}

/** 학교급별 학년 범위 */
const GRADE_OPTIONS: Record<SchoolLevelCode, number[]> = {
  elementary: [5, 6],
  middle: [1, 2, 3],
  high: [1, 2, 3],
};

/** 학교급 라벨 */
const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
};

export interface GroupFormData {
  name: string;
  schoolLevel: SchoolLevelCode;
  grade: number;
  classNumber: number;
  description: string;
  schoolName: string;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 6px;
`;

const LabelIcon = styled.span`
  display: inline;
  margin-right: ${({ theme }) => theme.spacing.xs};
  vertical-align: middle;
`;

const OptionalText = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
`;

const SchoolLevelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SchoolLevelButton = styled.button<{ $isSelected: boolean }>`
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid
    ${({ theme, $isSelected }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[300]};
  background: ${({ theme, $isSelected }) => ($isSelected ? theme.colors.primary[500] : 'white')};
  color: ${({ theme, $isSelected }) => ($isSelected ? 'white' : theme.colors.gray[700])};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme, $isSelected }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[50]};
  }
`;

const GradeClassGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.lg};
  outline: none;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[200]};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.lg};
  outline: none;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[200]};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 16px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.lg};
  outline: none;
  resize: none;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[200]};
  }
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #1d4ed8;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: ${({ theme }) => theme.spacing.sm};
`;

const FlexButton = styled(Button)`
  flex: 1;
`;

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    schoolLevel: 'elementary',
    grade: GRADE_OPTIONS.elementary[0],
    classNumber: 1,
    description: '',
    schoolName: '',
  });

  // 학교급 변경 시 학년 초기화
  const handleSchoolLevelChange = (schoolLevel: SchoolLevelCode) => {
    setFormData((prev) => ({
      ...prev,
      schoolLevel,
      grade: GRADE_OPTIONS[schoolLevel][0],
    }));
  };

  // 학년/반 변경 시 그룹명 자동 생성
  const handleGradeClassChange = (field: 'grade' | 'classNumber', value: number) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // 이름이 비어있거나 자동 생성된 형식이면 자동 업데이트
      const autoName = `${prev.grade}학년 ${prev.classNumber}반`;
      if (!prev.name || prev.name === autoName) {
        newData.name = `${field === 'grade' ? value : prev.grade}학년 ${field === 'classNumber' ? value : prev.classNumber}반`;
      }
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    // 폼 초기화
    setFormData({
      name: '',
      schoolLevel: 'elementary',
      grade: GRADE_OPTIONS.elementary[0],
      classNumber: 1,
      description: '',
      schoolName: '',
    });
    onClose();
  };

  const handleChange = (field: keyof GroupFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='새 그룹 만들기' size='lg'>
      <Form onSubmit={handleSubmit}>
        {/* 학교급 */}
        <FormGroup>
          <Label>
            <LabelIcon>
              <GraduationCap size={16} style={{ verticalAlign: 'middle' }} />
            </LabelIcon>
            학교급
          </Label>
          <SchoolLevelGrid>
            {(Object.keys(SCHOOL_LEVEL_LABELS) as SchoolLevelCode[]).map((level) => (
              <SchoolLevelButton
                key={level}
                type='button'
                onClick={() => handleSchoolLevelChange(level)}
                $isSelected={formData.schoolLevel === level}
              >
                {SCHOOL_LEVEL_LABELS[level]}
              </SchoolLevelButton>
            ))}
          </SchoolLevelGrid>
        </FormGroup>

        {/* 학년/반 */}
        <GradeClassGrid>
          <FormGroup>
            <Label>학년</Label>
            <Select
              value={formData.grade}
              onChange={(e) => handleGradeClassChange('grade', parseInt(e.target.value))}
            >
              {GRADE_OPTIONS[formData.schoolLevel].map((g) => (
                <option key={g} value={g}>
                  {g}학년
                </option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>반</Label>
            <Select
              value={formData.classNumber}
              onChange={(e) => handleGradeClassChange('classNumber', parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                <option key={c} value={c}>
                  {c}반
                </option>
              ))}
            </Select>
          </FormGroup>
        </GradeClassGrid>

        {/* 그룹 이름 */}
        <FormGroup>
          <Label>그룹 이름</Label>
          <Input
            type='text'
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder='예: 6학년 2반'
            required
          />
        </FormGroup>

        {/* 설명 (선택) */}
        <FormGroup>
          <Label>
            설명 <OptionalText>(선택)</OptionalText>
          </Label>
          <TextArea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder='예: 2024학년도 6학년 2반'
            rows={2}
          />
        </FormGroup>

        {/* 학교명 (선택) */}
        <FormGroup>
          <Label>
            <LabelIcon>
              <Building2 size={16} style={{ verticalAlign: 'middle' }} />
            </LabelIcon>
            학교명 <OptionalText>(선택)</OptionalText>
          </Label>
          <Input
            type='text'
            value={formData.schoolName}
            onChange={(e) => handleChange('schoolName', e.target.value)}
            placeholder='예: 서울초등학교'
          />
        </FormGroup>

        {/* 안내 문구 */}
        <InfoBox>
          <p>그룹을 생성하면 학생 초대 코드가 자동으로 발급됩니다.</p>
        </InfoBox>

        {/* 버튼 */}
        <ButtonRow>
          <FlexButton type='button' variant='secondary' onClick={onClose}>
            취소
          </FlexButton>
          <FlexButton type='submit'>그룹 생성</FlexButton>
        </ButtonRow>
      </Form>
    </Modal>
  );
};
