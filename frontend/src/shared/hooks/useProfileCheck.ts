import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { useAuth } from '@features/auth/model/AuthContext';

interface ProfileStatusData {
  registered: boolean;
  userNo?: number;
  roleCode?: string;
  tcId?: string;
  stdtId?: string;
}

interface ProfileStatus {
  isChecking: boolean;
}

/**
 * SSO 로그인 후 학심정 user 동기화 훅.
 *
 * `/api/v1/user/status` 호출이 BE 의 resolveOrProvision(알려진 역할 자동 프로비저닝)
 * + touchOnRequest(SP claim sync) 를 태우고, 응답의 userNo/tcId/stdtId 를 AuthContext 에 반영한다.
 * (역할 미정 UNSET 사용자는 RP 까지 내려오지 않으므로 별도 프로필 입력 단계는 없다.)
 *
 * - staleTime 5분: 라우트 연타 시 호출 절감
 * - refetchOnWindowFocus: 다른 탭(SP 마이페이지) 복귀 시 자동 sync
 */
export function useProfileCheck(isAuthenticated: boolean): ProfileStatus {
  const { updateUser } = useAuth();

  const query = useQuery<ProfileStatusData>({
    queryKey: ['profile-status'],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await apiClient.get<ProfileStatusData>('/api/v1/user/status');
      return res.resultData;
    },
  });

  // 등록된 사용자면 학심정 서비스 데이터를 AuthContext 에 반영
  useEffect(() => {
    const data = query.data;
    if (data?.registered && data.userNo) {
      updateUser({
        id: String(data.userNo),
        roleCode: data.roleCode,
        tcId: data.tcId ?? undefined,
        stdtId: data.stdtId ?? undefined,
      });
    }
  }, [query.data, updateUser]);

  return {
    isChecking: query.isLoading,
  };
}
