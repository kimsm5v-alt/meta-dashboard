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

| 역할 | 라이브러리 | 버전 |
|------|-----------|------|
| UI 프레임워크 | React | 19.x |
| 언어 | TypeScript | ~5.9 |
| 번들러 | Vite | 5.x |
| 스타일 | Emotion (CSS-in-JS) | 11.x |
| 서버 상태 | TanStack React Query | v5 |
| 클라이언트 상태 | Zustand | v5 |
| 라우팅 | React Router | v7 |
| 폼 | React Hook Form + Zod | - |
| 차트 | Recharts | v3 |
| 아이콘 | Lucide React | - |

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
    <PageTitle title="대시보드" subtitle="전체 학급 현황을 한눈에 확인하세요" />
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

| 상태 종류 | 도구 | 위치 |
|----------|------|------|
| 서버 데이터 (API 응답) | TanStack React Query | `features/*/api/queries.ts` |
| 인증 상태 (user, token) | Zustand + persist | `features/auth/model/useAuthStore.ts` |
| UI 상태 (모달, 사이드바 등) | useState / useReducer | 각 컴포넌트 로컬 |

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
<Card variant="glass">
  <Card.Content>내용</Card.Content>
  <Card.Footer><Button>버튼</Button></Card.Footer>
</Card>
```

### 데이터 패칭 패턴

```tsx
// widgets에서 feature 훅 사용
export const ClassList = () => {
  const { data: classes, isLoading } = useTeacherClasses();

  if (isLoading) return <Skeleton height="160px" />;

  return (
    <Grid>
      {classes?.map((cls) => <ClassCard key={cls.id} {...cls} />)}
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

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

---

## Path Alias

`vite.config.ts`와 `tsconfig.app.json`에 동일하게 설정되어 있음.

| Alias | 실제 경로 |
|-------|----------|
| `@app/*` | `src/app/*` |
| `@pages/*` | `src/pages/*` |
| `@widgets/*` | `src/widgets/*` |
| `@features/*` | `src/features/*` |
| `@entities/*` | `src/entities/*` |
| `@shared/*` | `src/shared/*` |

레이어 간 import 시 반드시 alias 사용. 상대경로(`../../`)는 같은 슬라이스 내부에서만 허용.

---

## 디자인 시스템

라이트 모드. `src/app/styles/theme.ts` 참조.
prototype의 화이트/라이트 디자인을 기준으로 함.

### 핵심 색상

```ts
theme.colors.primary[500]       // #8b5cf6 — 브랜드 보라
theme.colors.secondary[500]     // #06b6d4 — 보조 청록
theme.colors.background.default // #f8fafc — 최하단 배경 (밝은 회백색)
theme.colors.background.paper   // #ffffff — 카드 배경 (흰색)
theme.colors.background.elevated // #f1f5f9 — 강조 영역 배경
theme.colors.text.primary       // #0f172a — 본문 텍스트
theme.colors.glass.background   // rgba(255,255,255,0.8) — 글래스 배경
theme.colors.glass.border       // rgba(0,0,0,0.08) — 글래스 테두리

// LPA 학생 유형 색상
theme.colors.type.warning   // #ea580c — 자원소진형/무기력형
theme.colors.type.balance   // #0d9488 — 안전균형형
theme.colors.type.excellent // #2563eb — 몰입자원풍부형
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

`shared/api/client.ts` — fetch 기반 래퍼.

```ts
import { apiClient } from '@shared/api';

// 환경변수: VITE_API_URL (기본값: http://localhost:8080/api)
const data = await apiClient.get<ClassSummary[]>('/teacher/classes');
await apiClient.post('/auth/login', { email, password });
await apiClient.put('/student/1', updatedData);
await apiClient.delete('/memo/5');
```

- `localStorage`의 `auth_token` 키에서 JWT 자동 읽어 `Authorization: Bearer` 헤더 주입
- 4xx/5xx 응답 시 `ApiError(statusCode, message)` throw

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

| 규칙 | 설정 | 이유 |
|------|------|------|
| `@typescript-eslint/no-explicit-any` | error | any 타입 전면 금지 |
| `@typescript-eslint/no-unused-vars` | error | `_` prefix는 허용 |
| `@typescript-eslint/consistent-type-imports` | error | `import type` 강제 (verbatimModuleSyntax 대응) |
| `@typescript-eslint/no-empty-function` | off | 이벤트 핸들러 stub 허용 |

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

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `ClassCard.tsx` |
| 훅 파일 | camelCase | `useTeacherClasses.ts` |
| 유틸/상수 파일 | camelCase | `dateUtils.ts` |
| Styled component | PascalCase | `StyledButton`, `CardWrapper` |
| Transient prop | `$` prefix | `$variant`, `$isOpen` |
| 미사용 변수 | `_` prefix | `_unusedParam` |
| 상수 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

---

## 현재 구현 상태

### 완료

- [x] app/ — providers, router, theme, GlobalStyles
- [x] shared/ui — Button, Card, Input, FormField, Badge, Skeleton, PageTitle
- [x] shared/api — apiClient (HTTP 래퍼)
- [x] widgets/layout — Header, Sidebar, PageLayout
- [x] widgets/dashboard — StatsOverview, ClassList
- [x] features/auth — useAuthStore (Zustand persist)
- [x] features/dashboard — useTeacherStats, useTeacherClasses (mock 데이터)
- [x] pages/auth — LoginPage (react-hook-form + zod)
- [x] pages/dashboard — TeacherDashboardPage (슬림 조합형)
- [x] ESLint v9 flat config + Prettier 통합

### 미구현 (작업 예정)

- [ ] 라우터 가드 — 인증 여부에 따른 리다이렉트
- [ ] features/auth — 로그인 API 연동
- [ ] features/class-dashboard — 학급 상세 (L2)
- [ ] features/student-dashboard — 학생 상세 (L3)
- [ ] features/assessment — 검사 관리
- [ ] features/ai-room — AI 어시스턴트 채팅
- [ ] features/schedule — 상담 일정
- [ ] features/counseling — 상담 기록
- [ ] features/resources — 학습 자료
- [ ] Backend API 연동 (mock → apiClient 교체)
- [ ] 에러 바운더리
- [ ] 로딩/에러 상태 공통 처리

---

## 작업 시 주의사항

1. **prototype 코드 구조 참고 금지** — UI 디자인(색상, 레이아웃)만 참조
2. **페이지 파일에 styled component 추가 금지** — widgets 또는 shared/ui로 분리
3. **레이어 경계 위반 금지** — 하위 레이어가 상위 레이어 import 불가
4. **`any` 사용 금지** — ESLint error로 차단됨
5. **타입 import는 `import type`** — `verbatimModuleSyntax` 강제
6. **새 feature 추가 시** `model/types.ts` → `api/queries.ts` → `index.ts` 순서로 작성
