# SP Auth WebClient 유휴 커넥션 eviction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `superPlatformAuthWebClient` 의 커넥션 풀에 idle/lifetime eviction 을 설정해, 게이트웨이가 닫은 유휴 keep-alive 커넥션을 재사용하다 발생하는 `PrematureCloseException`(폴링 사이클 실패)을 없앤다.

**Architecture:** 현재 `HttpClient.create()` 는 eviction 미설정 전역 기본 풀을 쓴다. 전용 named `ConnectionProvider`(maxIdleTime/maxLifeTime/evictInBackground)를 팩토리 메서드로 만들어 Auth WebClient 의 HttpClient 에 주입한다. 호출 코드·시그니처·타임아웃 로직 무변경 — config-only.

**Tech Stack:** Java 21, Spring Boot 4, reactor-netty `HttpClient`/`ConnectionProvider`, JUnit 5 + AssertJ.

## Global Constraints

- 변경 파일은 **`backend/src/main/java/com/vs/meta/common/config/WebClientConfig.java`** + 신규 테스트뿐. `qchIngestWebClient` 및 호출 클라이언트(`RpGroupClient` 등)는 **무변경**.
- 구성 값은 package-private static 상수: `SP_AUTH_MAX_IDLE = Duration.ofSeconds(20)`, `SP_AUTH_MAX_LIFE = Duration.ofMinutes(5)`, `SP_AUTH_EVICT = Duration.ofSeconds(30)`. 팩토리가 이 상수를 사용.
- 프로바이더 이름 `"sp-auth"`, `maxConnections(100)`, `pendingAcquireTimeout(Duration.ofSeconds(10))`.
- 기존 `CONNECT_TIMEOUT_MS`(5000)·`RESPONSE_TIMEOUT`(10s)·baseUrl 설정은 그대로 유지.
- 커밋 메시지 한글 `fix(be): ...`; `Co-Authored-By` 트레일러 금지.
- 테스트: PowerShell `.\gradlew.bat :backend:test --tests "..."`. Bash cwd 리셋되므로 git 은 `git -C C:/workspace/meta-dashboard ...`.

---

## File Structure

- `backend/src/main/java/com/vs/meta/common/config/WebClientConfig.java` — (수정) `ConnectionProvider` import, 3개 duration 상수, `spAuthConnectionProvider()` 팩토리, `superPlatformAuthWebClient` 빈이 `HttpClient.create(spAuthConnectionProvider())` 사용.
- `backend/src/test/java/com/vs/meta/common/config/WebClientConfigTest.java` — (신규) 구성 상수 회귀 방지 + 팩토리 생성 검증.

---

### Task 1: SP Auth WebClient 커넥션 풀 eviction

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/common/config/WebClientConfig.java`
- Test: `backend/src/test/java/com/vs/meta/common/config/WebClientConfigTest.java` (신규)

**Interfaces:**
- Consumes: 기존 상수 `CONNECT_TIMEOUT_MS`, `RESPONSE_TIMEOUT`, `SpAuthProperties.getServerUrl()`.
- Produces: package-private `static final Duration SP_AUTH_MAX_IDLE/SP_AUTH_MAX_LIFE/SP_AUTH_EVICT` 와 `static ConnectionProvider spAuthConnectionProvider()`. 다른 태스크 없음.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `backend/src/test/java/com/vs/meta/common/config/WebClientConfigTest.java`:

```java
package com.vs.meta.common.config;

import org.junit.jupiter.api.Test;
import reactor.netty.resources.ConnectionProvider;

import static org.assertj.core.api.Assertions.assertThat;

class WebClientConfigTest {

    @Test
    void spAuth_풀_구성값_회귀방지() {
        // 유휴 커넥션이 총수명 만료 전에 폐기되도록 maxIdle < maxLife, 그리고 evict/idle 은 양수여야 한다.
        assertThat(WebClientConfig.SP_AUTH_MAX_IDLE).isPositive();
        assertThat(WebClientConfig.SP_AUTH_EVICT).isPositive();
        assertThat(WebClientConfig.SP_AUTH_MAX_IDLE).isLessThan(WebClientConfig.SP_AUTH_MAX_LIFE);
    }

    @Test
    void spAuthConnectionProvider_는_프로바이더를_생성한다() {
        ConnectionProvider provider = WebClientConfig.spAuthConnectionProvider();
        assertThat(provider).isNotNull();
    }
}
```

- [ ] **Step 2: 테스트 실패(컴파일) 확인**

Run (PowerShell): `.\gradlew.bat :backend:test --tests "com.vs.meta.common.config.WebClientConfigTest" --console=plain`
Expected: 컴파일 실패 — `WebClientConfig` 에 `SP_AUTH_MAX_IDLE`/`SP_AUTH_MAX_LIFE`/`SP_AUTH_EVICT` 상수와 `spAuthConnectionProvider()` 메서드가 아직 없음.

- [ ] **Step 3: 구현**

`WebClientConfig.java` 에 import 추가:

```java
import reactor.netty.resources.ConnectionProvider;
```

클래스 안에 상수와 팩토리 추가(기존 `CONNECT_TIMEOUT_MS`/`RESPONSE_TIMEOUT` 상수 아래):

```java
    static final Duration SP_AUTH_MAX_IDLE = Duration.ofSeconds(20);   // 게이트웨이 keep-alive(통상 60s)보다 짧게 → 유휴 커넥션 선제 폐기
    static final Duration SP_AUTH_MAX_LIFE = Duration.ofMinutes(5);    // 총수명 백스톱(게이트웨이 커넥션 로테이션 대비)
    static final Duration SP_AUTH_EVICT    = Duration.ofSeconds(30);   // 신규 acquire 없어도 주기적으로 유휴 회수(저트래픽 필수)

    static ConnectionProvider spAuthConnectionProvider() {
        return ConnectionProvider.builder("sp-auth")
                .maxConnections(100)                       // 내부 Auth 호출 규모에 충분 + 전역 기본풀에서 격리
                .maxIdleTime(SP_AUTH_MAX_IDLE)
                .maxLifeTime(SP_AUTH_MAX_LIFE)
                .evictInBackground(SP_AUTH_EVICT)
                .pendingAcquireTimeout(Duration.ofSeconds(10))
                .build();
    }
```

`superPlatformAuthWebClient` 빈의 HttpClient 생성만 교체(나머지 빌더·baseUrl·timeout 유지):

```java
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

`qchIngestWebClient` 는 건드리지 않는다.

- [ ] **Step 4: 테스트·컴파일 통과 확인**

Run: `.\gradlew.bat :backend:test --tests "com.vs.meta.common.config.WebClientConfigTest" --console=plain`
Expected: 2개 테스트 PASS.

Run: `.\gradlew.bat :backend:compileJava --console=plain`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: 커밋**

```bash
git -C C:/workspace/meta-dashboard add backend/src/main/java/com/vs/meta/common/config/WebClientConfig.java backend/src/test/java/com/vs/meta/common/config/WebClientConfigTest.java
git -C C:/workspace/meta-dashboard commit -m "fix(be): SP Auth WebClient 커넥션 풀 유휴 eviction 추가로 PrematureClose 폴링 실패 방지"
```

---

## Self-Review

**Spec coverage:**
- §3 전용 ConnectionProvider(maxIdle/maxLife/evict/maxConnections/pendingAcquire) + 팩토리 분리 → Task 1 Step 3 ✅
- §3 `superPlatformAuthWebClient` 만 교체, `qchIngestWebClient` 무변경 → Step 3 ✅
- §5 상수 기반 단위 테스트(non-null 프로바이더, 0<maxIdle<maxLife, evict>0) → Step 1 ✅
- §2 config-only·호출코드 무변경 → 파일 2개만 변경 ✅

**Placeholder scan:** 모든 스텝에 실제 코드·명령·기대출력 포함. 플레이스홀더 없음.

**Type consistency:** 상수명 `SP_AUTH_MAX_IDLE`/`SP_AUTH_MAX_LIFE`/`SP_AUTH_EVICT` 와 메서드 `spAuthConnectionProvider()` 가 테스트(Step 1)·구현(Step 3)에서 동일. `Duration` 은 기존 import 존재. `ConnectionProvider` import 신규 추가. AssertJ `DurationAssert.isPositive()`/`isLessThan(Duration)` 사용.

**참고:** config 효과(실제 PrematureClose 소거)는 런타임에서만 드러남 → dev 배포 후 폴링 로그 관찰이 최종 검증(spec §5).
