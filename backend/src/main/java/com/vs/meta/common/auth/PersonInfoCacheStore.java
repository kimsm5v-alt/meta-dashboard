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
 * 마스킹 상태(maskedReason != NONE — 미동의/탈퇴 등)도 저장하지 않아 동의 변경이 즉시 반영된다
 * (consent 는 volatile — 캐시하면 동의 후에도 5분간 마스킹 유지되는 문제).
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
                // placeholder(미존재) + 마스킹(미동의/탈퇴 등 maskedReason != NONE)은 캐시 안 함 →
                // 동의 변경이 다음 조회에 즉시 반영(서버 캐시로 인한 지연 제거). 동의된 실명만 캐시.
                if (!info.placeholder() && isCacheable(info)) {
                    cache.put(id, info);
                }
                result.put(id, info);
            });
            missed.forEach(id -> result.putIfAbsent(id, UserInfo.placeholder(id)));
        }

        return result;
    }

    /** 마스킹 안 된(NONE) 안정 상태만 캐시 대상 — 미동의/탈퇴(volatile) 는 매번 신선 조회. */
    private static boolean isCacheable(UserInfo info) {
        return info.maskedReason() == null || "NONE".equals(info.maskedReason());
    }

    public void invalidateAll() {
        cache.invalidateAll();
    }

    public void invalidate(String publicUserId) {
        cache.invalidate(publicUserId);
    }
}
