import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { X, Info } from 'lucide-react';
import {
  SCHOOL_LEVEL_OPTIONS,
  GRADE_OPTIONS,
  CLASS_OPTIONS,
} from '../constants';
import { generateGroupName } from '../utils';
import type { GroupFormData } from '../types';
import type { SchoolLevelCode } from '@shared/types';

interface GroupFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: GroupFormData;
  onClose: () => void;
  onSubmit: (data: GroupFormData) => void;
  isLoading?: boolean;
}

const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 50;
  display: flex; align-items: center; justify-content: center; padding: 24px;
`;

const Backdrop = styled.div`
  position: absolute; inset: 0;
  background: rgba(17, 24, 39, 0.5);
  animation: vj-fade-in 0.15s ease-out;
`;

const Modal = styled.div`
  position: relative;
  background: #fff;
  border-radius: 16px;
  width: 100%; max-width: 512px;
  box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.3);
  animation: vj-slide-up 0.2s ease-out;
`;

const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #E5E7EB;
`;

const Title = styled.h2`
  margin: 0; font-size: 17px; font-weight: 800; color: #111827;
`;

const CloseBtn = styled.button`
  width: 32px; height: 32px;
  display: grid; place-items: center;
  border-radius: 8px; border: none; background: transparent;
  color: #9CA3AF; cursor: pointer;
  &:hover { background: #F3F4F6; color: #374151; }
`;

const Body = styled.div`
  padding: 20px 24px;
  display: flex; flex-direction: column; gap: 18px;
`;

const FieldLabel = styled.label`
  display: block; font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px;
`;

const Req = styled.span` color: #EF4444; `;
const Opt = styled.span` color: #9CA3AF; font-weight: 400; `;

const SegmentGroup = styled.div`
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 6px; padding: 4px;
  background: #F3F4F6; border-radius: 10px;
`;

const SegmentBtn = styled.button<{ $active: boolean }>`
  padding: 9px 0; font-size: 13px; font-weight: 700;
  border-radius: 8px; border: none; cursor: pointer; font-family: inherit;
  background: ${({ $active }) => ($active ? '#fff' : 'transparent')};
  color: ${({ $active }) => ($active ? '#7C3AED' : '#6B7280')};
  box-shadow: ${({ $active }) => ($active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none')};
  transition: all 0.15s;
  &:hover { color: #111827; }
`;

const Row2 = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 14px; `;

const Select = styled.select`
  width: 100%; padding: 9px 12px;
  background: #fff; border: 1px solid #E5E7EB;
  border-radius: 8px; font-size: 13px; color: #111827;
  outline: none; font-family: inherit;
  &:focus { border-color: #7C3AED; box-shadow: 0 0 0 2px rgba(124,58,237,0.15); }
`;

const Input = styled.input`
  width: 100%; padding: 9px 12px; box-sizing: border-box;
  background: #fff; border: 1px solid #E5E7EB;
  border-radius: 8px; font-size: 13px; color: #111827;
  outline: none; font-family: inherit;
  &:focus { border-color: #7C3AED; box-shadow: 0 0 0 2px rgba(124,58,237,0.15); }
  &::placeholder { color: #9CA3AF; }
`;

const Textarea = styled.textarea`
  width: 100%; padding: 9px 12px; box-sizing: border-box;
  background: #fff; border: 1px solid #E5E7EB;
  border-radius: 8px; font-size: 13px; color: #111827;
  outline: none; font-family: inherit; resize: none;
  &:focus { border-color: #7C3AED; box-shadow: 0 0 0 2px rgba(124,58,237,0.15); }
  &::placeholder { color: #9CA3AF; }
`;

const InfoBox = styled.div`
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px;
  background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 10px;
`;

const Footer = styled.div`
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid #E5E7EB;
  background: #F9FAFB; border-radius: 0 0 16px 16px;
`;

const CancelBtn = styled.button`
  padding: 9px 16px; font-size: 13px; font-weight: 700;
  background: transparent; border: none; color: #6B7280; cursor: pointer; font-family: inherit;
  &:hover { color: #111827; }
`;

const SubmitBtn = styled.button`
  padding: 9px 20px; font-size: 13px; font-weight: 700;
  background: #7C3AED; color: #fff; border: none; border-radius: 8px;
  cursor: pointer; font-family: inherit; transition: background 0.15s;
  &:hover { background: #6D28D9; }
  &:disabled { background: #D1D5DB; cursor: not-allowed; }
`;

const DEFAULT_FORM: GroupFormData = {
  name: generateGroupName(5, 1),
  schoolLevel: 'elementary',
  grade: 5,
  classNumber: 1,
  description: '',
  schoolName: '',
};

export const GroupFormModal = ({
  isOpen,
  mode,
  initialData,
  onClose,
  onSubmit,
  isLoading = false,
}: GroupFormModalProps) => {
  const [formData, setFormData] = useState<GroupFormData>(DEFAULT_FORM);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setFormData(initialData);
    } else {
      setFormData({ ...DEFAULT_FORM, name: generateGroupName(5, 1) });
    }
  }, [isOpen, mode, initialData]);

  const handleSchoolLevelChange = (schoolLevel: SchoolLevelCode) => {
    const newGrade = schoolLevel === 'elementary' ? 5 : 1;
    setFormData((prev) => ({
      ...prev,
      schoolLevel,
      grade: newGrade,
      name: generateGroupName(newGrade, prev.classNumber),
    }));
  };

  const handleGradeChange = (grade: number) => {
    setFormData((prev) => ({ ...prev, grade, name: generateGroupName(grade, prev.classNumber) }));
  };

  const handleClassChange = (classNumber: number) => {
    setFormData((prev) => ({ ...prev, classNumber, name: generateGroupName(prev.grade, classNumber) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const gradeOptions = GRADE_OPTIONS[formData.schoolLevel] ?? [1, 2, 3];

  return (
    <Overlay>
      <Backdrop onClick={onClose} />
      <Modal>
        <Header>
          <Title>{mode === 'create' ? '새 그룹 만들기' : '그룹 정보 수정'}</Title>
          <CloseBtn onClick={onClose}><X size={18} /></CloseBtn>
        </Header>

        <form onSubmit={handleSubmit}>
          <Body>
            {/* 학교급 */}
            <div>
              <FieldLabel>학교급</FieldLabel>
              <SegmentGroup>
                {SCHOOL_LEVEL_OPTIONS.map((opt) => (
                  <SegmentBtn
                    key={opt.value}
                    type="button"
                    $active={formData.schoolLevel === opt.value}
                    onClick={() => handleSchoolLevelChange(opt.value as SchoolLevelCode)}
                  >
                    {opt.label}
                  </SegmentBtn>
                ))}
              </SegmentGroup>
            </div>

            {/* 학년 / 반 */}
            <Row2>
              <div>
                <FieldLabel>학년</FieldLabel>
                <Select
                  value={formData.grade}
                  onChange={(e) => handleGradeChange(Number(e.target.value))}
                >
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>{g}학년</option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel>반</FieldLabel>
                <Select
                  value={formData.classNumber}
                  onChange={(e) => handleClassChange(Number(e.target.value))}
                >
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}반</option>
                  ))}
                </Select>
              </div>
            </Row2>

            {/* 그룹 이름 */}
            <div>
              <FieldLabel>그룹 이름 <Req>*</Req></FieldLabel>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="그룹 이름을 입력하세요"
                required
              />
            </div>

            {/* 설명 */}
            <div>
              <FieldLabel>설명 <Opt>(선택)</Opt></FieldLabel>
              <Textarea
                value={formData.description ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="그룹에 대한 간단한 설명"
                rows={2}
              />
            </div>

            {/* 학교명 */}
            <div>
              <FieldLabel>학교명 <Opt>(선택)</Opt></FieldLabel>
              <Input
                type="text"
                value={formData.schoolName ?? ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, schoolName: e.target.value }))}
                placeholder="예: 서울초등학교"
              />
            </div>

            {/* 안내 메시지 (생성 시만) */}
            {mode === 'create' && (
              <InfoBox>
                <Info size={15} style={{ color: '#7C3AED', flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 13, color: '#5B21B6', lineHeight: 1.6 }}>
                  그룹을 생성하면 학생 초대 코드가 자동으로 발급됩니다.
                </p>
              </InfoBox>
            )}
          </Body>

          <Footer>
            <CancelBtn type="button" onClick={onClose} disabled={isLoading}>취소</CancelBtn>
            <SubmitBtn type="submit" disabled={!formData.name.trim() || isLoading}>
              {isLoading ? '처리 중...' : mode === 'create' ? '그룹 생성' : '저장'}
            </SubmitBtn>
          </Footer>
        </form>
      </Modal>
    </Overlay>
  );
};
