package com.vs.meta.api.sso.controller;

import com.vs.meta.common.config.SpAuthProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * SuperPlatform Auth 서버 프록시 (BFF 역할).
 * SDK가 브라우저에서 호출하며, client_secret을 추가하여 Auth 서버에 전달한다.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
@Tag(name = "SSO Auth 프록시", description = "SuperPlatform Auth 서버 프록시 (SDK용)")
public class AuthProxyController {

    private final SpAuthProperties spAuth;
    private static final int RT_COOKIE_MAX_AGE_FALLBACK = 7 * 24 * 60 * 60;

    // ─────────────────────────────────────────────────────
    // 1) 토큰 교환 — OAuth2 code → AT + RT
    // ─────────────────────────────────────────────────────
    @PostMapping("/token")
    @Operation(summary = "토큰 교환", description = "Authorization Code → Access Token + Refresh Token")
    public ResponseEntity<?> token(@RequestBody Map<String, String> body,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "authorization_code");
        form.add("code", body.get("code"));
        form.add("client_id", spAuth.getClientId());
        form.add("client_secret", spAuth.getClientSecret());
        form.add("code_verifier", body.get("codeVerifier"));
        form.add("redirect_uri", body.get("redirectUri"));

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> tokens = WebClient.create(spAuth.getServerUrl())
                    .post()
                    .uri("/oauth2/token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue(form)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            setRefreshTokenCookie(request, response, (String) tokens.get("refreshToken"), resolveRefreshExpiresIn(tokens));
            return ResponseEntity.ok(Map.of("success", true, "data", tokens));
        } catch (WebClientResponseException e) {
            log.warn("토큰 교환 실패: {}", e.getStatusCode());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("success", false, "message", "token exchange failed"));
        }
    }

    // ─────────────────────────────────────────────────────
    // 2) 토큰 갱신 — RT → 새 AT + 새 RT (RT Rotation)
    // ─────────────────────────────────────────────────────
    @PostMapping("/refresh")
    @Operation(summary = "토큰 갱신", description = "Refresh Token → 새 Access Token + Refresh Token")
    public ResponseEntity<?> refresh(@RequestBody(required = false) Map<String, String> body,
                                     HttpServletRequest request,
                                     HttpServletResponse response) {
        var refreshToken = resolveRefreshToken(body, request);
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "refresh token not found"));
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> wrapped = WebClient.create(spAuth.getServerUrl())
                    .post()
                    .uri("/api/v1/auth/refresh")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of("refreshToken", refreshToken))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (wrapped != null && wrapped.get("data") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) wrapped.get("data");
                String newRT = (String) data.get("refreshToken");
                if (newRT != null) {
                    setRefreshTokenCookie(request, response, newRT, resolveRefreshExpiresIn(data));
                }
            }

            return ResponseEntity.ok(wrapped);
        } catch (WebClientResponseException e) {
            int status = e.getRawStatusCode();
            if (status == 401 || status == 403) {
                clearRefreshTokenCookie(request, response);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "refresh token invalid"));
            }
            log.warn("refresh 실패: {}", e.getStatusCode());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("success", false, "message", "refresh failed"));
        }
    }

    // ─────────────────────────────────────────────────────
    // 3) 로그아웃 — RT 무효화
    // ─────────────────────────────────────────────────────
    @PostMapping("/logout")
    @Operation(summary = "로그아웃", description = "Refresh Token 무효화")
    public ResponseEntity<?> logout(@RequestBody(required = false) Map<String, String> body,
                                    HttpServletRequest request,
                                    HttpServletResponse response) {
        var refreshToken = resolveRefreshToken(body, request);
        if (refreshToken != null) {
            try {
                WebClient.create(spAuth.getServerUrl())
                        .post()
                        .uri("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(Map.of("refreshToken", refreshToken))
                        .retrieve()
                        .toBodilessEntity()
                        .block();
            } catch (Exception e) {
                log.warn("logout 호출 실패(무시): {}", e.getMessage());
            }
        }

        clearRefreshTokenCookie(request, response);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ─────────────────────────────────────────────────────
    // 4) 게스트 토큰 — Auth 서버에 client_secret 추가 전달
    // ─────────────────────────────────────────────────────
    @PostMapping("/guest/token")
    @Operation(summary = "게스트 토큰 발급", description = "비회원 게스트 JWT 발급 (2시간)")
    public ResponseEntity<?> guestToken(@RequestBody Map<String, String> body) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = WebClient.create(spAuth.getServerUrl())
                    .post()
                    .uri("/oauth2/guest-token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "clientId", spAuth.getClientId(),
                            "clientSecret", spAuth.getClientSecret(),
                            "name", body.getOrDefault("name", "")
                    ))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return ResponseEntity.ok(Map.of("success", true, "data", result));
        } catch (WebClientResponseException e) {
            log.warn("guest token 발급 실패: {}", e.getStatusCode());
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("success", false, "message", "guest token failed"));
        }
    }

    // ─────────────────────────────────────────────────────
    // 헬퍼
    // ─────────────────────────────────────────────────────

    private int resolveRefreshExpiresIn(Map<?, ?> data) {
        var val = data.get("refreshExpiresIn");
        if (val instanceof Number && ((Number) val).longValue() > 0) return ((Number) val).intValue();
        return RT_COOKIE_MAX_AGE_FALLBACK;
    }

    private String resolveRefreshToken(Map<String, String> body, HttpServletRequest request) {
        if (body != null) {
            String fromBody = body.get("refreshToken");
            if (fromBody != null && !fromBody.isBlank()) return fromBody;
        }
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("RT".equals(c.getName())) return c.getValue();
            }
        }
        return null;
    }

    private void setRefreshTokenCookie(HttpServletRequest request, HttpServletResponse response,
                                       String refreshToken, int maxAge) {
        var cookie = ResponseCookie.from("RT", refreshToken)
                .httpOnly(true)
                .secure(request.isSecure())
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletRequest request, HttpServletResponse response) {
        var cookie = ResponseCookie.from("RT", "")
                .httpOnly(true).secure(request.isSecure()).sameSite("Lax")
                .path("/api/v1/auth").maxAge(0).build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
