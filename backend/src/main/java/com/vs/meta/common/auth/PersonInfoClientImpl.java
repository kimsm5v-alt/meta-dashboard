package com.vs.meta.common.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.*;

@Component
@Slf4j
public class PersonInfoClientImpl implements PersonInfoClient {

    private static final int BATCH_CHUNK_SIZE = 100;

    private final RestClient personInfoRestClient;
    private final ServiceAccessTokenProvider tokenProvider;

    public PersonInfoClientImpl(
            @Qualifier("personInfoRestClient") RestClient personInfoRestClient,
            ServiceAccessTokenProvider tokenProvider
    ) {
        this.personInfoRestClient = personInfoRestClient;
        this.tokenProvider = tokenProvider;
    }

    @Override
    public UserInfo getOne(String publicUserId) {
        if (publicUserId == null || publicUserId.isBlank()) {
            return UserInfo.placeholder("(unknown)");
        }
        try {
            Map<String, Object> body = personInfoRestClient.get()
                    .uri("/users/{id}", publicUserId)
                    .header("Authorization", "Bearer " + tokenProvider.getToken())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> { /* 404 등 swallow */ })
                    .body(Map.class);
            return toUserInfo(body);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                log.debug("User not found: {}", publicUserId);
                return UserInfo.placeholder(publicUserId);
            }
            log.warn("Auth getOne 실패 ({}): {}", publicUserId, e.getMessage());
            return UserInfo.placeholder(publicUserId);
        } catch (Exception e) {
            log.warn("Auth getOne 예외 ({}): {}", publicUserId, e.getMessage());
            return UserInfo.placeholder(publicUserId);
        }
    }

    @Override
    public Map<String, UserInfo> getBatch(List<String> publicUserIds) {
        if (publicUserIds == null || publicUserIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<String> distinct = publicUserIds.stream().filter(Objects::nonNull).distinct().toList();

        Map<String, UserInfo> result = new HashMap<>();
        for (int i = 0; i < distinct.size(); i += BATCH_CHUNK_SIZE) {
            List<String> chunk = distinct.subList(i, Math.min(i + BATCH_CHUNK_SIZE, distinct.size()));
            result.putAll(callBatchOnce(chunk));
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, UserInfo> callBatchOnce(List<String> chunk) {
        try {
            Map<String, Object> body = personInfoRestClient.post()
                    .uri("/users/batch")
                    .header("Authorization", "Bearer " + tokenProvider.getToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("publicUserIds", chunk))
                    .retrieve()
                    .body(Map.class);

            Map<String, Object> data = (Map<String, Object>) body.get("data");
            List<Map<String, Object>> users = (List<Map<String, Object>>) data.get("users");
            List<String> notFound = (List<String>) data.getOrDefault("notFound", List.of());

            Map<String, UserInfo> map = new HashMap<>();
            users.forEach(u -> {
                String reason = (String) u.getOrDefault("maskedReason", "NONE");
                UserInfo info = new UserInfo(
                        (String) u.get("publicUserId"),
                        (String) u.get("name"),
                        (String) u.get("nickname"),
                        (String) u.get("email"),
                        (String) u.get("userType"),
                        false,
                        reason != null ? reason : "NONE"
                );
                map.put(info.publicUserId(), info);
            });
            notFound.forEach(id -> map.put(id, UserInfo.placeholder(id)));
            // 입력에 있었지만 응답에 없는 경우도 placeholder
            chunk.forEach(id -> map.putIfAbsent(id, UserInfo.placeholder(id)));
            return map;
        } catch (Exception e) {
            log.warn("Auth getBatch 실패 (chunk size={}): {}", chunk.size(), e.getMessage());
            Map<String, UserInfo> fallback = new HashMap<>();
            chunk.forEach(id -> fallback.put(id, UserInfo.placeholder(id)));
            return fallback;
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    public Optional<UserInfo> lookupByEmail(String email) {
        if (email == null || email.isBlank()) return Optional.empty();
        try {
            Map<String, Object> body = personInfoRestClient.post()
                    .uri("/users/lookup")
                    .header("Authorization", "Bearer " + tokenProvider.getToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("email", email))
                    .retrieve()
                    .body(Map.class);
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null || data.get("publicUserId") == null) return Optional.empty();
            return Optional.of(new UserInfo(
                    (String) data.get("publicUserId"),
                    (String) data.get("name"),
                    (String) data.get("nickname"),
                    email,
                    (String) data.get("userType"),
                    false,
                    "NONE"
            ));
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) return Optional.empty();
            log.warn("Auth lookupByEmail 실패 ({}): {}", email, e.getMessage());
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Auth lookupByEmail 예외 ({}): {}", email, e.getMessage());
            return Optional.empty();
        }
    }

    @SuppressWarnings("unchecked")
    @Override
    public UserSearchResult search(String keyword, String status, int page, int size) {
        if (keyword == null || keyword.isBlank()) {
            // 빈 keyword 는 전체 목록 우회(문서 §6 ②) — 호출 자체를 막는다.
            return UserSearchResult.empty(page, size);
        }
        try {
            // keyword 는 PII(이름) 이므로 로그에 남기지 않는다(문서 §6 ③).
            Map<String, Object> body = personInfoRestClient.get()
                    .uri(b -> {
                        b.path("/users/search")
                         .queryParam("keyword", keyword)
                         .queryParam("page", page)
                         .queryParam("size", size);
                        if (status != null && !status.isBlank()) {
                            b.queryParam("status", status);
                        }
                        return b.build();
                    })
                    .header("Authorization", "Bearer " + tokenProvider.getToken())
                    .retrieve()
                    .body(Map.class);

            Map<String, Object> data = (Map<String, Object>) body.get("data");
            if (data == null) {
                return UserSearchResult.empty(page, size);
            }
            List<Map<String, Object>> items = (List<Map<String, Object>>) data.getOrDefault("items", List.of());
            List<UserSearchResult.Item> parsed = items.stream()
                    .map(m -> new UserSearchResult.Item(
                            (String) m.get("publicUserId"),
                            (String) m.get("name"),
                            (String) m.get("nickname"),
                            (String) m.get("userType"),
                            (String) m.get("status")))
                    .toList();
            return new UserSearchResult(
                    parsed,
                    toInt(data.get("page"), page),
                    toInt(data.get("size"), size),
                    toLong(data.get("totalElements")),
                    toInt(data.get("totalPages"), 0));
        } catch (Exception e) {
            log.warn("Auth users/search 실패: {}", e.getMessage());
            return UserSearchResult.empty(page, size);
        }
    }

    private static int toInt(Object o, int dflt) {
        return (o instanceof Number n) ? n.intValue() : dflt;
    }

    private static long toLong(Object o) {
        return (o instanceof Number n) ? n.longValue() : 0L;
    }

    @SuppressWarnings("unchecked")
    private UserInfo toUserInfo(Map<String, Object> body) {
        // ApiResponse 형태: { "data": { ...UserPublicResponse }, ... }
        Map<String, Object> data = (Map<String, Object>) body.get("data");
        if (data == null) return UserInfo.placeholder("(unknown)");
        String reason = (String) data.getOrDefault("maskedReason", "NONE");
        return new UserInfo(
                (String) data.get("publicUserId"),
                (String) data.get("name"),
                (String) data.get("nickname"),
                (String) data.get("email"),
                (String) data.get("userType"),
                false,
                reason != null ? reason : "NONE"
        );
    }
}
