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
import java.util.concurrent.ConcurrentHashMap;

/**
 * IdP server-to-server 호출용 service AT 발급/캐싱 — scope 별 분리 캐시.
 *
 * <p>OAuth2 client_credentials grant (RFC 6749 §4.4). RT 미발급이라 만료 시 재발급.
 * expires_in 은 IdP 가 1시간(3600s) 고정. 만료 {@value #EXPIRY_MARGIN_SECONDS}초 전부터 갱신.
 *
 * <p>scope 별 용도:
 * <ul>
 *   <li>{@code events:read} — RP Event Feed(revocations/deletions)</li>
 *   <li>{@code groups:read} — RP Group API(/rp/groups 스냅샷·변경 피드·단건) (group-from-idp)</li>
 * </ul>
 * 운영자가 학심정 RP 의 oauth2_client.scopes 에 해당 scope 를 미리 부여해야 발급된다(미부여 시 401).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SpServiceTokenProvider {

    public static final String SCOPE_EVENTS_READ = "events:read";
    public static final String SCOPE_GROUPS_READ = "groups:read";

    private static final long EXPIRY_MARGIN_SECONDS = 300; // 만료 5분 전 갱신

    private final WebClient superPlatformAuthWebClient;
    private final SpAuthProperties spAuth;

    private record CachedToken(String token, Instant expiresAt) {
        boolean stillValid() {
            return Instant.now().isBefore(expiresAt.minusSeconds(EXPIRY_MARGIN_SECONDS));
        }
    }

    private final Map<String, CachedToken> cache = new ConcurrentHashMap<>();

    /** 유효한 service AT 반환 (캐시 hit 또는 신규 발급). 기존 호출 호환 — events:read. */
    public String getToken() {
        return getToken(SCOPE_EVENTS_READ);
    }

    /** scope 지정 service AT 반환 (캐시 hit 또는 신규 발급). */
    public String getToken(String scope) {
        CachedToken current = cache.get(scope);
        if (current != null && current.stillValid()) {
            return current.token();
        }
        synchronized (this) {
            current = cache.get(scope);
            if (current != null && current.stillValid()) {
                return current.token();
            }
            CachedToken fresh = issue(scope);
            cache.put(scope, fresh);
            return fresh.token();
        }
    }

    /** 401 등으로 토큰이 거부된 경우 호출 측에서 캐시 무효화 후 재시도. 기존 호출 호환 — events:read. */
    public void invalidate() {
        invalidate(SCOPE_EVENTS_READ);
    }

    /** scope 지정 캐시 무효화. */
    public void invalidate(String scope) {
        cache.remove(scope);
    }

    private CachedToken issue(String scope) {
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", spAuth.getClientId());
        form.add("client_secret", spAuth.getClientSecret());
        form.add("scope", scope);

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
            throw new IllegalStateException("service AT 발급 실패: 응답에 access_token 없음 (scope=" + scope + ")");
        }

        String token = (String) resp.get("access_token");
        long expiresIn = resp.get("expires_in") instanceof Number n ? n.longValue() : 3600L;
        log.info("[SSO-POLL] service AT 발급 완료: scope={}, expiresIn={}s", scope, expiresIn);
        return new CachedToken(token, Instant.now().plus(Duration.ofSeconds(expiresIn)));
    }
}
