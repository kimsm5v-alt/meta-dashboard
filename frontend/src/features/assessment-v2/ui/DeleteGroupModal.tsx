import { useState } from 'react';
import styled from '@emotion/styled';
import { X, AlertTriangle, Users, ClipboardList, FileText, Link } from 'lucide-react';
import type { Group } from '../types';

interface DeleteGroupModalProps {
  isOpen: boolean;
  group: Group;
  memberCount: number;
  completedExamCount: number;
  inProgressExamCount: number;
  onClose: () => void;
  onConfirm: () => void;
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
  background: #fff; border-radius: 16px;
  width: 100%; max-width: 440px;
  box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.3);
  animation: vj-slide-up 0.2s ease-out;
`;

const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px; border-bottom: 1px solid #E5E7EB;
`;

const Title = styled.h2` margin: 0; font-size: 17px; font-weight: 800; color: #111827; `;

const CloseBtn = styled.button`
  width: 32px; height: 32px; display: grid; place-items: center;
  border-radius: 8px; border: none; background: transparent;
  color: #9CA3AF; cursor: pointer;
  &:hover { background: #F3F4F6; color: #374151; }
`;

const Body = styled.div` padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; `;

const WarnBox = styled.div`
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px;
`;

const DataList = styled.div` display: flex; flex-direction: column; gap: 6px; `;

const DataItem = styled.div`
  display: flex; align-items: center; gap: 12px;
  padding: 9px 12px; background: #F9FAFB; border-radius: 8px;
`;

const FieldLabel = styled.label` display: block; font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px; `;

const ConfirmInput = styled.input`
  width: 100%; padding: 9px 12px; box-sizing: border-box;
  background: #fff; border: 1px solid #E5E7EB;
  border-radius: 8px; font-size: 13px; color: #111827;
  outline: none; font-family: inherit;
  &:focus { border-color: #EF4444; box-shadow: 0 0 0 2px rgba(239,68,68,0.15); }
  &::placeholder { color: #D1D5DB; }
`;

const Hint = styled.p` margin: 6px 0 0; font-size: 11.5px; color: #9CA3AF; `;

const Footer = styled.div`
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 14px 24px; border-top: 1px solid #E5E7EB;
  background: #F9FAFB; border-radius: 0 0 16px 16px;
`;

const CancelBtn = styled.button`
  padding: 9px 16px; font-size: 13px; font-weight: 700;
  background: transparent; border: none; color: #6B7280; cursor: pointer; font-family: inherit;
  &:hover { color: #111827; }
`;

const DeleteBtn = styled.button`
  padding: 9px 20px; font-size: 13px; font-weight: 700;
  background: #DC2626; color: #fff; border: none; border-radius: 8px;
  cursor: pointer; font-family: inherit; transition: background 0.15s;
  &:hover { background: #B91C1C; }
  &:disabled { background: #D1D5DB; cursor: not-allowed; }
`;

export const DeleteGroupModal = ({
  isOpen,
  group,
  memberCount,
  completedExamCount,
  inProgressExamCount,
  onClose,
  onConfirm,
  isLoading = false,
}: DeleteGroupModalProps) => {
  const [confirmName, setConfirmName] = useState('');

  const isValid = confirmName.trim() === group.name;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <Backdrop onClick={onClose} />
      <Modal>
        <Header>
          <Title>그룹 삭제</Title>
          <CloseBtn onClick={onClose}><X size={18} /></CloseBtn>
        </Header>

        <form onSubmit={handleSubmit}>
          <Body>
            <WarnBox>
              <AlertTriangle size={18} style={{ color: '#EF4444', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>
                  이 작업은 되돌릴 수 없습니다
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#DC2626' }}>
                  그룹의 모든 학생·검사 데이터가 함께 삭제되며 복구할 수 없습니다.
                </p>
              </div>
            </WarnBox>

            <div>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#374151' }}>삭제될 데이터</p>
              <DataList>
                <DataItem>
                  <Users size={15} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: 13, color: '#6B7280', flex: 1 }}>학생 명단</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{memberCount}명</span>
                </DataItem>
                <DataItem>
                  <ClipboardList size={15} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: 13, color: '#6B7280', flex: 1 }}>완료된 검사 결과</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{completedExamCount}건</span>
                </DataItem>
                <DataItem>
                  <FileText size={15} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: 13, color: '#6B7280', flex: 1 }}>진행 중인 검사 데이터</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{inProgressExamCount}건</span>
                </DataItem>
                <DataItem>
                  <Link size={15} style={{ color: '#9CA3AF' }} />
                  <span style={{ fontSize: 13, color: '#6B7280', flex: 1 }}>초대 코드</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{group.inviteCode}</span>
                </DataItem>
              </DataList>
            </div>

            <div>
              <FieldLabel>삭제 확인을 위해 그룹 이름을 입력하세요</FieldLabel>
              <ConfirmInput
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={group.name}
              />
              <Hint>"{group.name}"을(를) 정확히 입력해야 삭제할 수 있습니다.</Hint>
            </div>
          </Body>

          <Footer>
            <CancelBtn type="button" onClick={onClose} disabled={isLoading}>취소</CancelBtn>
            <DeleteBtn type="submit" disabled={!isValid || isLoading}>
              {isLoading ? '삭제 중...' : '삭제'}
            </DeleteBtn>
          </Footer>
        </form>
      </Modal>
    </Overlay>
  );
};
