/**
 * SuperPlatform Auth Client SDK 타입 선언 + 싱글턴 초기화.
 *
 * SDK는 index.html에서 CDN <script>로 로드되며,
 * 전역 window.AuthClient 클래스가 생성된다.
 */

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

  // touchEnabled: localhost(HTTP)에서는 Secure 쿠키가 전송 안 되므로 touch 비활성화
  // HTTPS 환경(개발서버/운영)에서는 SameSite=None; Secure로 정상 동작
  const isHttps = window.location.protocol === 'https:';

  authInstance = await AuthClient.init({
    authUrl: import.meta.env.VITE_SP_AUTH_URL || 'http://localhost:8080',
    clientId: import.meta.env.VITE_SP_CLIENT_ID || 'test-service',
    redirectUri: window.location.origin + '/auth/callback',
    postLogoutRedirectUri: window.location.origin + '/login',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8081',
    touchEnabled: isHttps,
  });

  return authInstance;
}

export function getAuth(): AuthClientInstance {
  if (!authInstance) throw new Error('Auth SDK not initialized. Call initAuth() first.');
  return authInstance;
}
