> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 70b364b3

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 모니터링 권장 (LOW)


**`client.ts`** (other)

- 평균 복잡도: **0.106**

- 최대 복잡도: 0.525

- 청크 수: 32개

- 평균 사용처: 4.7곳


**권장사항:**

- **모니터링 권장**: 복잡도가 높은 편이지만 영향 범위 제한적

- 파일 크기가 큼 (32개 청크) - 파일 분리 검토


---


## [STATUS] 심각도별 이슈 요약

### Critical (즉시 수정 필요)
- **보안 취약점**: `/group/invite`와 `/group/join-guest` 엔드포인트를 PUBLIC_ENDPOINTS에 추가하면서 접근 제어 메커니즘이 완전히 제거됨

### High (우선 수정 권장)
- **엔드포인트 검증 부재**: URL에 `/group/invite` 문자열이 포함된 모든 요청이 인증 없이 허용됨
- **정규화되지 않은 경로 패턴**: 경로 매칭 로직이 단순 문자열 포함 검사로 되어 있어 보안 위협 초래

### Medium (개선 권장)
- **주석 부족**: 변경 사항에 대한 상세한 설명이 부족함
- **코드 구조 개선 필요**: PUBLIC_ENDPOINTS 관리 방식이 취약함

### Low (참고 사항)
- **코드 포맷팅**: 주석 정렬이 약간 불일치함

## 변경사항 요약
CP님의 커밋은 게스트 초대 기능을 위해 프론트엔드 API 클라이언트의 PUBLIC_ENDPOINTS 목록에 두 개의 그룹 관련 엔드포인트(`/group/invite`, `/group/join-guest`)를 추가했습니다. 이는 인증이 필요하지 않은 엔드포인트로 설정하여 비로그인 사용자의 초대 링크 접근과 게스트 가입을 가능하게 하기 위한 변경입니다.

## 파일별 상세 분석

### frontend/src/shared/api/client.ts
**변경 내용:**
`PUBLIC_ENDPOINTS` 배열에 `/group/invite`와 `/group/join-guest` 두 개의 엔드포인트를 추가하여 인증이 필요하지 않은 엔드포인트로 설정

**[PROBLEM] 발견된 문제:**
1. **[보안 취약점 - 인증 우회 가능성]**: 공개 엔드포인트 추가로 인한 인증 우회 위험
   - **위치 (라인 번호)**: 라인 62-63
   - **기존 코드**: 
   ```typescript
   '/group/invite', // 초대 링크 접근 (비로그인 허용)
   '/group/join-guest', // 게스트 가입 (비로그인 허용)
   ```
   - **해결 방안 (수정 코드)**: 
   ```typescript
   // 초대 링크 조회는 인증 없이 허용하되, 초대 코드 검증 필요
   '/group/invite/get', // 초대 정보 조회 (비로그인 허용)
   '/group/invite/validate', // 초대 코드 검증 (비로그인 허용)
   
   // 게스트 가입은 최소한의 인증 정보 검증 필요
   '/group/join-guest', // 게스트 가입 (초대 코드 기반 인증 필요)
   ```
   - **위험도**: Critical
   - **영향**: `/group/invite` 경로를 사용하는 모든 API 호출이 인증 없이 접근 가능해짐. 공격자가 다른 그룹 관련 엔드포인트(`/group/invite/delete`, `/group/invite/list` 등)를 우회 접근할 수 있는 가능성이 있음

2. **[URL 패턴 매칭 취약성]**: 단순 문자열 포함 검사로 인한 오탐지 가능성
   - **위치 (라인 번호)**: 라인 103-105
   - **기존 코드**:
   ```typescript
   axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
     const isPublic = PUBLIC_ENDPOINTS.some((ep) => config.url?.includes(ep));
     if (!isPublic) {
   ```
   - **해결 방안 (수정 코드)**:
   ```typescript
   axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
     // 정확한 경로 매칭을 위한 정규화 함수
     const normalizePath = (url: string): string => {
       const urlObj = new URL(url, BASE_URL);
       return urlObj.pathname;
     };
     
     const currentPath = config.url ? normalizePath(config.url) : '';
     const isPublic = PUBLIC_ENDPOINTS.some((ep) => currentPath === ep);
     if (!isPublic) {
   ```
   - **위험도**: High
   - **영향**: `config.url?.includes(ep)` 방식은 `/group/invite/something` 같은 하위 경로도 공개 엔드포인트로 오인할 수 있음. 예를 들어, `/group/invite/delete` 요청도 인증 없이 통과될 수 있는 심각한 보안 문제

**[GOOD] 잘된 점:**
- 기능 요구사항(게스트 초대 링크 접근)에 맞춰 필요한 변경을 최소한으로 수행함
- 주석을 통해 변경 의도를 명시적으로 표현함
- 기존 코드 패턴을 따르며 일관성을 유지함

## 보안 분석
**발견된 보안 취약점:**
1. **인증 우회 가능성**
   - **CVE 참조**: CWE-287 (Improper Authentication)
   - **공격 시나리오**: 공격자가 `/group/invite`를 포함하는 모든 API 엔드포인트에 인증 없이 접근 가능. 예를 들어, 추후 추가될 `/group/invite/delete` 같은 관리 기능도 우회 접근 가능
   - **수정 방법**: 정확한 경로 매칭 방식 도입 및 엔드포인트별 세부적인 접근 제어 구현

2. **초대 코드 검증 부재**
   - **공격 시나리오**: 초대 코드 없이도 `/group/join-guest`에 접근 가능하여 무단 가입 시도 가능
   - **수정 방법**: 게스트 가입 API는 반드시 유효한 초대 코드를 요청 파라미터로 받아 검증해야 함

**보안 체크리스트:**
- [ ] 인증/인가 검증: PUBLIC_ENDPOINTS 추가로 인한 인증 우회 위험 존재
- [ ] 입력 검증 및 Sanitization: 초대 코드 검증 메커니즘 확인 필요
- [ ] 민감 정보 보호: 게스트 정보 처리 시 개인정보 보호 확인 필요
- [ ] HTTPS/암호화 사용: 환경변수 기반 BASE_URL 사용으로 일부 해결

## 버그 가능성 분석
**잠재적 버그:**
1. **엔드포인트 충돌 버그**
   - **재현 조건**: `/group/invite`로 시작하는 새로운 엔드포인트 추가 시
   - **예상 결과**: 모든 `/group/invite/*` 요청이 인증 없이 처리됨
   - **수정 방법**: 정확한 경로 매칭 알고리즘으로 수정

2. **CORS/CSRF 공격 노출**
   - **재현 조건**: 공개 엔드포인트에 대한 크로스 도메인 요청
   - **예상 결과**: CSRF 토큰 없이도 API 호출 가능
   - **수정 방법**: 공개 엔드포인트라도 CSRF 토큰 검증 또는 Referer 검증 추가

**Edge Case 검증:**
- [ ] Null/Undefined 처리: config.url이 null일 경우 처리 필요
- [ ] 빈 배열/객체 처리: PUBLIC_ENDPOINTS 검증 로직 강화
- [ ] 경계값 (0, 음수, 최대값): 초대 코드 길이/형식 제한 검증
- [ ] 동시성 문제: 다중 게스트 가입 시 데이터 무결성 보장 필요

## 성능 분석
**성능 이슈:**
1. **PUBLIC_ENDPOINTS 배열 선형 검색**
   - **영향**: 엔드포인트 수가 증가할수록 O(n) 시간 복잡도로 성능 저하
   - **개선 방법**: Set 자료구조로 변경하여 O(1) 검색 가능
   ```typescript
   const PUBLIC_ENDPOINTS_SET = new Set([
     '/member/login',
     // ... 기존 엔드포인트
     '/group/invite',
     '/group/join-guest'
   ]);
   ```

**성능 체크리스트:**
- [ ] 불필요한 연산 제거: 문자열 includes 대신 정확한 매칭으로 개선 가능
- [ ] 캐싱 활용: 초대 코드 검증 결과 캐싱 고려
- [ ] 비동기 처리: 이미 적절히 구현됨
- [ ] 메모리 효율성: Set 사용으로 메모리 효율 개선 가능

## 코드 품질 평가
- **가독성**: 7/10 - 주석은 있지만 변경 이유와 보안 고려사항이 부족함
- **유지보수성**: 6/10 - PUBLIC_ENDPOINTS 관리 방식이 취약하여 유지보수 어려움
- **테스트 커버리지**: 평가 불가 - 테스트 코드가 확인되지 않음
- **문서화**: 5/10 - 기능적 목적만 기술하고 보안/예외 사항 문서화 부족

---

## 개선 제안 (우선순위별)

### 필수 (Must Fix)
1. **보안 취약점 수정**: PUBLIC_ENDPOINTS 검증 로직을 정확한 경로 매칭 방식으로 변경
2. **엔드포인트 세분화**: `/group/invite`를 구체적인 기능별 엔드포인트로 분리
3. **초대 코드 검증 강화**: 게스트 가입 시 반드시 유효한 초대 코드 검증

### 권장 (Should Fix)
1. **PUBLIC_ENDPOINTS 관리 개선**: Set 자료구조로 변경 및 상수화
2. **에러 핸들링 강화**: 초대 코드 무효/만료 시 적절한 에러 응답
3. **로그 보강**: 게스트 가입 시도에 대한 감사 로그 기록

### 선택 (Nice to Have)
1. **API 문서화**: 게스트 초대 관련 API 명세 문서화
2. **테스트 코드 작성**: PUBLIC_ENDPOINTS 기능에 대한 단위 테스트
3. **타입 안전성 강화**: 엔드포인트 타입 정의를 통한 타입 안전성 확보

---

## 최종 평가

**종합 점수**: 45/100

**결론**: 
- [ ] [OK] 승인 (Approved) - 문제 없음
- [ ] [WARN] 조건부 승인 (Approved with Comments) - 경미한 이슈만 존재
- [x] [FIX] 수정 필요 (Changes Requested) - 중요 이슈 수정 후 재검토
- [ ] [REJECT] 거부 (Rejected) - 치명적 이슈로 인한 병합 불가

**핵심 코멘트:**
CP님의 변경은 기능적 요구사항을 구현했으나, 보안 측면에서 심각한 취약점을 도입했습니다. `/group/invite`를 PUBLIC_ENDPOINTS에 추가하는 방식은 해당 경로의 모든 하위 엔드포인트에 대한 인증을 우회할 수 있는 위험을 내포하고 있습니다. 현재의 단순 문자열 포함 검사 방식은 보안 상 취약하며, 정확한 경로 매칭 방식으로 전환해야 합니다.

**리뷰어 노트:**
- 검토 시간: 약 30분
- 우선 수정 항목:
  1. PUBLIC_ENDPOINTS 검증 로직을 정확한 경로 매칭으로 변경
  2. `/group/invite` 엔드포인트를 기능별로 세분화
  3. 게스트 가입 시 초대 코드 검증 메커니즘 강화