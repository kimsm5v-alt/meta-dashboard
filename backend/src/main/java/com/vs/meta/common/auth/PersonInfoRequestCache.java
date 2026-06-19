package com.vs.meta.common.auth;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import java.util.*;
import java.util.function.Function;

/**
 * 한 HTTP 요청 안에서 sp_user_id → UserInfo 결과를 재사용.
 * 요청 캐시 miss → PersonInfoCacheStore(Caffeine) 확인 → 그래도 miss면 SSO 호출.
 */
@Component
@RequestScope
public class PersonInfoRequestCache {

    private final Map<String, UserInfo> requestCache = new HashMap<>();
    private final PersonInfoCacheStore appCacheStore;

    public PersonInfoRequestCache(PersonInfoCacheStore appCacheStore) {
        this.appCacheStore = appCacheStore;
    }

    public Map<String, UserInfo> getBatchOrLoad(
            List<String> publicUserIds,
            Function<List<String>, Map<String, UserInfo>> loader
    ) {
        if (publicUserIds == null || publicUserIds.isEmpty()) return Map.of();

        List<String> distinct = publicUserIds.stream()
                .filter(Objects::nonNull).distinct().toList();

        // 1단계: 요청 내 캐시에 없는 ID 추출
        List<String> notInRequest = distinct.stream()
                .filter(id -> !requestCache.containsKey(id))
                .toList();

        // 2단계: app 캐시(Caffeine) 경유 — miss분만 loader(SSO) 호출
        if (!notInRequest.isEmpty()) {
            Map<String, UserInfo> fromAppCache = appCacheStore.getOrLoad(notInRequest, loader);
            requestCache.putAll(fromAppCache);
        }

        // 3단계: 요청 캐시에서 결과 조합
        Map<String, UserInfo> result = new HashMap<>();
        distinct.forEach(id -> result.put(id,
                requestCache.getOrDefault(id, UserInfo.placeholder(id))));
        return result;
    }
}
