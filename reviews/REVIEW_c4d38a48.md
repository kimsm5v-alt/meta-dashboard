> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - c4d38a48

## 코드 복잡도 분석

**분석된 파일**: 10개 / 변경된 파일: 13개


### 정상 범위 (NONE)


**`counselingservice.java`** (other)

- 평균 복잡도: **0.226**

- 최대 복잡도: 0.470

- 청크 수: 27개

- 평균 사용처: 20.6곳


**권장사항:**

- 파일 크기가 큼 (27개 청크) - 파일 분리 검토


**`securityconfig.java`** (config)

- 평균 복잡도: **0.215**

- 최대 복잡도: 0.464

- 청크 수: 13개

- 평균 사용처: 24.2곳


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`dgnssservice.java`** (other)

- 평균 복잡도: **0.129**

- 최대 복잡도: 0.473

- 청크 수: 59개

- 평균 사용처: 14.9곳


**권장사항:**

- 파일 크기가 큼 (59개 청크) - 파일 분리 검토


**`aiconversationservice.java`** (other)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.009

- 청크 수: 15개


**권장사항:**

- 복잡도 정상 범위


**`qchtraceaspect.java`** (other)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.009

- 청크 수: 5개


**권장사항:**

- 복잡도 정상 범위


**`ncpmailsender.java`** (utility)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.007

- 청크 수: 7개


**권장사항:**

- 복잡도 정상 범위


**`dgnsslpaservice.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.007

- 청크 수: 20개


**권장사항:**

- 복잡도 정상 범위


**`redispubsubdispatcher.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.005

- 청크 수: 2개


**권장사항:**

- 복잡도 정상 범위


**`redispubsubsubscriber.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.005

- 청크 수: 2개


**권장사항:**

- 복잡도 정상 범위


**`notificationredisconfig.java`** (config)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.004

- 청크 수: 3개


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


---


## 변경 배경

이 커밋은 Spring Boot 4.0.5 업그레이드 과정에서 Task 1(사전 조사) 단계에서 누락되었던 두 가지 항목을 후속 조치합니다. 첫째, Boot 4가 기본 Jackson 라이브러리를 `com.fasterxml.jackson` (2.x)에서 `tools.jackson` (3.x)으로 전환하면서 `ObjectMapper` 빈이 생성되지 않는 문제가 발생했습니다. 둘째, Neo4j Java Driver 5.28.5를 핀고정한 상태에서 Boot 4 BOM이 `neo4j-bolt-connection`을 10.1.1로 강제 관리하여, driver 5.x가 호출하는 `BootstrapFactory` 클래스가 bolt-connection 10.1.1에서 제거(impl 하위로 재배치)되면서 `NoClassDefFoundError`가 발생했습니다.

- **목적**: Spring Boot 4.0.5 마이그레이션에서 Jackson 좌표 변경 및 Neo4j Driver ABI 불일치 해결
- **도메인**: 인프라/라이브러리 업그레이드 (API 레이어 import 문 및 예외 처리 변경 포함)
- **변경 방향**: `com.fasterxml.jackson.*` → `tools.jackson.*` 패키지 마이그레이션, Neo4j Driver 핀고정 제거 후 BOM 위임, Jackson 3 API 변경사항 반영

---

## [GOOD] 잘된 점

**문서화와 회고 기록이 우수합니다.** `docs/superpowers/plans/2026-05-21-spring-boot-4-upgrade.md`에 Task 11/12를 추가하고, 사전 조사 누락 원인과 교훈을 상세히 기록했습니다. 특히 "기본 JSON/HTTP/Logging starter의 좌표(groupId/artifactId) 변경 여부"와 "Boot BOM이 transitive 의존성을 강제 관리하는 라이브러리와 사용자 핀고정 버전의 ABI 정합성"이라는 두 가지 교훈을 명시한 점은 향후 메이저 업그레이드 시 재발 방지에 실질적으로 기여합니다.

**변경 범위를 최소화한 점이 합리적입니다.** `com.fasterxml.jackson.annotation.*` 패키지는 Jackson 3가 동일한 annotation jar에 의존하므로 변경에서 제외했습니다. 실제로 `ResponseDTO.java`, `QchTraceEvent.java` 등은 건드리지 않아 리스크를 최소화했습니다. Task 11 문서에도 "제외" 항목으로 명시되어 있습니다.

**예외 처리 일관성을 유지했습니다.** `JsonProcessingException`(checked exception) → `JacksonException`(RuntimeException)으로 변경하면서도, 기존의 try-catch 패턴과 로그 레벨(`log.warn`)을 그대로 유지했습니다. `AiConversationService.java`의 `convertContextDataToString()` 메서드와 `RedisPubSubDispatcher.java`의 `dispatch()` 메서드 모두 예외 발생 시 `null` 반환 또는 `log.warn` 처리 후 정상 흐름을 유지하는 기존 전략을 그대로 따르고 있어 안정적입니다.

---

## 변경사항 요약

Jackson 2→3 마이그레이션으로 10개 Java 파일의 import 문과 API 호출을 `tools.jackson`으로 일괄 변경했습니다. Neo4j Driver는 `build.gradle`에서 버전 핀고정(`:5.28.5`)을 제거하여 Boot 4 BOM(6.0.3)에 위임했습니다. 주요 API 변경으로는 `NotificationRedisConfig.java`의 `ObjectMapper` 생성 방식을 `JsonMapper.builder()`로 전환, `DgnssLpaService.java`의 `JsonNode.fields()` → `properties()` 변경, `DgnssService.java`의 `throws JsonProcessingException` 시그니처 2건 제거가 포함됩니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

#### 1. `DgnssService.java` 내 `selectTcAnalysis()`에서 `new ObjectMapper()` 직접 생성 — Jackson 3 immutable 특성과의 정합성

**변경 내용:**
`DgnssService.java`는 import 문을 `tools.jackson.databind.ObjectMapper`로 변경했으나, `selectTcAnalysis()` 메서드 내부에서 `ObjectMapper mapper = new ObjectMapper();`로 직접 인스턴스를 생성하고 있습니다. 이 부분은 이번 커밋에서 변경되지 않은 기존 코드입니다.

**위치 (라인 번호):** `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java:1461`

**기존 코드:**
```java
ObjectMapper mapper = new ObjectMapper();
```

**문제 분석:**
Jackson 3에서 `ObjectMapper`는 immutable 객체로 변경되었습니다. `new ObjectMapper()` 생성자는 여전히 존재하지만, 이렇게 생성된 인스턴스는 Jackson 3의 기본 설정을 따릅니다. 현재 이 mapper는 `mapper.readValue(MapUtils.getString(map, "json", ""), Map.class)` 용도로만 사용되므로 런타임 오류가 발생하지는 않을 가능성이 높습니다.

그러나 이 방식은 두 가지 리스크가 있습니다:
1. Jackson 3의 `ObjectMapper`는 immutable이므로, 향후 누군가 이 mapper에 `configure()`나 `setProperty()` 등을 호출하면 `UnsupportedOperationException`이 발생합니다.
2. 프로젝트 전체적으로 `@Bean`으로 관리되는 `ObjectMapper`(Spring Boot가 자동 구성)를 사용하지 않고 매번 `new ObjectMapper()`를 생성하는 것은 일관된 설정(날짜 형식, `PropertyNamingStrategy` 등)이 적용되지 않습니다.

**해결 방안:**
`DgnssService.java`의 필드 선언부를 확인해야 정확한 수정 코드를 제시할 수 있습니다. 클래스에 `ObjectMapper` 필드가 `@Autowired` 또는 생성자 주입으로 존재한다면, 해당 필드를 재사용하는 것이 가장 좋습니다. 만약 필드가 없다면, 최소한 `JsonMapper.builder().build()`로 변경하는 것이 Jackson 3의 immutable 특성에 부합합니다.

```java
// Jackson 3: JsonMapper.builder() 사용 (ObjectMapper는 immutable)
ObjectMapper mapper = tools.jackson.databind.json.JsonMapper.builder().build();
```

**[수정 코드 제시 불가 — 문맥 파악 불충분]**: `DgnssService.java` 전체 필드와 `objectMapper` 필드 존재 여부, 그리고 `selectTcAnalysis()` 메서드가 이 mapper를 어떻게 사용하는지 전체 맥락을 확인해야 정확한 수정 코드를 제시할 수 있습니다. `DgnssService.java`는 2849줄에 달하는 대형 클래스이므로, 필드 선언부와 `selectTcAnalysis()` 메서드 전체를 읽은 후에야 최적의 수정 방안을 결정할 수 있습니다.

---

### Medium (개선 권장)

#### 1. `NotificationRedisConfig.java` — Jackson 3 `JsonMapper.builder()` 패턴의 올바른 사용

**변경 내용:**
Jackson 2에서는 `new ObjectMapper()` + `registerModule(new JavaTimeModule())` + `disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)` + `setVisibility(...)` 패턴을 사용했으나, Jackson 3에서는 `JsonMapper.builder().changeDefaultVisibility(...).build()`로 전환했습니다.

**위치 (라인 번호):** `backend/src/main/java/com/vs/meta/api/notification/dispatcher/NotificationRedisConfig.java:35-38`

**분석:**
Jackson 3가 `java.time` 모듈을 자동 등록하고 ISO 문자열 직렬화가 기본이므로, `JavaTimeModule` 등록과 `WRITE_DATES_AS_TIMESTAMPS` 비활성화 코드를 제거한 것은 정확합니다. 주석에도 그 근거가 명확히 기록되어 있습니다.

다만, 기존에 `WRITE_DATES_AS_TIMESTAMPS`를 `disable()`했던 이유가 특정 Redis Pub/Sub 메시지 소비자가 timestamp 형식을 기대하기 때문이었다면, Jackson 3의 기본 ISO 문자열 형식으로 변경되면서 하위 호환성 문제가 발생할 수 있습니다. 그러나 `notificationObjectMapper`는 알림 페이로드 직렬화 전용으로 격리되어 있고, 동일한 인스턴스 집합 내에서만 사용되므로 문제가 없을 것으로 판단됩니다. 이 부분은 별도 개선이 필요하지 않습니다.

---

## 주요 파일 분석

### `backend/build.gradle`

**변경 내용:**
Neo4j Java Driver 의존성에서 버전 핀고정(`:5.28.5`)을 제거하고 BOM 위임으로 전환했습니다.

```groovy
// 변경 전
implementation 'org.neo4j.driver:neo4j-java-driver:5.28.5'

// 변경 후
// Boot 4 BOM 이 6.0.3 으로 관리. bolt-connection 10.1.1 과 ABI 정합 (5.x driver 는 BootstrapFactory 호출 실패)
implementation 'org.neo4j.driver:neo4j-java-driver'
```

**평가:**
주석에 ABI 불일치 원인(`BootstrapFactory` 호출 실패)과 해결 근거(Boot 4 BOM이 6.0.3 관리)를 명확히 기록하여 유지보수성을 높였습니다. API 호환성 검증 결과 메타가 사용하는 Neo4j Java Driver API(`GraphDatabase.driver()`, `AuthTokens.basic()`, `Driver`, `Session`, `Result` 등)는 6.x에서도 동일 시그니처이므로 코드 변경이 0건인 점도 확인되었습니다. 적절한 변경입니다.

---

### `backend/src/main/java/com/vs/meta/api/notification/dispatcher/NotificationRedisConfig.java`

**변경 내용:**
Jackson 2의 `new ObjectMapper()` + `registerModule()` + `disable()` 패턴을 Jackson 3의 `JsonMapper.builder()` + `changeDefaultVisibility()`로 전환했습니다.

```java
// 변경 전
ObjectMapper m = new ObjectMapper();
m.registerModule(new JavaTimeModule());
m.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
m.setVisibility(PropertyAccessor.FIELD, JsonAutoDetect.Visibility.ANY);
return m;

// 변경 후
return tools.jackson.databind.json.JsonMapper.builder()
        .changeDefaultVisibility(vc -> vc.withFieldVisibility(JsonAutoDetect.Visibility.ANY))
        .build();
```

**평가:**
Jackson 3의 `ObjectMapper`가 immutable이므로 `JsonMapper.builder()` 패턴을 사용한 것은 정확합니다. `JavaTimeModule` 제거와 `WRITE_DATES_AS_TIMESTAMPS` 제거 근거를 주석에 명확히 기록했습니다. `com.fasterxml.jackson.annotation.JsonAutoDetect`와 `com.fasterxml.jackson.annotation.PropertyAccessor`는 Jackson 3에서도 동일한 annotation jar에 의존하므로 유지된 점도 적절합니다.

---

### `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssLpaService.java`

**변경 내용:**
`JsonNode.fields()` → `JsonNode.properties()` API 변경, `IOException` → `JacksonException` 예외 타입 변경.

```java
// 변경 전
meansNode.fields().forEachRemaining(entry -> ...);
objectNode.fields().forEachRemaining(entry -> ...);
// catch (IOException e)

// 변경 후
meansNode.properties().forEach(entry -> ...);
objectNode.properties().forEach(entry -> ...);
// catch (JacksonException e)
```

**평가:**
Jackson 3에서 `fields()`가 제거되고 `properties()`로 대체된 점을 정확히 반영했습니다. `parseSchoolModel()`과 `readDoubleMap()` 두 곳 모두 일관되게 변경되었습니다. `writeJson()` 메서드의 예외 처리도 `JacksonException`(RuntimeException)으로 변경하면서 `IllegalStateException`으로 래핑하는 기존 패턴을 유지했습니다. 적절한 변경입니다.

---

### `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java`

**변경 내용:**
`selectStAnalysis()`와 `selectTcAnalysis()` 메서드 시그니처에서 `throws JsonProcessingException` 제거, import 문 `tools.jackson.*`으로 변경.

```java
// 변경 전
public Map<String, Object> selectStAnalysis(Map<String, Object> param) throws JsonProcessingException
public Map<String, Object> selectTcAnalysis(Map<String, Object> param) throws JsonProcessingException

// 변경 후
public Map<String, Object> selectStAnalysis(Map<String, Object> param)
public Map<String, Object> selectTcAnalysis(Map<String, Object> param)
```

**평가:**
`JacksonException`이 `RuntimeException`이므로 `throws` 선언을 제거한 것은 적절합니다. `selectStAnalysis()`는 내부에서 `selectUnifiedStAnalysis(param)`을 호출하는데, 해당 메서드가 `JacksonException`을 던지더라도 `RuntimeException`이므로 시그니처에 명시할 필요가 없습니다.

다만, 앞서 High 이슈에서 언급한 `selectTcAnalysis()` 내부의 `new ObjectMapper()` 직접 생성(라인 1461)은 Jackson 3의 immutable 특성과 일관된 ObjectMapper 사용 정책 측면에서 개선이 필요합니다.

---

### `backend/src/main/java/com/vs/meta/api/ai/service/AiConversationService.java`

**변경 내용:**
import 문을 `tools.jackson`으로 변경하고, `JsonProcessingException` → `JacksonException`으로 예외 타입 변경.

```java
// 변경 전
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
// catch (JsonProcessingException e)

// 변경 후
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
// catch (JacksonException e)
```

**평가:**
`convertContextDataToString()`과 `parseContextData()` 두 메서드 모두 예외 발생 시 `log.warn` 후 `null` 반환하는 기존 패턴을 그대로 유지했습니다. `JacksonException`이 `RuntimeException`이므로 try-catch가 필수는 아니지만, 기존의 null-safe 처리 전략을 유지한 점이 안정적입니다. 적절한 변경입니다.

---

### `backend/src/main/java/com/vs/meta/api/counseling/service/CounselingService.java`

**변경 내용:**
import 문을 `tools.jackson`으로 변경하고, `JsonProcessingException` → `JacksonException`으로 예외 타입 변경.

```java
// 변경 전
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
// catch (JsonProcessingException e)

// 변경 후
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
// catch (JacksonException e)
```

**평가:**
`toJsonArray()`와 `parseJsonArray()` 두 메서드 모두 일관되게 변경되었습니다. `toJsonArray()`는 `IllegalArgumentException`으로 래핑하고, `parseJsonArray()`는 fallback 로직(문자열 파싱)을 유지하여 기존 예외 처리 전략을 그대로 따릅니다. 적절한 변경입니다.

---

### `backend/src/main/java/com/vs/meta/api/notification/dispatcher/RedisPubSubDispatcher.java`

**변경 내용:**
import 문을 `tools.jackson`으로 변경하고, `JsonProcessingException` → `JacksonException`으로 예외 타입 변경.

**평가:**
`dispatch()` 메서드에서 `JacksonException` catch 후 `log.warn` 처리하고, 별도의 `Exception` catch 블록에서 Redis 일시 장애를 처리하는 2단계 예외 처리 구조를 그대로 유지했습니다. 적절한 변경입니다.

---

### `backend/src/main/java/com/vs/meta/api/notification/dispatcher/RedisPubSubSubscriber.java`, `QchTraceAspect.java`, `SecurityConfig.java`, `NcpMailSender.java`

**변경 내용:**
import 문만 `com.fasterxml.jackson.databind.ObjectMapper` → `tools.jackson.databind.ObjectMapper`로 변경.

**평가:**
이 파일들은 `ObjectMapper`를 단순히 주입받아 사용만 하므로, import 문 변경 외에 추가 수정이 필요하지 않습니다. 적절한 변경입니다.

---

## 최종 평가

**결론**: 
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전체적으로 변경의 방향성과 범위는 매우 적절하며, 특히 사전 조사 누락에 대한 회고와 교훈을 문서화한 점은 실무적으로 높은 가치를 가집니다. Jackson 2→3 마이그레이션에서 10개 파일의 import 문과 API 호출을 일관되게 변경했고, Neo4j Driver 버전 정합 문제를 핀고정 제거라는 단순한 변경으로 해결한 점도 효율적입니다.

다만 `DgnssService.java`의 `selectTcAnalysis()` 메서드(라인 1461)에서 `ObjectMapper mapper = new ObjectMapper();`로 직접 인스턴스를 생성하는 부분이 Jackson 3의 immutable 특성과 일관된 ObjectMapper 사용 정책에 위배될 가능성이 있어 High 이슈로 지적합니다. 이 부분은 이번 커밋에서 변경된 코드는 아니지만, Jackson 3 마이그레이션의 일관성 측면에서 검토가 필요합니다. `JsonMapper.builder().build()`로 변경하거나, 클래스 레벨의 `ObjectMapper` 필드를 주입받아 재사용하는 방식으로 수정을 권장합니다.

이 한 가지만 해결되면 즉시 승인 가능한 수준의 퀄리티입니다. 수고하셨습니다.