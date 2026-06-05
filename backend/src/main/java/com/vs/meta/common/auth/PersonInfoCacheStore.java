package com.vs.meta.common.auth;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;

/**
 * HTTP 요청 경계를 넘어 UserInfo를 캐싱하는 앱 레벨 캐시.
 * TTL 5분, 최대 10,000건.
 * placeholder(탈퇴 회원)는 저장하지 않아 계정 복구 즉시 반영된다.
 */
@Component
public class PersonInfoCacheStore {

    private final Cache<String, UserInfo> cache = Caffeine.newBuilder()
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .maximumSize(10_000)
            .build();

    /**
     * ids 중 캐시에 있는 것은 즉시 반환, miss된 것만 loader 호출.
     * loader가 반환한 non-placeholder 결과를 캐시에 저장한다.
     */
    public Map<String, UserInfo> getOrLoad(
            List<String> ids,
            Function<List<String>, Map<String, UserInfo>> loader
    ) {
        if (ids == null || ids.isEmpty()) return Map.of();

        Map<String, UserInfo> result = new HashMap<>();
        List<String> missed = new ArrayList<>();

        for (String id : ids) {
            UserInfo cached = cache.getIfPresent(id);
            if (cached != null) {
                result.put(id, cached);
            } else {
                missed.add(id);
            }
        }

        if (!missed.isEmpty()) {
            Map<String, UserInfo> loaded = loader.apply(missed);
            loaded.forEach((id, info) -> {
                if (!info.placeholder()) {
                    cache.put(id, info);
                }
                result.put(id, info);
            });
            missed.forEach(id -> result.putIfAbsent(id, UserInfo.placeholder(id)));
        }

        return result;
    }

    public void invalidateAll() {
        cache.invalidateAll();
    }

    public void invalidate(String publicUserId) {
        cache.invalidate(publicUserId);
    }
}
