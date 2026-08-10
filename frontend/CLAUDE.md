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

## 🎯 UI/UX 구현 기준 우선순위

UI와 사용자 흐름을 구현하거나 수정할 때 다음 순서를 기준으로 판단합니다.

1. **최신 확정 기획서/PPT**
2. **`prototype/`의 실제 화면과 동작**
3. **기능정의서**
4. **기존 `frontend/` 구현**
5. **개발자의 임의 판단**

- 자료가 충돌하면 더 높은 순위의 자료를 따릅니다.
- `prototype/`은 단순 참고가 아니라 UI 구성, 문구, 상태, 상호작용의 기준 구현입니다.
- 작업 전 관련 라우트와 컴포넌트뿐 아니라 초기/선택/완료/해제 상태를 확인합니다.
- 기준 자료에 없는 문구, 버튼, 아이콘, 칩, 상태, 동작을 임의로 추가하지 않습니다.
- 기준이 없거나 충돌해 판단할 수 없으면 추측하지 말고 확인한 자료와 충돌 지점을 보고합니다.
- 코드를 복사하지는 않습니다. 이 문서의 FSD 구조와 backend API 계약을 유지하면서 UI와 사용자 경험을 동등하게 구현합니다.

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

## 🧭 서버 상태 관리 원칙

- **서버 상태는 React Query로 관리**: API 응답 데이터, 목록, 상세, 검사 슬롯, 메모, 상담 기록은 `useQuery`/`useQueries`/`useMutation` 훅으로 감싼다.
- **로컬 state는 UI 상태만**: 모달 열림, 입력값, 선택 탭, 드롭다운, hover 같은 화면 상호작용만 `useState`에 둔다.
- **`useEffect` fetch 금지**: 마운트 시 `loadXxx()`를 호출해 `setData`/`setLoading` 하는 패턴은 새 코드에서 사용하지 않는다. 외부 시스템 동기화(SSE, DOM observer 등)에만 `useEffect`를 쓴다.
- **query key factory 우선**: 신규 서버 상태는 기능별 `queryKeys.ts`의 key factory를 사용한다. ad-hoc 문자열 key를 새로 만들지 않는다.
- **mutation 후 최소 무효화**: 생성/수정/삭제/상태 변경 성공 시 관련 key만 invalidate한다. 예: 검사 액션(`useInvalidateAssessmentGroup`)은 해당 `claId`의 슬롯 query(`examSlots(claId, userId)`)만 갱신한다.
- **optimistic update는 선별 적용**: 알림 읽음 처리처럼 즉시 반응성이 중요한 경우에만 사용하고, 검사/메모/상담은 기본적으로 성공 후 invalidate를 사용한다.

---

## 🧩 주요 아키텍처 결정

코드만 봐서는 알기 어려운, "왜 이렇게 되어 있나"를 설명하는 결정들. (전체 작업 이력은 git log / Jira 참조)

- **그룹 관리는 mypage(SSO)로 이관 (group-from-IDP)**: 그룹 생성/수정/삭제·학생 초대·초대코드/QR/링크 기능이 앱에서 제거되고 mypage로 이관됨. 앱은 그룹 **조회 + 검사 진행**만 담당. 미동의(NOT_CONSENTED) 멤버는 PII 마스킹, 그룹 데이터는 on-demand 동기화
- **AI 서버 분리**: `VITE_GEMINI_API_KEY`(클라이언트 직접 호출) 제거 → `VITE_CHAT_API_URL`(GPT/DJ 서버)로 일원화. AI 호출은 서버 경유
- **SSO/CDN 도메인**: vschool.at로 이전 + 콩(Kong) 게이트웨이 경유로 통일 (env는 `shared/config/env.ts`)
- **검사 페이지 단일화**: 구형 V1 검사 관리 제거 후 `AssessmentPage`(구 V2) 하나만 존재. `features/assessment`로 통합됨 ("🧭 서버 상태 관리 원칙" 참고)

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
9. **SchoolLevel**: 타입 정의는 `'초등' | '중등'`만 명시되어 있으나 실제 데이터에는 `'고등'`도 존재 (HSJ-83 이후). 고등 분기는 `classData.schoolLevel === '고등'` 인라인 비교로 처리

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

- **SDK CDN**: 로드 실패 시 앱 전체 사용 불가
- **SSE 연결**: 네트워크 불안정 시 3회 재시도 후 종료
- **useProfileCheck 창 포커스 리페치**: `refetchOnWindowFocus: true`이며 쿼리가 stale한 상태에서 탭 복귀 시 `/api/v1/user/status` 재호출(`staleTime: 5분`)

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

**최종 업데이트**: 2026-08-10 (UI/UX 구현 기준 우선순위 추가)
**빌드 상태**: ✅ Production ready (tsc -b --noEmit 에러 없음)
