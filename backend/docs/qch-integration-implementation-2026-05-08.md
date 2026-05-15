# QCH 외부 로그 적재 연동 구현 노트

> **작성일**: 2026-05-08
> **대상**: backend (Spring Boot 2.7.17 / Java 17)
> **참조 가이드**: [doc-1444.md](./doc-1444.md) — QCH(Quality Coverage Hub) API 연동 가이드
> **목적**: 본 backend 의 모든 API 호출을 QCH `/api/v1/ingest/trace` 로 자동 적재. 오류 발생 시 이 문서로 흐름 추적 + 수정 진입점 확보.

---

## 1. 개요

### 1.1 결정 사항 요약

| 항목 | 결정 | 근거 |
|---|---|---|
| **채널** | HTTP `POST /api/v1/ingest/trace` (NATS / app-log 미사용) | doc-1444 §0 트래픽 가이드(분당 수백~수천 건 = HTTP 권장). 본 서비스 규모(학교/학급) 와 부합. NATS 인프라 0(NatsSendService 는 stub) → HTTP 가 인프라 비용 0. |
| **부착 범위** | `com.vs.meta..api..controller` + `com.vs.meta.common.controller` 패키지 전체 | URL 경로가 `/api/v1/`, `/api/`, `/group/`, `/member/`, `/guest/`, `/school/`, `/dev/` 등 8가지로 흩어져 있어 path 화이트리스트 누락 위험 큼 → Java 패키지 기반 AOP 가 정확. 새 도메인 컨트롤러 추가 시 자동 포함. |
| **제외 방식** | (A) `@QchSkip` 마커 어노테이션 + (B) 리턴타입 자동 감지 | (A) NotificationDebugController, NotificationTesterPageController 등 명시 제외. (B) `SseEmitter`/`ResponseBodyEmitter`/`StreamingResponseBody`/`DeferredResult` 자동 skip — 미래 SSE 추가도 자동 안전. |
| **호출 방식** | `@Async` + 별도 ThreadPoolTaskExecutor + best-effort | doc-1444 §2.4 권장 패턴. 본 서비스 응답 스레드와 격리. queue full 시 DiscardPolicy. 모든 예외는 WARN 로그로만. |
| **enabled 기본값** | `false` | QCH 운영팀 등록(serviceKey/baseUrl 발급) 완료 전엔 호출 자체 skip. `QCH_ENABLED=true` 환경변수로 환경별 켬. |

### 1.2 전체 흐름

```
[클라이언트 HTTP 요청]
    │
    ▼
[Servlet Filter Chain]
    ├─ MdcLoggingFilter           — MDC: requestId(8자), clientIp
    ├─ SpUserMappingFilter        — MDC: spUserId, userNo + req attribute
    ├─ QchRequestBodyCachingFilter ★ NEW — JSON & ≤64KB 면 ContentCachingRequestWrapper 로 wrap
    ├─ Spring Security FilterChain
    └─ DispatcherServlet
            │
            ▼
        [AOP @Around 체인 — outer→inner]
        ┌─ QchTraceAspect    @Order(1)   ★ NEW
        │   └─ ApiResponseAspect  @Order(없음=LOWEST)
        │        └─ Controller 메서드
        │             ↑ 실제 비즈니스 로직 (Service / Mapper / DB)
        │        ↓ 메서드 리턴 (ResponseDTO<CustomBody>)
        │   ↓ ApiResponseAspect 가 sTime/eTime/hash 주입
        ↓ QchTraceAspect afterReturning:
            ├─ shouldSkip() 체크 — @QchSkip / 리턴타입
            ├─ buildEvent() — request, response, headers redact, body redact, MDC traceId
            └─ qchTraceClient.sendTrace(event)
                    │  (별도 스레드풀 qch-trace-* 로 분리)
                    ▼
                [WebClient] POST {baseUrl}/api/v1/ingest/trace
                    ├─ 200 OK → DEBUG 로그
                    ├─ 4xx/5xx → WARN 로그 (본 서비스 영향 X)
                    └─ 타임아웃/네트워크 → WARN 로그 (본 서비스 영향 X)
```

---

## 2. 추가/수정된 파일 전체 목록

### 2.1 신규 파일 (7개 .java + 1개 doc)

| 경로 | 역할 | 비고 |
|---|---|---|
| `common/config/QchProperties.java` | `@ConfigurationProperties("qch")` — enabled / baseUrl / serviceKey / env / timeout / async pool | SpAuthProperties 패턴 답습 |
| `common/config/QchAsyncConfig.java` | `qchTraceExecutor` ThreadPoolTaskExecutor + `@EnableAsync` | DiscardPolicy 로 queue full 시 silently drop |
| `common/config/QchRequestBodyCachingFilter.java` | `OncePerRequestFilter` — `ContentCachingRequestWrapper` 로 요청 body 캐싱 | `@Order(HIGHEST_PRECEDENCE+100)`. 64KB 이하 JSON 만 wrap |
| `common/aop/QchSkip.java` | 마커 어노테이션 (METHOD/TYPE) — Aspect 가 보면 적재 skip | `reason()` 옵션 필드 |
| `common/aop/QchTraceAspect.java` | `@Around` Aspect — 전 API 자동 부착, 적재 trigger | `@Order(1)` outer (ApiResponseAspect 보다 먼저 진입, enrich 된 응답 캡처) |
| `common/service/QchTraceClient.java` | best-effort POST + `@Async("qchTraceExecutor")` | 모든 예외 WARN 로그만. 호출자 미전파 |
| `common/service/QchTraceEvent.java` | doc-1444 §2.2 페이로드 DTO + Payload nested DTO | Lombok `@Builder`, `@JsonInclude(NON_NULL)` |
| `docs/qch-integration-implementation-2026-05-08.md` | **본 문서** | |

### 2.2 수정된 파일

| 경로 | 변경 내용 |
|---|---|
| `common/config/WebClientConfig.java` | `qchIngestWebClient` Bean 추가 (connect/response timeout 은 QchProperties 에서) |
| `common/utils/PiiMasker.java` | `redactHeaders(Map / HttpServletRequest)` + `redactSensitiveFields(Object)` 추가 |
| `api/notification/controller/NotificationDebugController.java` | `@QchSkip(reason = "디버그 endpoint…")` 클래스 부착 |
| `api/notification/controller/NotificationTesterPageController.java` | `@QchSkip(reason = "dev 전용 HTML 페이지…")` 클래스 부착 |
| `src/main/resources/application.yml` | `qch.*` 기본값 블록 추가 (`enabled=false`) |
| `src/main/resources/application-local.yml` | local 기본 비활성 (`enabled: false`) |
| `src/main/resources/application-vs-dev.yml` | dev 환경 — `t-qch.vsaidt.com`, `env=DEV` |
| `src/main/resources/application-vs-prod.yml` | prod 환경 — `qch.vsaidt.com`, `env=PROD` |

---

## 3. 환경 설정

### 3.1 application.yml 기본값

```yaml
qch:
  enabled: ${QCH_ENABLED:false}
  base-url: ${QCH_BASE_URL:https://t-qch.vsaidt.com}
  service-key: ${QCH_SERVICE_KEY:meta-api}
  env: ${QCH_ENV:DEV}
  connect-timeout-ms: 3000
  response-timeout-ms: 5000
  async:
    core-pool-size: 2
    max-pool-size: 8
    queue-capacity: 500
    thread-name-prefix: qch-trace-
```

### 3.2 환경변수

| 변수 | 용도 | 권장값 (dev) | 권장값 (prod) |
|---|---|---|---|
| `QCH_ENABLED` | 적재 켬/끔 | `true` (운영팀 발급 후) | `true` |
| `QCH_BASE_URL` | QCH ingest baseUrl | `https://t-qch.vsaidt.com` | `https://qch.vsaidt.com` |
| `QCH_SERVICE_KEY` | 운영팀 발급 serviceKey | `meta-api` | `meta-api` |
| `QCH_ENV` | doc-1444 §2.2 env 필드 | `DEV` | `PROD` |

> **운영팀 등록 전엔 `QCH_ENABLED=false` 유지**. 발급(serviceKey/baseUrl/dev URL) 완료 후에만 켤 것.

### 3.3 환경별 yml 설정 위치

- `application.yml` — 전체 기본값 (enabled=false)
- `application-local.yml` — 로컬 PC (enabled=false 고정 — 검증 시 임시 변경)
- `application-vs-dev.yml` — dev 환경 (`t-qch.vsaidt.com`)
- `application-vs-prod.yml` — prod 환경 (`qch.vsaidt.com`)

---

## 4. 컴포넌트 상세

### 4.1 `QchProperties` (Bean: `@ConfigurationProperties("qch")`)

```java
private boolean enabled = false;
private String baseUrl;
private String serviceKey;
private String env;
private int connectTimeoutMs = 3000;
private int responseTimeoutMs = 5000;
private Async async = new Async();  // corePoolSize=2, maxPoolSize=8, queue=500
```

**주의**: `@Component` + `@ConfigurationProperties` 조합. SpAuthProperties 와 동일 패턴.

### 4.2 `QchAsyncConfig` — `@EnableAsync` + `qchTraceExecutor` Bean

- Bean 이름 상수: `QchAsyncConfig.QCH_TRACE_EXECUTOR = "qchTraceExecutor"`
- RejectedExecutionHandler: `ThreadPoolExecutor.DiscardPolicy` — queue full 시 silently drop
- 스레드 이름: `qch-trace-1`, `qch-trace-2`, ...
- `@EnableAsync` 는 본 프로젝트에 다른 곳 없음(이 클래스가 처음). 따라서 다른 `@Async` 기능에도 영향 미침.

> **충돌 가능성**: 이미 다른 곳에서 `@EnableAsync` 가 추가된다면 중복 활성화는 무해하지만, default executor 가 변경될 수 있음. 그래서 `QchTraceClient` 는 반드시 `@Async("qchTraceExecutor")` 처럼 이름 명시.

### 4.3 `WebClientConfig.qchIngestWebClient` Bean

- baseUrl: `QchProperties.baseUrl` (비어있으면 baseUrl 미설정 → 호출 시 절대 URL 필요)
- connect timeout: 3s
- response timeout: 5s

### 4.4 `QchRequestBodyCachingFilter` — body 캐싱

**wrap 조건 (모두 만족해야 wrap):**
1. `qch.enabled = true`
2. method ∈ {POST, PUT, PATCH}
3. content-type 이 `json` 포함 (대소문자 무관, multipart 는 명시 제외)
4. content-length ≤ 64KB (`MAX_CACHE_BYTES`)

**wrap 안 됨 → cached body 없음 → `payload.requestBody = {}`**

**메모리 보호**: 64KB 초과 / multipart / GET·DELETE / non-JSON 은 wrap 자체 skip — `ContentCachingRequestWrapper` 가 byte[] 를 메모리에 들고 있으므로 큰 페이로드 wrap 은 위험.

### 4.5 `QchTraceAspect` — 핵심 부착 로직

**Pointcut**:
```java
execution(* com.vs.meta..api..controller..*.*(..))
|| execution(* com.vs.meta.common.controller..*.*(..))
```
ApiResponseAspect 와 동일. 새 도메인 컨트롤러가 `com.vs.meta.api.<도메인>.controller` 에 추가되면 자동 포함.

**부착 순서**: `@Order(1)` — `ApiResponseAspect`(미지정 = LOWEST_PRECEDENCE) 보다 outer 에서 동작. 따라서 `ApiResponseAspect.enrichResponse()` 가 sTime/eTime/hash 채운 **최종** ResponseDTO 를 그대로 캡처.

**제외 규칙**:

```java
private boolean shouldSkip(Method method) {
    if (method.isAnnotationPresent(QchSkip.class)) return true;
    if (method.getDeclaringClass().isAnnotationPresent(QchSkip.class)) return true;
    Class<?> returnType = method.getReturnType();
    return SseEmitter.class.isAssignableFrom(returnType)
        || ResponseBodyEmitter.class.isAssignableFrom(returnType)
        || StreamingResponseBody.class.isAssignableFrom(returnType)
        || DeferredResult.class.isAssignableFrom(returnType);
}
```

**예외 안전성**: try/catch 로 controller 호출 분리. `proceed()` 결과(또는 throw) 와 무관하게 `finally` 에서 적재 시도. 적재 build 자체에서 예외나도 WARN 만 찍고 컨트롤러 응답에는 영향 없음.

**캡처되는 메타**:
- `serviceKey`, `env`, `appName=meta-api`, `createdAt`(ISO-8601)
- `method` (GET/POST/...)
- `endpoint` (request URI)
- `statusCode` (ResponseDTO.CustomBody.resultCode 우선, 없으면 HttpServletResponse.status, 예외면 500)
- `responseTimeMs` (System.currentTimeMillis 차이)
- `testcoverage = "Y"` (doc-1444 §2.2 — coverage 토픽도 처리)
- `traceId = MDC.get("requestId")` (MdcLoggingFilter 가 박은 8자 UUID)
- `userId = SecurityUtil.getCurrentUserNo()` (없으면 null)
- `userType = SecurityUtil.getCurrentSpUser().userType()` (없으면 null)
- `payload.queryParams` — request.getParameterMap() 평탄화
- `payload.requestHeaders` — request 의 모든 헤더, PiiMasker 로 redact
- `payload.requestBody` — ContentCachingRequestWrapper 의 cached bytes → JSON 파싱 → PiiMasker.redactSensitiveFields, 파싱 실패 시 raw 문자열, 빈 경우 `{}`
- `payload.responseBody` — controller 리턴 객체 (Jackson 이 직렬화)

### 4.6 `QchTraceClient` — best-effort 발송

```java
@Async(QchAsyncConfig.QCH_TRACE_EXECUTOR)
public void sendTrace(QchTraceEvent event) {
    if (!qch.isEnabled()) return;
    if (event == null) return;
    try {
        qchIngestWebClient.post()
            .uri("/api/v1/ingest/trace")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(event)
            .retrieve()
            .toBodilessEntity()
            .block();
    } catch (WebClientResponseException ex) {
        log.warn("[QCH] trace failed (HTTP {} - {}): ...", ...);
    } catch (Exception ex) {
        log.warn("[QCH] trace failed: ...");
    }
}
```

**중요**:
- `@Async` + Bean 이름 명시 — 별도 스레드풀
- `block()` 호출하지만 별도 스레드라 본 서비스 응답 스레드 차단 X
- 모든 예외 catch — 호출자(Aspect → Controller) 에 미전파

### 4.7 `PiiMasker` — redact 로직

**헤더 redact 대상** (소문자 비교):
```
authorization, proxy-authorization, cookie, set-cookie, x-api-key, x-auth-token
```

**body 필드 redact 대상** (소문자 + `_`/`-` 제거 후 비교):
```
password, passwd, pwd
accesstoken, refreshtoken, idtoken, sessiontoken
secret, clientsecret, apikey
ssn, rrn, residentregistrationnumber
cardnumber, cardno, cvv, cvc
```

→ `accessToken`, `access_token`, `ACCESSTOKEN`, `access-token` 모두 동일하게 매칭됨.

마스킹 값: `***redacted***`

---

## 5. 운영 적용 절차

> **현재 상태**: `enabled=false` 라 호출 발생 안 함. 아래 절차 거쳐야 적재 시작.

1. **doc-1444 §1.1 양식으로 QCH 운영팀에 등록 신청**
   - 부서/팀, 서비스명: 학심정 (Meta API)
   - serviceKey: `meta-api`
   - env: `DEV` / `PROD`
   - baseUrl: dev `https://t-meta-api.vsaidt.com` / prod 운영 URL (운영팀이 트래픽 검증용)
   - auth_type: `JWT` (test 실행 필요 시) — JWKs 정보 같이 제출
   - 연동 채널: HTTP

2. **dev 등록 완료 통보 받음** → `application-vs-dev.yml` 의 `QCH_ENABLED=true` 환경변수로 켬 (재배포)

3. **doc-1444 §7 자기검증**:
   - 임의 API 1건 호출 → 본 서비스 200 OK 응답 정상
   - QCH `/admin/dev-tools` "최근 적재 trace" 카드에서 본인 trace 1건 보임 (1~3초 내)
   - QCH `/monitoring/dashboard` 에서 service 별 KPI 카운트 +1
   - QCH `/tests/analysis/result` 에서 본 endpoint 가 시그니처에 등록

4. **prod 발급 후 동일 패턴**으로 prod 배포

---

## 6. 동작 검증 (로컬)

QCH 운영팀 등록 전이라도 로컬에서 적재 흐름 자체는 검증 가능.

### 6.1 Mock 서버 띄워 검증

```bash
# 가짜 ingest 서버 띄우기 (호스트 8888)
docker run --rm -p 8888:80 mendhak/http-https-echo:latest
```

`application-local.yml` 임시 수정:
```yaml
qch:
  enabled: true
  base-url: http://localhost:8888
  service-key: meta-api
  env: LOCAL
```

→ backend 재기동 후 임의 API 호출. 로그에서 `[QCH] trace sent: ...` (DEBUG) 또는 mock 서버 stdout 에서 페이로드 확인.

### 6.2 Aspect 단독 검증 (enabled=true 필요)

DEBUG 로그 활성화:
```yaml
logging:
  level:
    com.vs.meta.common.aop.QchTraceAspect: DEBUG
    com.vs.meta.common.service.QchTraceClient: DEBUG
```

API 호출 후 `[QCH] trace sent: GET /api/v1/... 200` 로그 확인.

---

## 7. 트러블슈팅

### 7.1 적재 자체가 안 일어남

**증상**: API 호출해도 `[QCH] trace ...` 로그 안 보이고 QCH 화면에도 안 뜸.

**체크리스트** (위에서 아래로):

| # | 체크 | 확인 방법 |
|---|---|---|
| 1 | `qch.enabled=true` 인가 | `/actuator/configprops` (dev profile) 또는 yml 확인 |
| 2 | 컨트롤러가 패키지 포인트컷에 잡히는가 | declaring class 가 `com.vs.meta..api..controller..` 또는 `com.vs.meta.common.controller..` 인지 |
| 3 | `@QchSkip` 부착되지 않았나 | 클래스/메서드에 어노테이션 있나 |
| 4 | 리턴타입이 emitter 류 아닌가 | `SseEmitter` / `ResponseBodyEmitter` / `StreamingResponseBody` / `DeferredResult` |
| 5 | Aspect 가 Bean 으로 등록됐나 | startup 로그에 `[QCH] trace executor initialized: ...` 보이는지 |
| 6 | `qchTraceExecutor` 풀이 살아있나 | jstack / VisualVM 으로 `qch-trace-*` 스레드 존재 확인 |

### 7.2 적재는 시도되는데 4xx/5xx 응답

**증상**: WARN 로그 `[QCH] trace failed (HTTP 401 - Unauthorized): ...`

| 코드 | 원인 | 조치 |
|---|---|---|
| 400 | 페이로드 스키마 위반 | doc-1444 §2.2 4개 키 (queryParams/requestHeaders/requestBody/responseBody) 모두 채워졌는지. responseBody 가 너무 큰지 (256KB 한도) |
| 401 | 운영팀에서 인증 토큰 정책 변경했을 수 있음 | doc-1444 §1.2 — HTTP ingest 는 별도 토큰 불필요한 게 default. 변경됐다면 헤더 추가 필요 |
| 404 | baseUrl 오타 또는 endpoint 경로 변경 | `qch.base-url` 값 확인 |
| 5xx | QCH 서버 일시 장애 | 본 서비스 영향 X. QCH 운영팀에 §7 자기검증 결과 + 페이로드 sample 첨부해 문의 |

### 7.3 timeout / 네트워크 에러

**증상**: WARN 로그 `[QCH] trace failed: io.netty.handler.timeout.ReadTimeoutException` 등.

- `qch.connect-timeout-ms` / `qch.response-timeout-ms` 짧을 수 있음 — 일시적이면 무시. 빈도 높으면 늘리기 (단 본 서비스 영향 차단 위해 너무 길게 잡지 말 것 — async 풀 queue 가 쌓임).
- 컨테이너에서 `qch.vsaidt.com` 호스트 해석 안 되면 DNS 확인 (CoreDNS, hosts 파일 등).
- 5xx 가 빈번하면 운영팀 공지 확인.

### 7.4 본 서비스 응답이 느려졌다

**증상**: QCH 켠 직후 본 서비스 응답 시간 증가.

이론상 `@Async` + 별도 풀이라 영향 없어야 함. 영향이 있다면:

1. **풀 사이즈 부족** — queue 가 가득 차면 DiscardPolicy 로 drop 만 됨 (응답 시간 영향 X). 다만 main 스레드에서 ContentCachingRequestWrapper bytes 를 읽고 JSON 파싱하는 시점에 약간의 CPU 비용 — 큰 페이로드라면 여기서 시간 소요. → `MAX_CACHE_BYTES` 낮추거나 큰 endpoint 에 `@QchSkip` 부착.
2. **block() 이 main 스레드에서 호출됨** — `@Async` 가 invoke 되지 않은 경우. 원인:
   - `QchTraceClient.sendTrace` 가 같은 클래스 내부에서 `this.sendTrace()` 호출됐는가? (Spring AOP 우회 — Aspect 와 같이 동작 안 함). **반드시 다른 Bean 에서 호출해야 함**. 현재 `QchTraceAspect` → `QchTraceClient` 는 다른 Bean 이므로 OK.
   - `@EnableAsync` Bean(`QchAsyncConfig`) 이 component scan 범위에 있는가? 현재 `com.vs.meta.common.config` — 메인 클래스가 `com.vs.meta` 이상이면 OK.
3. **WebClient 가 default elastic 풀 사용** — connect timeout 짧아도 elastic 풀이 부족하면 대기. 본 backend 트래픽 규모에서 이슈 없을 것이지만 의심되면 `qchIngestWebClient` 에 connection provider 명시.

### 7.5 requestBody 가 항상 `{}`

**증상**: 적재된 trace 의 `payload.requestBody` 가 비어 있음.

| 가능 원인 | 확인 |
|---|---|
| 요청이 GET/DELETE/HEAD | RFC 상 body 없음 — 정상 |
| Content-Type 이 JSON 아님 | `application/x-www-form-urlencoded` 면 `queryParams` 에 들어가 있음. multipart 면 의도적 skip |
| Content-Length > 64KB | wrap 자체 skip — `MAX_CACHE_BYTES` 임계값 변경 필요하면 `QchRequestBodyCachingFilter.MAX_CACHE_BYTES` 조정 (메모리 부담 고려) |
| `ContentCachingRequestWrapper` 가 적용 안 됨 | Filter 가 controller 보다 먼저 동작하는지. `@Order(HIGHEST_PRECEDENCE+100)` 인데 더 일찍 동작하는 Security Filter 가 body 를 한 번 읽어버려 stream 소진 가능성? — Spring Boot OAuth2 resource server 는 일반적으로 body 안 건드림. 의심되면 `QchRequestBodyCachingFilter` 의 `@Order` 더 낮춰서 (예: `HIGHEST_PRECEDENCE+50`) 시도 |

### 7.6 컴파일 / 기동 실패

| 증상 | 원인 후보 |
|---|---|
| `NoSuchBeanDefinitionException: QchProperties` | `@Component` 가 `@ConfigurationProperties` 에 빠짐. SpAuthProperties 도 동일 패턴이므로 비교 |
| `BeanCreationException: qchTraceExecutor` | `QchProperties.async` 가 null. 기본 `new Async()` 초기화 누락 확인 |
| `Bean 'qchIngestWebClient' is not autowired` | `WebClientConfig` 에 메서드 누락 또는 `@Bean` 누락 |
| Aspect 가 동작 안 함 | `spring.aop.auto: true` 인지 확인 (application.yml 에 있음). Aspect 클래스에 `@Aspect` + `@Component` 둘 다 있는지 |
| `@EnableAsync` 중복 경고 | 다른 곳에도 `@EnableAsync` 추가됐는지. 무해하지만 깔끔하게 한 곳에만 두는 게 권장 |

---

## 8. 향후 개선 아이템 (현재 미구현, TODO)

### 8.1 `testAllowed` 플래그 (doc-1444 §8)

현재 모든 trace 가 `testAllowed` 미설정 = 서버 default true. 결제/송금/외부 효과/멱등성 없는 POST endpoint 가 추가될 경우 위험.

**개선안**:
```java
@Target({METHOD, TYPE})
@Retention(RUNTIME)
public @interface QchTestAllowed {
    boolean value() default true;
}
```
Aspect 에서 어노테이션 읽어 `event.testAllowed` 채우기. 현재 본 backend 에 위험 endpoint 없어 미구현.

### 8.2 responseBody 크기 제한

doc-1444 §9 jsonb 256KB 한도. 현재 controller 리턴 객체를 그대로 직렬화. 큰 응답(예: 학생 목록 1000명 한 번에 반환) 시 적재 실패 가능.

**개선안**: Aspect 에서 직렬화 후 size 체크, 초과 시 truncate 또는 sentinel 값(`{"_truncated": true, "_originalSize": 12345}`).

### 8.3 multipart 요청 메타데이터

현재 multipart 는 body wrap skip. 파일 업로드 endpoint 의 trace 가 빈 requestBody 로 적재됨. 메타(파일명, 크기, content-type) 만 따로 캡처하면 도움 됨.

**개선안**: Aspect 에서 `joinPoint.getArgs()` 검사해 `MultipartFile` 인 경우 메타만 추출.

### 8.4 archive 조회 가이드 (doc-1444 §9 FAQ)

14일 이전 데이터는 운영팀에 archive 조회 요청. 실제 운영 들어간 후 빈도 높으면 별도 공유.

### 8.5 NATS 채널 이전

본 서비스가 분당 만건 이상으로 트래픽 폭증하면 doc-1444 §3 NATS publish 로 이전 검토. 현재는 HTTP 가 적합.

---

## 9. 변경 이력

| 일자 | 변경 |
|---|---|
| 2026-05-08 | 초기 구현 — HTTP `/api/v1/ingest/trace` 채널 선택, 패키지 기반 AOP, @QchSkip + 리턴타입 자동 skip, ContentCachingRequestWrapper 기반 requestBody 캡처, PiiMasker 헤더/body redact 확장. enabled=false 기본. |

---

## 10. 관련 문서

- [doc-1444.md](./doc-1444.md) — QCH API 연동 가이드 (외부 audience)
- 운영팀 문의: Teams `#qch-support` (doc-1444 §11)
