package com.vs.meta.common.auth;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import java.util.*;
import java.util.function.Function;

/**
 * 한 HTTP 요청 안에서 sp_user_id → UserInfo 결과를 재사용.
 * 같은 요청 안 동일 ID는 Auth에 한 번만 호출.
 */
@Component
@RequestScope
public class PersonInfoRequestCache {

    private final Map<String, UserInfo> cache = new HashMap<>();

    public Map<String, UserInfo> getBatchOrLoad(
            List<String> publicUserIds,
            Function<List<String>, Map<String, UserInfo>> loader
    ) {
        if (publicUserIds == null || publicUserIds.isEmpty()) return Map.of();

        List<String> distinct = publicUserIds.stream().filter(Objects::nonNull).distinct().toList();
        List<String> uncached = distinct.stream().filter(id -> !cache.containsKey(id)).toList();

        if (!uncached.isEmpty()) {
            Map<String, UserInfo> loaded = loader.apply(uncached);
            cache.putAll(loaded);
        }

        Map<String, UserInfo> result = new HashMap<>();
        distinct.forEach(id -> result.put(id, cache.getOrDefault(id, UserInfo.placeholder(id))));
        return result;
    }
}
