export const ENV = {
  API_URL: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8081',
  AGENT_API_URL:
    (import.meta.env.VITE_AGENT_API_URL as string | undefined) ??
    'https://t-meta-agent-api.vsaidt.com',
  GEMINI_API_KEY: (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '',
  GEMINI_MODEL:
    (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-2.5-flash',
  SP_AUTH_URL:
    (import.meta.env.VITE_SP_AUTH_URL as string | undefined) ?? 'http://localhost:8080',
  SP_CLIENT_ID: (import.meta.env.VITE_SP_CLIENT_ID as string | undefined) ?? 'test-service',
  SP_MYPAGE_URL:
    (import.meta.env.VITE_SP_MYPAGE_URL as string | undefined)
    ?? 'https://t-mypage-superplatform.vsaidt.com',
  // 학생 그룹참여(QR/링크) 복귀 URL 오버라이드 (group-from-idp).
  // 기본은 빈 값 → buildGroupJoinUrl 이 window.location.origin 기준으로 자동 도출(환경별 자동).
  SP_STUDENT_RETURN_URL: (import.meta.env.VITE_SP_STUDENT_RETURN_URL as string | undefined) ?? '',
  IS_DEV: import.meta.env.DEV as boolean,
} as const;
