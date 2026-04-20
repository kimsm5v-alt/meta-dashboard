# CLAUDE.md — frontend

META AI 학습심리정서검사 대시보드의 프론트엔드 프로젝트입니다.
이 파일을 읽으면 코드베이스 전체 맥락을 바로 파악할 수 있습니다.

---

## 프로젝트 개요

- **역할**: 교사용 대시보드 (학급/학생 심리검사 결과 분석 및 AI 어시스턴트)
- **`prototype/` 폴더**: UI 레퍼런스. 구조는 참고하지 말고 **UI 디자인만** 참조
- **`backend/`**: Spring Boot REST API (포트 8080)
- **`agent/`**: FastAPI AI 에이전트 (포트 8000)

---

## 기술 스택

| 역할            | 라이브러리            | 버전 |
| --------------- | --------------------- | ---- |
| UI 프레임워크   | React                 | 19.x |
| 언어            | TypeScript            | ~5.9 |
| 번들러          | Vite                  | 5.x  |
| 스타일          | Emotion (CSS-in-JS)   | 11.x |
| 서버 상태       | TanStack React Query  | v5   |
| 클라이언트 상태 | Zustand               | v5   |
| 라우팅          | React Router          | v7   |
| 폼              | React Hook Form + Zod | -    |
| 차트            | Recharts              | v3   |
| 아이콘          | Lucide React          | -    |

---

## 아키텍처: FSD Lite (Feature-Sliced Design 경량화)

### 디렉토리 구조

```
src/
├── app/            # 앱 초기화 (providers, router, theme) — 거의 수정 없음
├── pages/          # 라우트 단위 페이지 — 조합만, 로직/스타일 없음
├── widgets/        # 화면 섹션 단위 복합 컴포넌트
├── features/       # 기능 단위 모듈 (API 훅 + 타입 + 상태 캡슐화)
├── shared/         # 레이어 공통 기반 (UI 컴포넌트, API 클라이언트)
└── main.tsx
```

### 단방향 의존성 규칙 (반드시 준수)

```
pages → widgets → features → shared
```

- 하위 레이어가 상위 레이어를 import하면 안 됨
- 같은 레이어 간 cross-import 금지 (예: feature A가 feature B를 import하면 안 됨)

---

## 레이어별 작성 규칙

### `app/`

건드릴 일이 거의 없음. Provider 추가 시에만 수정.

```
app/
├── providers/
│   ├── QueryProvider.tsx   # TanStack Query (staleTime: 5분, gcTime: 30분, retry: 1)
│   ├── ThemeProvider.tsx   # Emotion 테마 주입
│   └── index.tsx           # Provider 합성 순서: QueryProvider > ThemeProvider
├── router/
│   └── routes.tsx          # createBrowserRouter 라우트 정의
└── styles/
    ├── theme.ts            # 전체 디자인 토큰 (색상/간격/타이포/그림자 등)
    └── GlobalStyles.tsx    # CSS 리셋 + 전역 스타일
```

### `pages/`

**페이지는 얇게 유지한다.** styled component, 비즈니스 로직, 데이터 패칭 금지.
widgets와 features를 조합하는 역할만.

```tsx
// ✅ 올바른 페이지
export const TeacherDashboardPage = () => (
  <div>
    <PageTitle title='대시보드' subtitle='전체 학급 현황을 한눈에 확인하세요' />
    <StatsOverview />
    <ClassList />
  </div>
);

// ❌ 잘못된 페이지 — styled component와 mock 데이터가 페이지에 있음
export const TeacherDashboardPage = () => {
  const stats = [{ label: '전체 학생', value: '128' }]; // ❌
  return <div style={{ padding: 24 }}>...</div>; // ❌
};
```

### `widgets/`

화면을 구성하는 섹션 단위. features 훅과 shared/ui를 조합.
자체 데이터 패칭은 features 훅을 통해서만.

```
widgets/
├── layout/
│   ├── Header/       # 상단 헤더 (로고, 알림, 사용자)
│   ├── Sidebar/      # 사이드 네비게이션 (반응형)
│   └── PageLayout/   # Header + Sidebar + Outlet 조합
└── dashboard/
    ├── StatsOverview/  # 통계 카드 4개 (useTeacherStats 사용)
    └── ClassList/      # 학급 카드 목록 (useTeacherClasses 사용)
```

### `features/`

기능 단위 캡슐화. 외부에서는 `index.ts`를 통해서만 접근.

```
features/
├── auth/
│   ├── model/
│   │   └── useAuthStore.ts   # Zustand persist 스토어
│   └── index.ts
└── dashboard/
    ├── model/
    │   └── types.ts          # DashboardStat, ClassSummary 타입
    ├── api/
    │   └── queries.ts        # useTeacherStats, useTeacherClasses
    └── index.ts
```

**API 연동 전략**: queryFn에 mock 데이터를 두고, 백엔드 연동 시 `apiClient.get(...)` 으로만 교체.

```ts
// 현재 (mock)
queryFn: async (): Promise<ClassSummary[]> => mockClasses,

// API 연동 후
queryFn: () => apiClient.get<ClassSummary[]>('/teacher/classes'),
```

### `shared/`

도메인 무관한 공통 코드. 어느 레이어에서든 import 가능.

```
shared/
├── api/
│   └── client.ts     # fetch 래퍼 (Bearer 토큰 자동 주입, ApiError throw)
└── ui/
    ├── Button/        # variant: primary | secondary | outline | ghost
    ├── Card/          # variant: default | glass, Compound 패턴
    ├── Input/         # error prop 지원
    ├── FormField/     # Label + children 래퍼
    ├── Badge/         # variant: warning | balance | excellent | success | error | info | default
    ├── Skeleton/      # shimmer 애니메이션 로딩 플레이스홀더
    └── PageTitle/     # title + subtitle 페이지 헤더
```

---

## 상태 관리 전략

| 상태 종류                   | 도구                  | 위치                                  |
| --------------------------- | --------------------- | ------------------------------------- |
| 서버 데이터 (API 응답)      | TanStack React Query  | `features/*/api/queries.ts`           |
| 인증 상태 (user, token)     | Zustand + persist     | `features/auth/model/useAuthStore.ts` |
| UI 상태 (모달, 사이드바 등) | useState / useReducer | 각 컴포넌트 로컬                      |

- Redux 사용 안 함
- Zustand는 인증 등 진짜 전역 클라이언트 상태에만 사용
- 서버에서 오는 데이터는 전부 React Query로 관리

---

## 컴포넌트 작성 패턴

### Emotion Styled Component 기본형

```tsx
import styled from '@emotion/styled';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

// $ prefix: transient prop — DOM에 전달되지 않음
const StyledButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  color: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary[500] : theme.colors.gray[400]};
`;

export const Button = ({ variant = 'primary', children, ...props }: ButtonProps) => (
  <StyledButton $variant={variant} {...props}>
    {children}
  </StyledButton>
);
```

### Compound Component 패턴 (Card)

```tsx
export const Card = ({ children, ...props }: CardProps) => (
  <StyledCard {...props}>{children}</StyledCard>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

// 사용
<Card variant='glass'>
  <Card.Content>내용</Card.Content>
  <Card.Footer>
    <Button>버튼</Button>
  </Card.Footer>
</Card>;
```

### 데이터 패칭 패턴

```tsx
// widgets에서 feature 훅 사용
export const ClassList = () => {
  const { data: classes, isLoading } = useTeacherClasses();

  if (isLoading) return <Skeleton height='160px' />;

  return (
    <Grid>
      {classes?.map((cls) => (
        <ClassCard key={cls.id} {...cls} />
      ))}
    </Grid>
  );
};
```

### 폼 패턴 (React Hook Form + Zod)

```tsx
const schema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});

type FormData = z.infer<typeof schema>;

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

---

## Path Alias

`vite.config.ts`와 `tsconfig.app.json`에 동일하게 설정되어 있음.

| Alias         | 실제 경로        |
| ------------- | ---------------- |
| `@app/*`      | `src/app/*`      |
| `@pages/*`    | `src/pages/*`    |
| `@widgets/*`  | `src/widgets/*`  |
| `@features/*` | `src/features/*` |
| `@entities/*` | `src/entities/*` |
| `@shared/*`   | `src/shared/*`   |

레이어 간 import 시 반드시 alias 사용. 상대경로(`../../`)는 같은 슬라이스 내부에서만 허용.

---

## 디자인 시스템

라이트 모드. `src/app/styles/theme.ts` 참조.
prototype의 화이트/라이트 디자인을 기준으로 함.

### 핵심 색상

```ts
theme.colors.primary[500]; // #8b5cf6 — 브랜드 보라
theme.colors.secondary[500]; // #06b6d4 — 보조 청록
theme.colors.background.default; // #f8fafc — 최하단 배경 (밝은 회백색)
theme.colors.background.paper; // #ffffff — 카드 배경 (흰색)
theme.colors.background.elevated; // #f1f5f9 — 강조 영역 배경
theme.colors.text.primary; // #0f172a — 본문 텍스트
theme.colors.glass.background; // rgba(255,255,255,0.8) — 글래스 배경
theme.colors.glass.border; // rgba(0,0,0,0.08) — 글래스 테두리

// LPA 학생 유형 색상
theme.colors.type.warning; // #ea580c — 자원소진형/무기력형
theme.colors.type.balance; // #0d9488 — 안전균형형
theme.colors.type.excellent; // #2563eb — 몰입자원풍부형
```

### 글래스모피즘 카드 (라이트 모드)

```tsx
<Card variant="glass">...</Card>

// 또는 직접 styled에서
background: ${({ theme }) => theme.colors.glass.background}; // rgba(255,255,255,0.8)
backdrop-filter: blur(10px);
border: 1px solid ${({ theme }) => theme.colors.glass.border}; // rgba(0,0,0,0.08)
box-shadow: ${({ theme }) => theme.shadows.glass};
```

---

## API 클라이언트

`shared/api/client.ts` — **Axios 기반** (fetch에서 교체됨). Silent Refresh 구현 포함.

```ts
import { apiClient } from '@shared/api';

// 환경변수: VITE_API_URL (기본값: http://localhost:8080/api)
const data = await apiClient.get<ClassSummary[]>('/teacher/classes');
await apiClient.post('/auth/login', { email, password });
await apiClient.put('/student/1', updatedData);
await apiClient.delete('/memo/5');
```

- `localStorage`의 `auth_token` 키에서 JWT 자동 읽어 `Authorization: Bearer` 헤더 주입
- **Silent Refresh**: 401 응답 시 `POST /member/token/refresh` 호출 후 원본 요청 재시도
- **동시 요청 큐**: 여러 요청이 동시에 401 받으면 하나만 refresh 시도, 나머지는 큐에서 대기
- Refresh 실패 시 localStorage 초기화 + `window.dispatchEvent(new Event('auth:logout'))` 발행
- `PUBLIC_ENDPOINTS` 목록 (`/member/login`, `/member/token/refresh` 등)은 interceptor 제외

### localStorage 키

| 키              | 내용               |
| --------------- | ------------------ |
| `auth_token`    | Access Token (JWT) |
| `refresh_token` | Refresh Token      |
| `auth_user`     | 사용자 정보 (JSON) |

---

## ESLint + Prettier

### 설정 파일

- `eslint.config.js` — ESLint v9 flat config
- `.prettierrc` — Prettier 설정

### Prettier 규칙

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "singleQuote": true,
  "jsxSingleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "endOfLine": "auto"
}
```

### ESLint 주요 규칙

| 규칙                                         | 설정  | 이유                                           |
| -------------------------------------------- | ----- | ---------------------------------------------- |
| `@typescript-eslint/no-explicit-any`         | error | any 타입 전면 금지                             |
| `@typescript-eslint/no-unused-vars`          | error | `_` prefix는 허용                              |
| `@typescript-eslint/consistent-type-imports` | error | `import type` 강제 (verbatimModuleSyntax 대응) |
| `@typescript-eslint/no-empty-function`       | off   | 이벤트 핸들러 stub 허용                        |

### 명령어

```bash
# 루트에서 실행 (nx 사용)
npm run frontend   # dev 서버 (nx serve frontend)

# frontend 폴더 내부 또는 루트에서 직접
npx eslint . --fix    # 린트 자동 수정 (prettier 포맷팅 포함)
npx prettier --write "src/**/*.{ts,tsx}"  # prettier만 실행
```

---

## TypeScript 설정 (`tsconfig.app.json`)

주요 strict 옵션들:

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "verbatimModuleSyntax": true,
  "erasableSyntaxOnly": true,
  "noUncheckedSideEffectImports": true
}
```

- `verbatimModuleSyntax`: 타입 import는 반드시 `import type` 사용
- `erasableSyntaxOnly`: `enum`, `namespace` 등 비표준 TypeScript 문법 금지 → `const enum` 대신 `as const` 객체 사용

---

## 네이밍 규칙

| 대상             | 규칙             | 예시                          |
| ---------------- | ---------------- | ----------------------------- |
| 컴포넌트 파일    | PascalCase       | `ClassCard.tsx`               |
| 훅 파일          | camelCase        | `useTeacherClasses.ts`        |
| 유틸/상수 파일   | camelCase        | `dateUtils.ts`                |
| Styled component | PascalCase       | `StyledButton`, `CardWrapper` |
| Transient prop   | `$` prefix       | `$variant`, `$isOpen`         |
| 미사용 변수      | `_` prefix       | `_unusedParam`                |
| 상수             | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`             |

---

## 현재 구현 상태

### 완료

- [x] app/ — providers, router, theme, GlobalStyles
- [x] shared/ui — Button, Card, Input, FormField, Badge, Skeleton, PageTitle
- [x] shared/api — apiClient (Axios + Silent Refresh + 동시 요청 큐)
- [x] widgets/layout — Header, Sidebar, PageLayout
- [x] widgets/dashboard — StatsOverview, ClassList
- [x] features/auth — AuthContext (로그인/로그아웃/세션 복원/강제 로그아웃 이벤트/크로스탭 동기화)
- [x] features/auth/ui — LoginForm (비밀번호 오류 시 빨간 테두리 + 에러 메시지)
- [x] features/dashboard — useTeacherStats, useTeacherClasses (mock 데이터)
- [x] features/groups — 그룹 참여 (inviteCode 기반), JoinCodeModal, GroupListPage
- [x] features/student-exam — StudentGroupsPage (학생 그룹 참여 플로우)
- [x] pages/auth — LoginPage
- [x] pages/dashboard — TeacherDashboardPage
- [x] pages/groups — GroupListPage, JoinGroupPage (claId 기반 라우팅)
- [x] ESLint v9 flat config + Prettier 통합

#### 최근 완료 (2026-04-09)

**AI 어시스턴트 에이전트 API 연동**

- [x] features/ai-room/api/agentApiService.ts — META 에이전트 API 래퍼 신규 작성
  - `agentChat` (POST /chat), `agentChatStream` (POST /chat/stream SSE), `agentResetSession` (DELETE /chat/{id})
- [x] features/ai-room/api/assistantService.ts — Gemini callAI → 에이전트 API로 전환
  - RAG 컨텍스트를 `context_data`로 전달, session_id = 대화 ID
  - 스트리밍 응답 지원 (`callAssistantStream`)
- [x] features/ai-room/model/useConversations.ts — 스트리밍 + 세션 초기화 연동
  - `streamingContent` 상태 추가, `handleDeleteConversation` 시 서버 세션 초기화
- [x] features/ai-room/ui/ChatArea.tsx — 스트리밍 실시간 텍스트 표시 지원
- [x] widgets/ai-room/AIRoomChatArea.tsx — `streamingContent` prop 연결
- [x] `.env.development` — `VITE_AGENT_API_URL` 설정 완료

**생기부 패널 복원 및 Gemini 연동**

- [x] features/student-dashboard/ui/SchoolRecordPanel.tsx — prototype 기능 동등 복원
  - Emotion styled-components 전환 (TailwindCSS 제거)
  - `buildSimpleRecordMessages` + `callAI` 정상 연동
  - 강점 영역 토글 + 예시 문장 선택 (최대 5개)
  - 편집/저장/복사/다운로드/재생성 액션 전부 구현
  - 글자수 및 금지어 실시간 검증
- [x] `.env.development` — `VITE_GEMINI_API_KEY` 설정 완료
- [x] shared/services/schoolRecordService.ts — API 경로 `/api/` prefix 수정 (3곳)

**L1/L2/L3 실제 API 데이터 연동 완료**

- [x] features/api/useApiData.ts — `useTeacherClasses`, `useClassStudents`, `useStudentAnalysis` 실 API 연동

**MyResultPage 마이그레이션 (Phase 1)**

- [x] pages/student/MyResultPage.tsx (578 lines)
  - Tailwind → Emotion styled-components 전환
  - 대시보드 위젯 5개 통합 (ExamSummary, RecentExamResults, ProgressTracking, NextExam, PerformanceComparison)
  - 2차 검사 결과 표시, 빈 상태 처리, 로딩 스켈레톤
  - 브라우저 테스트 완료

**선생님 대시보드 API 연결**

- [x] shared/services/memoService.ts — fetch → apiClient 전환 (관찰 메모 API)
- [x] shared/services/schoolRecordService.ts — apiClient 전환 (생활기록부 API)
- [x] shared/services/unifiedCounselingService.ts — 10개 엔드포인트 전부 apiClient 전환 (통합 상담 API)
  - Bearer 토큰 자동 주입, 401 시 자동 토큰 갱신, APIResponse<T> 타입 래핑 적용

**검사 완료 화면 (Phase 3)**

- [x] features/exam/ui/MemberCompleteStep.tsx (168 lines)
  - 회원용 검사 완료 화면 (이메일 입력 없음)
  - pages/exam/ExamPage.tsx에 회원/게스트 분기 로직 통합
  - `user.memberType !== 'guest'` 조건으로 화면 분기

#### 최근 완료 (2026-04-20) — 리팩토링 + SSO 통합

**리팩토링 Phase 1: FSD Pages 레이어 slim화**

- [x] `GroupDetailPage.tsx` (1,372줄 → 3줄) → `widgets/group-detail/GroupDetailWidget.tsx`
- [x] `ClassDashboardPage.tsx` (857줄 → 4줄) → `widgets/class-dashboard/ClassDashboardWidget.tsx`
- [x] `SchedulePage.tsx` (592줄 → 3줄) → `widgets/schedule/ScheduleWidget.tsx`
- pages 파일에서 console.log 5개 제거, 빈 catch 블록 → console.error 처리

**리팩토링 Phase 2: TanStack Query 마이그레이션**

- [x] `features/api/useApiData.ts` — 4개 훅 전부 `useQuery` 패턴으로 교체
  - `useTeacherClasses`, `useClassStudents`, `useStudentAnalysis`, `useClassAnalysis`
  - `hasFetched` 플래그 제거 → queryKey 기반 자동 캐싱
  - 569줄 → 278줄

**리팩토링 Phase 3: 번들 분리**

- [x] `vite.config.ts` — `manualChunks` 추가, 메인 번들 2,371kB → 1,827kB (23% 감소)
  - `data-ai-prompts`, `data-school-record`, `data-lpa-profiles`, `data-knowledge-graph`
  - `vendor-recharts`, `vendor-emotion`, `vendor-router`

**리팩토링 Phase 4: 에러 핸들링 & 환경변수 중앙화**

- [x] `shared/config/env.ts` 신규 생성 — `import.meta.env` 직접 접근 9개 파일 → `ENV.*` 통일
- [x] `.catch(() => {})` 3곳 → `console.warn/error` 교체

**SSO 통합 (feature/sso-integration 브랜치 반영)**

- [x] `shared/lib/authClient.ts` 신규 — SuperPlatform Auth SDK 타입 + 싱글턴 (`initAuth`, `getAuth`)
- [x] `shared/hooks/useSpAuth.ts` 신규 — SDK 기반 React 훅 (`useSyncExternalStore`)
- [x] `shared/hooks/useProfileCheck.ts` 신규 — SSO 로그인 후 프로필 등록 여부 확인
- [x] `pages/auth/CompleteProfilePage.tsx` 신규 — 최초 로그인 시 성별/역할 입력
- [x] `features/auth/model/AuthContext.tsx` 완전 교체 — SDK 기반으로 전환
  - 제거: `loginWithCredentials`, `loginWithEmail`, `signUp`, `sendCode`, `verifyCode`
  - 유지: `loginAsGuest`(SDK `setGuestToken`), `updateUser`, `logout`
- [x] `main.tsx` 완전 교체 — 비동기 bootstrap 패턴 (SDK 초기화 → callback → React 렌더)
- [x] `shared/api/client.ts` 교체 — 자체 Silent Refresh 150줄 제거 → SDK `refreshAccessToken()` 20줄
- [x] 삭제: `SignUpPage.tsx`, `ForgotPasswordPage.tsx`, `LoginForm.tsx`
- [x] `LoginPage.tsx`, `ExamAuthStep.tsx`, `JoinGroupPage.tsx` — SSO 버튼으로 교체
- [x] `routes.tsx` — `/signup`, `/forgot-password` 제거; `/auth/complete-profile` 추가; `useProfileCheck` 적용
- [x] `groupService.ts` — `joinGroupAsGuest` 반환 타입 `refreshToken` → `guestId`
- [x] `User` 타입에 `spUserId?`, `userType?` 추가; `OAuthProvider`에 `'sso'` 추가

#### 최근 완료 (2026-04-10)

**교사 대시보드 버그 수정 — Mock 데이터 → 실 API 전환**

- [x] widgets/teacher-dashboard/ClassCardsSection.tsx
  - `getRound1Status()` 버그 수정: `cls.stats === undefined`일 때 항상 'in-progress' 반환하던 문제
  - 배지 텍스트 '진행중'/'시작전' 분기 수정

- [x] shared/services/dashboardService.ts
  - `StudentInfoItem` 인터페이스에 `stdtNm?`, `nickname?` 필드 추가
  - `buildClassFromAPI`: 학생 이름 `stdtNm ?? nickname ?? \`학생${rowNum}\`` 순으로 폴백
  - `fetchL2DashboardData`: `fetchStudentFullAnalysis(info.stdtId, '1')` → `fetchStudentFullAnalysis(claId, info.stdtId, '1')` 인자 순서 수정

- [x] pages/class-dashboard/ClassDashboardPage.tsx
  - `totalStudents` / `assessedStudents`: 필터된 학생 수 → `l2Data.examDetail.stTotalCnt` / `stSubmCnt` 실 API 값 사용

- [x] features/api/useApiData.ts (`useStudentAnalysis`)
  - `classId.split('-')` 로 학년/반 파싱하던 로직 제거 (claId는 UUID 형식)
  - `groupService.getMyGroups` → `g.claId === classId` 매칭으로 학년/반/schoolLevel 조회
  - `fetchStudentInfoList` 호출로 학생 이름/번호 조회
  - `useAuthStore` → `useAuth()` (AuthContext) 교체 — `stdtId`, `classId` 필드 접근

**학생 결과 페이지 빈 상태 처리**

- [x] features/student-exam/ui/MyResultPage.tsx
  - `useAuthStore` → `useAuth()` 교체
  - mock `fetchStudentResult` 제거 → `getStudentExamList` + `fetchStudentFullAnalysis` 실 API 연동
  - 신규 학생(검사 미수행) 가드: `stdtId 없음 → claId 없음 → result_ready 없음` 단계별 빈 상태 표시

**상담 일정 페이지 실 데이터 연동**

- [x] pages/schedule/SchedulePage.tsx
  - `SCHEDULE_CLASSES`, `CLASS_COLORS` mock 제거
  - `groupService.getMyGroups` (owner 그룹만) → `ScheduleClass[]` 변환
  - `groupService.getGroupMembers` → 활성 멤버 `CounselingStudent[]` 변환
  - 반별 필터, `ClassSummaryCards`, `ScheduleModal`에 실 데이터 props 전달

- [x] features/schedule/ui/ClassSummaryCards.tsx — `classes`, `classColors` props 수신 (mock import 제거)
- [x] features/schedule/ui/ScheduleModal.tsx — `classes`, `studentsMap`, `classColors` props 수신 및 하위 전달
- [x] features/schedule/ui/ScheduleStudentPicker.tsx — `classes`, `studentsMap`, `classColors` props 수신 (mock import 전면 제거)
  - 초기 탭 `SCHEDULE_CLASSES[0].id` → `classes[0]?.id ?? ''` 안전하게 처리
  - 학생 목록 API: `dgnssService.getDgnssStudentList` (검사 컨텍스트 필요) → `groupService.getGroupMembers` (그룹 전체 멤버)

### 미구현 (작업 예정 — MVP 우선순위 순)

**UI 마이그레이션 작업**

- [ ] **[Phase 2]** student-exam 컴포넌트 분리 — FSD 아키텍처 준수
  - ExamCard → widgets/ExamCard 분리
  - EmptyExamList → widgets/EmptyExamList 분리
  - ExamCardSkeleton → widgets/ExamCardSkeleton 분리
  - StudentExamsPage 의존성 업데이트

- [ ] **[Phase 4]** MyResultPage 추가 기능
  - 1차/2차 비교 모드 구현
  - 차트 인터랙션 개선

**백엔드 연동**

- [ ] **[Phase 1]** 학생 시험 코드 입력 플로우 검증 — `inviteCode` 기반 백엔드 연동 확인 (`StudentGroupsPage.tsx`)

**기타 기능**

- [ ] 에러 바운더리
- [ ] features/counseling — 상담 기록
- [ ] features/resources — 학습 자료

---

## 🐛 최근 버그 수정 (2026-04-10)

### Bug #1: MyResultPage 결과 감지 로직
**증상**: 1차 검사 결과는 있고 2차 검사 결과는 대기 중일 때 대시보드에 "아직 시행한 검사가 없습니다" 표시

**원인**: Line 405에서 `status === 'result_ready'` 조건만 확인
- `result_ready` 상태는 검사가 완전히 종료되었을 때만 발생 (dgnssAt === 'N')
- 실제 결과 데이터는 `hasResult === true` (eakAt === 'Y')로 감지해야 함

**해결**:
```typescript
// Before
const hasReadyResults = examList.some((e) => e.status === 'result_ready');

// After
const hasReadyResults = examList.some((e) => e.hasResult === true);
```

**파일**: `features/student-exam/ui/MyResultPage.tsx` (line 405)

**빌드 결과**: ✅ 7.80s (성공)

---

### Bug #2: MyResultPage 단일 그룹만 조회
**증상**: 학생이 여러 그룹에 속할 때 첫 번째 그룹만 조회하여 다른 그룹의 결과 누락

**원인**: Lines 388-401에서 `groups.find()` 사용 (첫 번째 그룹만 반환)
- 학생이 3개 그룹에 속할 경우, 그룹 B/C의 결과는 확인하지 않음

**해결**:
```typescript
// 모든 memberGroups 순회 + 결과 수집
for (const group of groupsToCheck) {
  try {
    const examList = await getStudentExamList(group.claId, user.stdtId);
    const hasResults = examList.some((e) => e.hasResult === true);

    if (hasResults) {
      hasAnyResults = true;
      const fullAnalysis = await fetchStudentFullAnalysis(group.claId, user.stdtId, '1');
      allAnalyses.push({ claId: group.claId, analysis: fullAnalysis, ... });
    }
  } catch (err) {
    console.warn(`그룹 ${group.claId} 조회 실패`);
  }
}

// 결과 있는 첫 번째 그룹으로 디스플레이
const selectedGroup = allAnalyses[0];
```

**패턴 출처**: `MyExamListPage.tsx` (422-424) — 이미 올바르게 구현되어 있는 multi-group 쿼리 패턴

**파일**: `features/student-exam/ui/MyResultPage.tsx` (lines 377-449)

**빌드 결과**: ✅ 9.06s (성공)

---

## 🐛 알려진 이슈 (비치명적)

**런타임 경고**:
- `MyResultPage.tsx` — Recharts width/height NaN 경고 (시각적 영향 없음)
- Vite 빌드 — index chunk 1,827kB 경고 (Phase 3 이후 개선됨, 추가 분리 가능)

**SSO 주의사항**:
- `useProfileCheck`는 보호 라우트 접근마다 `/api/v1/user/status` 호출 — 성능 캐싱 고려 필요
- Auth SDK CDN(`cdn.vsaidt.com/superplatform/auth-client.js`)이 로드되지 않으면 앱 전체 사용 불가
- `index.html`의 CDN 스크립트가 `window.AuthClient`를 전역에 노출하는 패턴 — `initAuth()` 전에 접근 불가

---

## 📊 진행 상태

```
FSD Pages 정리    ████████████ 100% (Group/Class/Schedule → widgets)
TanStack Query    ████████████ 100% (useApiData 4개 훅)
번들 분리          ████████████ 100% (2,371kB → 1,827kB)
SSO 인증 통합     ████████████ 100% (feature/sso-integration 반영)
student-exam FSD  ░░░░░░░░░░░░   0% (다음 작업)
MyResultPage 비교 ░░░░░░░░░░░░   0% (다음 작업)
```

---

## 작업 시 주의사항

### 아키텍처
1. **prototype 코드 구조 참고 금지** — UI 디자인(색상, 레이아웃)만 참조
2. **페이지 파일에 styled component 추가 금지** — widgets 또는 shared/ui로 분리
3. **레이어 경계 위반 금지** — 하위 레이어가 상위 레이어 import 불가
4. **`any` 사용 금지** — ESLint error로 차단됨
5. **타입 import는 `import type`** — `verbatimModuleSyntax` 강제
6. **환경변수**: `import.meta.env` 직접 사용 금지 → `shared/config/env.ts`의 `ENV.*` 사용

### TypeScript / 빌드
7. **TypeScript 빌드 확인**: `tsc --noEmit` 대신 **`tsc -b`** 사용 — `noUnusedLocals`, `noUnusedParameters` 적용됨

### 타입 / 데이터 모델
8. **`SchoolLevel` 타입**: `'초등' | '중등'` 만 허용. `'고등'` 없음
9. **`ExamPeriodStatus`**: `string`이 아닌 `{ round1: ExamStatus; round2: ExamStatus }` 인터페이스
10. **그룹 ID**: `groupInfo.id`가 아닌 `groupInfo.claId` 사용
11. **classId는 UUID**: `claId`를 `split('-')`으로 학년/반 파싱 금지 → `groupService.getMyGroups`로 매칭
12. **상담 학생 목록**: `dgnssService.getDgnssStudentList`는 검사 컨텍스트 필요 → 전체 멤버는 `groupService.getGroupMembers`
13. **User 타입**: `user.memberType` 사용 (`'vivasam' | 'general' | 'guest'`). `user.role` 없음

### SSO 인증 (2026-04-20 전환)
14. **로그인**: `auth.login()` → Auth 서버로 리다이렉트. `AuthContext`에 직접 로그인 메서드 없음
15. **토큰**: SDK가 `accessToken`/`refreshToken` 키 사용. `API_CONFIG.jwtToken`은 두 키 모두 확인하는 fallback 포함
16. **`AuthContext` 제공 메서드**: `loginAsGuest`, `updateUser`, `logout` 3개만 존재
17. **SSO 후 프로필 미등록**: `useProfileCheck`가 `/api/v1/user/status` 확인 → `needsProfile=true` 시 `/auth/complete-profile` 리다이렉트
18. **게스트 토큰**: `joinGroupAsGuest` 반환값 `guestId` (구 `refreshToken`) — `loginAsGuest({ ..., guestId })` 호출
19. **SDK 미초기화 에러**: `getAuth()` 호출 시 `initAuth()` 먼저 완료되어야 함 — `main.tsx`에서 bootstrap 순서 보장

### 데이터 패칭
20. **useApiData 훅 캐싱**: React Query `queryKey` 기반 — `refetch()` 호출로 수동 갱신 가능
21. **DataContext**: 신규 코드에서 `useData()` 사용 금지 → `useTeacherClasses()` 사용

---

## 📋 다음 작업 우선순위

**1순위 — student-exam FSD 분리 (큰 파일 남음)**:
- [ ] `MyExamListPage.tsx` (~463줄) → `widgets/student-exam/` 분리
  - ExamCard, EmptyExamList, ExamCardSkeleton 컴포넌트 추출

**2순위 — 기능 개선**:
- [ ] MyResultPage 1차/2차 비교 모드 (Phase 4)
- [ ] `useProfileCheck` 캐싱 — 매 라우트 이동마다 API 호출하지 않도록 (React Query 적용 권장)

**3순위 — 기타**:
- [ ] 에러 바운더리 추가
- [ ] `features/counseling` 상담 기록 기능
- [ ] `features/resources` 학습 자료 기능

**우선순위 3 - 선택 사항**:
- [ ] 에러 바운더리
- [ ] features/counseling — 상담 기록
- [ ] features/resources — 학습 자료

---

**최종 업데이트**: 2026-04-20 (리팩토링 Phase 1-4 + SSO 통합 완료)
**빌드 상태**: ✅ Production ready (tsc -b && vite build: ~21s, bundle 1,827kB)
