# 코드 리뷰 - d99ca845

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`iav2toggle.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 13개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경
이 커밋은 개발/스테이징 환경에서 기획자가 IA_V2 플래그를 켜고 끄는 `IaV2Toggle` 컴포넌트의 동작 방식을 수정한 것입니다. 기존에는 토글 클릭 시 `window.location.reload()`로 같은 URL에서 새로고침했지만, v1/v2 라우트 구조가 서로 달라 특정 경로(예: `/exam/management`)에서 v2를 끄면 해당 라우트가 사라지고 공개 라우트 `/exam/:code`가 대신 매칭되어 "management"를 검사 코드로 오인하는 문제가 발생했습니다. 이를 해결하기 위해 토글 후 항상 두 모드 모두에서 안전하게 존재하는 `/dashboard`로 이동하도록 변경했습니다.

- **목적**: IA_V2 토글 시 v1/v2 라우트 구조 차이로 인한 `/exam/:code` 오매칭 에러 방지
- **도메인**: UI (프론트엔드 라우팅 및 기능 플래그 토글)
- **변경 방향**: 같은 URL 새로고침 → 공통 안전 경로(`/dashboard`)로 이동 후 자동 분기

## [GOOD] 잘된 점
- **근거 기반의 명확한 문서화**: 주석에 변경 이유를 상세히 기술했습니다. 단순히 "새로고침 대신 이동"이라고만 적지 않고, `/exam/management`가 IA_V2 전용 라우트라는 점, `/exam/:code` 공개 라우트와의 충돌 가능성, `/dashboard`가 두 모드 모두에서 안전한 이유까지 구체적으로 설명하여 향후 유지보수자가 의도를 쉽게 파악할 수 있습니다.
- **라우트 구조에 대한 정확한 이해**: `/dashboard`가 `FEATURES.IA_V2 ? '/home' : '/dashboard/comprehensive'`로 자동 분기된다는 점을 정확히 파악하고 이를 활용했습니다. 이는 `routes.tsx` 170~171행의 실제 코드와 일치합니다.
- **문제의 근본 원인 해결**: 단순히 새로고침 위치를 바꾼 것이 아니라, 라우트 충돌의 근본 원인(모드별 라우트 구조 차이)을 해결하는 방향으로 접근했습니다.

## 변경사항 요약
`IaV2Toggle.tsx`의 `handleToggle` 함수에서 `window.location.reload()`를 `window.location.href = '/dashboard'`로 변경하고, 관련 주석과 `title` 속성 텍스트를 수정했습니다. 이를 통해 토글 후 v1/v2 모드 모두에서 안전하게 동작하는 경로로 이동하게 됩니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)
없음

### High (우선 수정 권장)
없음

### Medium (개선 권장)

**1. 하드코딩된 경로 문자열 상수화**
- **위치**: `IaV2Toggle.tsx` 48행 (`window.location.href = '/dashboard'`)
- **기존 코드**:
```tsx
window.location.href = '/dashboard';
```
- **제안**: `/dashboard` 경로가 라우트 정의(`routes.tsx`)와 이 컴포넌트에 중복으로 하드코딩되어 있습니다. 향후 라우트 경로가 변경되면 두 곳을 모두 수정해야 하므로, 경로 상수를 별도 모듈로 추출하거나 `navigate` 훅을 사용하는 것이 유지보수에 유리합니다. 다만 이 컴포넌트의 목적이 "전체 페이지 리로드를 통한 features.ts 재평가"이므로 `navigate` 사용 시 `window.location.reload()`를 추가로 호출해야 하는 점을 고려해야 합니다. 경로 상수화만 제안합니다.

**2. `title` 속성의 사용자 관점 표현**
- **위치**: `IaV2Toggle.tsx` 56행
- **기존 코드**:
```tsx
title='IA_V2 (개발용, 클릭 시 대시보드로 이동)'
```
- **제안**: 현재 표현은 기술적 동작(대시보드로 이동)을 설명하고 있습니다. 기획자 관점에서는 "V2 모드 켜기/끄기"가 더 직관적일 수 있습니다. 다만 이는 개인 선호도에 가까우므로 필수는 아닙니다.

---

## 주요 파일 분석

### IaV2Toggle.tsx
**변경 내용:**
토글 클릭 시 `window.location.reload()` → `window.location.href = '/dashboard'`로 변경하고, 주석과 `title` 텍스트를 수정했습니다.

**개선 제안:**
1. 경로 문자열 상수화 (위 Medium 항목 참조)
   - **위치**: 48행
   - **기존 코드**:
```tsx
window.location.href = '/dashboard';
```
   - **해결 방안 (수정 코드)**:
```tsx
// shared/config/features.ts 또는 별도 상수 파일에 추가
export const SAFE_LANDING_PATH = '/dashboard';

// IaV2Toggle.tsx
window.location.href = SAFE_LANDING_PATH;
```
   - 이 수정은 `features.ts`에 상수를 추가하고 `IaV2Toggle.tsx`에서 import하여 사용하는 방식입니다. `routes.tsx`의 `/dashboard` 경로도 동일 상수를 사용하도록 변경하면 경로 변경 시 한 곳만 수정하면 됩니다.

---

## 최종 평가

**결론**: 
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**
이 커밋은 v1/v2 라우트 구조 차이로 인한 실제 문제를 정확히 진단하고, `/dashboard`라는 공통 안전 경로를 활용하여 해결한 좋은 수정입니다. 특히 주석에 변경 근거를 상세히 문서화한 점이 인상적이며, `routes.tsx`의 `/dashboard` 분기 로직과 정확히 일치하는 구현입니다. 경로 상수화 정도의 사소한 개선 여지만 남아 있으며, 현재 상태로 충분히 승인 가능한 수준입니다.