package com.vs.meta.api.sso.client;

import com.vs.meta.api.sso.client.dto.SsoEventFeedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * IdP RP Event Feed 호출 클라이언트.
 *
 * <ul>
 *   <li>{@code GET /api/v1/events/revocations} — 호출 RP SERVICE 동의 revoke (연결끊기, 즉시)</li>
 *   <li>{@code GET /api/v1/events/deletions}  — 통합 회원 hard purge (탈퇴신청 +30일)</li>
 * </ul>
 *
 * <p>service AT (scope=events:read) Bearer 인증. 응답은 snake_case 라 Map 으로 받아 정규화.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SpEventFeedClient {

    private static final DateTimeFormatter SINCE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final WebClient superPlatformAuthWebClient;

    /** REVOCATION feed — client_id 필수 (service AT 의 client_id 와 일치해야 함). */
    public SsoEventFeedResponse revocations(String serviceToken, String clientId, LocalDateTime since, int limit) {
        Map<String, Object> resp = superPlatformAuthWebClient.get()
                .uri(uri -> uri.path("/api/v1/events/revocations")
                        .queryParam("client_id", clientId)
                        .queryParam("since", since.format(SINCE_FMT))
                        .queryParam("limit", limit)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        return parse(resp, "revoked_at", since);
    }

    /** DELETION feed — client_id 불필요 (service AT 의 sub 으로 자동 식별). */
    public SsoEventFeedResponse deletions(String serviceToken, LocalDateTime since, int limit) {
        Map<String, Object> resp = superPlatformAuthWebClient.get()
                .uri(uri -> uri.path("/api/v1/events/deletions")
                        .queryParam("since", since.format(SINCE_FMT))
                        .queryParam("limit", limit)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        return parse(resp, "deleted_at", since);
    }

    @SuppressWarnings("unchecked")
    private SsoEventFeedResponse parse(Map<String, Object> resp, String timeField, LocalDateTime fallbackSince) {
        if (resp == null) {
            return new SsoEventFeedResponse(List.of(), fallbackSince);
        }
        List<Map<String, Object>> rawItems = (List<Map<String, Object>>) resp.getOrDefault("items", List.of());
        List<SsoEventFeedResponse.Item> items = rawItems.stream()
                .map(m -> new SsoEventFeedResponse.Item(
                        (String) m.get("sub"),
                        parseTime(m.get(timeField))))
                .toList();
        LocalDateTime nextSince = parseTime(resp.get("next_since"));
        return new SsoEventFeedResponse(items, nextSince != null ? nextSince : fallbackSince);
    }

    private LocalDateTime parseTime(Object raw) {
        if (raw == null) return null;
        // IdP 직렬화가 초 생략(2026-..T04:00) 또는 밀리초(..:00.123) 로 와도 허용
        return LocalDateTime.parse((String) raw, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
