package com.vs.meta.api.sso.client;

import com.vs.meta.api.sso.client.dto.RpGroupChangeDto;
import com.vs.meta.api.sso.client.dto.RpGroupChangeFeedDto;
import com.vs.meta.api.sso.client.dto.RpGroupDto;
import com.vs.meta.api.sso.client.dto.RpGroupPageDto;
import com.vs.meta.api.sso.client.dto.RpMemberDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Auth RP Group API 호출 클라이언트 (group-from-idp).
 *
 * <ul>
 *   <li>{@code GET /api/v1/rp/groups}            — 부트스트랩 스냅샷 (afterId 키셋, 멤버 명단 포함)</li>
 *   <li>{@code GET /api/v1/rp/groups/changes}    — 변경 피드 (since 시각 커서, 안전 지연 5초)</li>
 *   <li>{@code GET /api/v1/rp/groups/{groupId}}  — 증분 상세 (404 = 삭제됨 → null 반환)</li>
 * </ul>
 *
 * <p>service AT (scope=groups:read) Bearer 인증. 응답은 {@code {success, data}} 래핑 — data 만 파싱.
 * since 는 Auth group_change_log 가 DATETIME(6) 이라 ISO 마이크로초 포함 포맷으로 전송.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RpGroupClient {

    private static final DateTimeFormatter SINCE_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final WebClient superPlatformAuthWebClient;

    /** 부트스트랩 스냅샷 1페이지. afterId null = 첫 페이지. */
    public RpGroupPageDto snapshot(String serviceToken, Long afterId, int limit) {
        Map<String, Object> resp = superPlatformAuthWebClient.get()
                .uri(uri -> {
                    var b = uri.path("/api/v1/rp/groups").queryParam("limit", limit);
                    if (afterId != null) {
                        b = b.queryParam("afterId", afterId);
                    }
                    return b.build();
                })
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        Map<String, Object> data = unwrapData(resp);
        List<RpGroupDto> items = parseGroups(listOf(data.get("items")));
        return new RpGroupPageDto(items, asLong(data.get("nextAfterId")), parseTime(data.get("currentSince")));
    }

    /** 변경 피드 1페이지. */
    public RpGroupChangeFeedDto changes(String serviceToken, LocalDateTime since, int limit) {
        Map<String, Object> resp = superPlatformAuthWebClient.get()
                .uri(uri -> uri.path("/api/v1/rp/groups/changes")
                        .queryParam("since", since.format(SINCE_FMT))
                        .queryParam("limit", limit)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        Map<String, Object> data = unwrapData(resp);
        List<RpGroupChangeDto> items = listOf(data.get("items")).stream()
                .map(m -> new RpGroupChangeDto(
                        (String) m.get("changeType"),
                        asLong(m.get("groupId")),
                        (String) m.get("publicUserId"),
                        parseTime(m.get("occurredAt")),
                        (String) m.get("ownerPublicUserId")))
                .toList();
        LocalDateTime nextSince = parseTime(data.get("nextSince"));
        return new RpGroupChangeFeedDto(items, nextSince != null ? nextSince : since);
    }

    /** 증분 상세 조회. 404(조회 전 삭제) 는 예외가 아닌 null — 호출 측에서 로컬 비활성 처리. */
    public RpGroupDto detail(String serviceToken, Long groupId) {
        try {
            Map<String, Object> resp = superPlatformAuthWebClient.get()
                    .uri("/api/v1/rp/groups/{groupId}", groupId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceToken)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return parseGroup(unwrapData(resp));
        } catch (WebClientResponseException.NotFound e) {
            return null;
        }
    }

    /**
     * 교사 본인 그룹 id 목록 — {@code GET /api/v1/groups} (교사 user AT, group-from-idp on-demand).
     * 응답(GroupSummaryResponse[])에서 groupId 만 추출. 실제 데이터는 {@link #detail}(service AT)로 받는다.
     */
    public List<Long> myTeacherGroupIds(String userToken) {
        return myGroupIds(userToken, "/api/v1/groups");
    }

    /** 학생 본인 그룹 id 목록 — {@code GET /api/v1/groups/my} (학생 user AT). */
    public List<Long> myStudentGroupIds(String userToken) {
        return myGroupIds(userToken, "/api/v1/groups/my");
    }

    private List<Long> myGroupIds(String userToken, String path) {
        Map<String, Object> resp = superPlatformAuthWebClient.get()
                .uri(path)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + userToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        // 이 응답의 data 는 배열(List) — unwrapData(Map 기대)와 달라 별도 처리
        Object data = resp == null ? null : resp.get("data");
        if (!(data instanceof List)) {
            return List.of();
        }
        return listOf(data).stream()
                .map(m -> asLong(m.get("groupId")))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    // ---- parsing ----

    @SuppressWarnings("unchecked")
    private Map<String, Object> unwrapData(Map<String, Object> resp) {
        if (resp == null) {
            throw new IllegalStateException("RP Group API 응답 없음");
        }
        Object data = resp.get("data");
        if (!(data instanceof Map)) {
            throw new IllegalStateException("RP Group API 응답에 data 없음: keys=" + resp.keySet());
        }
        return (Map<String, Object>) data;
    }

    private List<RpGroupDto> parseGroups(List<Map<String, Object>> raw) {
        return raw.stream().map(this::parseGroup).toList();
    }

    private RpGroupDto parseGroup(Map<String, Object> m) {
        List<RpMemberDto> members = listOf(m.get("members")).stream()
                .map(mm -> new RpMemberDto(
                        (String) mm.get("publicUserId"),
                        (String) mm.get("status"),
                        mm.get("seqNo") instanceof Number n ? n.intValue() : null,
                        parseTime(mm.get("joinedAt")),
                        parseTime(mm.get("updatedAt"))))
                .toList();
        return new RpGroupDto(
                asLong(m.get("groupId")),
                (String) m.get("groupName"),
                (String) m.get("schoolName"),
                (String) m.get("schoolLevel"),
                (String) m.get("schoolCode"),
                (String) m.get("grade"),
                (String) m.get("classNo"),
                (String) m.get("subject"),
                (String) m.get("inviteCode"),
                (String) m.get("status"),
                parseTime(m.get("updatedAt")),
                members,
                (String) m.get("ownerPublicUserId"));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> listOf(Object raw) {
        return raw instanceof List ? (List<Map<String, Object>>) raw : List.of();
    }

    private Long asLong(Object raw) {
        return raw instanceof Number n ? n.longValue() : null;
    }

    private LocalDateTime parseTime(Object raw) {
        if (raw == null) return null;
        // 초 생략 / 밀리초 / 마이크로초(DATETIME(6)) 직렬화 모두 허용
        return LocalDateTime.parse((String) raw, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
