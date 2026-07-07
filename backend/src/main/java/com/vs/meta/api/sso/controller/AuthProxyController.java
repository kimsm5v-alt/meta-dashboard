package com.vs.meta.api.sso.controller;

import com.vs.meta.common.aop.QchSkip;
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

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
    private final WebClient superPlatformAuthWebClient;
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

        // [게이트웨이 전환 디버깅] 교환 파라미터 정합 확인 — 시크릿(code/verifier/secret)은 값 미로깅, 존재여부만.
        log.info("[TOKEN-DBG] codePresent={}, verifierPresent={}, redirectUri={}, clientId={}",
                body.get("code") != null, body.get("codeVerifier") != null,
                body.get("redirectUri"), spAuth.getClientId());

        var dpop = request.getHeader("DPoP");

        try {
            // DPoP-Nonce 응답 relay — Auth 가 요청 DPoP 를 받았다면 응답(성공 2xx)에 새 nonce 를
            //   되돌려줄 수 있다. .bodyToMono 대신 .toEntity 로 받아 응답 헤더까지 확보한다.
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = superPlatformAuthWebClient
                    .post()
                    .uri("/oauth2/token")
                    .headers(h -> { if (dpop != null && !dpop.isBlank()) h.set("DPoP", dpop); })
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .bodyValue(form)
                    .retrieve()
                    .toEntity(Map.class)
                    .block();

            relayDpopNonce(resp.getHeaders().getFirst("DPoP-Nonce"), response);
            @SuppressWarnings("unchecked")
            Map<String, Object> tokens = resp.getBody();
            setRefreshTokenCookie(request, response, (String) tokens.get("refreshToken"), resolveRefreshExpiresIn(tokens));
            return ResponseEntity.ok(Map.of("success", true, "data", tokens));
        } catch (WebClientResponseException e) {
            // [게이트웨이 전환 디버깅] IdP 가 준 거부 사유(error/error_description) 그대로 로깅.
            log.warn("토큰 교환 실패: {} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            // DPoP-Nonce 챌린지(401) relay — SDK 가 이 헤더를 읽어 새 DPoP proof 로 재시도한다.
            relayDpopNonce(e.getHeaders().getFirst("DPoP-Nonce"), response);
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of("success", false, "message", "token exchange failed"));
        }
    }

    // ─────────────────────────────────────────────────────
    // 2) 토큰 갱신 — RT → 새 AT + 새 RT (RT Rotation)
    // ─────────────────────────────────────────────────────
    @PostMapping("/refresh")
    @Operation(summary = "토큰 갱신", description = "Refresh Token → 새 Access Token + Refresh Token")
    @QchSkip(reason = "토큰 갱신은 빈번하게 호출되어 QCH 적재 제외")
    public ResponseEntity<?> refresh(@RequestBody(required = false) Map<String, String> body,
                                     HttpServletRequest request,
                                     HttpServletResponse response) {
        var refreshToken = resolveRefreshToken(body, request);
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "refresh token not found"));
        }

        var dpop = request.getHeader("DPoP");

        try {
            // OAuth2 §6 — IdP 가 RT.owner 와 client_id 매칭 + client_secret 을 검증하도록 자격을
            //   함께 전달. 다른 RP 의 RT 가 흘러들어왔을 때 IdP 가 즉시 401 로 거부 (멀티-RP
            //   쿠키 슬롯 충돌 방어 + RT 단독 탈취 차단).
            // DPoP-Nonce 응답 relay — .bodyToMono 대신 .toEntity 로 받아 응답 헤더까지 확보한다.
            @SuppressWarnings("unchecked")
            ResponseEntity<Map> resp = superPlatformAuthWebClient
                    .post()
                    .uri("/api/v1/auth/refresh")
                    .headers(h -> { if (dpop != null && !dpop.isBlank()) h.set("DPoP", dpop); })
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                            "refreshToken", refreshToken,
                            "clientId", spAuth.getClientId(),
                            "clientSecret", spAuth.getClientSecret()
                    ))
                    .retrieve()
                    .toEntity(Map.class)
                    .block();

            relayDpopNonce(resp.getHeaders().getFirst("DPoP-Nonce"), response);
            @SuppressWarnings("unchecked")
            Map<String, Object> wrapped = resp.getBody();

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
            int status = e.getStatusCode().value();
            String nonce = e.getHeaders().getFirst("DPoP-Nonce");
            if (nonce != null) {
                // nonce 챌린지(401 + DPoP-Nonce)는 RT 무효가 아니다 — RT 쿠키를 지우면 SDK 의
                //   1회 재시도(새 DPoP proof)가 RT 없이 나가 실패해 로그아웃된다. 쿠키는 그대로 두고 relay 만.
                relayDpopNonce(nonce, response);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "dpop nonce required"));
            }
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
                superPlatformAuthWebClient
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
            Map<String, Object> result = superPlatformAuthWebClient
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

    // Auth 응답의 DPoP-Nonce 를 브라우저 응답으로 그대로 relay (RFC 9449 §8).
    //   브라우저 JS/SDK 가 읽으려면 게이트웨이(Kong) CORS 의 expose-headers 에 DPoP-Nonce 가 있어야 한다.
    private void relayDpopNonce(String nonce, HttpServletResponse response) {
        if (nonce != null && !nonce.isBlank()) {
            response.setHeader("DPoP-Nonce", nonce);
        }
    }

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

    // RT 쿠키 path = "/" : 게이트웨이가 경로 앞에 prefix(/v1/meta)를 붙여도 refresh 요청에 실리도록 한다.
    //   (path="/api/v1/auth" 로 좁히면 브라우저가 보는 /v1/meta/api/v1/auth/refresh 와 안 맞아 쿠키 미전송 → 로그인 루프)
    //   백엔드는 자신의 게이트웨이 prefix 를 모르므로 "/" 로 두는 게 게이트웨이 유무와 무관하게 안전.
    private static final String RT_COOKIE_PATH = "/";

    private void setRefreshTokenCookie(HttpServletRequest request, HttpServletResponse response,
                                       String refreshToken, int maxAge) {
        var cookie = ResponseCookie.from("RT", refreshToken)
                .httpOnly(true)
                .secure(request.isSecure())
                .sameSite("Lax")
                .path(RT_COOKIE_PATH)
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletRequest request, HttpServletResponse response) {
        var cookie = ResponseCookie.from("RT", "")
                .httpOnly(true).secure(request.isSecure()).sameSite("Lax")
                .path(RT_COOKIE_PATH).maxAge(0).build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
