package com.vs.meta.common.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class PersonInfoCacheStoreTest {

    private PersonInfoCacheStore store;

    @BeforeEach
    void setUp() {
        store = new PersonInfoCacheStore();
    }

    @Test
    void 캐시_miss시_loader를_호출한다() {
        AtomicInteger callCount = new AtomicInteger(0);
        List<String> ids = List.of("user-1", "user-2");

        store.getOrLoad(ids, missed -> {
            callCount.incrementAndGet();
            return Map.of(
                "user-1", new UserInfo("user-1", "홍길동", null, null, "TEACHER", false, "NONE"),
                "user-2", new UserInfo("user-2", "김철수", null, null, "STUDENT", false, "NONE")
            );
        });

        assertThat(callCount.get()).isEqualTo(1);
    }

    @Test
    void 캐시_hit시_loader를_호출하지_않는다() {
        AtomicInteger callCount = new AtomicInteger(0);
        List<String> ids = List.of("user-1");

        // 첫 번째 호출로 캐시 워밍
        store.getOrLoad(ids, missed -> {
            callCount.incrementAndGet();
            return Map.of("user-1", new UserInfo("user-1", "홍길동", null, null, "TEACHER", false, "NONE"));
        });

        // 두 번째 호출 — 캐시 hit
        store.getOrLoad(ids, missed -> {
            callCount.incrementAndGet();
            return Map.of();
        });

        assertThat(callCount.get()).isEqualTo(1);
    }

    @Test
    void placeholder는_캐시에_저장하지_않는다() {
        AtomicInteger callCount = new AtomicInteger(0);
        List<String> ids = List.of("withdrawn-user");

        store.getOrLoad(ids, missed -> {
            callCount.incrementAndGet();
            return Map.of("withdrawn-user", UserInfo.placeholder("withdrawn-user"));
        });

        // placeholder는 저장 안 했으므로 두 번째도 loader 호출
        store.getOrLoad(ids, missed -> {
            callCount.incrementAndGet();
            return Map.of("withdrawn-user", UserInfo.placeholder("withdrawn-user"));
        });

        assertThat(callCount.get()).isEqualTo(2);
    }

    @Test
    void 일부_miss시_miss된_ID만_loader에_전달된다() {
        // user-1만 캐시 워밍
        store.getOrLoad(List.of("user-1"), missed ->
            Map.of("user-1", new UserInfo("user-1", "홍길동", null, null, "TEACHER", false, "NONE")));

        // user-1은 hit, user-2만 miss
        List<String> missedCapture = new java.util.ArrayList<>();
        store.getOrLoad(List.of("user-1", "user-2"), missed -> {
            missedCapture.addAll(missed);
            return Map.of("user-2", new UserInfo("user-2", "김철수", null, null, "STUDENT", false, "NONE"));
        });

        assertThat(missedCapture).containsExactly("user-2");
    }

    @Test
    void 결과_맵에_전체_ID가_포함된다() {
        Map<String, UserInfo> result = store.getOrLoad(List.of("user-1", "user-2"), missed ->
            Map.of(
                "user-1", new UserInfo("user-1", "홍길동", null, null, "TEACHER", false, "NONE"),
                "user-2", new UserInfo("user-2", "김철수", null, null, "STUDENT", false, "NONE")
            )
        );

        assertThat(result).containsKeys("user-1", "user-2");
        assertThat(result.get("user-1").name()).isEqualTo("홍길동");
    }
}
