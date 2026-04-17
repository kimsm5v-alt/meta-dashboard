import { useState, useEffect } from 'react';
import { apiClient } from '@shared/api/client';

interface ProfileStatus {
  registered: boolean;
  needsProfile: boolean;
  needsRoleSelection: boolean;
  isChecking: boolean;
}

/**
 * SSO 로그인 후 학심정 프로필 등록 여부 확인.
 * 미등록이면 /auth/complete-profile로 리다이렉트 필요.
 */
export function useProfileCheck(isAuthenticated: boolean): ProfileStatus {
  const [status, setStatus] = useState<ProfileStatus>({
    registered: false,
    needsProfile: false,
    needsRoleSelection: false,
    isChecking: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus({ registered: false, needsProfile: false, needsRoleSelection: false, isChecking: false });
      return;
    }

    let cancelled = false;

    apiClient
      .get<{
        registered: boolean;
        needsProfile: boolean;
        needsRoleSelection?: boolean;
      }>('/api/v1/user/status')
      .then((res) => {
        if (cancelled) return;
        const data = res.resultData;
        setStatus({
          registered: data.registered,
          needsProfile: data.needsProfile,
          needsRoleSelection: data.needsRoleSelection ?? false,
          isChecking: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // API 실패 시 미등록으로 처리
        setStatus({ registered: false, needsProfile: true, needsRoleSelection: false, isChecking: false });
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return status;
}
