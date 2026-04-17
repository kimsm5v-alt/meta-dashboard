import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initAuth } from '@shared/lib/authClient';
import { App } from '@app/App';

const PUBLIC_PATHS = ['/guest', '/group/join', '/join', '/exam', '/login', '/'];

async function bootstrap() {
  // 1) SDK 초기화
  const auth = await initAuth();

  // 2) 콜백 처리 + 세션 복구
  const result = await auth.handleRedirectResult();

  if (result.type === 'callback') {
    if (result.authenticated) {
      // 콜백 성공 → returnPath 또는 홈으로 replaceState
      window.history.replaceState(null, '', result.returnPath || '/');
    } else if (result.error === 'consent_denied') {
      window.history.replaceState(null, '', '/login');
    } else {
      window.history.replaceState(null, '', '/login');
    }
  } else if (!result.authenticated) {
    // 일반 페이지 로드 + 미인증
    const isPublic = PUBLIC_PATHS.some((p) => window.location.pathname === p || window.location.pathname.startsWith(p + '/'));

    if (!isPublic) {
      // SSO 세션 복구 시도
      const silent = await auth.trySilentLogin();
      if (!silent.success && !auth.isAuthenticated()) {
        // 미인증 → 라우터에서 로그인 페이지로 리다이렉트 (ProtectedLayout이 처리)
      }
    }
  }

  // 3) React 렌더
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
