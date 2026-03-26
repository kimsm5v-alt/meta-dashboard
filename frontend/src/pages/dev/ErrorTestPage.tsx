import { useState } from 'react';
import { ApiError } from '@shared/api/client';

// ============================================================
// 에러를 렌더링 중에 throw하는 컴포넌트
// ============================================================

const ErrorThrower = ({ error }: { error: Error }) => {
  throw error;
};

// ============================================================
// 테스트 케이스 정의
// ============================================================

const TEST_CASES = [
  {
    label: '401 — 인증 필요',
    description: '"접근 권한이 없습니다 / 로그인 정보를 확인해주세요."',
    color: '#f59e0b',
    makeError: () => new ApiError(401, 'Unauthorized'),
  },
  {
    label: '403 — 권한 없음',
    description: '"접근 권한이 없습니다 / 로그인 정보를 확인해주세요."',
    color: '#ef4444',
    makeError: () => new ApiError(403, 'Forbidden'),
  },
  {
    label: '500 — 서버 오류',
    description: '"서버 오류가 발생했습니다 / 잠시 후 다시 시도해주세요."',
    color: '#8b5cf6',
    makeError: () => new ApiError(500, 'Internal Server Error'),
  },
  {
    label: '일반 에러',
    description: '"오류가 발생했습니다 / 에러 메시지 표시"',
    color: '#64748b',
    makeError: () => new Error('예상치 못한 오류가 발생했습니다.'),
  },
] as const;

// ============================================================
// 페이지
// ============================================================

export const ErrorTestPage = () => {
  const [activeError, setActiveError] = useState<Error | null>(null);

  if (activeError) {
    return <ErrorThrower error={activeError} />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px',
        gap: '16px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          ErrorBoundary 폴백 UI 테스트
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
          버튼을 클릭하면 해당 에러를 throw하여 폴백 UI를 확인합니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {TEST_CASES.map((tc) => (
            <button
              key={tc.label}
              onClick={() => setActiveError(tc.makeError())}
              style={{
                padding: '14px 20px',
                borderRadius: '12px',
                border: `2px solid ${tc.color}20`,
                background: `${tc.color}08`,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 600, color: tc.color, fontSize: '14px' }}>{tc.label}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {tc.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
