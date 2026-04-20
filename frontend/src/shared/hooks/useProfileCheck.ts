import { useState, useEffect } from 'react';
import { apiClient } from '@shared/api/client';
import { useAuth } from '@features/auth/model/AuthContext';

interface ProfileStatus {
  registered: boolean;
  needsProfile: boolean;
  needsRoleSelection: boolean;
  isChecking: boolean;
}

/**
 * SSO 로그인 후 학심정 프로필 등록 여부 확인.
 * 등록된 사용자면 userNo, roleCode 등 학심정 서비스 데이터를 AuthContext에 반영.
 * 미등록이면 /auth/complete-profile로 리다이렉트 필요.
 */
export function useProfileCheck(isAuthenticated: boolean): ProfileStatus {
  const { updateUser } = useAuth();
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
        userNo?: number;
        roleCode?: string;
        tcId?: string;
        stdtId?: string;
      }>('/api/v1/user/status')
      .then((res) => {
        if (cancelled) return;
        const data = res.resultData;

        if (data.registered && data.userNo) {
          updateUser({
            id: String(data.userNo),
            roleCode: data.roleCode,
            tcId: data.tcId ?? undefined,
            stdtId: data.stdtId ?? undefined,
          });
        }

        setStatus({
          registered: data.registered,
          needsProfile: data.needsProfile,
          needsRoleSelection: data.needsRoleSelection ?? false,
          isChecking: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setStatus({ registered: false, needsProfile: true, needsRoleSelection: false, isChecking: false });
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, updateUser]);

  return status;
}
