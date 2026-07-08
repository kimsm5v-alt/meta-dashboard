package com.vs.meta.api.sso.controller;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.vs.meta.common.config.SpAuthProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.reactive.function.client.WebClient;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * AuthProxyController DPoP 헤더 패스스루 단위 테스트.
 *
 * <p>WireMock 으로 Auth 서버를 모사하고, token/refresh 요청에 DPoP 헤더가
 * 올바르게 전달되는지(있을 때) / 전달되지 않는지(없을 때)를 검증한다.
 * logout 등 다른 메서드는 변경 없으므로 이 테스트에서 다루지 않는다.
 */
class AuthProxyControllerDpopTest {

    private static final String CLIENT_ID = "test-client";
    private static final String CLIENT_SECRET = "test-secret";
    private static final String DPOP_PROOF = "eyJhbGciOiJFUzI1NiJ9.eyJodG0iOiJQT1NUIn0.sig";

    private WireMockServer wireMock;
    private AuthProxyController controller;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        wireMock.start();

        SpAuthProperties spAuth = new SpAuthProperties();
        spAuth.setServerUrl(wireMock.baseUrl());
        spAuth.setClientId(CLIENT_ID);
        spAuth.setClientSecret(CLIENT_SECRET);

        WebClient webClient = WebClient.builder()
                .baseUrl(wireMock.baseUrl())
                .build();

        controller = new AuthProxyController(spAuth, webClient);
    }

    @AfterEach
    void tearDown() {
        if (wireMock != null) wireMock.stop();
    }

    // ─────────────────────────────────────────────────────
    // token — DPoP 있음
    // ─────────────────────────────────────────────────────

    @Test
    @DisplayName("token — DPoP 헤더가 있으면 Auth 서버 호출에 그대로 전달된다")
    void token_forwardsDpopHeaderWhenPresent() {
        wireMock.stubFor(post(urlEqualTo("/oauth2/token"))
                .willReturn(okJson("{\"access_token\":\"at-1\",\"refreshToken\":\"rt-1\",\"refreshExpiresIn\":3600}")));

        var req = new MockHttpServletRequest();
        req.addHeader("DPoP", DPOP_PROOF);
        var res = new MockHttpServletResponse();

        var body = java.util.Map.of(
                "code", "auth-code-123",
                "codeVerifier", "verifier-abc",
                "redirectUri", "https://app.example.com/callback"
        );

        var result = controller.token(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        wireMock.verify(postRequestedFor(urlEqualTo("/oauth2/token"))
                .withHeader("DPoP", equalTo(DPOP_PROOF)));
    }

    // ─────────────────────────────────────────────────────
    // token — DPoP 없음
    // ─────────────────────────────────────────────────────

    @Test
    @DisplayName("token — DPoP 헤더가 없으면 Auth 서버 호출에 DPoP 미포함된다")
    void token_doesNotAddDpopHeaderWhenAbsent() {
        wireMock.stubFor(post(urlEqualTo("/oauth2/token"))
                .willReturn(okJson("{\"access_token\":\"at-2\",\"refreshToken\":\"rt-2\",\"refreshExpiresIn\":3600}")));

        var req = new MockHttpServletRequest();
        // DPoP 헤더 미설정
        var res = new MockHttpServletResponse();

        var body = java.util.Map.of(
                "code", "auth-code-456",
                "codeVerifier", "verifier-def",
                "redirectUri", "https://app.example.com/callback"
        );

        var result = controller.token(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        wireMock.verify(postRequestedFor(urlEqualTo("/oauth2/token"))
                .withoutHeader("DPoP"));
    }

    // ─────────────────────────────────────────────────────
    // refresh — DPoP 있음
    // ─────────────────────────────────────────────────────

    @Test
    @DisplayName("refresh — DPoP 헤더가 있으면 Auth 서버 호출에 그대로 전달된다")
    void refresh_forwardsDpopHeaderWhenPresent() {
        wireMock.stubFor(post(urlEqualTo("/api/v1/auth/refresh"))
                .willReturn(okJson("{\"success\":true,\"data\":{\"accessToken\":\"at-new\",\"refreshToken\":\"rt-new\",\"refreshExpiresIn\":3600}}")));

        var req = new MockHttpServletRequest();
        req.addHeader("DPoP", DPOP_PROOF);
        // RT 를 쿠키 대신 body 로 전달 (MockHttpServletRequest 에서 쿠키 설정이 더 복잡)
        var body = java.util.Map.of("refreshToken", "rt-existing");
        var res = new MockHttpServletResponse();

        var result = controller.refresh(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        wireMock.verify(postRequestedFor(urlEqualTo("/api/v1/auth/refresh"))
                .withHeader("DPoP", equalTo(DPOP_PROOF)));
    }

    // ─────────────────────────────────────────────────────
    // refresh — DPoP 없음
    // ─────────────────────────────────────────────────────

    @Test
    @DisplayName("refresh — DPoP 헤더가 없으면 Auth 서버 호출에 DPoP 미포함된다")
    void refresh_doesNotAddDpopHeaderWhenAbsent() {
        wireMock.stubFor(post(urlEqualTo("/api/v1/auth/refresh"))
                .willReturn(okJson("{\"success\":true,\"data\":{\"accessToken\":\"at-new2\",\"refreshToken\":\"rt-new2\",\"refreshExpiresIn\":3600}}")));

        var req = new MockHttpServletRequest();
        // DPoP 헤더 미설정
        var body = java.util.Map.of("refreshToken", "rt-legacy");
        var res = new MockHttpServletResponse();

        var result = controller.refresh(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        wireMock.verify(postRequestedFor(urlEqualTo("/api/v1/auth/refresh"))
                .withoutHeader("DPoP"));
    }

    // ─────────────────────────────────────────────────────
    // DPoP-Nonce 응답 relay (RFC 9449 §8)
    // ─────────────────────────────────────────────────────

    @Test
    @DisplayName("token — Auth 응답의 DPoP-Nonce 헤더를 브라우저 응답으로 relay 한다 (성공)")
    void token_relaysDpopNonceOnSuccess() {
        wireMock.stubFor(post(urlEqualTo("/oauth2/token"))
                .willReturn(okJson("{\"access_token\":\"at-1\",\"refreshToken\":\"rt-1\",\"refreshExpiresIn\":3600}")
                        .withHeader("DPoP-Nonce", "nonce-success-1")));

        var req = new MockHttpServletRequest();
        req.addHeader("DPoP", DPOP_PROOF);
        var res = new MockHttpServletResponse();

        var body = java.util.Map.of(
                "code", "auth-code-123",
                "codeVerifier", "verifier-abc",
                "redirectUri", "https://app.example.com/callback"
        );

        var result = controller.token(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getHeader("DPoP-Nonce")).isEqualTo("nonce-success-1");
    }

    @Test
    @DisplayName("token — 401 nonce 챌린지 시 DPoP-Nonce 를 relay 하고 상태코드를 전파한다")
    void token_relaysDpopNonceOnChallenge() {
        wireMock.stubFor(post(urlEqualTo("/oauth2/token"))
                .willReturn(aResponse().withStatus(401)
                        .withHeader("DPoP-Nonce", "nonce-challenge-1")
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"success\":false}")));

        var req = new MockHttpServletRequest();
        req.addHeader("DPoP", DPOP_PROOF);
        var res = new MockHttpServletResponse();

        var body = java.util.Map.of(
                "code", "auth-code-123",
                "codeVerifier", "verifier-abc",
                "redirectUri", "https://app.example.com/callback"
        );

        var result = controller.token(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(res.getHeader("DPoP-Nonce")).isEqualTo("nonce-challenge-1");
    }

    @Test
    @DisplayName("token — nonce 챌린지(401 + DPoP-Nonce)는 사유를 'dpop nonce required' 로 구분해 반환한다")
    void token_nonceChallengeReturnsDpopNonceRequiredMessage() {
        wireMock.stubFor(post(urlEqualTo("/oauth2/token"))
                .willReturn(aResponse().withStatus(401)
                        .withHeader("DPoP-Nonce", "nonce-challenge-1")
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"success\":false}")));

        var req = new MockHttpServletRequest();
        req.addHeader("DPoP", DPOP_PROOF);
        var res = new MockHttpServletResponse();

        var body = java.util.Map.of(
                "code", "auth-code-123",
                "codeVerifier", "verifier-abc",
                "redirectUri", "https://app.example.com/callback"
        );

        var result = controller.token(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(result.getBody()).isInstanceOf(java.util.Map.class);
        assertThat(((java.util.Map<?, ?>) result.getBody()).get("message")).isEqualTo("dpop nonce required");
    }

    @Test
    @DisplayName("token — nonce 없는 실패(진짜 교환 실패)는 기존대로 'token exchange failed' 를 반환한다")
    void token_plainFailureReturnsGenericMessage() {
        wireMock.stubFor(post(urlEqualTo("/oauth2/token"))
                .willReturn(aResponse().withStatus(401)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"error\":\"invalid_grant\"}")));

        var req = new MockHttpServletRequest();
        req.addHeader("DPoP", DPOP_PROOF);
        var res = new MockHttpServletResponse();

        var body = java.util.Map.of(
                "code", "auth-code-123",
                "codeVerifier", "verifier-abc",
                "redirectUri", "https://app.example.com/callback"
        );

        var result = controller.token(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(res.getHeader("DPoP-Nonce")).isNull();
        assertThat(result.getBody()).isInstanceOf(java.util.Map.class);
        assertThat(((java.util.Map<?, ?>) result.getBody()).get("message")).isEqualTo("token exchange failed");
    }

    @Test
    @DisplayName("refresh — Auth 응답의 DPoP-Nonce 헤더를 브라우저 응답으로 relay 한다 (성공)")
    void refresh_relaysDpopNonceOnSuccess() {
        wireMock.stubFor(post(urlEqualTo("/api/v1/auth/refresh"))
                .willReturn(okJson("{\"success\":true,\"data\":{\"accessToken\":\"at-new\",\"refreshToken\":\"rt-new\",\"refreshExpiresIn\":3600}}")
                        .withHeader("DPoP-Nonce", "nonce-refresh-1")));

        var req = new MockHttpServletRequest();
        req.addHeader("DPoP", DPOP_PROOF);
        var body = java.util.Map.of("refreshToken", "rt-existing");
        var res = new MockHttpServletResponse();

        var result = controller.refresh(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getHeader("DPoP-Nonce")).isEqualTo("nonce-refresh-1");
    }

    @Test
    @DisplayName("refresh — 401 nonce 챌린지 시 RT 쿠키를 지우지 않고 nonce 를 relay 한다")
    void refresh_nonceChallengeDoesNotClearCookieAndRelaysNonce() {
        wireMock.stubFor(post(urlEqualTo("/api/v1/auth/refresh"))
                .willReturn(aResponse().withStatus(401)
                        .withHeader("DPoP-Nonce", "nonce-refresh-challenge")
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"success\":false}")));

        var req = new MockHttpServletRequest();
        req.addHeader("DPoP", DPOP_PROOF);
        var body = java.util.Map.of("refreshToken", "rt-existing");
        var res = new MockHttpServletResponse();

        var result = controller.refresh(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(res.getHeader("DPoP-Nonce")).isEqualTo("nonce-refresh-challenge");
        // nonce 챌린지는 RT 무효가 아니다 — RT 쿠키를 지우면 SDK 재시도가 RT 없이 나가 로그아웃된다.
        assertThat(clearsRtCookie(res)).isFalse();
    }

    @Test
    @DisplayName("refresh — nonce 없는 401(진짜 RT 무효)은 기존대로 RT 쿠키를 지운다")
    void refresh_plainUnauthorizedClearsCookie() {
        wireMock.stubFor(post(urlEqualTo("/api/v1/auth/refresh"))
                .willReturn(aResponse().withStatus(401)
                        .withHeader("Content-Type", "application/json")
                        .withBody("{\"success\":false}")));

        var req = new MockHttpServletRequest();
        req.addHeader("DPoP", DPOP_PROOF);
        var body = java.util.Map.of("refreshToken", "rt-existing");
        var res = new MockHttpServletResponse();

        var result = controller.refresh(body, req, res);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(res.getHeader("DPoP-Nonce")).isNull();
        assertThat(clearsRtCookie(res)).isTrue();
    }

    /** 응답 Set-Cookie 중 RT 쿠키를 만료(Max-Age=0)시키는 헤더가 있는지 */
    private static boolean clearsRtCookie(MockHttpServletResponse res) {
        return res.getHeaders("Set-Cookie").stream()
                .anyMatch(h -> h.startsWith("RT=") && h.contains("Max-Age=0"));
    }
}
