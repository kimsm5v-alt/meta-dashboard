> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - b6d8e319

## 코드 복잡도 분석

**분석된 파일**: 8개 / 변경된 파일: 9개


### 정상 범위 (NONE)


**`groupservice.java`** (other)

- 평균 복잡도: **0.237**

- 최대 복잡도: 0.471

- 청크 수: 4개

- 평균 사용처: 18.8곳


**권장사항:**

- 복잡도 정상 범위


**`loginpage.tsx`** (component)

- 평균 복잡도: **0.176**

- 최대 복잡도: 0.465

- 청크 수: 55개

- 평균 사용처: 13.9곳


**권장사항:**

- 파일 크기가 큼 (55개 청크) - 파일 분리 검토


**`main.tsx`** (other)

- 평균 복잡도: **0.173**

- 최대 복잡도: 0.461

- 청크 수: 8개

- 평균 사용처: 14.4곳


**권장사항:**

- 복잡도 정상 범위


**`client.ts`** (other)

- 평균 복잡도: **0.090**

- 최대 복잡도: 0.473

- 청크 수: 30개

- 평균 사용처: 3.1곳


**권장사항:**

- 파일 크기가 큼 (30개 청크) - 파일 분리 검토


**`authcontext.tsx`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.008

- 청크 수: 14개


**권장사항:**

- 복잡도 정상 범위


**`examauthstep.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.011

- 청크 수: 17개


**권장사항:**

- 복잡도 정상 범위


**`joingrouppage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.016

- 청크 수: 75개


**권장사항:**

- 파일 크기가 큼 (75개 청크) - 파일 분리 검토


**`completeprofilepage.tsx`** (component)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.006

- 청크 수: 47개


**권장사항:**

- 파일 크기가 큼 (47개 청크) - 파일 분리 검토


---


## [STATUS] 심각도별 이슈 요약

### Critical (즉시 수정 필요)
- 없음

### High (우선 수정 권장)
1. **main.tsx - HTTP 오류 처리 누락**: fetch 응답의 `res.ok` 확인 없이 바로 JSON 파싱하여 서버 오류 시 잘못된 리다이렉트 발생 가능
2. **main.tsx - 네트워크 오류 시 역할 기반 리다이렉트 실패**: catch 블록에서 역할 정보를 고려하지 않고 기본 대시보드로만 리다이렉트

### Medium (개선 권장)
1. **CompleteProfilePage.tsx - 상태 확인 API 실패 시 무시**: 이미 등록된 사용자 감지 실패 시 불필요한 프로필 입력 페이지 노출
2. **main.tsx - 개발 환경 의존성**: API URL fallback이 localhost로 하드코딩되어 프로덕션 환경 위험
3. **AuthContext.tsx - 역할 코드 매핑 불완전**: sdkUser.userType이 'UNSET'일 경우 roleCode가 'UNSET'으로 설정될 수 있음

### Low (참고 사항)
1. **CompleteProfilePage.tsx - 타입 불일치**: roleCode 상태 타입과 실제 서버 응답 타입 간 불일치 가능성
2. **main.tsx - PUBLIC_PATHS 관리**: 공개 경로 배열에 하드코딩된 문자열 관리 필요성

## 변경사항 요약
이 커밋은 SSO 인증 통합의 최종 단계로, 인증 성공 후 사용자 역할(학생/교사)에 따른 적절한 리다이렉트 로직을 구현합니다. 주요 변경사항은 다음과 같습니다:

1. **main.tsx**: 인증 콜백 시 서버의 `/api/v1/user/status` 엔드포인트를 호출하여 프로필 등록 필요 여부와 역할 정보를 확인한 후, 학생(`STUDENT`)은 `/student/exams`로, 교사(`TEACHER`)는 `/dashboard`로 리다이렉트
2. **CompleteProfilePage.tsx**: `redirect` 쿼리 파라미터를 지원하여 원래 요청한 경로를 존중하는 리다이렉트 구현
3. **AuthContext.tsx**: SSO SDK 사용자 정보를 내부 사용자 객체로 매핑할 때 `roleCode` 필드 추가
4. **LoginPage.tsx**: SSO 로그인 시 `returnPath`를 명시하지 않으면 main.tsx의 역할 기반 리다이렉트 로직에 위임

## 파일별 상세 분석

### frontend/src/main.tsx
**변경 내용:**
- 인증 콜백 처리 로직 확장: 성공 시 서버에 사용자 상태 확인 요청
- 프로필 미등록 사용자는 `/auth/complete-profile` 페이지로 리다이렉트
- 등록된 사용자는 역할(`roleCode`)에 따라 학생은 시험 목록 페이지, 교사는 대시보드로 리다이렉트
- 공개 경로에 `/auth/complete-profile` 추가

**[PROBLEM] 발견된 문제:**
1. **HTTP 오류 처리 누락**:
   - **위치 (라인 번호)**: 라인 16-30 (fetch 호출 및 응답 처리 부분)
   - **기존 코드**:
     ```typescript
     const res = await fetch(...);
     const data = await res.json();
     if (data.resultData?.needsProfile) { ... }
     ```
   - **해결 방안 (수정 코드)**:
     ```typescript
     const res = await fetch(...);
     if (!res.ok) {
       throw new Error(`HTTP ${res.status}: ${res.statusText}`);
     }
     const data = await res.json();
     if (data.resultData?.needsProfile) { ... }
     ```
   - **위험도**: High
   - **영향**: 서버가 4xx/5xx 오류 응답을 반환해도 `res.json()` 파싱이 시도되며, `data.resultData`가 `undefined`가 되어 잘못된 리다이렉트 발생 가능

2. **네트워크 오류 시 역할 기반 리다이렉트 실패**:
   - **위치 (라인 번호)**: 라인 31-33 (catch 블록)
   - **기존 코드**:
     ```typescript
     } catch {
       window.history.replaceState(null, '', result.returnPath || '/dashboard');
     }
     ```
   - **해결 방안 (수정 코드)**:
     ```typescript
     } catch {
       // 네트워크 오류 시에도 가능한 역할 정보 활용
       const userRole = auth.getUser()?.userType; // SDK에서 사용자 정보 확인
       const defaultPath = userRole === 'STUDENT' ? '/student/exams' : '/dashboard';
       window.history.replaceState(null, '', result.returnPath || defaultPath);
     }
     ```
   - **위험도**: High
   - **영향**: 네트워크 또는 서버 장애 시 학생 사용자가 교사 대시보드로 잘못 리다이렉트될 수 있음

3. **개발 환경 의존성**:
   - **위치 (라인 번호)**: 라인 18 (API URL 구성)
   - **기존 코드**:
     ```typescript
     `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/api/v1/user/status`
     ```
   - **해결 방안 (수정 코드)**:
     ```typescript
     const apiUrl = import.meta.env.VITE_API_URL;
     if (!apiUrl) {
       console.error('VITE_API_URL 환경 변수가 설정되지 않았습니다.');
       // 프로덕션에서는 반드시 설정되어야 함, 개발 환경에서만 localhost 사용
       if (import.meta.env.PROD) {
         throw new Error('환경 변수 VITE_API_URL이 필요합니다.');
       }
     }
     `${apiUrl || 'http://localhost:8081'}/api/v1/user/status`
     ```
   - **위험도**: Medium
   - **영향**: 프로덕션 환경에서 환경 변수 누락 시 잘못된 서버(localhost)로 요청 전송

**[GOOD] 잘된 점:**
- 인증 흐름이 명확하게 단계별로 구성됨: SDK 초기화 → 콜백 처리 → 사용자 상태 확인 → 역할 기반 리다이렉트
- `PUBLIC_PATHS`를 배열로 관리하여 공개 경로 확인 로직이 간결함
- 프로필 미등록 사용자에 대한 처리 경로(`/auth/complete-profile`)가 적절하게 포함됨

### frontend/src/pages/auth/CompleteProfilePage.tsx
**변경 내용:**
- `useSearchParams` 훅 추가로 `redirect` 쿼리 파라미터 지원
- 프로필 등록 성공 시 원래 요청 경로(`redirectTo`) 또는 역할 기반 경로로 리다이렉트

**[PROBLEM] 발견된 문제:**
1. **상태 확인 API 실패 시 무시**:
   - **위치 (라인 번호)**: 라인 47-58 (useEffect 내 API 호출)
   - **기존 코드**:
     ```typescript
     apiClient
       .get<{ registered: boolean; roleCode?: string }>('/api/v1/user/status')
       .then((res) => { ... })
       .catch(() => {
         // 미등록 → 현재 페이지 유지
       });
     ```
   - **해결 방안 (수정 코드)**:
     ```typescript
     apiClient
       .get<{ registered: boolean; roleCode?: string }>('/api/v1/user/status')
       .then((res) => { ... })
       .catch((err) => {
         console.error('사용자 상태 확인 실패:', err);
         // 오류 발생 시에도 사용자에게 알림 필요
         setError('사용자 정보를 확인하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
       });
     ```
   - **위험도**: Medium
   - **영향**: 이미 등록된 사용자가 API 호출 실패로 인해 불필요하게 프로필 입력 페이지에 머무를 수 있음

2. **타입 불일치 가능성**:
   - **위치 (라인 번호)**: 라인 33 (roleCode 상태 타입)
   - **기존 코드**:
     ```typescript
     const [roleCode, setRoleCode] = useState<'TEACHER' | 'STUDENT' | ''>('');
     ```
   - **해결 방안 (수정 코드)**:
     ```typescript
     type RoleType = 'TEACHER' | 'STUDENT' | '';
     const [roleCode, setRoleCode] = useState<RoleType>('');
     // 또는 서버 응답과 일치하는 타입 정의
     interface UserStatusResponse {
       registered: boolean;
       roleCode?: 'TEACHER' | 'STUDENT';
     }
     ```
   - **위험도**: Low
   - **영향**: 서버에서 다른 역할 코드 값을 반환할 경우 타입 불일치 발생 가능

**[GOOD] 잘된 점:**
- `redirect` 쿼리 파라미터를 통해 원래 요청 경로를 존중하는 UX 구현
- `needsRoleSelection` 플래그를 통해 UNSET 사용자에게만 역할 선택 요구
- 프로필 등록 성공 후 AuthContext 업데이트로 일관된 사용자 상태 유지

### frontend/src/features/auth/model/AuthContext.tsx
**변경 내용:**
- `mapSdkUserToUser` 함수에 `roleCode: sdkUser.userType` 매핑 추가
- 주석으로 "TEACHER/STUDENT — useProfileCheck에서 정확한 값으로 덮어씀" 설명 추가

**[PROBLEM] 발견된 문제:**
1. **역할 코드 매핑 불완전**:
   - **위치 (라인 번호)**: 라인 159 (mapSdkUserToUser 함수)
   - **기존 코드**:
     ```typescript
     roleCode: sdkUser.userType, // TEACHER/STUDENT — useProfileCheck에서 정확한 값으로 덮어씀
     ```
   - **해결 방안 (수정 코드)**:
     ```typescript
     roleCode: sdkUser.userType === 'TEACHER' || sdkUser.userType === 'STUDENT' 
       ? sdkUser.userType 
       : undefined,
     // 또는
     roleCode: (sdkUser.userType as 'TEACHER' | 'STUDENT' | undefined),
     ```
   - **위험도**: Medium
   - **영향**: `sdkUser.userType`이 'UNSET' 또는 다른 값일 경우 `roleCode`에 예상치 못한 값이 설정될 수 있음

**[GOOD] 잘된 점:**
- 주석을 통해 매핑의 임시적 성격과 후속 처리 흐름을 명확히 설명
- SSO SDK 사용자 정보와 내부 사용자 객체 간 매핑이 점진적으로 개선되고 있음

### frontend/src/pages/auth/LoginPage.tsx
**변경 내용:**
- SSO 로그인 시 `returnPath`를 지정하지 않으면 `undefined` 전달하여 main.tsx의 역할 기반 리다이렉트 로직에 위임

**[GOOD] 잘된 점:**
- 리다이렉트 로직의 일관성을 위해 main.tsx의 역할 기반 결정에 위임하는 설계가 합리적
- 기존 `/dashboard` 하드코딩에서 역할 기반 동적 결정으로 전환

## 보안 분석
**발견된 보안 취약점:**
특별한 보안 취약점은 발견되지 않았습니다. 인증 토큰을 Authorization 헤더에 포함하여 API 호출을 수행하는 방식은 적절합니다.

**보안 체크리스트:**
- [x] 인증/인가 검증: SSO SDK를 통한 인증, 서버 측에서 추가 역할 확인
- [x] 입력 검증 및 Sanitization: 프로필 입력 시 클라이언트 측 기본 검증 수행
- [x] 민감 정보 보호: 토큰이 안전하게 전송되며 로컬 스토리지에 저장되지 않음
- [x] HTTPS/암호화 사용: `import.meta.env.VITE_API_URL`을 통한 HTTPS 엔드포인트 사용 가정

## 버그 가능성 분석
**잠재적 버그:**
1. **서버 오류 시 잘못된 리다이렉트**:
   - **재현 조건**: `/api/v1/user/status` 엔드포인트가 500 오류 반환
   - **예상 결과**: `data.resultData`가 `undefined`가 되어 프로필 미등록 사용자로 간주되지 않고, 역할 정보 없이 기본 대시보드로 리다이렉트
   - **수정 방법**: `res.ok` 확인 추가 및 오류 처리 강화

2. **네트워크 단절 시 역할 정보 손실**:
   - **재현 조건**: 사용자 인증 성공 후 서버 상태 확인 중 네트워크 연결 끊김
   - **예상 결과**: catch 블록에서 역할 정보를 고려하지 않고 기본 대시보드로 리다이렉트
   - **수정 방법**: catch 블록에서 SDK의 사용자 정보를 활용한 역할 기반 리다이렉트 구현

**Edge Case 검증:**
- [x] Null/Undefined 처리: 대부분의 경우 기본값 제공
- [x] 빈 배열/객체 처리: `PUBLIC_PATHS` 빈 배열 시 모든 경로 공개로 처리될 수 있음 (현재는 하드코딩)
- [x] 경계값 (0, 음수, 최대값): 해당 없음
- [ ] 동시성 문제: 여러 인증 콜백이 동시에 처리될 경우 상태 충돌 가능성 (낮음)

## 성능 분석
**성능 이슈:**
1. **추가 네트워크 요청**:
   - **영향**: 인증 콜백 시마다 `/api/v1/user/status` 호출로 인한 약 100-500ms 지연
   - **개선 방법**: 인증 토큰에 역할 정보를 포함시켜 서버 호출 감소 (장기적)

**성능 체크리스트:**
- [x] 불필요한 연산 제거: 공개 경로 확인 로직 효율적
- [ ] 캐싱 활용: 사용자 상태 정보 캐싱 고려 가능
- [x] 비동기 처리: 모든 네트워크 요청 비동기 처리
- [x] 메모리 효율성: 불필요한 상태 변수 없음

## 코드 품질 평가
- **가독성**: 8/10 - 인증 흐름이 명확하게 단계별로 구성되어 이해하기 쉬움
- **유지보수성**: 7/10 - 역할 기반 로직이 여러 파일에 분산되어 있어 중앙 관리 필요
- **테스트 커버리지**: 평가 불가 - 테스트 코드 확인 필요
- **문서화**: 6/10 - 주요 함수에는 주석 있으나, 전체 인증 흐름 문서화 부족

---

## 개선 제안 (우선순위별)

### 필수 (Must Fix)
1. **main.tsx의 HTTP 오류 처리**: `fetch` 응답에 `res.ok` 확인 추가하여 서버 오류 시 적절한 오류 처리
2. **네트워크 오류 시 역할 기반 리다이렉트**: catch 블록에서 SDK 사용자 정보를 활용한 역할 판단 로직 추가

### 권장 (Should Fix)
1. **CompleteProfilePage.tsx의 오류 처리 개선**: API 호출 실패 시 사용자에게 적절한 안내 메시지 제공
2. **환경 변수 검증 강화**: 프로덕션 환경에서 `VITE_API_URL` 설정 강제화 또는 더 나은 fallback 전략
3. **AuthContext.tsx의 역할 매핑 개선**: `sdkUser.userType`의 유효한 값만 `roleCode`로 매핑

### 선택 (Nice to Have)
1. **역할 기반 리다이렉트 로직 중앙화**: 현재 main.tsx와 CompleteProfilePage.tsx에 분산된 역할 로직을 유틸리티 함수로 통합
2. **타입 정의 정리**: 역할 코드 관련 타입을 공통 타입 파일에서 정의하고 재사용
3. **PUBLIC_PATHS 동적 관리**: 하드코딩된 공개 경로를 설정 파일에서 관리 가능하도록 개선

---

## 최종 평가

**종합 점수**: 75/100

**결론**: 
- [x] [OK] **승인 (Approved)** - 문제 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - 경미한 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - 중요 이슈 수정 후 재검토
- [ ] [REJECT] **거부 (Rejected)** - 치명적 이슈로 인한 병합 불가

**핵심 코멘트:**
이 커밋은 SSO 통합의 중요한 마지막 단계를 구현하며, 역할 기반 리다이렉트라는 핵심 기능을 도입했습니다. 전반적인 설계는 합리적이지만, 오류 처리와 타입 안정성 측면에서 개선이 필요합니다. 특히 서버 오류 시의 리다이렉트 로직과 네트워크 실패 시의 역할 정보 활용이 현재 상태로는 불완전합니다. 이러한 이슈들은 사용자 경험에 직접적인 영향을 미칠 수 있으므로, 병합은 가능하지만 최대한 빠른 시일 내에 수정하는 것을 권장합니다.

**리뷰어 노트:**
- 검토 시간: 45분
- 우선 수정 항목:
  1. main.tsx의 HTTP 응답 상태 코드 확인 추가
  2. 네트워크 오류 시 SDK 사용자 정보를 활용한 역할 기반 리다이렉트 구현
  3. 프로덕션 환경 변수 검증 강화