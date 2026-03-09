import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, ArrowRight, Loader2, CheckCircle, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/shared/components';
import { groupService } from '../services/groupService';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { GroupInviteInfo, SchoolLevelCode } from '@/shared/types';

type PageStep = 'loading' | 'info' | 'guest-form' | 'joining' | 'success' | 'error';

/** 학교급 라벨 */
const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

export const JoinGroupPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<PageStep>('loading');
  const [groupInfo, setGroupInfo] = useState<GroupInviteInfo | null>(null);
  const [error, setError] = useState('');

  // 회원 가입 폼
  const [studentNumber, setStudentNumber] = useState('');

  // 게스트 가입 폼
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestStudentNumber, setGuestStudentNumber] = useState('');

  // 그룹 정보 로드
  useEffect(() => {
    const loadGroupInfo = async () => {
      if (!code || authLoading) return;

      setStep('loading');
      try {
        const info = await groupService.getGroupByInviteCode(code, user?.id);

        if (!info) {
          setError('유효하지 않은 초대 코드입니다. 코드를 확인해주세요.');
          setStep('error');
          return;
        }

        if (info.alreadyJoined) {
          setError('이미 가입된 그룹입니다.');
          setStep('error');
          return;
        }

        setGroupInfo(info);
        setStep('info');
      } catch {
        setError('그룹 정보를 불러오는데 실패했습니다.');
        setStep('error');
      }
    };

    loadGroupInfo();
  }, [code, user?.id, authLoading]);

  // 회원 가입 처리
  const handleMemberJoin = async () => {
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage === 'ALREADY_JOINED') {
        setError('이미 가입된 그룹입니다.');
      } else {
        setError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
      }
      setStep('error');
    }
  };

  // 게스트 가입 처리
  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupInfo) return;

    // 유효성 검사
    if (!guestEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!guestName.trim() || guestName.trim().length < 2) {
      setError('이름을 2자 이상 입력해주세요.');
      return;
    }

    setError('');
    setStep('joining');

    try {
      await groupService.joinGroupAsGuest(groupInfo.id, {
        email: guestEmail.trim(),
        name: guestName.trim(),
        studentNumber: guestStudentNumber ? parseInt(guestStudentNumber) : undefined,
      });
      setStep('success');
    } catch {
      setError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
      setStep('error');
    }
  };

  // 로딩
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">그룹 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류 발생</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/groups')} className="w-full justify-center">
              그룹 목록으로
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setError('');
                setStep('loading');
                window.location.reload();
              }}
              className="w-full justify-center"
            >
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 가입 성공
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">가입 완료!</h1>
          <p className="text-gray-600 mb-6">
            <span className="font-semibold">{groupInfo?.name}</span>에 성공적으로 가입되었습니다.
          </p>
          {isAuthenticated ? (
            <Button onClick={() => navigate(`/groups/${groupInfo?.id}`)} className="w-full justify-center">
              그룹 보기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                방장이 검사를 시작하면 알림을 받게 됩니다.
              </p>
              <Button variant="secondary" onClick={() => navigate('/login')} className="w-full justify-center">
                로그인하고 결과 확인하기
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 가입 중
  if (step === 'joining') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">가입 처리 중...</p>
        </div>
      </div>
    );
  }

  // 게스트 폼
  if (step === 'guest-form' && groupInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <UserPlus className="w-10 h-10 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">게스트로 참가</h1>
            <p className="text-gray-600">
              <span className="font-semibold text-primary-600">{groupInfo.name}</span>
              {' '}({groupInfo.ownerName})
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleGuestJoin} className="bg-white rounded-2xl shadow-lg p-8">
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => {
                    setGuestEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                  required
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">
                  나중에 회원가입 시 검사 기록을 연동할 수 있습니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    setError('');
                  }}
                  placeholder="이름을 입력하세요"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                  required
                  minLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출석번호 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input
                  type="number"
                  value={guestStudentNumber}
                  onChange={(e) => setGuestStudentNumber(e.target.value)}
                  placeholder="출석번호"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                  min={1}
                  max={50}
                />
              </div>
            </div>

            {error && (
              <p className="mb-4 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}

            {/* 안내 */}
            <div className="bg-amber-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-700">
                게스트로 참가하면 이 기기에서만 검사 결과를 확인할 수 있습니다.
                회원가입하면 모든 기기에서 결과를 확인할 수 있습니다.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                게스트로 참가하기
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setStep('info')}
                className="w-full px-6 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors"
              >
                뒤로
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 그룹 정보 표시 (로그인/비로그인 분기)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-4">
            <Users className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">그룹 가입</h1>
          {groupInfo && (
            <p className="text-gray-600">
              <span className="font-semibold text-primary-600">{groupInfo.name}</span>
              {' '}({groupInfo.ownerName})
            </p>
          )}
        </div>

        {/* 그룹 정보 카드 */}
        {groupInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 mb-1">
                {SCHOOL_LEVEL_LABELS[groupInfo.schoolLevel]} {groupInfo.grade}학년 {groupInfo.classNumber}반
              </p>
              <p className="text-sm text-gray-500">
                현재 멤버 {groupInfo.memberCount}명
              </p>
            </div>

            {/* 로그인 상태에 따른 UI */}
            {isAuthenticated && user ? (
              // 로그인 상태: 바로 가입
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">{user.name}</span>님으로 가입합니다.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    출석번호 <span className="text-gray-400 font-normal">(선택)</span>
                  </label>
                  <input
                    type="number"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    placeholder="출석번호를 입력하세요"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                    min={1}
                    max={50}
                  />
                </div>

                <button
                  onClick={handleMemberJoin}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                >
                  그룹 가입하기
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              // 비로그인 상태: 로그인 유도 + 게스트 옵션
              <div className="space-y-4">
                <Link
                  to={`/login?redirect=/join/${code}`}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  로그인하고 가입하기
                </Link>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">또는</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep('guest-form')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  게스트로 참가하기
                </button>

                <p className="text-xs text-center text-gray-500">
                  게스트로 참가하면 이 기기에서만 결과를 확인할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 초대 코드 표시 */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            초대 코드: <span className="font-mono">{code}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
