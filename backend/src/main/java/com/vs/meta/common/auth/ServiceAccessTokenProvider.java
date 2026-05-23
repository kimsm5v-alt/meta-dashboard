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

    @SuppressWarnings("unchecked")
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
