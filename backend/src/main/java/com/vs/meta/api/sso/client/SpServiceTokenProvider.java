package com.vs.meta.api.sso.client;

import com.vs.meta.common.config.SpAuthProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * IdP server-to-server 호출용 service AT 발급/캐싱.
 *
 * <p>OAuth2 client_credentials grant (RFC 6749 §4.4). RT 미발급이라 만료 시 재발급.
 * expires_in 은 IdP 가 1시간(3600s) 고정. 만료 {@value #EXPIRY_MARGIN_SECONDS}초 전부터 갱신.
 *
 * <p>scope=events:read — RP Event Feed(revocations/deletions) 호출 전용.
 * 운영자가 학심정 RP 의 oauth2_client.scopes 에 events:read 를 미리 부여해야 발급된다(미부여 시 401).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SpServiceTokenProvider {

    private static final String SCOPE = "events:read";
    private static final long EXPIRY_MARGIN_SECONDS = 300; // 만료 5분 전 갱신

    private final WebClient superPlatformAuthWebClient;
    private final SpAuthProperties spAuth;

    private volatile String cachedToken;
    private volatile Instant expiresAt = Instant.EPOCH;

    /** 유효한 service AT 반환 (캐시 hit 또는 신규 발급). */
    public synchronized String getToken() {
        if (cachedToken != null && Instant.now().isBefore(expiresAt.minusSeconds(EXPIRY_MARGIN_SECONDS))) {
            return cachedToken;
        }
        return issue();
    }

    /** 401 등으로 토큰이 거부된 경우 호출 측에서 캐시 무효화 후 재시도. */
    public synchronized void invalidate() {
        cachedToken = null;
        expiresAt = Instant.EPOCH;
    }

    private String issue() {
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", spAuth.getClientId());
        form.add("client_secret", spAuth.getClientSecret());
        form.add("scope", SCOPE);

        @SuppressWarnings("unchecked")
        Map<String, Object> resp = superPlatformAuthWebClient
                .post()
                .uri("/oauth2/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue(form)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (resp == null || resp.get("access_token") == null) {
            throw new IllegalStateException("service AT 발급 실패: 응답에 access_token 없음");
        }

        cachedToken = (String) resp.get("access_token");
        long expiresIn = resp.get("expires_in") instanceof Number n ? n.longValue() : 3600L;
        expiresAt = Instant.now().plus(Duration.ofSeconds(expiresIn));
        log.info("[SSO-POLL] service AT 발급 완료: scope={}, expiresIn={}s", SCOPE, expiresIn);
        return cachedToken;
    }
}
