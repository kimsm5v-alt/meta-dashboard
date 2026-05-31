package com.vs.meta.common.auth;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.vs.meta.common.config.SpAuthProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * PersonInfoClient + ServiceAccessTokenProvider 통합 테스트.
 *
 * <p>WireMock 으로 Auth 서버 가짜 응답을 띄우고 client_credentials grant + /users/{id} + /users/batch + /users/lookup
 * 의 실제 HTTP 호출 흐름을 검증한다. PersonInfoClientImpl 의 placeholder fallback(404/timeout) + batch chunking(100 초과) 도 함께 검증.
 */
class PersonInfoClientIntegrationTest {

    private static final String CLIENT_ID = "test-service";
    private static final String CLIENT_SECRET = "test-secret-1234!";
    private static final String SCOPE = "users:read";

    private WireMockServer wireMock;
    private PersonInfoClient client;
    private ServiceAccessTokenProvider tokenProvider;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        wireMock.start();

        // SpAuthProperties 수동 구성
        SpAuthProperties props = new SpAuthProperties();
        props.setServerUrl(wireMock.baseUrl());
        props.setClientId(CLIENT_ID);
        props.setClientSecret(CLIENT_SECRET);
        SpAuthProperties.InternalApi internalApi = new SpAuthProperties.InternalApi();
        internalApi.setBaseUrl(wireMock.baseUrl() + "/api/v1");
        internalApi.setServiceTokenScope(SCOPE);
        internalApi.setConnectTimeoutMs(2000);
        internalApi.setReadTimeoutMs(3000);
        props.setInternalApi(internalApi);

        // ServiceAccessTokenProvider: RestClient.Builder는 기본 인스턴스로
        tokenProvider = new ServiceAccessTokenProvider(props, RestClient.builder());

        // PersonInfoClientImpl: 전용 RestClient + tokenProvider
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(2000));
        factory.setReadTimeout(Duration.ofMillis(3000));
        RestClient restClient = RestClient.builder()
                .baseUrl(internalApi.getBaseUrl())
                .requestFactory(factory)
                .build();
        client = new PersonInfoClientImpl(restClient, tokenProvider);

        // 토큰 발급 stub (모든 테스트에서 공통)
        wireMock.stubFor(post(urlEqualTo("/oauth2/token"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"access_token\":\"test-token-12345\",\"token_type\":\"Bearer\",\"expires_in\":3600,\"scope\":\"users:read\"}")));
    }

    @AfterEach
    void tearDown() {
        if (wireMock != null) wireMock.stop();
    }

    // ─────────────────────────────────────────────────────────
    // getOne
    // ─────────────────────────────────────────────────────────

    @Test
    void getOne_returnsUserInfoOnSuccess() {
        wireMock.stubFor(get(urlEqualTo("/api/v1/users/sp-123"))
                .withHeader("Authorization", equalTo("Bearer test-token-12345"))
                .willReturn(okJson("{\"success\":true,\"data\":{\"publicUserId\":\"sp-123\",\"name\":\"홍길동\",\"nickname\":\"길동\",\"email\":\"hong@test.com\",\"userType\":\"STUDENT\",\"status\":\"ACTIVE\"}}")));

        UserInfo info = client.getOne("sp-123");

        assertThat(info.publicUserId()).isEqualTo("sp-123");
        assertThat(info.name()).isEqualTo("홍길동");
        assertThat(info.email()).isEqualTo("hong@test.com");
        assertThat(info.placeholder()).isFalse();
    }

    @Test
    void getOne_returnsPlaceholderOn404() {
        wireMock.stubFor(get(urlEqualTo("/api/v1/users/sp-deleted"))
                .willReturn(aResponse().withStatus(404)));

        UserInfo info = client.getOne("sp-deleted");

        assertThat(info.placeholder()).isTrue();
        assertThat(info.name()).isEqualTo("(탈퇴 회원)");
    }

    @Test
    void getOne_returnsPlaceholderOn500() {
        wireMock.stubFor(get(urlEqualTo("/api/v1/users/sp-error"))
                .willReturn(aResponse().withStatus(500)));

        UserInfo info = client.getOne("sp-error");

        assertThat(info.placeholder()).isTrue();
    }

    @Test
    void getOne_returnsPlaceholderForBlankInput() {
        UserInfo info = client.getOne("");
        assertThat(info.placeholder()).isTrue();
    }

    // ─────────────────────────────────────────────────────────
    // getBatch
    // ─────────────────────────────────────────────────────────

    @Test
    void getBatch_returnsUsersAndPlaceholdersForNotFound() {
        wireMock.stubFor(post(urlEqualTo("/api/v1/users/batch"))
                .willReturn(okJson("{\"success\":true,\"data\":{\"users\":[{\"publicUserId\":\"sp-1\",\"name\":\"A\",\"email\":\"a@x\",\"userType\":\"STUDENT\",\"status\":\"ACTIVE\"}],\"notFound\":[\"sp-2\"]}}")));

        Map<String, UserInfo> result = client.getBatch(List.of("sp-1", "sp-2"));

        assertThat(result).hasSize(2);
        assertThat(result.get("sp-1").placeholder()).isFalse();
        assertThat(result.get("sp-1").name()).isEqualTo("A");
        assertThat(result.get("sp-2").placeholder()).isTrue();
    }

    @Test
    void getBatch_chunksOver100Items() {
        wireMock.stubFor(post(urlEqualTo("/api/v1/users/batch"))
                .willReturn(okJson("{\"success\":true,\"data\":{\"users\":[],\"notFound\":[]}}")));

        // 150건 입력
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < 150; i++) ids.add("sp-" + i);

        Map<String, UserInfo> result = client.getBatch(ids);

        // chunking 확인: 100 + 50 = 2회 호출
        wireMock.verify(2, postRequestedFor(urlEqualTo("/api/v1/users/batch")));
        // 모든 ID는 응답에 placeholder 로 채워져 있음 (가짜 서버가 빈 users 반환)
        assertThat(result).hasSize(150);
        assertThat(result.values()).allMatch(UserInfo::placeholder);
    }

    @Test
    void getBatch_returnsEmptyMapForEmptyInput() {
        Map<String, UserInfo> result = client.getBatch(List.of());
        assertThat(result).isEmpty();
        wireMock.verify(0, postRequestedFor(urlEqualTo("/api/v1/users/batch")));
    }

    @Test
    void getBatch_fillsAllPlaceholdersOnException() {
        wireMock.stubFor(post(urlEqualTo("/api/v1/users/batch"))
                .willReturn(aResponse().withStatus(503)));

        Map<String, UserInfo> result = client.getBatch(List.of("sp-1", "sp-2"));

        assertThat(result).hasSize(2);
        assertThat(result.values()).allMatch(UserInfo::placeholder);
    }

    // ─────────────────────────────────────────────────────────
    // lookupByEmail
    // ─────────────────────────────────────────────────────────

    @Test
    void lookupByEmail_returnsUserInfoOnSuccess() {
        wireMock.stubFor(post(urlEqualTo("/api/v1/users/lookup"))
                .willReturn(okJson("{\"success\":true,\"data\":{\"publicUserId\":\"sp-found\",\"name\":\"찾은회원\",\"userType\":\"TEACHER\"}}")));

        Optional<UserInfo> info = client.lookupByEmail("found@test.com");

        assertThat(info).isPresent();
        assertThat(info.get().publicUserId()).isEqualTo("sp-found");
        assertThat(info.get().email()).isEqualTo("found@test.com");  // 요청한 email 그대로 채움
    }

    @Test
    void lookupByEmail_returnsEmptyOn404() {
        wireMock.stubFor(post(urlEqualTo("/api/v1/users/lookup"))
                .willReturn(aResponse().withStatus(404)));

        Optional<UserInfo> info = client.lookupByEmail("notfound@test.com");

        assertThat(info).isEmpty();
    }

    @Test
    void lookupByEmail_returnsEmptyForBlankInput() {
        Optional<UserInfo> info = client.lookupByEmail("");
        assertThat(info).isEmpty();
    }

    // ─────────────────────────────────────────────────────────
    // Service AT token caching
    // ─────────────────────────────────────────────────────────

    @Test
    void serviceToken_isCachedAcrossMultipleCalls() {
        wireMock.stubFor(get(urlMatching("/api/v1/users/.*"))
                .willReturn(okJson("{\"success\":true,\"data\":{\"publicUserId\":\"sp-x\",\"name\":\"X\"}}")));

        // 3번 호출 — 토큰은 한 번만 발급되어야 함 (캐시)
        client.getOne("sp-1");
        client.getOne("sp-2");
        client.getOne("sp-3");

        wireMock.verify(1, postRequestedFor(urlEqualTo("/oauth2/token")));
        wireMock.verify(3, getRequestedFor(urlMatching("/api/v1/users/.*")));
    }

    @Test
    void serviceToken_isIssuedWithCorrectFormBody() {
        wireMock.stubFor(get(urlEqualTo("/api/v1/users/sp-x"))
                .willReturn(okJson("{\"success\":true,\"data\":{\"publicUserId\":\"sp-x\"}}")));

        client.getOne("sp-x");

        // Spring RestClient 는 form body 를 percent-encode 함: ':' → %3A, '!' → %21
        wireMock.verify(postRequestedFor(urlEqualTo("/oauth2/token"))
                .withHeader("Content-Type", containing("application/x-www-form-urlencoded"))
                .withRequestBody(containing("grant_type=client_credentials"))
                .withRequestBody(containing("client_id=" + CLIENT_ID))
                .withRequestBody(containing("scope=users%3Aread")));
    }
}
