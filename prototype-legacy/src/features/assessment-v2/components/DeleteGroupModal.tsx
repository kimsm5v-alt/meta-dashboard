/**
 * 그룹 삭제 확인 모달
 */

import { useState } from 'react';
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

export const DeleteGroupModal: React.FC<DeleteGroupModalProps> = ({
  isOpen,
  group,
  memberCount,
  completedExamCount,
  inProgressExamCount,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [confirmName, setConfirmName] = useState('');

  const isConfirmValid = confirmName.trim() === group.name;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmValid) return;
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-gray-900/50 animate-fade-in"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl animate-slide-up">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">그룹 삭제</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* 경고 박스 */}
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">
                  이 작업은 되돌릴 수 없습니다
                </p>
                <p className="text-sm text-red-600">
                  그룹의 모든 학생·검사 데이터가 함께 삭제되며 복구할 수 없습니다.
                </p>
              </div>
            </div>

            {/* 삭제될 데이터 목록 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                삭제될 데이터
              </p>
              <div className="space-y-2">
                <DataItem
                  icon={<Users className="w-4 h-4" />}
                  label="학생 명단"
                  value={`${memberCount}명`}
                />
                <DataItem
                  icon={<ClipboardList className="w-4 h-4" />}
                  label="완료된 검사 결과"
                  value={`${completedExamCount}건`}
                />
                <DataItem
                  icon={<FileText className="w-4 h-4" />}
                  label="진행 중인 검사 데이터"
                  value={`${inProgressExamCount}건`}
                />
                <DataItem
                  icon={<Link className="w-4 h-4" />}
                  label="초대 코드"
                  value={group.inviteCode}
                />
              </div>
            </div>

            {/* 확인 입력 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                삭제 확인을 위해 그룹 이름을 입력하세요
              </label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={group.name}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                "{group.name}"을(를) 정확히 입력해야 삭제할 수 있습니다.
              </p>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!isConfirmValid || isLoading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {isLoading ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 데이터 항목
const DataItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
    <span className="text-gray-400">{icon}</span>
    <span className="text-sm text-gray-600 flex-1">{label}</span>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

export default DeleteGroupModal;
