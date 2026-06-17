import { ENV } from '@shared/config/env';

/**
 * SuperPlatform 마이페이지의 그룹 관리 화면으로 이동한다. (group-from-idp 전환)
 *
 * <p>그룹 생성/수정/삭제/초대는 mypage(SSO)로 이관됐다. 학심정은 동기화로 받아 읽기만 한다.
 * 기존 마이페이지 버튼(MainLayout/StudentLayout의 openMypage)과 동일하게 `client_id` + `return_to`
 * (현재 URL)를 query 로 실어, 작업 후 학심정으로 복귀할 수 있게 한다.
 *
 * @param view 'list' = 교사 그룹 목록/관리, 'create' = 새 그룹 만들기, 생략 = userType 자동 분기
 */
export function openMypageGroups(view?: 'list' | 'create'): void {
  const params = new URLSearchParams({
    client_id: ENV.SP_CLIENT_ID,
    return_to: window.location.href,
  });
  if (view) {
    params.set('view', view);
  }
  window.location.href = `${ENV.SP_MYPAGE_URL}/groups?${params}`;
}

/**
 * 학생 그룹참여 deep-link (교사 그룹상세의 QR/링크 공유용). (group-from-idp)
 *
 * <p>학생이 이 링크/QR로 진입하면 mypage 그룹참여 페이지에서 회원가입/로그인 →
 * 그룹 합류 → `return_to`(학심정 학생 검사목록)로 자동 복귀한다. 참여는 mypage(SSO)가 처리.
 *
 * @param inviteCode Auth 동기화로 받은 그룹 초대코드
 */
export function buildGroupJoinUrl(inviteCode: string): string {
  const params = new URLSearchParams({
    client_id: ENV.SP_CLIENT_ID,
    return_to: ENV.SP_STUDENT_RETURN_URL,
  });
  return `${ENV.SP_MYPAGE_URL}/groups/join/${encodeURIComponent(inviteCode)}?${params}`;
}
