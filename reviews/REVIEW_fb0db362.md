> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - fb0db362

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`useapidata.ts`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.010

- 청크 수: 36개


**권장사항:**

- 파일 크기가 큼 (36개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 `frontend/src/features/api/useApiData.ts` 파일에서 API 모드(온라인)와 로컬 모드(오프라인)를 구분하는 기준을 **JWT 토큰 존재 여부(`getAuthTokens()`)**에서 **사용자 인증 상태(`user` 객체 존재 여부)**로 변경한 리팩토링입니다.

- **목적**: 인증 상태 판단 로직을 `localStorage` 직접 접근 방식(`getAuthTokens()`)에서 `useAuth()` 컨텍스트 기반 방식으로 일원화
- **도메인**: 인증/API 레이어 (비즈니스 로직)
- **변경 방향**: 토큰 기반 판단(`getAuthTokens()`) -> 사용자 객체 기반 판단(`!!user`)으로 단순화. `useApiConfig`의 `hasJwtToken`도 동일한 방식으로 변경

---

## 최종 평가

**종합 점수**: 75/100

**결론**: **[FIX] 수정 필요 (Changes Requested)** - 중요 이슈 수정 후 재검토

**핵심 코멘트**:

변경 방향성(토큰 기반 -> 사용자 인증 기반)은 React의 반응형 패러다임에 더 적합하며, `getAuthTokens`의 `localStorage` 직접 접근을 제거한 점은 긍정적입니다. 그러나 `hasJwtToken` 속성명이 실제 반환값(`!!user`)과 의미적으로 불일치하여, 이 속성을 사용하는 14곳의 호출부에서 오해를 불러일으킬 수 있습니다. 또한 `user` 객체 존재와 JWT 토큰 유효성 사이에 간극이 존재할 수 있어, API 호출 실패 시나리오에 대한 추가 검증이 필요합니다.

---

## 상세 분석

### 1. 변경된 코드의 구조

이 커밋은 4곳을 변경했습니다:

**변경 1: import 문 (라인 9)**
```typescript
// 변경 전
import { API_CONFIG, getAuthTokens } from '@shared/services/apiClient';

// 변경 후
import { API_CONFIG } from '@shared/services/apiClient';
```
`getAuthTokens` import가 제거되었습니다. 이 함수는 더 이상 사용되지 않습니다.

**변경 2: `useStudentAnalysis` 함수 (라인 73-76 -> 76)**
```typescript
// 변경 전
const authTokens = getAuthTokens();
const isApiMode = !!authTokens?.authToken && !!authTokens?.refreshToken;

// 변경 후
const isApiMode = !!user;
```
`getAuthTokens()`를 호출하여 `localStorage`에서 토큰을 읽어오던 방식을, `useAuth()` 훅에서 가져온 `user` 객체의 존재 여부로 대체했습니다.

**변경 3: `useClassStudents` 함수 (라인 248-251 -> 251)**
```typescript
// 변경 전
const authTokens = getAuthTokens();
const isApiMode = !!authTokens?.authToken && !!authTokens?.refreshToken;

// 변경 후
const isApiMode = !!user;
```
동일한 패턴의 변경입니다.

**변경 4: `useApiConfig` 함수 (라인 472-477)**
```typescript
// 변경 전
return {
  hasJwtToken: !!API_CONFIG.jwtToken,
  baseUrl: API_CONFIG.baseUrl,
};

// 변경 후
const { user } = useAuth();
return {
  hasJwtToken: !!user,
  baseUrl: API_CONFIG.baseUrl,
};
```
`API_CONFIG.jwtToken` getter가 반환하는 JWT 토큰 문자열 존재 여부 대신, `user` 객체 존재 여부를 반환합니다.

---

### 2. 발견된 문제점

#### [Critical] `hasJwtToken` 속성명과 실제 동작의 의미론적 불일치

**위치**: 라인 469-477 (`useApiConfig` 함수)

**문제**: `hasJwtToken`이라는 속성명은 "JWT 토큰이 존재한다"는 의미를 내포하지만, 실제로는 `user` 객체 존재 여부를 반환합니다. 이는 다음과 같은 차이가 있습니다:

- `API_CONFIG.jwtToken` (기존 방식): `localStorage`에서 `accessToken` 또는 `auth_token` 키로 저장된 실제 JWT 토큰 문자열을 읽어옵니다. 토큰이 실제로 저장되어 있어야만 `true`를 반환합니다.
- `!!user` (변경된 방식): `AuthContext`에서 관리되는 `user` 객체가 존재하는지만 확인합니다. `user` 객체가 존재하더라도 JWT 토큰이 `localStorage`에 저장되지 않았거나 만료되었을 수 있습니다.

**영향**: `hasJwtToken`을 사용하는 호출부는 총 14곳입니다:
- `ClassDetailAnalysisPage.tsx` (라인 318, 327, 387, 390, 402)
- `StudentDashboardPage.tsx` (라인 375, 384, 544, 659, 669, 681, 708)
- `TeacherDashboardPage.tsx` (라인 43, 56, 57, 58, 59)
- `ClassDashboardWidget.tsx` (라인 360, 377, 437, 443, 454)

이들 모두 `hasJwtToken`을 조건으로 API 호출 여부를 결정합니다. 만약 `user` 객체는 존재하지만 JWT 토큰이 유효하지 않은 상태에서 `hasJwtToken=true`로 판단되면, API 호출이 시도되고 401 Unauthorized 오류가 발생합니다.

**해결 방안**: 속성명을 `isAuthenticated`로 변경하고, 호출부 14곳도 일괄 변경해야 합니다.

```typescript
interface UseApiConfigResult {
  isAuthenticated: boolean;
  baseUrl: string;
}

export function useApiConfig(): UseApiConfigResult {
  const { user } = useAuth();
  return {
    isAuthenticated: !!user,
    baseUrl: API_CONFIG.baseUrl,
  };
}
```

#### [High] `user` 객체와 실제 API 인증 가능성 간 괴리

**위치**: 라인 76, 251 (`isApiMode` 판단 로직)

**문제**: 기존 코드는 `getAuthTokens()`를 통해 `localStorage`에 실제로 `authToken`과 `refreshToken`이 모두 존재하는지를 확인했습니다. 이는 "실제로 API를 호출할 수 있는가"를 직접 검증하는 방식입니다.

변경된 코드는 `!!user`만 확인합니다. `user` 객체가 `AuthContext`에 설정되는 시점과 JWT 토큰이 `localStorage`에 저장되는 시점이 완전히 동기화되어 있다는 보장이 필요합니다.

**분석 결과**:
- `useAuthStore.ts`의 `login` 함수는 `user`와 `token`을 동시에 설정합니다(원자적 연산).
- 그러나 `AuthContext.tsx`의 SDK 기반 흐름에서는 `mapSdkUserToUser()`로 `user`를 생성하고, 토큰은 SDK 내부에서 관리됩니다. 이 두 저장소 간 동기화가 항상 원자적으로 이루어지는지 확인이 필요합니다.
- `AuthContext.tsx`의 `logout` 함수(라인 1325)는 `getAuthTokens()`를 호출하여 토큰을 읽어온 후 `logoutApi`를 호출합니다. 이는 `AuthContext` 내부에서도 여전히 `getAuthTokens()`를 사용하고 있음을 의미합니다.

**영향**: `user` 객체는 존재하지만 토큰이 아직 `localStorage`에 저장되지 않은 극히 짧은 시간 윈도우에서 `isApiMode=true`로 판단되어 API 호출이 시도되고, 401 인증 오류가 발생할 수 있습니다.

#### [Medium] `useAuth()` 중복 호출

**위치**: 라인 22-27 (`useCredentials` 훅), 라인 68 (`useStudentAnalysis`), 라인 237 (`useClassStudents`)

**문제**: `useCredentials` 훅(라인 22-27)은 이미 내부에서 `useAuth()`를 호출하고 `hasCredentials: !!user`를 반환합니다.

```typescript
function useCredentials() {
  const { user } = useAuth();
  const tcId = user?.tcId ?? '';
  const claId = user?.classId ?? '';
  const schoolLevel: SchoolLevel = '중등';
  return { tcId, claId, gradeLevel: 'mi', schoolLevel, hasCredentials: !!user };
}
```

그러나 `useStudentAnalysis`와 `useClassStudents`에서는 `useCredentials()`와 별도로 `const { user } = useAuth()`를 다시 호출하고, `const isApiMode = !!user`를 별도로 계산합니다. `useCredentials().hasCredentials`를 재사용하면 중복을 제거할 수 있습니다.

---

### 3. 긍정적 측면

1. **반응형 데이터 흐름**: `getAuthTokens()`는 `localStorage`를 직접 읽어 React의 상태 관리 시스템과 무관하게 동작했습니다. `user` 객체 기반으로 변경하면 `AuthContext`의 상태 변경에 따라 자동으로 리렌더링이 트리거됩니다.

2. **의존성 감소**: `getAuthTokens` import를 제거하여 `apiClient.ts`에 대한 의존성을 줄였습니다.

3. **코드 간결화**: `getAuthTokens()` 호출과 `authToken`, `refreshToken` 존재 여부를 각각 확인하던 2줄의 코드가 `!!user` 한 줄로 단순화되었습니다.

---

### 4. 보안 분석

**발견된 보안 취약점**:

1. **인증 상태 판단 기준 약화 가능성**
   - **시나리오**: SDK가 `user` 객체를 반환했지만 실제 JWT 토큰이 만료되었거나 무효화된 상태라면, `isApiMode=true`로 판단되어 API 호출이 이루어지고 401 응답을 받게 됩니다.
   - **영향**: 불필요한 API 호출 발생, 사용자 경험 저하 (갑작스러운 오류 화면)
   - **수정 방법**: `useAuth()`의 `isAuthenticated` 플래그를 함께 확인하거나, API 호출 전 인터셉터 레벨에서 토큰 유효성을 검증

**보안 체크리스트**:
- [x] 인증/인가 검증 - `user` 객체 기반으로 변경되었으나, 토큰 유효성까지 보장하지는 않음
- [ ] 입력 검증 및 Sanitization - 해당 없음
- [x] 민감 정보 보호 - `getAuthTokens` 제거로 `localStorage` 접근 최소화 (긍정적)
- [ ] HTTPS/암호화 사용 - 해당 없음

---

### 5. 버그 가능성 분석

**잠재적 버그 시나리오**:

1. **`user` 객체는 존재하지만 JWT 토큰이 없는 경우**
   - **재현 조건**: SDK 인증이 완료되어 `user` 객체는 존재하지만, JWT 토큰이 `localStorage`에 저장되지 않았거나 만료된 상태
   - **예상 결과**: `isApiMode=true`로 판단되어 `fetchStudentFullAnalysis`, `fetchL2DashboardData` 등의 API 호출이 시도되고, 401 Unauthorized 오류 발생
   - **수정 방법**: `useAuth()`의 `isAuthenticated` 플래그를 함께 확인하거나, API 호출 전 토큰 존재 여부를 추가 검증

**Edge Case 검증**:
- [x] Null/Undefined 처리 - `!!user`로 안전하게 처리됨
- [ ] 빈 배열/객체 처리 - 해당 없음
- [ ] 경계값 (0, 음수, 최대값) - 해당 없음
- [x] 동시성 문제 - `user` 객체와 토큰 저장소 간 동기화 타이밍 이슈 가능성

---

### 6. 성능 분석

**성능 이슈**:

1. **불필요한 `useAuth()` 호출 중복**
   - **영향**: `useStudentAnalysis` 함수 내에서 `useCredentials()`(내부에서 `useAuth()` 호출)와 별도로 `const { user } = useAuth()`를 다시 호출하고 있습니다. `useCredentials`가 이미 `hasCredentials: !!user`를 반환하므로, `isApiMode` 계산에 `useCredentials().hasCredentials`를 재사용할 수 있습니다.
   - **개선 방법**: `useCredentials`의 `hasCredentials`를 `isApiMode` 대신 사용하여 중복 `useAuth()` 호출 제거

---

### 7. 코드 품질 평가

| 항목 | 점수 | 이유 |
|------|------|------|
| 가독성 | 8/10 | `!!user`가 `getAuthTokens()` 호출보다 간결하고 직관적 |
| 유지보수성 | 7/10 | `hasJwtToken` 속성명이 실제 의미와 불일치하여 혼란 초래 가능 |
| 테스트 커버리지 | 평가 불가 | 테스트 파일 확인 필요 |
| 문서화 | 6/10 | `useApiConfig`의 `hasJwtToken` 속성에 대한 JSDoc 주석 부재 |

---

## 개선 제안 (우선순위별)

### 필수 (Must Fix)

1. **`hasJwtToken` 속성명을 `isAuthenticated`로 변경**
   - 속성명과 실제 동작의 불일치 해소
   - 호출부 14곳도 함께 변경 필요
   - 변경 대상 파일: `useApiData.ts`, `ClassDetailAnalysisPage.tsx`, `StudentDashboardPage.tsx`, `TeacherDashboardPage.tsx`, `ClassDashboardWidget.tsx`

### 권장 (Should Fix)

1. **`isApiMode` 판단에 `useCredentials().hasCredentials` 재사용**
   - `useStudentAnalysis`와 `useClassStudents`에서 `const { user } = useAuth()`와 `const isApiMode = !!user`를 별도로 선언하지 않고, `useCredentials()`의 `hasCredentials`를 활용하여 중복 제거

2. **`useApiConfig` 함수에 JSDoc 주석 추가**
   - `hasJwtToken`(또는 `isAuthenticated`) 속성이 더 이상 JWT 토큰 존재 여부가 아닌 사용자 인증 상태를 나타냄을 문서화

### 선택 (Nice to Have)

1. **`useCredentials` 훅의 `schoolLevel` 하드코딩 개선**
   - 현재 `'중등'`으로 고정되어 있으며 주석에 "SSO 전환 후 기본값 - user 프로필에서 추후 개선 가능"이라고 명시되어 있음
   - `user` 객체 기반으로 전환된 김에 `user` 프로필에서 `schoolLevel`을 가져오는 것으로 개선 가능

---

## 정리

이 커밋은 인증 상태 판단 로직을 `localStorage` 직접 접근 방식에서 React 컨텍스트 기반 방식으로 전환하는 리팩토링입니다. 변경 방향성은 올바르나, 다음과 같은 문제점이 있습니다:

1. **`hasJwtToken` 속성명이 실제 의미(`isAuthenticated`)와 불일치**하여 14곳의 호출부에서 오해를 유발할 수 있습니다.
2. **`user` 객체 존재와 JWT 토큰 유효성 사이에 간극**이 존재하여, API 호출 실패 시나리오에 대한 추가 검증이 필요합니다.
3. **`useAuth()` 중복 호출**로 인한 불필요한 리렌더링 가능성이 있습니다.

**우선 수정 항목**:
1. `hasJwtToken` -> `isAuthenticated` 속성명 변경 및 호출부 14곳 일괄 수정
2. `useCredentials().hasCredentials` 재사용하여 `useAuth()` 중복 호출 제거
3. `user` 객체와 JWT 토큰 간 동기화 보장 여부 확인 (AuthContext 구현 검토)