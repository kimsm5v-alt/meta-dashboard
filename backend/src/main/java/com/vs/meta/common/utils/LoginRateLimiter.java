package com.vs.meta.common.utils;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.time.Duration;

/**
 * 로그인 시도 횟수 제한 (IP + email 기반)
 * - Caffeine 인메모리 캐시 사용 (TTL 자동 만료)
 * - application.yml에서 설정 가능:
 *   login.rate-limit.max-attempts (기본 5)
 *   login.rate-limit.block-minutes (기본 5)
 */
@Component
public class LoginRateLimiter {

    @Value("${login.rate-limit.max-attempts:5}")
    private int maxAttempts;

    @Value("${login.rate-limit.block-minutes:5}")
    private int blockMinutes;

    private Cache<String, Integer> attemptCache;

    @PostConstruct
    public void init() {
        attemptCache = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(blockMinutes))
                .maximumSize(10_000)
                .build();
    }

    /**
     * 로그인 차단 여부 확인
     */
    public boolean isBlocked(String ip, String email) {
        String key = buildKey(ip, email);
        Integer attempts = attemptCache.getIfPresent(key);
        return attempts != null && attempts >= maxAttempts;
    }

    /**
     * 로그인 실패 기록
     */
    public void recordFailure(String ip, String email) {
        String key = buildKey(ip, email);
        Integer attempts = attemptCache.getIfPresent(key);
        attemptCache.put(key, (attempts != null ? attempts : 0) + 1);
    }

    /**
     * 로그인 성공 시 실패 카운트 초기화
     */
    public void clearAttempts(String ip, String email) {
        attemptCache.invalidate(buildKey(ip, email));
    }

    public int getBlockMinutes() {
        return blockMinutes;
    }

    private String buildKey(String ip, String email) {
        return ip + ":" + (email != null ? email.toLowerCase() : "unknown");
    }
}
