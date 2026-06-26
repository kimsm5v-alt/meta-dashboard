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
}
