# CLAUDE.md — frontend

META AI 학습심리정서검사 대시보드 프론트엔드 프로젝트.
이 파일을 읽으면 코드베이스 전체 맥락을 즉시 파악할 수 있습니다.

---

## 📋 프로젝트 개요

- **역할**: 교사/학생 대시보드 (심리검사 결과 분석 + AI 어시스턴트)
- **`prototype/`**: UI 디자인 참조용 (구조 참고 금지)
- **`backend/`**: Spring Boot API (포트 8080)
- **`agent/`**: FastAPI AI 에이전트 (포트 8000)

---

## 🛠 기술 스택

| 역할       | 라이브러리           | 버전 |
| ---------- | -------------------- | ---- |
| UI         | React                | 19.x |
| 언어       | TypeScript           | ~5.9 |
| 번들러     | Vite                 | 5.x  |
| 스타일     | Emotion (CSS-in-JS)  | 11.x |
| 서버 상태  | TanStack React Query | v5   |
| 로컬 상태  | Zustand              | v5   |
| 라우팅     | React Router         | v7   |
| 폼         | React Hook Form      | -    |
| 차트       | Recharts             | v3   |
| 아이콘     | Lucide React         | -    |
| SSE        | fetch-event-source   | -    |
| HTTP       | Axios                | 1.x  |

---

## 🏗 아키텍처: FSD Lite

### 디렉토리 구조

```
src/
├── app/         # 초기화 (providers, router, theme)
├── pages/       # 라우트 페이지 (조합만, 로직 없음)
├── widgets/     # 화면 섹션 단위 복합 컴포넌트
├── features/    # 기능 단위 모듈 (API 훅 + 타입)
├── shared/      # 공통 기반 (UI, API 클라이언트)
└── main.tsx
```

### 단방향 의존성 규칙

```
pages → widgets → features → shared
```

- 하위 → 상위 import 금지
- 같은 레이어 간 cross-import 금지

### Path Alias

| Alias         | 경로             |
| ------------- | ---------------- |
| `@app/*`      | `src/app/*`      |
| `@pages/*`    | `src/pages/*`    |
| `@widgets/*`  | `src/widgets/*`  |
| `@features/*` | `src/features/*` |
| `@shared/*`   | `src/shared/*`   |

---

## 🔐 인증 (SSO + Cookie Security)

### SuperPlatform SSO 통합

**파일**: `shared/lib/authClient.ts`, `main.tsx`, `features/auth/model/AuthContext.tsx`

- **SDK CDN 로드**: `index.html`에서 `window.__authSdkReady` Promise 패턴
- **Bootstrap 순서**: SDK 초기화 → `handleRedirectResult()` → `trySilentLogin()` → React 렌더
- **Auth 메서드**: `loginAsGuest`, `updateUser`, `logout` (3개만 제공)
- **로그인**: `auth.login()` 호출 시 Auth 서버로 리다이렉트

### Cookie Mode 보안 (XSS 방지)

**목적**: Refresh Token을 localStorage에서 httpOnly 쿠키로 이동하여 XSS 공격 차단

**설정**:
```typescript
// authClient.ts:99
tokenStorage: 'cookie',  // RT는 httpOnly 쿠키에 저장

// client.ts:49
withCredentials: true,   // 쿠키 자동 전송
```

**검증**:
- ✅ localStorage에 `auth_token`/`refresh_token` 없음
- ✅ `ST_SESSION` 쿠키 (`httpOnly: true`, `secure: true`)
- ✅ JavaScript로 RT 접근 불가 → XSS 공격 차단
- ✅ SDK가 AT/RT 자동 관리

---

## 📡 실시간 알림 (SSE)

### 구현 개요

**라이브러리**: `@microsoft/fetch-event-source` (Bearer 토큰 지원)
**엔드포인트**: `/api/v1/notifications/stream` (SSE)
**폴링**: React Query (30초 간격)

### 핵심 파일

```
features/notifications/
├── api/
│   ├── useNotificationStream.ts   # SSE 연결 훅 (fetchEventSource)
│   ├── queries.ts                 # useNotifications, useMarkAsRead, useMarkAllAsRead
│   └── notificationService.ts     # API 래퍼
├── model/
│   └── types.ts                   # Notification, EventType, Category
├── ui/
│   ├── BellWithPanel/             # 벨 아이콘 + 패널 토글
│   ├── NotificationPanel/         # 알림 패널 (탭 + 리스트)
│   ├── NotificationTabs/          # 전체/검사/그룹 탭
│   ├── NotificationList/          # 무한 스크롤 리스트
│   ├── NotificationItem/          # 개별 알림 아이템
│   └── NotificationEmpty/         # 빈 상태
└── utils/
    ├── formatNotificationTime.ts  # 상대시간 포맷
    └── renderMessage.tsx          # 하이라이트 렌더링
```

### 구현 세부사항

- **SSE 연결**: `fetchEventSource` → Bearer 토큰 헤더 → 401 시 SDK refresh 후 재연결
- **이벤트 처리**: `notification` 이벤트 수신 → React Query 캐시 무효화
- **에러 처리**: 최대 3회 재시도 (5초 간격)
- **React Query**: `useInfiniteQuery` + 30초 폴링 + `refetchOnWindowFocus`
- **Optimistic Update**: 읽음 처리 즉시 UI 반영 → 실패 시 롤백

---

## 🎨 디자인 시스템

라이트 모드 기준 (`src/app/styles/theme.ts`)

### 핵심 색상

```typescript
theme.colors.primary[500];      // #8b5cf6 — 브랜드 보라
theme.colors.background.paper;  // #ffffff — 카드 배경
theme.colors.glass.background;  // rgba(255,255,255,0.8)
theme.colors.type.warning;      // #ea580c — LPA 자원소진형
theme.colors.type.balance;      // #0d9488 — 안전균형형
```

### Emotion 패턴

```tsx
// Transient props ($prefix)
const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
  color: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary[500] : theme.colors.gray[400]};
`;
```

---

## 🌐 API 클라이언트

**파일**: `shared/api/client.ts` (Axios 기반)

### 특징

- **자동 토큰 주입**: `getAuth().getAccessToken()` → `Authorization: Bearer`
- **401 자동 처리**: SDK `refreshAccessToken()` 호출 후 재시도
- **Public 엔드포인트**: `/api/v1/auth/*`, `/guest/*` 등은 토큰 제외
- **withCredentials**: 쿠키 기반 인증 지원

```typescript
import { apiClient } from '@shared/api';

const data = await apiClient.get<ClassSummary[]>('/teacher/classes');
await apiClient.post('/student/exam', { examData });
```

---

## ✅ 완료 작업

**2026-05-08**: PDF 다운로드 기능
- `shared/services/pdfDownloadService.ts` — 2단계 패턴 (POST→URL→`/files/pfile-download` blob)
- `shared/assets/svgIcons.ts` — PDF 아이콘 SVG 공용 상수
- **교사 클래스 대시보드** (`ClassDashboardWidget`): 학생별 PDF 버튼 활성화 (`pdf/search` answerIdx 맵), 전체 ZIP 일괄 다운로드 (미생성 선생성 → ZIP), 진행 모달
- **교사 학생 상세** (`StudentDashboardPage`): 1/2차 상세·요약 보고서 버튼 4개
- **학생 결과 페이지** (`MyResultPage`): 1/2차 결과 다운로드 버튼
- **검사하기** (`GeneralSection`): 교사용 설명서 PDF 버튼 2개

**2026-04-27**: SSE 알림 시스템 + Cookie 보안
- SSE 연결 (`@microsoft/fetch-event-source`) + React Query 폴링
- Optimistic Update + 벨 아이콘 UI
- `tokenStorage: 'cookie'` + httpOnly 쿠키 (`ST_SESSION`)
- localStorage RT 제거 → XSS 차단

**2026-04-20**: 리팩토링
- FSD Pages slim화 (1,372줄 → 3줄)
- 번들 분리 (2,371kB → 1,827kB)
- 환경변수 중앙화

**API 연동**: L1/L2/L3 대시보드, AI 에이전트, 생기부, 상담 일정

---

## ⚠️ 작업 시 주의사항

### 아키텍처
1. **Pages는 얇게** — styled component/로직 금지
2. **레이어 경계 준수** — 하위가 상위 import 금지
3. **any 금지** — ESLint error
4. **환경변수**: `ENV.*` 사용 (`shared/config/env.ts`)

### TypeScript
5. **타입 import**: `import type` 강제 (`verbatimModuleSyntax`)
6. **빌드**: `tsc -b` 사용 (noUnusedLocals 적용)

### 데이터 모델
7. **claId**: UUID 형식 (`split` 금지)
8. **User 타입**: `user.memberType` 사용 (`role` 없음)
9. **SchoolLevel**: `'초등' | '중등'` (고등 없음)

### SSO 인증
10. **로그인**: `auth.login()` → Auth 서버 리다이렉트
11. **토큰**: SDK가 자동 관리 (localStorage 직접 접근 금지)
12. **AuthContext**: `loginAsGuest`, `updateUser`, `logout` 3개만
13. **SDK 초기화**: `main.tsx` bootstrap에서 보장

### SSE 알림
14. **연결**: `useNotificationStream` 훅 사용
15. **401 처리**: SDK `refreshAccessToken()` 후 재연결
16. **재연결**: 최대 3회 (5초 간격)
17. **폴링**: React Query 30초 간격

### PDF 다운로드
18. **서비스**: `shared/services/pdfDownloadService.ts`
19. **개별 PDF**: POST `/api/dgnss/pdf` → URL 추출 → GET `/files/pfile-download?url=...&jwtToken=...` → blob → 새 탭
20. **전체 ZIP**: `pdf/search`로 미생성 학생 조회 → 순차 POST 생성 → GET `/api/dgnss/dgnss-download-all?jwtToken=...` → ZIP 다운로드
21. **PDF 아이콘**: `shared/assets/svgIcons.ts`의 `PDF_ICON_SVG_URL` (CSS `::before` 사용)

---

## 🐛 알려진 이슈

- **useProfileCheck**: 매 라우트마다 `/api/v1/user/status` 호출 (캐싱 필요)
- **SDK CDN**: 로드 실패 시 앱 전체 사용 불가
- **SSE 연결**: 네트워크 불안정 시 3회 재시도 후 종료

---

## 📋 다음 작업

**우선순위 1**:
- [ ] useProfileCheck React Query 캐싱

**우선순위 2**:
- [ ] MyResultPage 1차/2차 비교 모드
- [ ] 에러 바운더리

**우선순위 3**:
- [ ] features/counseling — 상담 기록
- [ ] features/resources — 학습 자료

---

## 📊 진행 상태

```
SSO 인증 통합     ████████████ 100%
SSE 알림 시스템   ████████████ 100%
Cookie 보안       ████████████ 100%
FSD Pages 정리    ████████████ 100%
TanStack Query    ████████████ 100%
번들 분리          ████████████ 100%
PDF 다운로드      ████████████ 100%
student-exam FSD  ████████████ 100%
```

---

**최종 업데이트**: 2026-05-08 (PDF 다운로드 완료)
**빌드 상태**: ✅ Production ready (tsc -b && vite build: ~21s, 1,827kB)
