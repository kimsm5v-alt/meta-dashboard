import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { useAuth } from '@features/auth/model/AuthContext';

interface ProfileStatusData {
  registered: boolean;
  needsProfile: boolean;
  needsRoleSelection?: boolean;
  userNo?: number;
  roleCode?: string;
  tcId?: string;
  stdtId?: string;
}

interface ProfileStatus {
  registered: boolean;
  needsProfile: boolean;
  needsRoleSelection: boolean;
  isChecking: boolean;
}

/**
 * SSO 로그인 후 학심정 프로필 등록 여부 확인.
 * SP claim sync는 BE touchOnRequest(987e284)가 담당하므로 프론트에서 refreshAccessToken() 불필요.
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
    registered: query.data?.registered ?? false,
    // 에러 시 needsProfile=true 로 가드 (기존 catch 블록과 동일 동작)
    needsProfile: query.isError ? true : (query.data?.needsProfile ?? false),
    needsRoleSelection: query.data?.needsRoleSelection ?? false,
    isChecking: query.isLoading,
  };
}
