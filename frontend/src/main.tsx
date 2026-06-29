import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initAuth } from '@shared/lib/authClient';
import { App } from '@app/App';

const PUBLIC_PATHS = ['/', '/guest', '/group/join', '/join', '/exam', '/login'];

async function bootstrap() {
  // 1) SDK 초기화
  const auth = await initAuth();

  // 2) 콜백 처리 + 세션 복구
  const result = await auth.handleRedirectResult();

  if (result.type === 'callback') {
    if (result.authenticated) {
      // 콜백 성공 → 학심정 user 등록 여부 확인
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/v1/user/status`,
          { headers: { Authorization: `Bearer ${auth.getAccessToken()}` } },
        );
        const data = await res.json();
        // 등록 여부는 BE resolveOrProvision 이 자동 처리 → returnPath 또는 역할 기반 리다이렉트
        const defaultPath = data.resultData?.roleCode === 'STUDENT' ? '/student/exams' : '/assessment';
        window.history.replaceState(null, '', result.returnPath || defaultPath);
      } catch {
        window.history.replaceState(null, '', result.returnPath || '/assessment');
      }
    } else {
      window.history.replaceState(null, '', '/login');
    }
  } else if (!result.authenticated) {
    const isPublic = PUBLIC_PATHS.some(
      (p) => window.location.pathname === p || window.location.pathname.startsWith(p + '/'),
    );

    if (!isPublic) {
      const silent = await auth.trySilentLogin();
      if (!silent.success && !auth.isAuthenticated()) {
        // 미인증 → 라우터에서 로그인 페이지로 리다이렉트
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
