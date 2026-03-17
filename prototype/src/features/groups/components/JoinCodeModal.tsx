import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, Loader2, AlertCircle, Users, CheckCircle } from 'lucide-react';
import { Modal, Button } from '@/shared/components';
import { groupService } from '../services/groupService';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { GroupInviteInfo, SchoolLevelCode } from '@/shared/types';

interface JoinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess?: (groupId: string) => void;
}

/** 학교급 라벨 */
const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

type Step = 'input' | 'preview' | 'joining' | 'success' | 'error';

export const JoinCodeModal: React.FC<JoinCodeModalProps> = ({
  isOpen,
  onClose,
  onJoinSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [groupInfo, setGroupInfo] = useState<GroupInviteInfo | null>(null);
  const [studentNumber, setStudentNumber] = useState<string>('');
  const [error, setError] = useState('');

  const resetState = () => {
    setCode('');
    setStep('input');
    setGroupInfo(null);
    setStudentNumber('');
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // 초대 코드 검색
  const handleSearch = async () => {
    if (code.trim().length < 4) {
      setError('초대 코드를 입력해주세요.');
      return;
    }

    setError('');
    setStep('joining');

    try {
      const info = await groupService.getGroupByInviteCode(code.trim(), user?.id);

      if (!info) {
        setError('유효하지 않은 초대 코드입니다.');
        setStep('error');
        return;
      }

      if (info.alreadyJoined) {
        setError('이미 가입된 그룹입니다.');
        setStep('error');
        return;
      }

      setGroupInfo(info);
      setStep('preview');
    } catch {
      setError('그룹 정보를 불러오는데 실패했습니다.');
      setStep('error');
    }
  };

  // 그룹 가입
  const handleJoin = async () => {
    if (!groupInfo || !user) return;

    setStep('joining');

    try {
      await groupService.joinGroup(
        groupInfo.id,
        { studentNumber: studentNumber ? parseInt(studentNumber) : undefined },
        user.id,
        user.name
      );

      setStep('success');

      // 2초 후 자동으로 모달 닫기 및 이동
      setTimeout(() => {
        handleClose();
        if (onJoinSuccess) {
          onJoinSuccess(groupInfo.id);
        }
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '가입에 실패했습니다.';

      if (errorMessage === 'ALREADY_JOINED') {
        setError('이미 가입된 그룹입니다.');
      } else if (errorMessage === 'GROUP_DELETED') {
        setError('존재하지 않는 그룹입니다.');
      } else {
        setError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
      }
      setStep('error');
    }
  };

  // 비로그인 상태에서는 가입 페이지로 이동
  const handleGuestJoin = () => {
    handleClose();
    navigate(`/join/${code.trim()}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="그룹 참가"
      size="md"
    >
      {/* Step 1: 코드 입력 */}
      {step === 'input' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              초대 코드
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="예: ABC123"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-mono tracking-widest text-center uppercase focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                maxLength={6}
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <QrCode className="w-5 h-5 text-gray-400" />
              <p>방장에게 받은 초대 코드 6자리를 입력하세요.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
              취소
            </Button>
            <Button
              onClick={handleSearch}
              disabled={code.trim().length < 4}
              className="flex-1"
            >
              <Search className="w-4 h-4 mr-2" />
              그룹 찾기
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: 그룹 미리보기 */}
      {step === 'preview' && groupInfo && (
        <div className="space-y-6">
          {/* 그룹 정보 */}
          <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-xl p-6 text-center border border-primary-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-4">
              <Users className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{groupInfo.name}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {SCHOOL_LEVEL_LABELS[groupInfo.schoolLevel]} {groupInfo.grade}학년 {groupInfo.classNumber}반
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span>방장: {groupInfo.ownerName}</span>
              <span>멤버 {groupInfo.memberCount}명</span>
            </div>
          </div>

          {/* 출석번호 입력 (선택) */}
          {user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                출석번호 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                type="number"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="출석번호를 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                min={1}
                max={50}
              />
              <p className="mt-1 text-xs text-gray-500">
                나중에 방장이 수정할 수 있습니다.
              </p>
            </div>
          )}

          {/* 안내 문구 */}
          {user ? (
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
              <p>
                <span className="font-medium">{user.name}</span>님으로 그룹에 가입합니다.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-700">
              <p>로그인하지 않은 상태입니다. 게스트로 참가하거나 로그인 후 가입하세요.</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStep('input');
                setGroupInfo(null);
              }}
              className="flex-1"
            >
              뒤로
            </Button>
            {user ? (
              <Button onClick={handleJoin} className="flex-1">
                가입하기
              </Button>
            ) : (
              <Button onClick={handleGuestJoin} className="flex-1">
                게스트로 참가
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: 가입 중 */}
      {step === 'joining' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
          <p className="text-gray-600">처리 중...</p>
        </div>
      )}

      {/* Step 4: 가입 성공 */}
      {step === 'success' && groupInfo && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">가입 완료!</h3>
          <p className="text-gray-600">
            <span className="font-semibold">{groupInfo.name}</span>에 성공적으로 가입되었습니다.
          </p>
        </div>
      )}

      {/* Step 5: 에러 */}
      {step === 'error' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">오류 발생</h3>
            <p className="text-gray-600">{error}</p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
            >
              닫기
            </Button>
            <Button
              onClick={() => {
                setError('');
                setStep('input');
              }}
              className="flex-1"
            >
              다시 시도
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
