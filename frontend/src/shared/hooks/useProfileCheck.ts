import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import { getAuth } from '@shared/lib/authClient';
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
 *
 * <p>queryFn 진입 시 SDK refreshAccessToken()을 선행 호출하여 SP JWT의 최신 claim이
 * 학심정에 도달하도록 한다. BE의 touchOnRequest sync 와 결합되어 SP 마이페이지에서
 * 변경된 이름·이메일이 즉시 user/group_member 에 반영된다.
 *
 * <ul>
 *   <li>staleTime 5분 — 라우트 연타 시 호출 절감</li>
 *   <li>refetchOnWindowFocus — 다른 탭(SP 마이페이지) 다녀온 직후 자동 sync</li>
 *   <li>refresh 실패 시 fallback — 기존 AT 로 status 호출 진행</li>
 * </ul>
 */
export function useProfileCheck(isAuthenticated: boolean): ProfileStatus {
  const { updateUser } = useAuth();

  const query = useQuery<ProfileStatusData>({
    queryKey: ['profile-status'],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // SP claim 최신화 — 실패해도 기존 AT 로 fallback 진행
      await getAuth().refreshAccessToken().catch(() => null);
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
