import { useState, useEffect } from 'react';
import { ArrowLeft, LogIn, AlertCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/shared/components';

export interface TestCredentials {
  teacherId: string;
  classId: string;
  gradeLevel: 'el' | 'mi' | 'hi';
  jwtToken: string;
}

interface TestAccount extends TestCredentials {
  label: string;
}

interface TestLoginFormProps {
  onLogin: (credentials: TestCredentials) => void;
  isLoading: boolean;
}

const GRADE_LEVEL_OPTIONS = [
  { value: 'el', label: '초등' },
  { value: 'mi', label: '중등' },
  { value: 'hi', label: '고등' },
] as const;

/** 테스트 계정 목록 로드 (test-accounts.json) */
async function loadTestAccounts(): Promise<TestAccount[]> {
  try {
    const response = await fetch('/test-accounts.json');
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Failed to load test-accounts.json:', e);
  }
  return [];
}

export const TestLoginForm: React.FC<TestLoginFormProps> = ({ onLogin, isLoading }) => {
  const navigate = useNavigate();
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState<number>(-1);

  // 테스트 계정 로드
  useEffect(() => {
    loadTestAccounts().then(setTestAccounts);
  }, []);

  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [gradeLevel, setGradeLevel] = useState<'el' | 'mi' | 'hi'>('mi');
  const [jwtToken, setJwtToken] = useState('');
  const [error, setError] = useState('');

  // 테스트 계정 선택 시 자동 채우기
  useEffect(() => {
    if (selectedAccountIndex >= 0 && selectedAccountIndex < testAccounts.length) {
      const account = testAccounts[selectedAccountIndex];
      setTeacherId(account.teacherId);
      setClassId(account.classId);
      setGradeLevel(account.gradeLevel);
      setJwtToken(account.jwtToken);
    }
  }, [selectedAccountIndex, testAccounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!teacherId.trim()) {
      setError('교사 ID를 입력해주세요.');
      return;
    }
    if (!classId.trim()) {
      setError('클래스 ID를 입력해주세요.');
      return;
    }
    if (!jwtToken.trim()) {
      setError('JWT 토큰을 입력해주세요.');
      return;
    }

    onLogin({
      teacherId: teacherId.trim(),
      classId: classId.trim(),
      gradeLevel,
      jwtToken: jwtToken.trim(),
    });
  };

  const hasTestAccounts = testAccounts.length > 0;

  return (
    <Card className="w-full max-w-md p-8 relative">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-gray-500" />
      </button>

      {/* 헤더 */}
      <div className="text-center mb-8 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium mb-4">
          <AlertCircle className="w-3 h-3" />
          테스트 모드
        </div>
        <h1 className="text-2xl font-bold text-gray-900">임시 로그인</h1>
        <p className="text-gray-500 mt-1 text-sm">API 테스트용 credentials 입력</p>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 테스트 계정 선택 (계정이 있을 때만 표시) */}
        {hasTestAccounts && (
          <div>
            <label htmlFor="testAccount" className="block text-sm font-medium text-gray-700 mb-1">
              테스트 계정 선택
            </label>
            <div className="relative">
              <select
                id="testAccount"
                value={selectedAccountIndex}
                onChange={(e) => setSelectedAccountIndex(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none bg-white pr-10"
                disabled={isLoading}
              >
                <option value={-1}>직접 입력</option>
                {testAccounts.map((account, index) => (
                  <option key={index} value={index}>
                    {account.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* 교사 ID */}
        <div>
          <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700 mb-1">
            교사 ID (tcId)
          </label>
          <input
            id="teacherId"
            type="text"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            placeholder="예: engreal51-t"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            disabled={isLoading}
          />
        </div>

        {/* 클래스 ID */}
        <div>
          <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-1">
            클래스 ID (claId)
          </label>
          <input
            id="classId"
            type="text"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            placeholder="예: 1c4379432acc4a37ad0b608fd3a16a5c"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            disabled={isLoading}
          />
        </div>

        {/* 학교급 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            학교급 (gradeLevel)
          </label>
          <div className="flex gap-2">
            {GRADE_LEVEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGradeLevel(option.value)}
                className={`
                  flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all
                  ${gradeLevel === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }
                `}
                disabled={isLoading}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* JWT 토큰 (직접 입력 모드일 때만 표시) */}
        {selectedAccountIndex === -1 && (
          <div>
            <label htmlFor="jwtToken" className="block text-sm font-medium text-gray-700 mb-1">
              JWT 토큰
            </label>
            <textarea
              id="jwtToken"
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none text-sm font-mono"
              disabled={isLoading}
            />
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* 로그인 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-medium
            bg-primary-500 hover:bg-primary-600 text-white
            transition-all duration-200 shadow-lg shadow-primary-500/25
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>테스트 로그인</span>
            </>
          )}
        </button>
      </form>

      {/* 안내 문구 */}
      <p className="text-center text-xs text-gray-400 mt-6">
        실제 회원 체계 구축 전 API 테스트용 임시 로그인입니다.
      </p>
    </Card>
  );
};
