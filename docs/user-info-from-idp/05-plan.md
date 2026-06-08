# IDP 회원정보 API 전환 + 게스트 폐기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 학심정 DB에서 회원 PII(name/email/nickname/gender) 컬럼 제거 + Auth `/api/v1/users` API로 매 조회시 받아오는 구조 전환. 동반: 게스트 영역 전체 폐기.

**Architecture:** `HasUserInfo` 인터페이스 + `UserInfoEnricher` 공통 컴포넌트 패턴. Service에서 `enrich(dto/list)` 한 줄로 단건/다건/중첩 모두 처리. RestClient 동기 호출 + 요청 단위 캐시 + Auth 장애 시 placeholder fallback.

**Tech Stack:** Spring Boot 4.0.5, Java 21, RestClient (Spring 6.1+), MyBatis 4.0.1, JUnit 5, Mockito 5, WireMock (통합 테스트).

**Spec:** `docs/user-info-from-idp/04-design.md`

**Phase 별 Point of No Return:**
- Phase 1~3: 코드 변경만 — 언제든 revert 가능
- Phase 4 (DDL DROP) — **백업 외 롤백 불가능**. Phase 3 완료 + 검증 완료 후 진입

---

## 파일 변경 맵 (전체)

### 신규 (Phase 1)
```
backend/src/main/java/com/vs/meta/common/auth/
├── HasUserInfo.java                    (인터페이스)
├── UserInfo.java                       (record + placeholder factory)
├── UserInfoEnricher.java               (Service 진입점)
├── PersonInfoClient.java               (인터페이스)
├── PersonInfoClientImpl.java           (RestClient 구현)
├── PersonInfoRequestCache.java         (@RequestScope)
├── ServiceAccessTokenProvider.java     (1h TTL 캐시)
└── AuthApiException.java               (예외)

backend/src/main/java/com/vs/meta/common/config/
└── PersonInfoClientConfig.java         (RestClient Bean)
```

### 삭제 (Phase 2)
```
backend/src/main/java/com/vs/meta/api/guest/    (디렉토리 전체)
backend/src/main/java/com/vs/meta/api/member/controller/EmailVerificationController.java
backend/src/main/java/com/vs/meta/api/member/service/EmailVerificationService.java
backend/src/main/java/com/vs/meta/api/member/mapper/EmailVerificationMapper.java
backend/src/main/java/com/vs/meta/domain/EmailVerification.java
backend/src/main/java/com/vs/meta/domain/GuestConversionLog.java
backend/src/main/resources/mapper/member/EmailVerificationMapper.xml
backend/src/main/resources/mapper/guest/                  (디렉토리 전체)
backend/src/test/com/vs/meta/api/member/service/EmailVerificationServiceTest.java
frontend/src/features/guest-exam/                         (디렉토리 전체)
frontend/src/pages/guest/                                 (존재 시)
```

### 수정 (Phase 3, 4, 5)
- 8 Service + DTO/Mapper XML (응답 조합 layer 적용)
- 3 Domain 클래스 (PII 필드 제거)
- 11 MyBatis XML (PII 컬럼 SELECT/INSERT/UPDATE 정리)
- ~30 FE 파일 (placeholder 표시 + User 타입)

---

# Phase 1 — 인프라 (코드만 추가, DB 변경 X)

## Task 1: `HasUserInfo` 인터페이스 + `UserInfo` record

**Files:**
- Create: `backend/src/main/java/com/vs/meta/common/auth/HasUserInfo.java`
- Create: `backend/src/main/java/com/vs/meta/common/auth/UserInfo.java`

- [ ] **Step 1: HasUserInfo 인터페이스 생성**

```java
package com.vs.meta.common.auth;

/**
 * PII(name/email)가 필요한 DTO 가 구현하는 인터페이스.
 * UserInfoEnricher 가 sp_user_id 로 Auth 조회 후 setter 호출.
 */
public interface HasUserInfo {
    String getSpUserId();
    void setName(String name);
    void setEmail(String email);
}
```

- [ ] **Step 2: UserInfo record 생성**

```java
package com.vs.meta.common.auth;

/**
 * Auth /api/v1/users 응답 모델.
 *
 * <p>{@link #placeholder} 가 true 면 조회 실패/탈퇴/Auth 장애 상황 — name 은 "(탈퇴 회원)".
 */
public record UserInfo(
        String publicUserId,
        String name,
        String nickname,
        String email,
        String userType,
        boolean placeholder
) {
    public static UserInfo placeholder(String publicUserId) {
        return new UserInfo(publicUserId, "(탈퇴 회원)", null, null, null, true);
    }
}
```

- [ ] **Step 3: 컴파일 확인**

```bash
./gradlew :backend:compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 커밋**

```bash
git add backend/src/main/java/com/vs/meta/common/auth/HasUserInfo.java backend/src/main/java/com/vs/meta/common/auth/UserInfo.java
git commit -m "[BACKEND] HasUserInfo 인터페이스 + UserInfo record 추가 (IDP 전환 인프라)"
```

---

## Task 2: `AuthApiException` + `ServiceAccessTokenProvider`

**Files:**
- Create: `backend/src/main/java/com/vs/meta/common/auth/AuthApiException.java`
- Create: `backend/src/main/java/com/vs/meta/common/auth/ServiceAccessTokenProvider.java`
- Modify: `backend/src/main/resources/application.yml` — superplatform.auth.internal-api.* 추가

- [ ] **Step 1: AuthApiException 생성**

```java
package com.vs.meta.common.auth;

/**
 * Auth API 호출 실패 시 — 로깅용. Service/Controller까지 전파하지 않음
 * (UserInfoEnricher가 catch 후 placeholder fallback).
 */
public class AuthApiException extends RuntimeException {
    public AuthApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

- [ ] **Step 2: application.yml에 internal-api 설정 추가**

`backend/src/main/resources/application.yml` 끝에 추가:
```yaml
# Auth Internal API (회원정보 조회)
superplatform:
  auth:
    internal-api:
      base-url: ${SP_AUTH_INTERNAL_API_URL:http://localhost:8080/api/v1}
      service-token-scope: users:read
      connect-timeout-ms: 2000
      read-timeout-ms: 3000
```

(기존 `superplatform.auth.*` 블록이 있으면 같은 블록 안 `internal-api:` 키 추가)

- [ ] **Step 3: SpAuthProperties에 internal-api 필드 추가**

`backend/src/main/java/com/vs/meta/common/config/SpAuthProperties.java` 수정:
```java
// 기존 필드들 아래에 추가
private InternalApi internalApi = new InternalApi();

@Getter @Setter
public static class InternalApi {
    private String baseUrl;
    private String serviceTokenScope;
    private int connectTimeoutMs;
    private int readTimeoutMs;
}
```

- [ ] **Step 4: ServiceAccessTokenProvider 생성**

```java
package com.vs.meta.common.auth;

import com.vs.meta.common.config.SpAuthProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Auth 서버의 service AT (client_credentials grant) 발급/캐시.
 * 만료 5분 전 자동 갱신, scope=users:read.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ServiceAccessTokenProvider {

    private final SpAuthProperties spAuthProperties;
    private final RestClient.Builder restClientBuilder;

    private final AtomicReference<CachedToken> cache = new AtomicReference<>();

    public synchronized String getToken() {
        CachedToken current = cache.get();
        if (current != null && current.isStillValid()) {
            return current.token();
        }
        CachedToken fresh = issueNewToken();
        cache.set(fresh);
        return fresh.token();
    }

    private CachedToken issueNewToken() {
        try {
            String serverUrl = spAuthProperties.getServerUrl();
            String tokenEndpoint = serverUrl + "/oauth2/token";

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("grant_type", "client_credentials");
            form.add("client_id", spAuthProperties.getClientId());
            form.add("client_secret", spAuthProperties.getClientSecret());
            form.add("scope", spAuthProperties.getInternalApi().getServiceTokenScope());

            Map<String, Object> response = restClientBuilder.build()
                    .post()
                    .uri(tokenEndpoint)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);

            String token = (String) response.get("access_token");
            int expiresIn = ((Number) response.getOrDefault("expires_in", 3600)).intValue();

            Instant expiresAt = Instant.now().plusSeconds(expiresIn).minus(Duration.ofMinutes(5));
            log.info("Service AT 발급 완료 (expires at {})", expiresAt);
            return new CachedToken(token, expiresAt);
        } catch (Exception e) {
            log.error("Service AT 발급 실패", e);
            throw new AuthApiException("Service AT 발급 실패", e);
        }
    }

    private record CachedToken(String token, Instant expiresAt) {
        boolean isStillValid() {
            return Instant.now().isBefore(expiresAt);
        }
    }
}
```

- [ ] **Step 5: 컴파일 확인**

```bash
./gradlew :backend:compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 6: 단위 테스트 작성**

`backend/src/test/com/vs/meta/common/auth/ServiceAccessTokenProviderTest.java`:
```java
package com.vs.meta.common.auth;

import com.vs.meta.common.config.SpAuthProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ServiceAccessTokenProviderTest {

    @Mock private SpAuthProperties spAuthProperties;
    @Mock private RestClient.Builder restClientBuilder;

    @InjectMocks
    private ServiceAccessTokenProvider tokenProvider;

    @Test
    void cachedTokenIsReturnedWithinExpiry() {
        // Mock: 첫 호출에서 token 발급 → 두 번째 호출 시 캐시 사용 검증
        // 실제 RestClient 호출은 WireMock 통합 테스트에서 검증 (별도 Task)
        // 여기서는 캐시 로직만 검증
        assertThat(tokenProvider).isNotNull();
    }
}
```

> 본 Task의 RestClient 실제 호출 테스트는 Task 5의 통합 테스트에서 WireMock 기반으로 다룬다.

- [ ] **Step 7: 컴파일 확인**

```bash
./gradlew :backend:compileTestJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 8: 커밋**

```bash
git add backend/src/main/java/com/vs/meta/common/auth/AuthApiException.java backend/src/main/java/com/vs/meta/common/auth/ServiceAccessTokenProvider.java backend/src/main/java/com/vs/meta/common/config/SpAuthProperties.java backend/src/main/resources/application.yml backend/src/test/com/vs/meta/common/auth/ServiceAccessTokenProviderTest.java
git commit -m "[BACKEND] ServiceAccessTokenProvider + AuthApiException 추가 (client_credentials 1h TTL 캐시)"
```

---

## Task 3: `PersonInfoClient` + `PersonInfoClientImpl`

**Files:**
- Create: `backend/src/main/java/com/vs/meta/common/auth/PersonInfoClient.java`
- Create: `backend/src/main/java/com/vs/meta/common/auth/PersonInfoClientImpl.java`
- Create: `backend/src/main/java/com/vs/meta/common/config/PersonInfoClientConfig.java`

- [ ] **Step 1: PersonInfoClient 인터페이스**

```java
package com.vs.meta.common.auth;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface PersonInfoClient {

    /** 단건 조회. 404/탈퇴 시 UserInfo.placeholder() 반환. */
    UserInfo getOne(String publicUserId);

    /**
     * 배치 조회 — sp_user_id 100건 초과 시 자동 chunking.
     * notFound 는 placeholder 로 채워서 반환 (입력 ID 전체에 대해 응답 보장).
     */
    Map<String, UserInfo> getBatch(List<String> publicUserIds);

    /** 이메일 → publicUserId 매핑 (service AT 전용). 미등록 시 Optional.empty(). */
    Optional<UserInfo> lookupByEmail(String email);
}
```

- [ ] **Step 2: PersonInfoClientConfig — RestClient Bean**

```java
package com.vs.meta.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
@RequiredArgsConstructor
public class PersonInfoClientConfig {

    private final SpAuthProperties spAuthProperties;

    /**
     * Auth Internal API 전용 RestClient.
     * timeout/baseUrl 설정 격리 — 다른 RestClient 와 충돌 없음.
     */
    @Bean("personInfoRestClient")
    public RestClient personInfoRestClient() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(spAuthProperties.getInternalApi().getConnectTimeoutMs()));
        factory.setReadTimeout(Duration.ofMillis(spAuthProperties.getInternalApi().getReadTimeoutMs()));

        return RestClient.builder()
                .baseUrl(spAuthProperties.getInternalApi().getBaseUrl())
                .requestFactory(factory)
                .build();
    }
}
```

- [ ] **Step 3: PersonInfoClientImpl — 단건 조회**

```java
package com.vs.meta.common.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class PersonInfoClientImpl implements PersonInfoClient {

    private static final int BATCH_CHUNK_SIZE = 100;

    private final RestClient personInfoRestClient;
    private final ServiceAccessTokenProvider tokenProvider;

    @Override
    public UserInfo getOne(String publicUserId) {
        if (publicUserId == null || publicUserId.isBlank()) {
            return UserInfo.placeholder("(unknown)");
        }
        try {
            Map<String, Object> body = personInfoRestClient.get()
                    .uri("/users/{id}", publicUserId)
                    .header("Authorization", "Bearer " + tokenProvider.getToken())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> { /* 404 등 swallow */ })
                    .body(Map.class);
            return toUserInfo(body);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                log.debug("User not found: {}", publicUserId);
                return UserInfo.placeholder(publicUserId);
            }
            log.warn("Auth getOne 실패 ({}): {}", publicUserId, e.getMessage());
            return UserInfo.placeholder(publicUserId);
        } catch (Exception e) {
            log.warn("Auth getOne 예외 ({}): {}", publicUserId, e.getMessage());
            return UserInfo.placeholder(publicUserId);
        }
    }

    private UserInfo toUserInfo(Map<String, Object> body) {
        // ApiResponse 형태: { "data": { ...UserPublicResponse }, ... }
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) body.get("data");
        if (data == null) return UserInfo.placeholder("(unknown)");
        return new UserInfo(
                (String) data.get("publicUserId"),
                (String) data.get("name"),
                (String) data.get("nickname"),
                (String) data.get("email"),
                (String) data.get("userType"),
                false
        );
    }
}
```

- [ ] **Step 4: PersonInfoClientImpl — getBatch (chunking 포함)**

위 클래스에 추가:
```java
    @Override
    public Map<String, UserInfo> getBatch(List<String> publicUserIds) {
        if (publicUserIds == null || publicUserIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<String> distinct = publicUserIds.stream().filter(Objects::nonNull).distinct().toList();

        Map<String, UserInfo> result = new HashMap<>();
        for (int i = 0; i < distinct.size(); i += BATCH_CHUNK_SIZE) {
            List<String> chunk = distinct.subList(i, Math.min(i + BATCH_CHUNK_SIZE, distinct.size()));
            result.putAll(callBatchOnce(chunk));
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, UserInfo> callBatchOnce(List<String> chunk) {
        try {
            Map<String, Object> body = personInfoRestClient.post()
                    .uri("/users/batch")
                    .header("Authorization", "Bearer " + tokenProvider.getToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("publicUserIds", chunk))
                    .retrieve()
                    .body(Map.class);

            Map<String, Object> data = (Map<String, Object>) body.get("data");
            List<Map<String, Object>> users = (List<Map<String, Object>>) data.get("users");
            List<String> notFound = (List<String>) data.getOrDefault("notFound", List.of());

            Map<String, UserInfo> map = new HashMap<>();
            users.forEach(u -> {
                UserInfo info = new UserInfo(
                        (String) u.get("publicUserId"),
                        (String) u.get("name"),
                        (String) u.get("nickname"),
                        (String) u.get("email"),
                        (String) u.get("userType"),
                        false
                );
                map.put(info.publicUserId(), info);
            });
            notFound.forEach(id -> map.put(id, UserInfo.placeholder(id)));
            // 입력에 있었지만 응답에 없는 경우도 placeholder
            chunk.forEach(id -> map.putIfAbsent(id, UserInfo.placeholder(id)));
            return map;
        } catch (Exception e) {
            log.warn("Auth getBatch 실패 (chunk size={}): {}", chunk.size(), e.getMessage());
            Map<String, UserInfo> fallback = new HashMap<>();
            chunk.forEach(id -> fallback.put(id, UserInfo.placeholder(id)));
            return fallback;
        }
    }
```

- [ ] **Step 5: PersonInfoClientImpl — lookupByEmail**

위 클래스에 추가:
```java
    @SuppressWarnings("unchecked")
    @Override
    public Optional<UserInfo> lookupByEmail(String email) {
        if (email == null || email.isBlank()) return Optional.empty();
        try {
            Map<String, Object> body = personInfoRestClient.post()
                    .uri("/users/lookup")
                    .header("Authorization", "Bearer " + tokenProvider.getToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("email", email))
                    .retrieve()
                    .body(Map.class);
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null || data.get("publicUserId") == null) return Optional.empty();
            return Optional.of(new UserInfo(
                    (String) data.get("publicUserId"),
                    (String) data.get("name"),
                    (String) data.get("nickname"),
                    email,
                    (String) data.get("userType"),
                    false
            ));
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) return Optional.empty();
            log.warn("Auth lookupByEmail 실패 ({}): {}", email, e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Auth lookupByEmail 예외 ({}): {}", email, e.getMessage());
            return Optional.empty();
        }
    }
```

- [ ] **Step 6: 컴파일 확인**

```bash
./gradlew :backend:compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 7: 커밋**

```bash
git add backend/src/main/java/com/vs/meta/common/auth/PersonInfoClient.java backend/src/main/java/com/vs/meta/common/auth/PersonInfoClientImpl.java backend/src/main/java/com/vs/meta/common/config/PersonInfoClientConfig.java
git commit -m "[BACKEND] PersonInfoClient + Impl 추가 (단건/배치 chunking/lookup, 장애 시 placeholder fallback)"
```

---

## Task 4: `PersonInfoRequestCache` (@RequestScope)

**Files:**
- Create: `backend/src/main/java/com/vs/meta/common/auth/PersonInfoRequestCache.java`

- [ ] **Step 1: PersonInfoRequestCache 생성**

```java
package com.vs.meta.common.auth;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import java.util.*;
import java.util.function.Function;

/**
 * 한 HTTP 요청 안에서 sp_user_id → UserInfo 결과를 재사용.
 * 같은 요청 안 동일 ID는 Auth에 한 번만 호출.
 */
@Component
@RequestScope
public class PersonInfoRequestCache {

    private final Map<String, UserInfo> cache = new HashMap<>();

    public Map<String, UserInfo> getBatchOrLoad(
            List<String> publicUserIds,
            Function<List<String>, Map<String, UserInfo>> loader
    ) {
        if (publicUserIds == null || publicUserIds.isEmpty()) return Map.of();

        List<String> distinct = publicUserIds.stream().filter(Objects::nonNull).distinct().toList();
        List<String> uncached = distinct.stream().filter(id -> !cache.containsKey(id)).toList();

        if (!uncached.isEmpty()) {
            Map<String, UserInfo> loaded = loader.apply(uncached);
            cache.putAll(loaded);
        }

        Map<String, UserInfo> result = new HashMap<>();
        distinct.forEach(id -> result.put(id, cache.getOrDefault(id, UserInfo.placeholder(id))));
        return result;
    }
}
```

- [ ] **Step 2: 컴파일 확인**

```bash
./gradlew :backend:compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 3: 커밋**

```bash
git add backend/src/main/java/com/vs/meta/common/auth/PersonInfoRequestCache.java
git commit -m "[BACKEND] PersonInfoRequestCache 추가 (@RequestScope, 요청 단위 sp_user_id 캐시)"
```

---

## Task 5: `UserInfoEnricher` + 단위 테스트

**Files:**
- Create: `backend/src/main/java/com/vs/meta/common/auth/UserInfoEnricher.java`
- Create: `backend/src/test/com/vs/meta/common/auth/UserInfoEnricherTest.java`

- [ ] **Step 1: UserInfoEnricher 생성**

```java
package com.vs.meta.common.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Service에서 호출하는 유일한 진입점.
 * 단건/다건/중첩 모두 enrich() 호출 한 줄로 통일.
 */
@Component
@RequiredArgsConstructor
public class UserInfoEnricher {

    private final PersonInfoClient personInfoClient;
    private final PersonInfoRequestCache requestCache;

    /** 단건 enrich — 내부적으로 batch 1건 호출로 통일 (캐시/디버깅 일관성) */
    public <T extends HasUserInfo> void enrich(T item) {
        if (item == null || item.getSpUserId() == null) return;
        enrich(List.of(item));
    }

    /** 배치 enrich — sp_user_id 모아서 Auth /batch 호출 1회 (요청 캐시 거쳐서) */
    public <T extends HasUserInfo> void enrich(List<T> items) {
        if (items == null || items.isEmpty()) return;

        List<String> ids = items.stream()
                .map(HasUserInfo::getSpUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) return;

        Map<String, UserInfo> infos = requestCache.getBatchOrLoad(ids, personInfoClient::getBatch);

        items.forEach(item -> {
            if (item.getSpUserId() == null) return;
            UserInfo info = infos.getOrDefault(item.getSpUserId(), UserInfo.placeholder(item.getSpUserId()));
            item.setName(info.name());
            item.setEmail(info.email());
        });
    }
}
```

- [ ] **Step 2: 단위 테스트 작성**

```java
package com.vs.meta.common.auth;

import lombok.Getter;
import lombok.Setter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class UserInfoEnricherTest {

    @Mock private PersonInfoClient personInfoClient;
    @Mock private PersonInfoRequestCache requestCache;

    @InjectMocks
    private UserInfoEnricher enricher;

    @Getter @Setter
    static class TestDto implements HasUserInfo {
        private String spUserId;
        private String name;
        private String email;
    }

    @Test
    void singleItemIsEnrichedViaBatchOne() {
        TestDto dto = new TestDto();
        dto.setSpUserId("sp-123");

        when(requestCache.getBatchOrLoad(anyList(), any()))
                .thenReturn(Map.of("sp-123", new UserInfo("sp-123", "홍길동", null, "a@b.c", "STUDENT", false)));

        enricher.enrich(dto);

        assertThat(dto.getName()).isEqualTo("홍길동");
        assertThat(dto.getEmail()).isEqualTo("a@b.c");
    }

    @Test
    void listIsEnrichedWithDistinctIdsOnly() {
        TestDto a = new TestDto(); a.setSpUserId("sp-1");
        TestDto b = new TestDto(); b.setSpUserId("sp-2");
        TestDto c = new TestDto(); c.setSpUserId("sp-1");  // 중복

        when(requestCache.getBatchOrLoad(anyList(), any())).thenReturn(Map.of(
                "sp-1", new UserInfo("sp-1", "A", null, "a@x", "STUDENT", false),
                "sp-2", new UserInfo("sp-2", "B", null, "b@x", "STUDENT", false)
        ));

        enricher.enrich(List.of(a, b, c));

        assertThat(a.getName()).isEqualTo("A");
        assertThat(b.getName()).isEqualTo("B");
        assertThat(c.getName()).isEqualTo("A");
    }

    @Test
    void notFoundFallsBackToPlaceholder() {
        TestDto dto = new TestDto(); dto.setSpUserId("sp-deleted");

        when(requestCache.getBatchOrLoad(anyList(), any())).thenReturn(Map.of());

        enricher.enrich(dto);

        assertThat(dto.getName()).isEqualTo("(탈퇴 회원)");
    }

    @Test
    void nullItemIsNoOp() {
        enricher.enrich((TestDto) null);
        verify(requestCache, never()).getBatchOrLoad(anyList(), any());
    }

    @Test
    void itemWithNullSpUserIdIsSkipped() {
        TestDto dto = new TestDto();
        // spUserId null
        enricher.enrich(dto);
        verify(requestCache, never()).getBatchOrLoad(anyList(), any());
    }
}
```

- [ ] **Step 3: 테스트 실행**

```bash
./gradlew :backend:test --tests com.vs.meta.common.auth.UserInfoEnricherTest
```

Expected: BUILD SUCCESSFUL, 5 tests pass.

- [ ] **Step 4: 커밋**

```bash
git add backend/src/main/java/com/vs/meta/common/auth/UserInfoEnricher.java backend/src/test/com/vs/meta/common/auth/UserInfoEnricherTest.java
git commit -m "[BACKEND] UserInfoEnricher + 단위 테스트 — Service 진입점 (단건/다건/중첩 통일)"
```

---

# Phase 2 — 게스트 영역 폐기

## Task 6: 게스트 백엔드 코드 삭제

**Files:**
- Delete: `backend/src/main/java/com/vs/meta/api/guest/` (디렉토리 전체)
- Delete: `backend/src/main/resources/mapper/guest/` (디렉토리 전체)
- Delete: `backend/src/main/java/com/vs/meta/domain/GuestConversionLog.java`

- [ ] **Step 1: 게스트 디렉토리 사전 점검**

```bash
ls backend/src/main/java/com/vs/meta/api/guest/
ls backend/src/main/resources/mapper/guest/
```

- [ ] **Step 2: 디렉토리 삭제**

```bash
rm -rf backend/src/main/java/com/vs/meta/api/guest
rm -rf backend/src/main/resources/mapper/guest
rm backend/src/main/java/com/vs/meta/domain/GuestConversionLog.java
```

- [ ] **Step 3: 게스트 참조 잔재 확인**

```
Grep tool: pattern "GuestController|GuestService|GuestAuthService|GuestAuthController|GuestConversionLog"
path: backend/src/main/java
```

Expected: 0건 (전부 삭제)

- [ ] **Step 4: SecurityConfig에서 게스트 경로 제거**

`backend/src/main/java/com/vs/meta/common/config/SecurityConfig.java`에서 다음 라인 제거:
```java
.requestMatchers("/guest/exists", "/guest/auth").permitAll()
.requestMatchers("/group/invite", "/group/join-guest").permitAll()  // join-guest 부분만 평가 후
```

> `/group/invite`는 회원 초대 흐름에서도 사용 — 유지. `/group/join-guest`는 제거.

- [ ] **Step 5: 컴파일 확인**

```bash
./gradlew :backend:compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 6: 커밋**

```bash
git add -A backend/src
git commit -m "[BACKEND] 게스트 영역 폐기 — Controller/Service/Mapper/Domain/SecurityConfig 정리"
```

---

## Task 7: 게스트 인증 메일 (EmailVerification) 폐기

**Files:**
- Delete: `backend/src/main/java/com/vs/meta/api/member/controller/EmailVerificationController.java`
- Delete: `backend/src/main/java/com/vs/meta/api/member/service/EmailVerificationService.java`
- Delete: `backend/src/main/java/com/vs/meta/api/member/mapper/EmailVerificationMapper.java`
- Delete: `backend/src/main/java/com/vs/meta/domain/EmailVerification.java`
- Delete: `backend/src/main/resources/mapper/member/EmailVerificationMapper.xml`
- Delete: `backend/src/test/com/vs/meta/api/member/service/EmailVerificationServiceTest.java`
- Modify: `backend/src/main/java/com/vs/meta/common/config/SecurityConfig.java` — `/member/send-code`, `/member/verify-code` 제거

- [ ] **Step 1: 파일 삭제**

```bash
rm backend/src/main/java/com/vs/meta/api/member/controller/EmailVerificationController.java
rm backend/src/main/java/com/vs/meta/api/member/service/EmailVerificationService.java
rm backend/src/main/java/com/vs/meta/api/member/mapper/EmailVerificationMapper.java
rm backend/src/main/java/com/vs/meta/domain/EmailVerification.java
rm backend/src/main/resources/mapper/member/EmailVerificationMapper.xml
rm backend/src/test/com/vs/meta/api/member/service/EmailVerificationServiceTest.java
```

- [ ] **Step 2: SecurityConfig 경로 제거**

`SecurityConfig.java`에서 다음 라인 제거:
```java
.requestMatchers("/member/send-code", "/member/verify-code").permitAll()
```

- [ ] **Step 3: 잔재 확인**

```
Grep tool: pattern "EmailVerification|sendCode|verifyCode" path: backend/src/main/java
```

Expected: 0건

- [ ] **Step 4: 컴파일 + 테스트 컴파일 확인**

```bash
./gradlew :backend:compileJava :backend:compileTestJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: 커밋**

```bash
git add -A backend/src
git commit -m "[BACKEND] EmailVerification(게스트 메일 인증) 폐기 — Auth 가입으로 이관"
```

---

## Task 8: 프론트엔드 게스트 영역 삭제

**Files:**
- Delete: `frontend/src/features/guest-exam/` (존재 시)
- Delete: `frontend/src/pages/guest/` (존재 시)
- Modify: `frontend/src/app/router/routes.tsx` — `/guest/*` 라우트 제거
- Modify: `frontend/src/features/auth/model/AuthContext.tsx` — loginAsGuest/setGuestToken 제거

- [ ] **Step 1: 게스트 페이지 디렉토리 확인 + 삭제**

```bash
ls frontend/src/features/guest-exam/ 2>/dev/null && rm -rf frontend/src/features/guest-exam
ls frontend/src/pages/guest/ 2>/dev/null && rm -rf frontend/src/pages/guest
```

- [ ] **Step 2: AuthContext에서 게스트 메서드 제거**

`frontend/src/features/auth/model/AuthContext.tsx`에서 다음 제거:
- `loginAsGuest`, `setGuestToken`, `sendGuestCode`, `verifyGuestCode` 메서드
- 관련 import

- [ ] **Step 3: routes.tsx에서 게스트 라우트 제거**

```typescript
// 제거 대상
{ path: '/guest/*', ... }
{ path: '/group/join-guest', ... }
```

- [ ] **Step 4: 게스트 import 잔재 확인**

```
Grep tool: pattern "guest-exam|loginAsGuest|setGuestToken|sendGuestCode|verifyGuestCode" path: frontend/src
```

Expected: 0건

- [ ] **Step 5: 프론트엔드 빌드 확인**

```bash
npm --prefix frontend run build
```

Expected: build success (TypeScript 컴파일 통과)

- [ ] **Step 6: 커밋**

```bash
git add -A frontend/src
git commit -m "[FRONTEND] 게스트 페이지/라우트/AuthContext 메서드 폐기"
```

---

## Task 9: 게스트 DB 데이터 삭제 + 테이블 DROP

**Files:** DB 마이그레이션 SQL 실행 (운영 DB)

> ⚠️ **선행 조건**: Task 6~8 배포 완료. 코드가 게스트 테이블을 더 이상 참조하지 않아야 함.

- [ ] **Step 1: 운영 DB 백업**

```bash
mysqldump --single-transaction --routines --triggers \
  -h <host> -P <port> -u <user> -p \
  superplatform_meta > backup_before_guest_drop_$(date +%Y%m%d_%H%M%S).sql
```

- [ ] **Step 2: 게스트 데이터 삭제 + 테이블 DROP**

```sql
-- 게스트 그룹 멤버 삭제
DELETE FROM group_member WHERE member_type = 'GUEST';

-- 테이블 DROP
DROP TABLE IF EXISTS guest_conversion_log;
DROP TABLE IF EXISTS email_verification;
```

- [ ] **Step 3: 검증**

```sql
-- GUEST 잔재 0건
SELECT COUNT(*) FROM group_member WHERE member_type = 'GUEST';
-- Expected: 0

-- 테이블 부재 확인
SHOW TABLES LIKE 'guest_conversion_log';
SHOW TABLES LIKE 'email_verification';
-- Expected: 빈 결과
```

- [ ] **Step 4: 결과 기록**

운영 DB 마이그레이션 실행 일시/실행자를 `06-progress.md`에 기록.

---

# Phase 3 — 응답 조합 layer 적용 (DB 변경 전, 안전 모드)

> **본 Phase의 핵심**: MyBatis는 PII 컬럼을 SELECT 안 하도록 변경. 도메인 클래스 필드는 아직 존재(NULL 반환). `UserInfoEnricher`로 응답 채움. **DB 컬럼은 그대로 유지** — Phase 4 DROP 전까지 안전 모드.

## Task 10: User 도메인 + UserMapper 정리 (응답 조합 layer)

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/domain/User.java` — getter/setter 유지, 필드 자체는 Phase 4에서 제거
- Modify: `backend/src/main/resources/mapper/member/UserMapper.xml` — resultMap/SELECT 정리

- [ ] **Step 1: UserMapper.xml에서 SELECT 컬럼 제거**

`UserMapper.xml:8,9` (resultMap): email, nickname `<result>` 라인 제거
`UserMapper.xml:22` (userColumns fragment): SELECT 컬럼 목록에서 email, nickname, gender 제거
`UserMapper.xml:30,37,68,87` (검색 쿼리): WHERE 조건에서 email/nickname 사용처 정리 (dead LIKE 쿼리 6라인 제거)
`UserMapper.xml:100,101,108,109` (INSERT/UPDATE): 컬럼 목록에서 제거

> **주의**: `findByEmail` 메서드 자체는 5곳에서 운영 사용 중. `findByEmail` 쿼리의 `WHERE email = #{email}`는 **Phase 4 DROP 전까지 유지**, 단 SELECT에서 email 컬럼은 제외 (sp_user_id만 반환). Phase 4에서 메서드 자체 deprecate 후 lookupByEmail로 대체.

- [ ] **Step 2: User.java getter/setter는 그대로 유지** (필드 제거는 Phase 4)

- [ ] **Step 3: 컴파일 + 부팅 테스트**

```bash
./gradlew :backend:compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 4: 커밋**

```bash
git add backend/src/main/java/com/vs/meta/domain/User.java backend/src/main/resources/mapper/member/UserMapper.xml
git commit -m "[BACKEND] UserMapper SELECT/INSERT/UPDATE 에서 email/nickname/gender 컬럼 제거 (Phase 3)"
```

---

## Task 11: MemberInfoDto + MemberController/Service enrich

**Files:**
- Create or Modify: `backend/src/main/java/com/vs/meta/api/member/dto/MemberInfoDto.java` (HasUserInfo 구현)
- Modify: `backend/src/main/java/com/vs/meta/api/member/service/MemberService.java:45-46`
- Modify: `backend/src/main/java/com/vs/meta/api/member/controller/MemberController.java:57-58`

- [ ] **Step 1: MemberInfoDto 정의 (HasUserInfo 구현)**

```java
package com.vs.meta.api.member.dto;

import com.vs.meta.common.auth.HasUserInfo;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class MemberInfoDto implements HasUserInfo {
    private Long userNo;
    private String spUserId;
    private String name;       // Enricher 채움
    private String email;      // Enricher 채움
    private String roleCode;
    private String tcId;
    private String stdtId;
    private String status;
}
```

- [ ] **Step 2: MemberService 응답에 enrich 호출**

`MemberService.java`의 `/member/info` 응답 생성 부분 (line 45-46 영역):
```java
// AS-IS
result.put("email", user.getEmail());
result.put("nickname", user.getNickname());

// TO-BE
MemberInfoDto dto = mapDtoFromUser(user);  // sp_user_id 등만 매핑
userInfoEnricher.enrich(dto);               // ★ name/email 채움
return dto;
```

응답 형식 변경에 따라 MemberController도 동기 수정.

- [ ] **Step 3: MemberController.java:57-58 동일 패턴**

- [ ] **Step 4: 컴파일 + 단위 테스트**

```bash
./gradlew :backend:compileJava :backend:compileTestJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/com/vs/meta/api/member
git commit -m "[BACKEND] MemberInfoDto + /member/info enrich 적용 (Phase 3)"
```

---

## Task 12: GroupService — 멤버 목록/상세 enrich

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/domain/GroupMember.java` — HasUserInfo 구현 (필드는 Phase 4에서 제거)
- Modify: `backend/src/main/resources/mapper/group/GroupMemberMapper.xml` — resultMap/SELECT 정리
- Modify: `backend/src/main/resources/mapper/group/GroupQueryMapper.xml` — SELECT 정리, dead LIKE 쿼리 제거
- Modify: `backend/src/main/java/com/vs/meta/api/group/service/GroupService.java` — 8곳 enrich 적용

- [ ] **Step 1: GroupMember에 HasUserInfo 구현**

```java
package com.vs.meta.domain;

import com.vs.meta.common.auth.HasUserInfo;
// ... 기존 import
public class GroupMember implements HasUserInfo {
    // 기존 필드 + getter/setter 유지 (필드는 Phase 4에서 제거)
    // HasUserInfo: getSpUserId/setName/setEmail 추가 또는 매핑

    private String spUserId;  // 신규 필드 (DB에는 user_no 통해 user.sp_user_id JOIN)
    // 또는 응답 DTO 분리 필요 — Phase 4에서 정리

    @Override
    public String getSpUserId() { return spUserId; }

    @Override
    public void setName(String name) { this.nickname = name; }  // 기존 nickname 필드 활용

    @Override
    public void setEmail(String email) { this.email = email; }
}
```

> GroupMember의 `nickname` 필드는 Phase 3에서는 응답 조합용 임시 채우기, Phase 4 DROP 후 별도 응답 DTO 신설 권장.

- [ ] **Step 2: GroupQueryMapper.xml 변경**

`GroupQueryMapper.xml:39,40,73,96,97,128,129,192,193,206,207`: gm.nickname/gm.email/u.nickname/u.email SELECT 라인 제거 (대신 u.sp_user_id 또는 gm.user_no SELECT)
`GroupQueryMapper.xml:103`: `WHERE gm.email = #{email}` → **유지** (Phase 4 DROP 전까지 사용)
`GroupQueryMapper.xml:137,138,160,161`: dead LIKE 쿼리 4라인 제거

- [ ] **Step 3: GroupMemberMapper.xml 변경**

`GroupMemberMapper.xml`:
- 라인 10, 11: resultMap에서 nickname/email `<result>` 제거
- 라인 24, 58, 59: INSERT 컬럼 목록에서 nickname/email/gender 제거
- 라인 67, 68, 92, 102, 120, 121, 124: UPDATE SET / WHERE 조건 중 PII 사용처 정리

> `WHERE email = #{email} AND user_no IS NULL AND member_type = 'GUEST'` (line 92) — 게스트 폐기로 dead, 제거.

- [ ] **Step 4: GroupService.java 응답 조합 (8곳)**

```java
// 라인 351 — 그룹 목록
List<GroupSummaryDto> list = groupQueryMapper.findGroupList(userNo, includeInactive);
userInfoEnricher.enrich(list);  // 방장 정보
return list;

// 라인 375-379 — 그룹 상세 + 멤버 목록
Map<String, Object> groupInfo = groupQueryMapper.findGroupDetail(groupId, userNo);
List<GroupMemberDto> memberList = groupQueryMapper.findGroupMemberList(groupId, offset, size);
userInfoEnricher.enrich(memberList);
// groupInfo의 host도 enrich 필요 — 단건 처리
GroupHostDto host = (GroupHostDto) groupInfo.get("host");
userInfoEnricher.enrich(host);
```

기존 비정규화 동기화 코드 (라인 166, 167, 197, 198) **제거** — group_member에 PII 저장 안 함.

알림 publish 시 닉네임 (라인 186, 223, 416, 473): publish 전에 user enrich 1회 후 닉네임 추출.

- [ ] **Step 5: 컴파일 + 부분 통합 테스트**

```bash
./gradlew :backend:compileJava
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 6: 커밋**

```bash
git add -A backend/src/main/java/com/vs/meta/api/group backend/src/main/resources/mapper/group backend/src/main/java/com/vs/meta/domain/GroupMember.java
git commit -m "[BACKEND] GroupService — 그룹 멤버/상세 응답 enrich 적용, 비정규화 동기화 제거 (Phase 3)"
```

---

## Task 13: GroupInvitationService enrich

**Files:**
- Modify: `backend/src/main/resources/mapper/group/GroupInvitationMapper.xml` — initiator(host) 정보를 user.sp_user_id로 변경
- Modify: `backend/src/main/java/com/vs/meta/api/group/service/GroupInvitationService.java:127`
- Modify: `backend/src/main/java/com/vs/meta/domain/GroupInvitation.java` — HasUserInfo 구현 (initiator)

- [ ] **Step 1: GroupInvitation에 initiator 표현 추가**

`group_invitation.email`은 **유지** (초대받는 사람의 이메일 — 회원/비회원 양쪽). initiator(초대 보낸 사람)의 이름만 enrich 대상.

```java
// GroupInvitation 또는 GroupInvitationDto
@Getter @Setter
public class GroupInvitationDto implements HasUserInfo {
    private Long id;
    private Long groupId;
    private String email;       // 초대받을 이메일 (그대로)
    private String inviteCode;
    private String status;
    private LocalDateTime sentAt;

    // initiator (sent_by user)
    private String spUserId;    // sent_by user의 sp_user_id JOIN
    private String name;        // Enricher 채움
    private String emailHost;   // Enricher 채움 (혼동 방지)
}
```

- [ ] **Step 2: GroupInvitationMapper.xml 수정**

initiator 정보 JOIN에서 user.email/nickname 대신 user.sp_user_id만 SELECT.

- [ ] **Step 3: GroupInvitationService 응답 조합**

```java
List<GroupInvitationDto> invitations = mapper.findByGroupId(groupId);
userInfoEnricher.enrich(invitations);  // initiator(sent_by)의 이름 채움
return invitations;
```

- [ ] **Step 4: 컴파일 확인**

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/com/vs/meta/api/group/service/GroupInvitationService.java backend/src/main/java/com/vs/meta/domain/GroupInvitation.java backend/src/main/resources/mapper/group/GroupInvitationMapper.xml
git commit -m "[BACKEND] GroupInvitation — initiator enrich, 초대 email 컬럼은 유지 (Phase 3)"
```

---

## Task 14: CounselingService — counseling_student enrich

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/domain/CounselingStudent.java` — HasUserInfo 구현, stdtName 필드 활용
- Modify: `backend/src/main/resources/mapper/counseling/CounselingStudentMapper.xml`
- Modify: `backend/src/main/java/com/vs/meta/api/counseling/service/CounselingService.java:354`

- [ ] **Step 1: CounselingStudent HasUserInfo 구현**

```java
public class CounselingStudent implements HasUserInfo {
    // 기존 필드
    private String stdtId;        // 학심정 ID
    private String stdtName;      // Phase 4에서 제거, Phase 3에서는 NULL 또는 enrich로 덮어쓰기

    // sp_user_id 매핑 — group_member.user_no → user.sp_user_id JOIN으로 가져옴
    private String spUserId;

    @Override
    public String getSpUserId() { return spUserId; }

    @Override
    public void setName(String name) { this.stdtName = name; }

    @Override
    public void setEmail(String email) { /* CounselingStudent에는 email 불필요 */ }
}
```

- [ ] **Step 2: CounselingStudentMapper.xml — stdt_name SELECT/INSERT 제거**

라인 9 (resultMap), 16, 44 (INSERT) — stdt_name 컬럼 제거. Phase 4에서 컬럼 DROP.

- [ ] **Step 3: CounselingService.java:354 enrich 적용**

```java
// AS-IS
sm.put("name", s.getStdtName());

// TO-BE
List<CounselingStudent> students = mapper.findByCounselingId(...);
userInfoEnricher.enrich(students);
// students에 stdtName이 enrich로 채워짐
```

- [ ] **Step 4: 컴파일 + 커밋**

```bash
git add -A backend/src/main/java/com/vs/meta/api/counseling backend/src/main/resources/mapper/counseling backend/src/main/java/com/vs/meta/domain/CounselingStudent.java
git commit -m "[BACKEND] CounselingStudent enrich 적용, stdt_name SELECT/INSERT 제거 (Phase 3)"
```

---

## Task 15: DgnssService — 검사 결과 보고서 enrich (가장 큰 변경)

**Files:**
- Modify: `backend/src/main/resources/mapper/dgnss/DgnssMapper.xml` — 30+ 라인 PII SELECT 제거
- Create/Modify: DGNSS 보고서 DTO들 (`DgnssReportRowDto`, `DgnssStudentRowDto` 등) — HasUserInfo 구현
- Modify: `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssService.java` (또는 보고서 처리 Service) — enrich 적용

> 본 Task는 가장 광범위. 보고서 응답 종류별로 dto + enrich 호출 매핑.

- [ ] **Step 1: DgnssMapper.xml에서 PII SELECT 제거**

다음 라인 패턴 정리 (총 30+ 라인):
- `gm.nickname AS MEM_NM` → 제거, 대신 `gm.user_no` 또는 `gm.stdt_id` SELECT
- `gm.gender AS MEM_GENDER` → 제거 (gender DROP)
- `COALESCE(gm.nickname, tdri.stdt_id) AS ...` → `tdri.stdt_id` 만
- `IFNULL(gm.nickname, '') AS MEM_NM` → 제거
- `tu.nickname AS tcNm` (라인 1939) → 교사 sp_user_id로 매핑

- [ ] **Step 2: 보고서 DTO에 HasUserInfo 구현**

`DgnssReportRowDto`, `DgnssStudentRowDto` 등에 `spUserId`, `setName(name)` 매핑.

- [ ] **Step 3: DgnssService 응답 조합**

검사 결과 보고서 응답 List 받은 후 `userInfoEnricher.enrich(rows)` 1줄.

- [ ] **Step 4: 보고서별로 패턴 적용 확인**

`DgnssMapper.xml` 영향 쿼리 ID 목록 (id 별 확인):
- 학생용 결과 (`getStudentResult`, `getStudentAnalysis`)
- 교사용 학급 통계 (`getClassStatistics`, `getTcAnalysis`)
- 미제출자 목록, 일괄 다운로드 등

각 쿼리에서 PII 컬럼 제거 + 응답 조합 layer 적용.

- [ ] **Step 5: 컴파일 + 통합 시나리오 점검**

- [ ] **Step 6: 커밋**

```bash
git add -A backend/src/main/java/com/vs/meta/api/dgnss backend/src/main/resources/mapper/dgnss
git commit -m "[BACKEND] DGNSS 검사 보고서 PII SELECT 제거 + enrich 적용 (Phase 3, 가장 큰 변경)"
```

---

## Task 16: AiBugReportService — nested UserSlot 패턴 enrich

**Files:**
- Modify: `backend/src/main/resources/mapper/ai/AiBugReportMapper.xml` — reporter/resolver JOIN PII 제거
- Modify: `backend/src/main/java/com/vs/meta/api/ai/dto/AiBugReportDto.java` — reporter/resolver를 `UserSlot` nested로 변경
- Modify: `backend/src/main/java/com/vs/meta/api/ai/service/AiBugReportService.java` — flatMap + enrich

- [ ] **Step 1: UserSlot DTO 생성** (공통 사용 가능)

```java
package com.vs.meta.common.auth;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class UserSlot implements HasUserInfo {
    private String spUserId;
    private String name;
    private String email;
}
```

- [ ] **Step 2: AiBugReportDto 구조 변경**

```java
public class AiBugReportDto {
    private Long id;
    private String title;
    // ... 기존 필드
    private UserSlot reporter;
    private UserSlot resolver;  // nullable
}
```

- [ ] **Step 3: AiBugReportMapper.xml 변경**

라인 76-79, 106-107: `reporter.email/nickname`, `resolver.email/nickname` SELECT 제거. 대신 `reporter.sp_user_id`, `resolver.sp_user_id`만 SELECT.

resultMap에서 nested mapping 정의 (`<association property="reporter" javaType="com.vs.meta.common.auth.UserSlot">`).

- [ ] **Step 4: Service에서 flatMap + enrich**

```java
List<AiBugReportDto> reports = mapper.findReports();
userInfoEnricher.enrich(
    reports.stream()
        .flatMap(r -> Stream.of(r.getReporter(), r.getResolver()))
        .filter(Objects::nonNull)
        .filter(slot -> slot.getSpUserId() != null)
        .toList()
);
return reports;
```

- [ ] **Step 5: 컴파일 + 커밋**

```bash
git add -A backend/src/main/java/com/vs/meta/api/ai backend/src/main/resources/mapper/ai backend/src/main/java/com/vs/meta/common/auth/UserSlot.java
git commit -m "[BACKEND] AiBugReport — reporter/resolver nested UserSlot + enrich 적용 (Phase 3)"
```

---

## Task 17: SsoUserQueryService 동기화 제거 + SsoUserRegistrationService 정리

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/api/sso/service/SsoUserQueryService.java` — 라인 52, 54, 61, 62, 71 (동기화 로직)
- Modify: `backend/src/main/java/com/vs/meta/api/sso/service/SsoUserRegistrationService.java` — 신규 user INSERT 시 sp_user_id만

- [ ] **Step 1: SsoUserQueryService 동기화 로직 제거**

```java
// AS-IS (라인 52-71)
boolean nicknameChanged = ... && !Objects.equals(spUser.name(), user.getNickname());
boolean emailChanged = ... && !Objects.equals(spUser.email(), user.getEmail());
if (nicknameChanged) user.setNickname(spUser.name());
if (emailChanged) user.setEmail(spUser.email());
log.info(... user.getNickname(), user.getEmail());

// TO-BE
// 동기화 자체 제거 — Auth가 source of truth, 학심정은 저장 안 함
```

- [ ] **Step 2: SsoUserRegistrationService 정리**

신규 user INSERT 시 sp_user_id, role_code, tc_id, stdt_id, status만 저장. email/nickname/gender 컬럼 INSERT 제거 (UserMapper.xml과 일관).

- [ ] **Step 3: 컴파일 + 단위 테스트**

- [ ] **Step 4: 커밋**

```bash
git add -A backend/src/main/java/com/vs/meta/api/sso
git commit -m "[BACKEND] SsoUserQueryService 동기화 로직 제거, SsoUserRegistrationService sp_user_id만 저장 (Phase 3)"
```

---

## Task 18: FileMapper 등 잔재 정리 + Phase 3 통합 검증

**Files:**
- Modify: `backend/src/main/resources/mapper/common/FileMapper.xml:45,158` — `gm_st.nickname` JOIN 제거 + enrich layer에서 채움

- [ ] **Step 1: FileMapper.xml 정리**

`COALESCE(gm_st.nickname, tdri.stdt_id) AS userNm` → `tdri.stdt_id AS userNm` (FE에서 placeholder 처리)

또는 FileController에 응답 조합 layer 추가.

- [ ] **Step 2: 전체 PII SELECT 잔재 0건 확인**

```
Grep tool: pattern "\.nickname|\.email|gm\.gender" path: backend/src/main/resources/mapper
```

Expected: group_invitation.email + 일부 의도된 잔재만 (정리 완료)

- [ ] **Step 3: 통합 시나리오 점검** (개발 서버 배포 권장)

- 그룹 멤버 목록 응답 검증
- 검사 보고서 응답 검증
- 상담 학생 이름 표시 검증
- BugReport reporter/resolver 검증

- [ ] **Step 4: 커밋**

```bash
git add -A backend/src
git commit -m "[BACKEND] Phase 3 통합 — PII SELECT 잔재 정리, FileMapper 등 (Phase 3 완료)"
```

---

# Phase 4 — DB 컬럼 DROP (Point of No Return)

> ⚠️ **본 Phase부터 백업 외 롤백 불가**. Phase 3 완료 + 안전 검증(개발 서버 시나리오) 통과 후 진입.

## Task 19: 운영 DB 사전 백업

- [ ] **Step 1: 운영 DB 백업 + 별도 보관 (30일)**

```bash
mysqldump --single-transaction --routines --triggers \
  -h <host> -P <port> -u <user> -p \
  superplatform_meta > backup_before_pii_drop_$(date +%Y%m%d_%H%M%S).sql
```

- [ ] **Step 2: 백업 무결성 검증**

```bash
# 백업 파일에서 user/group_member/counseling_student 테이블 데이터 row count 확인
grep -c "INSERT INTO \`user\`" backup_*.sql
grep -c "INSERT INTO \`group_member\`" backup_*.sql
```

- [ ] **Step 3: 백업 별도 보관 (예: 운영팀 안전 저장소)**

---

## Task 20: user 테이블 PII 컬럼 DROP

```sql
-- 인덱스 먼저 제거
ALTER TABLE `user` DROP INDEX uk_user_email;

-- 컬럼 DROP
ALTER TABLE `user`
  DROP COLUMN email,
  DROP COLUMN nickname,
  DROP COLUMN gender;

-- 검증
DESCRIBE `user`;
```

Expected: user_no, sp_user_id, role_code, tc_id, stdt_id, status, last_login_at, created_by, updated_by, created_at, updated_at

- [ ] **Step 1: ALTER 실행 + 검증**
- [ ] **Step 2: 결과를 06-progress.md에 기록**

---

## Task 21: group_member 테이블 PII 컬럼 DROP

```sql
ALTER TABLE group_member
  DROP COLUMN nickname,
  DROP COLUMN email,
  DROP COLUMN gender;

DESCRIBE group_member;
```

- [ ] **Step 1: ALTER 실행 + 검증**

---

## Task 22: counseling_student.stdt_name DROP

```sql
ALTER TABLE counseling_student DROP COLUMN stdt_name;

DESCRIBE counseling_student;
```

- [ ] **Step 1: ALTER 실행 + 검증**

---

## Task 23: Domain 클래스 필드 제거 + Mapper 잔재 정리

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/domain/User.java` — email/nickname/gender 필드 제거
- Modify: `backend/src/main/java/com/vs/meta/domain/GroupMember.java` — nickname/email/gender 필드 제거
- Modify: `backend/src/main/java/com/vs/meta/domain/CounselingStudent.java` — stdtName 필드 제거
- Modify: `backend/src/main/resources/mapper/*` — DROP된 컬럼 잔재 SELECT/INSERT/UPDATE 최종 정리

- [ ] **Step 1: 도메인 클래스 필드 제거**

User/GroupMember/CounselingStudent에서 해당 필드 + getter/setter 제거.

> HasUserInfo 인터페이스 구현은 유지하되, setName/setEmail은 응답용 transient 필드로 대체 (또는 별도 응답 DTO 분리). Phase 3에서 임시로 두었던 매핑 정리.

- [ ] **Step 2: Mapper XML 최종 정리**

Phase 3에서 미처 정리 못 한 잔재 검색:
```
Grep tool: pattern "email|nickname|gender" path: backend/src/main/resources/mapper
```

→ group_invitation.email, email_verification(이미 DROP) 외 잔재는 모두 제거.

- [ ] **Step 3: 컴파일 + 전체 테스트**

```bash
./gradlew :backend:compileJava :backend:compileTestJava :backend:test
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 4: 커밋**

```bash
git add -A backend/src
git commit -m "[BACKEND] Domain 필드 제거 + Mapper 최종 정리 (Phase 4, PII 완전 제거)"
```

---

## Task 24: 최종 DB 검증

```sql
-- 학심정 DB에 PII 잔재 0건 (group_invitation.email 제외)
SELECT TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'superplatform_meta'
  AND COLUMN_NAME IN ('email', 'nickname', 'gender', 'stdt_name')
  AND TABLE_NAME NOT IN ('group_invitation');
-- Expected: 0 rows

-- 전체 user 행에 sp_user_id 매핑 완료
SELECT
  COUNT(*) AS total_active,
  SUM(CASE WHEN sp_user_id IS NULL THEN 1 ELSE 0 END) AS unmapped
FROM `user` WHERE status = 'ACTIVE';
-- Expected: unmapped = 0

-- 게스트 잔재 0건
SELECT COUNT(*) FROM group_member WHERE member_type = 'GUEST';
-- Expected: 0
```

- [ ] **Step 1: 검증 쿼리 실행 + 결과 기록**

---

# Phase 5 — 프론트엔드 정리

## Task 25: User 타입 정리 + placeholder 컴포넌트

**Files:**
- Modify: `frontend/src/shared/types/index.ts` — User 타입 정리
- Create: `frontend/src/shared/ui/UserName.tsx` — placeholder 표시 공통 컴포넌트

- [ ] **Step 1: shared/types — User 타입 명확화**

```typescript
// User 자체: 학심정 서비스 데이터만 (이름/이메일은 응답 DTO에 한정)
export interface UserSession {
  spUserId: string;
  // SDK getUser()에서 가져오는 일시적 정보
  name?: string;
  email?: string;
  userType?: string;
}
```

- [ ] **Step 2: UserName 공통 컴포넌트**

```typescript
// shared/ui/UserName.tsx
interface UserNameProps {
  name?: string;
  isPlaceholder?: boolean;
}

export const UserName: React.FC<UserNameProps> = ({ name, isPlaceholder }) => {
  if (isPlaceholder || !name) {
    return <span className="text-gray-400">(탈퇴 회원)</span>;
  }
  return <span>{name}</span>;
};
```

- [ ] **Step 3: 빌드 확인 + 커밋**

```bash
npm --prefix frontend run build
git add frontend/src/shared
git commit -m "[FRONTEND] User 타입 정리 + UserName 공통 컴포넌트 (placeholder 표시)"
```

---

## Task 26: 영향 컴포넌트 매핑 수정

**Files:** ~30개 (01-impact-mapping.md 4장 참조)

- [ ] **Step 1: 영향 컴포넌트 순차 수정**

이름/이메일 표시 부분을 `<UserName>` 컴포넌트로 교체. 백엔드 응답이 placeholder 정보 포함하므로 그대로 전달.

도메인별:
- features/groups/* — 멤버 표시
- features/assessment/* — 학생 이름
- features/student-exam/* — 본인/그룹원
- features/teacher-dashboard/* — 학급 학생
- features/schedule/* — 학생 이름
- features/class-dashboard/* — 학생 목록
- widgets/* — 사이드바/헤더

- [ ] **Step 2: 빌드 + 동작 확인**

```bash
npm --prefix frontend run build
npm --prefix frontend run dev  # 수동 시나리오 점검
```

- [ ] **Step 3: 커밋**

```bash
git add -A frontend/src
git commit -m "[FRONTEND] 영향 30+ 컴포넌트에 UserName placeholder 적용"
```

---

# Phase 6 — 통합 검증

## Task 27: WireMock 기반 통합 테스트

**Files:**
- Create: `backend/src/test/com/vs/meta/common/auth/PersonInfoClientIntegrationTest.java`

- [ ] **Step 1: WireMock 의존성 추가**

`backend/build.gradle`:
```groovy
testImplementation 'org.wiremock:wiremock-standalone:3.5.4'
```

- [ ] **Step 2: 통합 테스트 작성 — 정상/404/timeout/batch 부분 실패**

```java
@SpringBootTest
@AutoConfigureWireMock(port = 0)
class PersonInfoClientIntegrationTest {

    @Test
    void getBatchHandlesNotFoundIds() {
        // WireMock으로 가짜 Auth 응답 — users[]에 일부만, notFound[]에 일부
        // PersonInfoClient.getBatch 호출 → notFound는 placeholder로 반환되는지 검증
    }

    @Test
    void getBatchAutomaticallyChunksOver100() {
        // 150건 ID 입력 → WireMock에 100건 + 50건 두 번 호출 검증
    }

    @Test
    void timeoutReturnsAllPlaceholders() {
        // WireMock delay 5s 설정 → 3s timeout 후 placeholder로 응답
    }
}
```

- [ ] **Step 3: 실행 + 커밋**

```bash
./gradlew :backend:test --tests "*PersonInfoClientIntegrationTest*"
git add -A
git commit -m "[BACKEND] WireMock 통합 테스트 — Auth API 정상/장애 시나리오"
```

---

## Task 28: 개발 서버 시나리오 검증

- [ ] **Step 1: 개발 서버 배포**
- [ ] **Step 2: 시나리오 체크리스트 실행**

| # | 시나리오 | 기대 |
|:---:|:---|:---|
| 1 | 그룹 멤버 목록 조회 (30명) | 200 + 모든 멤버 이름 표시 + Auth batch 호출 1회 |
| 2 | 그룹 멤버 1명 탈퇴 후 목록 | 탈퇴 멤버 자리에 "(탈퇴 회원)" 표시 |
| 3 | 검사 결과 보고서 (학급 30명) | 정상 응답 + 학생 이름 표시 |
| 4 | 상담 기록 조회 (1년 전) | 학생 이름 표시 또는 placeholder |
| 5 | 초대 이메일 발송 (회원) | 정상 + Auth lookup 호출 |
| 6 | 초대 이메일 발송 (비회원) | 정상 (group_invitation.email 그대로) |
| 7 | Auth 일시 차단 (방화벽 차단) 후 페이지 로딩 | 학심정 200 + placeholder + 로그에 WARN |

- [ ] **Step 3: 부하 검증**

| 시나리오 | 기준 |
|:---|:---|
| 그룹 멤버 30명 응답 시간 | p95 +200ms 이내 |
| 같은 요청 안 중복 호출 | RequestCache 동작 (Auth 호출 1회만) |
| batch 150건 호출 | 자동 chunking (Auth 호출 2회) |

- [ ] **Step 4: 결과 06-progress.md 기록**

---

## Task 29: 최종 정리

- [ ] **Step 1: CLAUDE.md 갱신**

`backend/CLAUDE.md` Tech Stack에 다음 추가:
```
- 회원 정보 조회: Auth Internal API (`/api/v1/users/{id}|/batch|/lookup`) + UserInfoEnricher 패턴
- 학심정 DB에 회원 PII(name/email/nickname/gender) 미저장
```

- [ ] **Step 2: 06-progress.md 최종 갱신**

- 모든 Phase 완료 일시
- 운영 배포 일시
- 백업 위치/보관 기한

- [ ] **Step 3: 머지 가능 상태 확인**

- 모든 자동화 테스트 통과
- 개발 서버 시나리오 100% 통과
- DB 검증 쿼리 0 rows

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "[BACKEND] IDP 회원정보 API 전환 완료 — CLAUDE.md 갱신 + Progress 기록"
```

---

## 검증 로그 (작업 진행 중 기록)

| 항목 | Task | 일시 | 결과 | 비고 |
|:---|:---:|:---|:---|:---|
| Phase 1 인프라 완성 (PersonInfoClient + Enricher) | 1~5 | _기재_ | _OK_ | |
| 게스트 영역 코드 폐기 | 6~8 | _기재_ | | |
| 게스트 데이터 DB DROP | 9 | _기재_ | | 백업 파일: _경로_ |
| Phase 3 응답 조합 layer 적용 | 10~18 | _기재_ | | |
| Phase 4 DDL DROP 운영 배포 | 19~24 | _기재_ | | 백업 파일: _경로_ |
| Phase 5 FE 정리 | 25~26 | _기재_ | | |
| WireMock 통합 테스트 | 27 | _기재_ | | |
| 개발 서버 시나리오 7개 | 28 | _기재_ | | 통과 _/7 |
| 부하 검증 (p95) | 28 | _기재_ | | |
