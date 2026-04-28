> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 576b0b4f

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`notificationdebugcontroller.java`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.004

- 청크 수: 15개


**권장사항:**

- 복잡도 정상 범위


---


## [STATUS] 심각도별 이슈 요약

### Critical (즉시 수정 필요)
1. `/test-send` 엔드포인트에 `@Transactional` 어노테이션 누락 — DB insert와 SSE dispatch 간 트랜잭션 경계 불일치
2. `dispatcher.dispatch()` 실패 시 에러 처리 부재 — DB에는 알림이 저장되지만 SSE는 전송되지 않는 데이터 불일치 상태 발생 가능

### High (우선 수정 권장)
1. `dispatcher.dispatch()` 호출이 `service.create()` 트랜잭션 밖에서 실행 — AFTER_COMMIT 시점 보장과 실제 리스너 패턴과의 정합성 차이
2. HANDOFF.md 문서의 에러 로깅 가이드라인 누락 — 디버그 컨트롤러에서의 예외 처리 패턴 미기술

### Medium (개선 권장)
1. 요청 바디 내부 클래스(T1Body, T2Body 등)에 `@NotNull` 또는 `@Valid` 검증 부재
2. `NotificationDebugController`와 `NotificationController`의 엔드포인트 경로 중복 (`/api/v1/notifications`)

### Low (참고 사항)
1. HANDOFF.md에 JWT 획득 방법이 `fe-api-contract.md`보다 간략하게 기술되어 있어 혼동 가능성
2. `fe-api-contract.md`의 SSE 구현 가이드가 `@microsoft/fetch-event-source` 라이브러리에만 의존

---

## 변경사항 요약

이 커밋은 `feature/notification` 브랜치의 알림 기능 Phase 1 완료 시점에서 발생한 핫픽스와 문서화 작업이다. NotificationDebugController의 `/test-send` 엔드포인트에서 이벤트 시스템을 우회하는 경로로 인해 SSE dispatch가 누락되던 버그를 수정하여, `service.create()` 직후 `dispatcher.dispatch()`를 직접 호출하도록 변경하였다. 또한 핸드오프 문서(HANDOFF.md)를 신규 생성하고, `exam-integration-guide.md`와 `fe-api-contract.md`를 최신화하여 FE/검사 BE 담당자가 인수인계받을 수 있도록 준비하였다.

---

## 파일별 상세 분석

### 파일명1: `NotificationDebugController.java`

**변경 내용:**
`/test-send` 엔드포인트에 `NotificationDispatcher`를 생성자 주입받고, `service.create()` 직후 `dispatcher.dispatch(userNo, NotificationDto.from(n))`를 호출하여 SSE 전송을 보장하도록 수정하였다. 기존에는 `eventPublisher.publishEvent()`를 통한 이벤트 시스템만 의존했으나, debug 컨트롤러는 해당 경로를 우회하므로 직접 dispatch 호출이 필요했다.

**[PROBLEM] 발견된 문제:**

1. **[@Transactional 누락 — 트랜잭션 경계 불일치]**
   - **위치 (라인 번호)**: 라인 61-72 (`testSend` 메서드 전체)
   - **기존 코드**:
     ```java
     @PostMapping("/test-send")
     @Operation(summary = "[local] 본인에게 테스트 알림 발송", description = "로컬 환경에서 SSE 동작 확인용")
     public ResponseDTO<CustomBody> testSend(
             @RequestParam(defaultValue = "테스트 알림입니다") String msg
     ) {
         Long userNo = SecurityUtil.requireCurrentUserNo();
         Notification n = service.create(userNo, NotificationCategory.NOTICE, "TEST", msg, null);
         // 이벤트 시스템 우회 경로 — SSE 전송까지 확인하려면 직접 dispatch 호출 필요
         dispatcher.dispatch(userNo, NotificationDto.from(n));
         return AidtCommonUtil.makeResultSuccess(null, Collections.singletonMap("userNo", userNo), "sent");
     }
     ```
   - **해결 방안 (수정 코드)**:
     ```java
     @PostMapping("/test-send")
     @Operation(summary = "[local] 본인에게 테스트 알림 발송", description = "로컬 환경에서 SSE 동작 확인용")
     @Transactional  // AFTER_COMMIT 리스너 패턴과의 정합성 + dispatch 실패 시 롤백
     public ResponseDTO<CustomBody> testSend(
             @RequestParam(defaultValue = "테스트 알림입니다") String msg
     ) {
         Long userNo = SecurityUtil.requireCurrentUserNo();
         Notification n = service.create(userNo, NotificationCategory.NOTICE, "TEST", msg, null);
         try {
             dispatcher.dispatch(userNo, NotificationDto.from(n));
         } catch (Exception ex) {
             log.warn("[Debug] test-send dispatch failed for userNo={}", userNo, ex);
             // dispatch 실패 시 DB insert도 롤백하여 데이터 일관성 유지
             throw new RuntimeException("알림 dispatch 실패, 트랜잭션 롤백", ex);
         }
         return AidtCommonUtil.makeResultSuccess(null, Collections.singletonMap("userNo", userNo), "sent");
     }
     ```
   - **위험도**: Critical
   - **영향**: 현재 `service.create()`는 자체 `@Transactional`로 인해 DB insert가 개별 트랜잭션으로 커밋되지만, `dispatcher.dispatch()`는 이 트랜잭션 외부에서 실행된다. 만약 `dispatch()`에서 SSE 전송 실패가 발생하면 DB에는 notification이 저장되고 SSE는 전송되지 않는 데이터 불일치가 발생한다. 또한 `@Transactional`이 없으면 다른 fire 엔드포인트(T1, T2, S4, S5)는 `@Transactional`이 있는 반면 `test-send`만 없는 비대칭 구조가 되어, 디버깅 시 일관된 트랜잭션 동작을 기대하기 어렵다.

2. **[dispatcher.dispatch() 실패 시 에러 처리 부재]**
   - **위치 (라인 번호)**: 라인 69 (`dispatcher.dispatch(userNo, NotificationDto.from(n))`)
   - **기존 코드**: `dispatcher.dispatch()` 호출에 try-catch가 없어 예외 발생 시 상위로 전파되어 500 에러만 반환됨
   - **해결 방안 (수정 코드)**: 위 [#1]의 수정 코드와 동일 — try-catch로 dispatch 실패를 로깅하고 트랜잭션 롤백
   - **위험도**: Critical
   - **영향**: SSE 전송 실패(연결 끊김, Registry에 userNo 없음 등)가 발생해도 DB insert는 이미 커밋되어 고립된 알림 데이터가 생성된다. 디버깅 시 "알림이 생성되었으나 SSE로 안 옴" 상황을 야기한다.

3. **[실제 리스너 패턴과의 동작 차이]**
   - **위치 (라인 번호)**: 라인 68-69
   - **기존 코드**: `service.create()`(자체 `@Transactional`) 완료 후 `dispatcher.dispatch()` 호출
   - **설명**: 실제 NotificationEventHandler의 패턴은 `@TransactionalEventListener(AFTER_COMMIT) + @Transactional(propagation = REQUIRES_NEW)` 조합으로, 본 트랜잭션이 커밋된 후 별도 트랜잭션에서 알림 insert + dispatch를 수행한다. 반면 `test-send`는 `service.create()`의 트랜잭션이 커밋된 직후 dispatch를 호출하지만, 이는 AFTER_COMMIT 시점과 정확히 동일하지 않다. `service.create()`의 트랜잭션은 메서드 반환 직전에 커밋되며, 그 후 `dispatcher.dispatch()`가 실행되므로 AFTER_COMMIT 리스너가 개입할 수 없는 구조이다.
   - **위험도**: High
   - **영향**: `test-send`가 실제 이벤트 리스너의 동작을 100% 모방하지 못한다. debug 용도임을 감안하더라도, 실제 운영 환경에서의 트랜잭션 경계와 디버그 환경에서의 트랜잭션 경계가 다르면 "로컬에서는 잘 됐는데 운영에서는 안 됨" 현상 발생 가능성이 있다.

4. **[요청 바디 DTO에 검증 어노테이션 부재]**
   - **위치 (라인 번호)**: 라인 131-167 (T1Body, T2Body, S4Body, S5Body 내부 클래스)
   - **기존 코드**:
     ```java
     public static class T1Body {
         public Long teacherUserNo;
         public String claId;
         public String groupName;
         public String studentNickname;
         @Override public String toString() { ... }
     }
     ```
   - **해결 방안 (수정 코드)**:
     ```java
     public static class T1Body {
         @NotNull(message = "teacherUserNo는 필수") public Long teacherUserNo;
         @NotBlank(message = "claId는 필수") public String claId;
         @NotBlank(message = "groupName은 필수") public String groupName;
         @NotBlank(message = "studentNickname은 필수") public String studentNickname;
         @Override public String toString() { ... }
     }
     ```
   - **위험도**: Medium
   - **영향**: fire 엔드포인트에 null 필드가 전달되면 `NullPointerException`이 발생하거나, 이벤트 record가 null 필드를 포함한 채로 리스너에 전달된다. debug 용도이긴 하지만, FE 담당자가 테스터 페이지에서 잘못된 값을 입력했을 때 명확한 오류 메시지를 받지 못한다.

5. **[엔드포인트 경로 중복 — 프로덕션 컨트롤러와 충돌 가능성]**
   - **위치 (라인 번호)**: 라인 36 (`@RequestMapping(value = "/api/v1/notifications")`)
   - **기존 코드**: 프로덕션 `NotificationController`도 동일한 `@RequestMapping("/api/v1/notifications")`를 가질 가능성이 높음
   - **설명**: `@Profile("local")`로 인해 운영 환경에서는 문제가 없지만, 로컬에서 두 컨트롤러가 모두 활성화되면 endpoint 매핑 충돌로 애플리케이션 기동 자체가 실패할 수 있다. (단, `NotificationController`에도 `@Profile("!local")`이 있다면 문제없음)
   - **위험도**: Medium
   - **영향**: 로컬 프로파일에서 애플리케이션이 기동되지 않거나, 예기치 않은 매핑 오류가 발생할 수 있다. `NotificationController`의 프로파일 설정을 반드시 확인해야 한다.

**[GOOD] 잘된 점:**
- 버그 원인(이벤트 시스템 우회 경로)을 정확히 파악하고, `dispatcher.dispatch()`를 직접 호출하는 명확한 해결책을 적용했다.
- 주석(`// 이벤트 시스템 우회 경로 — SSE 전송까지 확인하려면 직접 dispatch 호출 필요`)으로 왜 dispatch가 필요한지 명확히 설명하여 유지보수성을 높였다.
- `@Profile("local")`로 debug 컨트롤러를 운영 환경과 격리한 점은 보안 측면에서 적절하다.

---

### 파일명2: `HANDOFF.md` (신규)

**변경 내용:**
알림 기능 Phase 1 완료 후, FE 담당자와 검사(EXAM) BE 담당자에게 인수인계를 위한 진입점 문서를 신규 생성하였다. "대상별 이것만 읽으세요" 섹션으로 역할별 필수 문서를 구분하고, 로컬 테스터 페이지 사용법, 공통 약속 사항(AFTER_COMMIT, REQUIRES_NEW, 문구 박제 등)을 정리하였다.

**[PROBLEM] 발견된 문제:**

1. **[에러 로깅 가이드라인 누락 — 디버그 컨트롤러에서의 예외 처리 패턴 미기술]**
   - **위치**: "주요 약속 사항" 섹션 (라인 128-132)
   - **설명**: 주요 약속 사항 #5에서 "에러 로깅 — catch 블록은 log.warn('메시지', ex)로 Throwable을 마지막 인자로 넘길 것"이라고 기술했으나, 디버그 컨트롤러 자체에서의 예외 처리 가이드는 전혀 포함되어 있지 않다. `test-send`와 같은 debug 엔드포인트에서 예외가 발생했을 때 어떻게 처리해야 하는지에 대한 가이드라인이 없다.
   - **해결 방안**: "디버그 컨트롤러의 예외 처리" 항목을 추가하여, debug 엔드포인트에서도 try-catch로 예외를 로깅하고 트랜잭션 롤백을 고려해야 함을 명시
   - **위험도**: High
   - **영향**: 담당자가 새로운 debug 엔드포인트를 추가할 때 예외 처리를 누락하면, 디버깅 환경에서도 데이터 불일치가 발생할 수 있다.

2. **[JWT 획득 방법의 간략화 — fe-api-contract.md와의 정합성 부족]**
   - **위치**: "로컬 테스터 페이지" > "주의" 섹션 (라인 111-113)
   - **기존 문서**: "JWT 필요 — 테스터 자체도 인증 경로를 타므로 FE에서 한 번 로그인한 후 토큰 복사 필요"
   - **설명**: `fe-api-contract.md`에서는 "JWT 획득 방법 정확화 (SDK 래퍼 사용, localStorage 직접 읽기 X)"라고 명시했으나, HANDOFF.md에서는 단순히 "FE에서 한 번 로그인한 후 토큰 복사"라고만 기술되어 있다. SDK 래퍼 사용을 강조하지 않으면, 담당자가 localStorage에서 직접 JWT를 읽어오는 보안 취약 패턴을 사용할 수 있다.
   - **해결 방안**: `fe-api-contract.md`에 명시된 "SDK 래퍼를 통해 access token을 획득"한다는 문구를 HANDOFF.md의 주의사항에도 반영
   - **위험도**: Low
   - **영향**: 담당자가 보안에 취약한 JWT 획득 방식을 사용할 가능성이 있으며, 로컬 환경에서는 큰 문제가 없더라도 잘못된 패턴이 운영 코드에 재사용될 위험이 있다.

**[GOOD] 잘된 점:**
- "30초 요약" 섹션으로 각 담당자가 최소한의 읽을 거리로 빠르게 업무를 시작할 수 있도록 설계했다.
- 문서 구조를 트리로 시각화하여 전체 파일 맵을 한눈에 파악할 수 있다.
- "Phase 2 (나중)" 섹션으로 미래 확장 계획을 명시하여 현재 Phase 1의 범위를 명확히 했다.

---

### 파일명3: `exam-integration-guide.md`

**변경 내용:**
로깅 패턴을 `ex.getMessage()`에서 `ex`(Throwable 전체 전달)로 수정하여 스택트레이스 보존을 강화하였다. 테스트 섹션을 "빠른 단위 확인"과 "풀 E2E" 2단계로 분리하고, 기존 `/dev/sse` 페이지 참조를 `/dev/notification-tester`로 교체하였다. 체크리스트의 SSE 수신 확인 경로도 업데이트하였다.

**[PROBLEM] 발견된 문제:**

1. **[로깅 패턴 수정의 일관성 부족 — 동일한 패턴의 다른 catch 블록이 있을 가능성]**
   - **위치**: 라인 91-94 (예제 코드 내 log.warn)
   - **설명**: 예제 코드에서 `ex.getMessage()` → `ex`로 수정되었으나, 실제 NotificationEventHandler의 모든 catch 블록이 동일한 패턴으로 수정되었는지 확인이 필요하다. 문서만 수정되고 실제 코드가 따라가지 않으면 문서-코드 불일치가 발생한다.
   - **위험도**: Low (문서화 이슈이므로)
   - **영향**: 문서와 실제 코드가 불일치하면 담당자가 혼동할 수 있다.

**[GOOD] 잘된 점:**
- 테스트를 2단계로 분리한 것은 실용적이다. "(a) 빠른 단위 확인"으로 이벤트 파이프라인만 격리 검증하고, "(b) 풀 E2E"로 실제 비즈 로직을 포함한 종단 검증을 수행하는 계층적 접근법이 명확하다.
- 체크리스트를 최신화하여 담당자가 테스트 시 혼동할 여지를 줄였다.

---

### 파일명4: `fe-api-contract.md`

**변경 내용:**
로컬 테스트 방법을 `/dev/notification-tester` 위주로 개편하고, JWT 획득 방법을 SDK 래퍼를 통하도록 정확화하였다. 수동 SSE 파서 참조를 추가하였다.

**[PROBLEM] 발견된 문제:**

없음 (문서 업데이트가 적절히 수행됨)

**[GOOD] 잘된 점:**
- `localStorage 직접 읽기 X`라고 명시하여 보안 취약 패턴을 원천 차단한 점이 우수하다.
- `@microsoft/fetch-event-source` 라이브러리 사용을 권장하여 Bearer 헤더가 필요한 SSE 구현의 실제적인 문제를 해결했다.

---

## 보안 분석

**발견된 보안 취약점:**

1. **디버그 엔드포인트의 JWT 인증 통과 — 운영 환경 노출 시 위험**
   - **설명**: `NotificationDebugController`는 `@Profile("local")`로 보호되어 있지만, `SecurityUtil.requireCurrentUserNo()`를 통해 정상 인증 경로를 탄다. 이는 debug용으로 적절하지만, 만약 프로파일 설정이 잘못되어 운영 환경에서 이 컨트롤러가 활성화되면 DB에 직접 접근하는 API(`/cleanup-old`, `deleteOlderThan`)가 노출된다.
   - **공격 시나리오**: 운영 서버에서 `@Profile("local")` 조건이 충족되지 않았으나, Spring profile 설정 실수로 debug 컨트롤러가 활성화되면 공격자가 `/api/v1/notifications/cleanup-old?days=0`을 호출하여 전체 알림 데이터를 삭제할 수 있다.
   - **수정 방법**: `@Profile("local")` 외에 추가적인 보안 장치(IP 화이트리스트, 추가 인증 토큰 등)를 고려하거나, `@Profile` 조건을 이중으로 검증하는 테스트 코드를 작성한다.

2. **요청 바디 검증 부재 — 잘못된 입력으로 인한 NPE 위험**
   - **설명**: T1Body, T2Body 등의 public 필드에 `@NotNull`이나 `@NotBlank` 같은 검증 어노테이션이 없어, 클라이언트가 빈 값이나 null을 전송하면 `NullPointerException`이 발생한다.
   - **공격 시나리오**: FE 테스터 페이지에서 필드를 비워두고 요청을 보내면, 이벤트 생성자에 null이 전달되어 리스너에서 NPE 발생 > 디버깅 환경이 중단된다.
   - **수정 방법**: Jakarta Validation 어노테이션을 추가하고, 컨트롤러 파라미터에 `@Valid`를 적용한다.

**보안 체크리스트:**
- [x] 인증/인가 검증: `SecurityUtil.requireCurrentUserNo()`로 JWT 인증 확인
- [ ] 입력 검증 및 Sanitization: `@Valid` 누락 — 개선 필요
- [ ] 민감 정보 보호: JWT 사용, 로컬 환경 격리
- [ ] HTTPS/암호화 사용: 로컬 환경이므로 해당사항 없음

---

## 버그 가능성 분석

**잠재적 버그:**

1. **`service.create()`의 `@Transactional`과 `test-send`의 트랜잭션 경계 불일치**
   - **재현 조건**: `dispatcher.dispatch()`에서 SSE 전송 중 예외 발생 (SseEmitter가 이미 닫힌 경우, `ClientAbortException` 등)
   - **예상 결과**: `service.create()`의 DB insert는 이미 커밋되었지만, SSE 전송은 실패한다. 클라이언트는 500 에러를 받지만, DB에는 알림이 생성되어 있어 재시도 시 중복 알림이 발생할 수 있다.
   - **수정 방법**: `test-send` 전체에 `@Transactional`을 추가하고 `dispatcher.dispatch()` 예외 시 롤백

2. **`NotificationDebugController`와 `NotificationController`의 매핑 충돌**
   - **재현 조건**: 로컬 프로파일에서 `NotificationController`에도 `@Profile("!local")`이 없거나, 두 컨트롤러가 동일한 `@RequestMapping`을 공유하는 경우
   - **예상 결과**: Spring context 로드 시 `RequestMappingHandlerMapping`에서 중복 매핑 예외 발생 → 애플리케이션 기동 실패
   - **수정 방법**: `NotificationController`에도 `@Profile("!local")`을 추가하여 debug 컨트롤러와 프로덕션 컨트롤러가 동시에 활성화되지 않도록 보장

**Edge Case 검증:**
- [ ] Null/Undefined 처리: 요청 바디 DTO에 `@NotNull` 부재 — 위험
- [x] 빈 배열/객체 처리: `createBatch`에서 null/empty 체크 수행
- [ ] 경계값 (0, 음수, 최대값): `cleanup-old`의 `days` 파라미터에 음수나 0이 전달되면 `service.deleteOlderThan()`에서 비정상 동작 가능 — `days` 파라미터 검증 부재
- [ ] 동시성 문제: 싱글 인스턴스 환경이므로 해당사항 없음

---

## 성능 분석

**성능 이슈:**

1. **`dispatcher.dispatch()`를 for-loop에서 호출할 경우 성능 저하**
   - **영향**: 현재 `test-send`는 단건이므로 성능 이슈는 없으나, 향후 배치 전송 시 `dispatch()`를 개별 호출하면 N+1 문제가 발생할 수 있다.
   - **개선 방법**: `InMemoryDispatcher`의 구현을 확인해야 하지만, 배치 dispatch를 위한 `dispatchBatch(List<Long> userNos, List<NotificationDto> dtos)` 메서드 추가 검토

**성능 체크리스트:**
- [x] 불필요한 연산 제거: debug 컨트롤러이므로 해당사항 없음
- [ ] 캐싱 활용: 알림 목록 조회 시 캐싱 고려 가능 (Phase 2)
- [x] 비동기 처리: SSE는 비동기 처리
- [x] 메모리 효율성: DTO 변환 시 stream API 사용으로 적절

---

## 코드 품질 평가

- **가독성**: 9/10 — 클래스 구조가 명확하고, 주석이 적절하며, 메서드 분리가 잘 되어 있음. `echo()` 헬퍼 메서드로 응답 생성 로직을 추상화한 점이 좋음.
- **유지보수성**: 8/10 — `@Profile("local")`로 운영 환경과 격리되어 있고, 의존성 주입이 명확함. 다만 내부 정적 클래스가 많아지면 파일이 비대해질 수 있으므로 별도 DTO 패키지로 분리 고려 가능.
- **테스트 커버리지**: 평가 불가 — 테스트 코드가 이 커밋 범위에 포함되지 않음. debug 컨트롤러에 대한 단위 테스트가 별도로 존재하는지 확인 필요.
- **문서화**: 9/10 — HANDOFF.md 신규 생성으로 인수인계 문서가 체계화되었으며, 코드 내 주석이 상세하고 명확함. 다만 트랜잭션 동작 방식에 대한 주석이 `test-send`에 부재함.

---

## 개선 제안 (우선순위별)

### 필수 (Must Fix)

1. **`test-send`에 `@Transactional` 추가 및 `dispatcher.dispatch()` 에러 처리**
   - 파일: `NotificationDebugController.java` 라인 61-72
   - 내용: `@Transactional` 어노테이션 추가 + try-catch로 dispatch 실패 시 로깅 및 트랜잭션 롤백
   - 사유: DB insert와 SSE dispatch 간 데이터 일관성 보장

2. **`test-send`의 `@Transactional` 누락으로 인한 디버깅 오해 소지 제거**
   - 파일: `NotificationDebugController.java` 라인 61
   - 내용: 메서드 레벨 `@Transactional` 추가로 다른 fire 엔드포인트와 동일한 트랜잭션 패턴 유지
   - 사유: debug 엔드포인트 간 일관된 트랜잭션 동작 보장

3. **요청 바디 DTO에 `@NotNull`/`@NotBlank` 검증 어노테이션 추가**
   - 파일: `NotificationDebugController.java` 라인 131-167
   - 내용: T1Body, T2Body, S4Body, S5Body의 모든 필드에 Jakarta Validation 적용
   - 사유: NPE 방지 및 클라이언트에 명확한 오류 메시지 전달

### 권장 (Should Fix)

1. **`NotificationController`에 `@Profile("!local")` 확인/추가**
   - 사유: 로컬 프로파일에서 두 컨트롤러 동시 활성화 시 매핑 충돌 방지

2. **`cleanup-old` 엔드포인트의 `days` 파라미터 검증 추가**
   - 파일: `NotificationDebugController.java` 라인 75-79
   - 내용: `@Min(1)` 또는 `@Positive` 어노테이션 추가로 음수/0 방지

3. **HANDOFF.md에 디버그 컨트롤러 예외 처리 가이드 추가**
   - 파일: `HANDOFF.md` "주요 약속 사항" 섹션
   - 내용: 디버그 엔드포인트에서도 try-catch와 트랜잭션 고려를 명시

### 선택 (Nice to Have)

1. **내부 정적 클래스를 별도 DTO 패키지로 분리**
   - 사유: `NotificationDebugController.java`의 파일 크기 증가 방지, 재사용성 향상

2. **`InMemoryDispatcher`의 `dispatch()` 메서드에 배치 처리 기능 추가 검토**
   - 사유: 향후 대량 알림 발송 시 N+1 문제 방지

3. **HANDOFF.md의 JWT 획득 방법에 SDK 래퍼 사용 문구 추가**
   - 사유: `fe-api-contract.md`와의 정합성 유지 및 보안 취약 패턴 방지

---

## 최종 평가

**종합 점수**: 72/100

**결론**:
- [ ] [OK] 승인 (Approved) — 문제 없음
- [ ] [WARN] 조건부 승인 (Approved with Comments) — 경미한 이슈만 존재
- [x] [FIX] 수정 필요 (Changes Requested) — 중요 이슈 수정 후 재검토
- [ ] [REJECT] 거부 (Rejected) — 치명적 이슈로 인한 병합 불가

**핵심 코멘트:**

이 커밋은 핫픽스의 성격이 강하지만, `test-send` 엔드포인트의 `@Transactional` 누락은 단순한 실수를 넘어 데이터 일관성을 위협하는 Critical 이슈입니다. 디버그 전용 엔드포인트라고 해도, DB 저장과 SSE 전송 간의 트랜잭션 경계 불일치는 향후 "로컬에서는 잘 됐는데 운영에서는 안 됨"이라는 디버깅 악몽의 원인이 됩니다.

문서화 측면에서는 HANDOFF.md의 신규 생성이 탁월합니다. 역할별로 "이것만 읽으세요"를 구분하여 30초 만에 진입할 수 있도록 설계한 점, 문서 트리를 시각화한 점은 높이 평가할 만합니다. 다만 문서가 아무리 좋아도 실제 코드의 트랜잭션 경계가 잘못되면 무용지물이 됩니다.

제안하는 3가지 Must Fix 항목(`@Transactional` 추가, 에러 처리, DTO 검증)을 먼저 수정한 후, 권장 항목(프로파일 확인, 파라미터 검증)을 추가로 적용하기를 권장합니다.

**리뷰어 노트:**
- 검토 시간: 약 15분
- 우선 수정 항목:
  1. `NotificationDebugController.testSend()`에 `@Transactional` 추가 및 `dispatcher.dispatch()` 예외 처리 추가
  2. 요청 바디 DTO(T1Body, T2Body, S4Body, S5Body)에 `@NotNull`/`@NotBlank` 검증 어노테이션 추가
  3. `NotificationController`의 프로파일 설정 확인 (`@Profile("!local")`)