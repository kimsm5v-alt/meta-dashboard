# 코드 리뷰 - b284a2bd

## 코드 복잡도 분석

**분석된 파일**: 2개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`webclientconfig.java`** (config)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.006

- 청크 수: 3개


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`webclientconfigtest.java`** (config)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.006

- 청크 수: 3개


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


---


## 변경 배경

이 커밋은 `superPlatformAuthWebClient`가 사용하는 reactor-netty HTTP 커넥션 풀에 idle/lifetime eviction을 설정하여, 게이트웨이(Kong 등)가 먼저 닫은 유휴 keep-alive 커넥션을 재사용하다 발생하는 `PrematureCloseException`(폴링 사이클 실패)을 방지합니다.

- **목적**: `GroupSyncScheduler`의 주기적 폴링(~1분)에서 발생하는 `PrematureCloseException` 로그 노이즈 제거 및 최대 ~1분 반영 지연 해소
- **도메인**: 인프라/네트워크 레벨 (WebClient 커넥션 풀 설정, config-only)
- **변경 방향**: 전역 기본 커넥션 풀(eviction 미설정)에서 전용 named 풀(eviction 설정)로 격리. 호출 코드, 시그니처, 타임아웃 로직은 무변경

---

## [GOOD] 잘된 점

1. **blast radius 최소화**: `superPlatformAuthWebClient`만 전용 `ConnectionProvider`로 교체하고, `qchIngestWebClient`는 건드리지 않았습니다. 설계 문서의 "config-only, 최소 diff" 원칙을 충실히 지켰습니다.

2. **팩토리 메서드 분리**: `spAuthConnectionProvider()`를 package-private static 메서드로 분리하여, 테스트에서 프로바이더 생성 로직을 직접 검증할 수 있게 했습니다. 이는 재사용성과 테스트 용이성을 동시에 확보한 좋은 구조입니다.

3. **회귀 방지 테스트**: 단순히 "프로바이더가 null이 아님"을 검증하는 것을 넘어, `SP_AUTH_MAX_IDLE`이 양수이고 `SP_AUTH_MAX_LIFE`보다 작은지, `SP_AUTH_EVICT`이 양수인지를 검증합니다. 이는 누군가가 실수로 idle 시간을 maxLife보다 길게 설정하거나 evict를 0으로 설정하는 회귀를 조기에 잡아냅니다.

4. **값 설정 근거의 명확성**: 주석에 "게이트웨이 keep-alive(통상 60s)보다 짧게", "저트래픽 필수" 등 값 선택의 근거가 명시되어 있어, 유지보수자가 나중에 값을 변경할 때 의도를 이해할 수 있습니다.

---

## 변경사항 요약

- `WebClientConfig.java`: `ConnectionProvider` import 추가, 3개 duration 상수(`SP_AUTH_MAX_IDLE`/`SP_AUTH_MAX_LIFE`/`SP_AUTH_EVICT`)와 `spAuthConnectionProvider()` 팩토리 메서드 추가, `superPlatformAuthWebClient` 빈이 `HttpClient.create(spAuthConnectionProvider())` 사용하도록 변경
- `WebClientConfigTest.java`: 신규 테스트 파일 (2개 테스트 메서드)
- 설계 문서(`design.md`) 및 구현 계획(`plan.md`): 신규 문서

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

**1. 설계 문서와 구현 코드 간 `maxConnections` 값 불일치**

설계 문서(`design.md`)에는 `maxConnections(100)`으로 명시되어 있으나, 실제 구현 코드는 `maxConnections(500)`을 사용하고 있습니다. 구현 코드의 주석("기존 전역 기본풀 상한(용량 회귀 방지)")으로 보아 의도된 차이로 판단되며, 500이 더 보수적인 선택이므로 기능상 문제는 없습니다. 다만 설계 문서가 구현과 다른 상태로 남아있으면 추후 유지보수 시 혼란을 줄 수 있습니다.

- **위치**: `docs/superpowers/plans/2026-07-02-sp-auth-webclient-idle-eviction.md` (설계 문서)
- **기존 코드** (설계 문서):
```
.maxConnections(100)                       // 내부 Auth 호출 규모에 충분 + 전역풀에서 격리
```
- **해결 방안**: 설계 문서의 `maxConnections` 값을 `500`으로 업데이트하거나, 구현 코드의 주석과 동일한 근거("기존 전역 기본풀 상한 유지")를 설계 문서에도 추가하세요.

**2. `pendingAcquireTimeout` 명시적 설정 vs 기본값 의존**

구현 코드는 `pendingAcquireTimeout`을 생략하여 reactor-netty 기본값(45초)에 의존하고 있습니다. 주석에 "기존과 동일"이라고 명시되어 있어 의도는 명확하지만, 향후 reactor-netty 버전 업그레이드 시 기본값이 변경될 경우 예상치 못한 동작 변화가 발생할 수 있습니다.

- **위치**: `WebClientConfig.java` 라인 37-38
- **기존 코드**:
```java
                // pendingAcquireTimeout: reactor-netty 기본값(45s) 그대로 유지 — 기존과 동일
                .build();
```
- **해결 방안**: 명시적으로 `.pendingAcquireTimeout(Duration.ofSeconds(45))`를 추가하여 버전 변경에 따른 기본값 변화로부터 격리하는 것을 고려하세요. 단, 이는 선택적 개선 사항이며 현재 동작에 문제는 없습니다.

---

## 주요 파일 분석

### WebClientConfig.java

**변경 내용**: 전용 `ConnectionProvider` 팩토리 메서드 추가 및 `superPlatformAuthWebClient` 빈의 HttpClient 생성 방식 변경

**개선 제안**: 위 Medium 항목에서 언급한 `pendingAcquireTimeout` 명시화 외에는 추가 개선 사항이 없습니다. 현재 구현은 설계 의도를 충실히 반영하고 있습니다.

### WebClientConfigTest.java

**변경 내용**: 신규 테스트 파일 (2개 테스트 메서드)

**개선 제안**: 
- `spAuthConnectionProvider_는_프로바이더를_생성한다` 테스트가 `assertThat(provider).isNotNull()`만 검증하고 있습니다. 프로바이더의 이름(`"sp-auth"`)이나 `maxConnections` 값(500)을 검증하는 단언을 추가하면 더 견고한 회귀 방지 테스트가 됩니다. 단, `ConnectionProvider`가 빌더 값을 getter로 노출하지 않아 이름 검증만 가능할 수 있습니다.

---

## 최종 평가

**결론**:
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견**: 이 커밋은 명확한 근거(게이트웨이 keep-alive 타임아웃과 폴링 주기의 레이스 조건)에 기반하여, 최소한의 변경으로 문제를 해결하는 잘 설계된 config-only 변경입니다. 전용 `ConnectionProvider`로의 격리, 팩토리 메서드 분리, 회귀 방지 테스트 등 실무에서 모범적으로 볼 수 있는 요소들을 갖추고 있습니다. 설계 문서와 구현 간의 `maxConnections` 값 불일치(100 vs 500)는 문서 업데이트로 정리하면 좋겠지만, 기능적 결함은 아닙니다. 승인합니다.