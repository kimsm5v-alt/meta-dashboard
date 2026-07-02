# SP Auth WebClient 유휴 커넥션 eviction 설계

> **작성일**: 2026-07-02
> **대상**: backend — `com.vs.meta.common.config.WebClientConfig` (`superPlatformAuthWebClient`)
> **제약**: 운영 오픈 임박 → 최소 diff, 사이드이펙트 회피, config-only
> **무관**: 그룹 sync DB 트랜잭션 격리(Fix 1/2)와 별개 이슈

---

## 1. 배경 / 근본 원인

운영 로그에서 반복 발생:
```
[GroupSyncScheduler] 폴링 사이클 실패: Connection prematurely closed BEFORE response
reactor.netty.http.client.PrematureCloseException
  → GET https://auth-api.vschool.at/api/v1/rp/groups/changes  (RpGroupClient.changes .block())
```

`WebClientConfig.java:26` 의 `superPlatformAuthWebClient` 는 `HttpClient.create()` 로 생성되어 **reactor-netty 전역 기본 커넥션 풀**을 쓴다. 이 풀은 `maxIdleTime`/`maxLifeTime`/`evictInBackground` 가 **미설정**(사실상 무제한 유휴 보관)이다.

레이스:
1. `GroupSyncScheduler` 가 주기적으로(~1분) Auth RP API 폴링 → 폴 사이 커넥션이 풀에서 유휴 방치.
2. `auth-api.vschool.at` 앞단 게이트웨이(Kong/콩) 또는 Auth 서버가 자기 keep-alive idle 타임아웃(통상 60초)에 유휴 커넥션을 닫음.
3. 다음 폴에서 reactor-netty 가 **서버가 이미 닫은 pooled 커넥션**을 꺼내 요청 → 응답 전 FIN 수신 → `PrematureCloseException`.

저트래픽 시간대(예: 05:13)에 유휴 구간이 길어 더 잘 재현된다.

### 영향 (기능 사고 아님)
- 폴링 사이클 1회 스킵 + ERROR 로그. `callWithTokenRetry` 는 401 만 재시도하므로 커넥션 리셋은 사이클 내 재시도되지 않음.
- 실패 시 **커서(since) 미전진** → 다음 사이클(~1분 후)이 동일 지점부터 재폴링 → **데이터 유실 없음**, 자연 회복. 사용자 화면은 on-demand sync 가 백업.
- 결론: 로그 노이즈 + 최대 ~1분 반영 지연. 기능 유실은 없으나 오픈 전 다듬을 가치 있음.

---

## 2. 결정 사항

| 항목 | 결정 | 근거 |
|---|---|---|
| 접근 | **커넥션 풀 idle eviction (config-only)** | 근본 원인이 풀 설정 미비. 호출 코드 무변경 → blast radius 최소 |
| 대상 | **`superPlatformAuthWebClient` 만** | 실제 문제 경로. qch 는 best-effort + 기본 비활성이라 실익 없음 |
| 멱등 GET 재시도 | **범위 밖(오픈 후)** | eviction 만으로 폴링 레이스 대부분 소멸. 잔여는 폴링 자연 회복 |
| 풀 격리 | 전역 기본풀 → **전용 named 풀** | 다른 `HttpClient.create()` 와 커넥션 간섭 제거 |

---

## 3. 컴포넌트 설계

`WebClientConfig` 에 전용 `ConnectionProvider` 를 구성해 `superPlatformAuthWebClient` 의 `HttpClient` 에 주입한다. 재사용·테스트를 위해 프로바이더 생성을 **package-private static 팩토리 메서드**로 분리한다.

```java
// WebClientConfig 내부 (package-private 상수 + 팩토리)
static final Duration SP_AUTH_MAX_IDLE = Duration.ofSeconds(20);   // 게이트웨이 keep-alive(통상 60s)보다 짧게
static final Duration SP_AUTH_MAX_LIFE = Duration.ofMinutes(5);    // 총수명 백스톱
static final Duration SP_AUTH_EVICT    = Duration.ofSeconds(30);   // 백그라운드 유휴 회수 주기

static ConnectionProvider spAuthConnectionProvider() {
    return ConnectionProvider.builder("sp-auth")
            .maxConnections(100)                        // 내부 Auth 호출 규모에 충분 + 전역풀에서 격리
            .maxIdleTime(SP_AUTH_MAX_IDLE)              // 유휴 커넥션 선제 폐기 → stale 재사용 레이스 소멸
            .maxLifeTime(SP_AUTH_MAX_LIFE)             // 게이트웨이 커넥션 로테이션 대비
            .evictInBackground(SP_AUTH_EVICT)          // 신규 acquire 없어도 주기적 회수(저트래픽 필수)
            .pendingAcquireTimeout(Duration.ofSeconds(10))
            .build();
}

@Bean
public WebClient superPlatformAuthWebClient(SpAuthProperties spAuth) {
    HttpClient httpClient = HttpClient.create(spAuthConnectionProvider())
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MS)
            .responseTimeout(RESPONSE_TIMEOUT);
    return WebClient.builder()
            .baseUrl(spAuth.getServerUrl())
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
}
```

`qchIngestWebClient` 는 무변경.

### 값 근거
- **maxIdleTime 20s**: 폴링 주기 ~60s 면 커넥션이 폴 사이 ~60s 유휴 → 20s 에 폐기 → 다음 폴은 항상 새 커넥션 → stale 재사용 레이스 소멸. 토큰/refresh 버스트(유휴<20s)엔 재사용 유지.
- **evictInBackground 30s**: idle eviction 은 기본적으로 "다음 acquire 시"에만 발생 → 저트래픽 구간에 리퍼 없으면 무의미하므로 주기 리퍼 필수.
- **maxLifeTime 5min**: 계속 재사용되는 커넥션의 총수명 상한.
- **maxConnections 100**: 내부 Auth 호출(토큰/refresh/폴링/on-demand) 규모에 충분. 전역 기본풀(500 공유)에서 분리해 간섭 제거.

---

## 4. 사이드이펙트 분석
- 공유 WebClient 4개 소비처(`AuthProxyController` 토큰/refresh, `SpServiceTokenProvider`, `SpEventFeedClient`, `RpGroupClient`)에 **동일하게 이롭게** 작용. eviction 은 유휴 커넥션만 정리하고 진행 중 요청엔 무영향.
- 호출 경로·재시도·타임아웃 로직 불변 → 정상 동작·응답 완전 동일.
- 전역 기본풀 → 전용 named 풀 격리: 다른 `HttpClient.create()`(qch 등)와 커넥션 공유가 사라짐 → 상호 간섭 감소(개선). maxConnections 100 은 내부 규모에 여유.
- 잔여 한계: 게이트웨이 idle 타임아웃이 20s 보다도 짧으면 이 접근으로 못 잡음 → 폴링 자연 회복 + 후속 retry(범위 밖).

---

## 5. 테스트
reactor-netty `ConnectionProvider` 는 빌더 값 getter 노출이 제한적이라, 구성 값을 **package-private static 상수**로 빼서 팩토리가 참조하고 테스트가 그 상수를 검증한다.

- 상수: `SP_AUTH_MAX_IDLE = Duration.ofSeconds(20)`, `SP_AUTH_MAX_LIFE = Duration.ofMinutes(5)`, `SP_AUTH_EVICT = Duration.ofSeconds(30)` (팩토리가 이 상수 사용).
- **단위** (`WebClientConfigTest`, DB·네트워크 불필요):
  1. `spAuthConnectionProvider()` 가 예외 없이 non-null `ConnectionProvider` 반환.
  2. 값 회귀 방지: `SP_AUTH_MAX_IDLE` 이 양수이고 `SP_AUTH_MAX_LIFE` 보다 작다(`0 < maxIdle < maxLife`), `SP_AUTH_EVICT` 이 양수. → 누군가 maxIdle 을 과도하게 키우거나 evict 를 0/제거하면 실패.
- **실환경(dev)**: 배포 후 수십 분간 폴링 로그 관찰 → `PrematureCloseException`/`폴링 사이클 실패` 소거 확인. 이것이 실질 검증(config 효과는 런타임에서만 드러남).
- **실환경(dev)**: 배포 후 수십 분간 폴링 로그 관찰 → `PrematureCloseException`/`폴링 사이클 실패` 소거 확인. 이것이 실질 검증(config 효과는 런타임에서만 드러남).

---

## 6. 범위 밖 (오픈 후 별건)
- 멱등 GET(RP/이벤트피드 폴링)에 PrematureClose/커넥션리셋 한정 bounded 재시도 — 잔여 레이스 self-heal.
- `qchIngestWebClient` 동일 eviction — QCH 활성화 시.
