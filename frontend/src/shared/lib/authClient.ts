/**
 * SuperPlatform Auth Client SDK 타입 선언 + 싱글턴 초기화.
 *
 * SDK는 index.html에서 CDN <script>로 로드되며,
 * 전역 window.AuthClient 클래스가 생성된다.
 */

import { ENV } from '@shared/config/env';

// ============================================================
// SDK 타입 선언
// ============================================================

export interface AuthClientOptions {
  authUrl: string;
  clientId: string;
  redirectUri: string;
  apiUrl?: string;
  paths?: {
    token?: string;
    refresh?: string;
    logout?: string;
  };
  postLogoutRedirectUri?: string;
  tokenStorage?: 'localStorage' | 'cookie';
  touchEnabled?: boolean;
  touchIntervalMs?: number;
}

export interface AuthUser {
  publicUserId: string;
  email: string;
  name: string;
  userType: string;
}

export interface RedirectResult {
  type: 'callback' | 'normal';
  authenticated: boolean;
  user: AuthUser | null;
  returnPath?: string;
  error?:
    | 'login_required'
    | 'consent_denied'
    | 'state_mismatch'
    | 'missing_params'
    | 'token_exchange_failed'
    | 'unknown';
}

export interface SilentLoginResult {
  success: boolean;
  reason?: 'no_session' | 'expired' | 'network';
}

export interface AuthClientInstance {
  login(options?: { redirectPath?: string }): Promise<void>;
  logout(): Promise<void>;
  getUser(): AuthUser | null;
  isAuthenticated(): boolean;
  getAccessToken(): string | null;
  refreshAccessToken(): Promise<string | null>;
  handleRedirectResult(): Promise<RedirectResult>;
  trySilentLogin(): Promise<SilentLoginResult>;
  setGuestToken(accessToken: string): void;
  onAuthChange(cb: (user: AuthUser | null) => void): () => void;
  authorizedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  startActivityTracking(): void;
  stopActivityTracking(): void;
}

declare global {
  const AuthClient: {
    init(options: AuthClientOptions): Promise<AuthClientInstance>;
  };
}

// ============================================================
// 싱글턴 인스턴스 관리
// ============================================================

let authInstance: AuthClientInstance | null = null;

export async function initAuth(): Promise<AuthClientInstance> {
  if (authInstance) return authInstance;

  // CDN 스크립트 로드 대기 (index.html에서 Promise 세팅)
  await (window as unknown as { __authSdkReady: Promise<void> }).__authSdkReady;

  // touchEnabled: localhost(HTTP)에서는 Secure 쿠키가 전송 안 되므로 touch 비활성화
  const isHttps = window.location.protocol === 'https:';

  authInstance = await AuthClient.init({
    authUrl: ENV.SP_AUTH_URL,
    clientId: ENV.SP_CLIENT_ID,
    redirectUri: window.location.origin + '/auth/callback',
    postLogoutRedirectUri: window.location.origin + '/login?logout=true',
    apiUrl: ENV.API_URL,
    tokenStorage: 'cookie',
    touchEnabled: isHttps,
  });

  return authInstance;
}

export function getAuth(): AuthClientInstance {
  if (!authInstance) throw new Error('Auth SDK not initialized. Call initAuth() first.');
  return authInstance;
}
