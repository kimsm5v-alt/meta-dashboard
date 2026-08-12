export const ENV = {
  API_URL: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8081',
  AGENT_API_URL:
    (import.meta.env.VITE_AGENT_API_URL as string | undefined) ??
    'https://t-meta-agent-api.vsaidt.com',
  CHAT_API_URL:
    (import.meta.env.VITE_CHAT_API_URL as string | undefined) ?? 'https://t-dj.vsaidt.com',
  GEMINI_API_KEY: (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '',
  GEMINI_MODEL: (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-2.5-flash',
  SP_AUTH_URL: (import.meta.env.VITE_SP_AUTH_URL as string | undefined) ?? 'http://localhost:8080',
  SP_CLIENT_ID: (import.meta.env.VITE_SP_CLIENT_ID as string | undefined) ?? 'test-service',
  SP_MYPAGE_URL:
    (import.meta.env.VITE_SP_MYPAGE_URL as string | undefined) ?? 'https://t-hub.vschool.at',
  // 학생 그룹참여(QR/링크) 복귀 URL 오버라이드 (group-from-idp).
  // 기본은 빈 값 → buildGroupJoinUrl 이 window.location.origin 기준으로 자동 도출(환경별 자동).
  SP_STUDENT_RETURN_URL: (import.meta.env.VITE_SP_STUDENT_RETURN_URL as string | undefined) ?? '',
  IS_DEV: import.meta.env.DEV as boolean,
  /** vite dev 서버뿐 아니라 `build:dev`(--mode development)로 배포된 개발/스테이징 서버에서도 true. 운영(production) 빌드에서만 false */
  IS_DEV_MODE: import.meta.env.MODE !== 'production',
  SELFREG_HIDDEN: import.meta.env.VITE_SELFREG_HIDDEN === 'true',
  MANUAL_URL_COMPREHENSIVE:
    (import.meta.env.VITE_MANUAL_URL_COMPREHENSIVE as string | undefined) ?? '',
  MANUAL_URL_SELF_REGULATED:
    (import.meta.env.VITE_MANUAL_URL_SELF_REGULATED as string | undefined) ?? '',
} as const;
