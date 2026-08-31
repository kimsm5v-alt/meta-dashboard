# AGENTS.md — frontend

이 지침은 `frontend/` 하위에서 작업하는 AI 코딩 에이전트에게만 적용됩니다.

## 프로젝트 역할과 참조 범위

- `frontend/`: 교사용 학습심리정서검사 대시보드의 실제 운영 프론트엔드
- `prototype/`: UI/UX와 사용자 흐름의 기준. 코드 구조는 복사하지 않습니다.
- `backend/`: Spring Boot API 계약과 비즈니스 로직의 원천
- `agent/`: FastAPI 기반 AI 분석 및 대화 처리 영역

## UI/UX 구현 기준 우선순위

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
- 코드를 복사하지는 않습니다. `frontend/CLAUDE.md`의 FSD 구조와 backend API 계약을 유지하면서 UI와 사용자 경험을 동등하게 구현합니다.

## 아키텍처 규칙

`frontend`는 FSD Lite 구조를 사용합니다.

```text
pages → widgets → features → shared
```

- `pages`: 라우트 페이지 조합만 담당합니다. 복잡한 로직과 styled component를 두지 않습니다.
- `widgets`: 화면 섹션 단위의 복합 UI를 담당합니다.
- `features`: 기능 단위 API, 모델, UI를 담당합니다.
- `shared`: 공통 UI, API 클라이언트, 설정과 유틸리티를 담당합니다.
- 하위 레이어가 상위 레이어를 import하지 않습니다.
- 같은 레이어 사이의 불필요한 cross-import를 만들지 않습니다.
- 기존 `@app`, `@pages`, `@widgets`, `@features`, `@shared` path alias를 사용합니다.

## React 상태와 사용자 흐름

상태는 다음 우선순위로 배치합니다.

1. API 데이터는 TanStack React Query의 서버 상태
2. 정렬, 검색어, 페이지, 탭, 필터는 필요한 경우 URL 상태
3. 한 컴포넌트 또는 가까운 부모에만 필요한 값은 로컬 상태
4. Zustand나 Context 전역 상태는 위 방법으로 해결되지 않을 때만 사용

- 서버 응답을 `useState`에 복사해 별도 동기화하지 않습니다.
- 데이터 페칭을 위해 마운트 `useEffect`를 사용하지 않습니다. `useEffect`는 이벤트 구독, SSE, DOM observer 등 외부 시스템 동기화에만 사용합니다.
- 렌더 중 계산이나 이벤트 핸들러로 처리할 수 있는 파생 상태를 effect로 만들지 않습니다.
- 액션이 있는 UI는 로딩, 중복 실행 방지, 실패 피드백, 유효성·권한, 성공 후 처리를 함께 확인합니다.
- `React.memo`, `useMemo`, `useCallback`은 실제 병목을 확인한 경우에만 사용합니다.
- props가 과도하게 늘어나는 만능 컴포넌트보다 작은 조각을 조합하는 구조를 선호합니다.

## API와 서버 상태

- API 타입과 연동 방식을 정하기 전에 `backend`의 Controller, DTO, 서비스 계약을 확인합니다.
- 백엔드가 준비되지 않은 경우에만 `prototype` mock 데이터를 `frontend` 구조에 맞게 변환합니다.
- API 응답, 목록, 상세, 검사 슬롯, 메모, 상담 기록은 React Query로 관리합니다.
- 기능별 `queryKeys.ts`의 query key factory를 사용하고 임의 문자열 키를 추가하지 않습니다.
- mutation 성공 후에는 관련된 최소 범위의 query만 invalidate합니다.
- optimistic update는 알림 읽음처럼 즉시 반응성이 중요한 기능에만 선별적으로 적용합니다.

## 인증과 개인정보 보호

- 인증은 기존 SSO SDK 흐름을 사용하며 `auth.login()`은 인증 서버 리다이렉트를 수행합니다.
- Access/Refresh Token을 localStorage에서 직접 읽거나 쓰지 않습니다.
- HTTP 요청은 기존 `shared/api/client.ts`와 인증 설정을 사용합니다.
- 환경변수는 `shared/config/env.ts`의 `ENV.*`를 통해 접근합니다.
- 학생 이름, 학번 등 PII가 AI 요청으로 전달될 때는 반드시 기존 마스킹 정책을 적용합니다.
- 로그인 문제를 해결하기 위한 임시 우회 코드는 명시적인 요청과 제거 조건 없이 추가하지 않습니다.

## TypeScript와 데이터 모델

- `any`를 사용하지 않습니다.
- 타입 전용 import는 `import type`을 사용합니다.
- `claId`는 UUID이므로 문자열 `split` 등으로 의미를 추론하지 않습니다.
- 사용자 권한은 `user.memberType`을 사용하며 존재하지 않는 `role` 필드를 만들지 않습니다.
- `SchoolLevel` 타입과 실제 고등 데이터의 차이는 기존 처리 방식을 먼저 확인합니다.
- Emotion 전용 스타일 props는 `$variant`와 같은 transient prop을 사용합니다.
- 새 색상을 임의의 hex 값으로 흩뿌리지 않고 `app/styles/theme.ts` 토큰을 우선 사용합니다.

## 변경과 검증

- 요청과 무관한 리팩터링을 섞지 않고 변경 범위를 작게 유지합니다.
- 사용자의 기존 변경과 dirty worktree를 보존합니다.
- UI 작업은 관련 `prototype` 화면과 주요 상태의 결과가 같은지 확인합니다.
- 변경 범위에 따라 최소한 다음 검증을 수행합니다.

```powershell
cd frontend
npx tsc -b --noEmit
npx eslint <변경 파일>
npm run build
```

- 정적 검사가 통과해도 사용자 흐름이 다르면 완료로 보지 않습니다.
- 최종 보고에는 변경 파일, 검증 결과, 아직 확인하지 못한 런타임/API 위험을 포함합니다.
