package com.vs.meta.common.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserInfoEnricherTest {

    @Mock private PersonInfoClient personInfoClient;
    @Mock private PersonInfoRequestCache requestCache;

    @InjectMocks
    private UserInfoEnricher enricher;

    static class TestDto implements HasUserInfo {
        private String spUserId;
        private String name;
        private String email;

        @Override
        public String getSpUserId() {
            return spUserId;
        }

        public void setSpUserId(String spUserId) {
            this.spUserId = spUserId;
        }

        @Override
        public void setName(String name) {
            this.name = name;
        }

        @Override
        public void setEmail(String email) {
            this.email = email;
        }

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }
    }

    @Test
    void singleItemIsEnrichedViaBatchOne() {
        TestDto dto = new TestDto();
        dto.setSpUserId("sp-123");

        when(requestCache.getBatchOrLoad(anyList(), any()))
                .thenReturn(Map.of("sp-123", new UserInfo("sp-123", "홍길동", null, "a@b.c", "STUDENT", false, "NONE")));

        enricher.enrich(dto);

        assertThat(dto.getName()).isEqualTo("홍길동");
        assertThat(dto.getEmail()).isEqualTo("a@b.c");
    }

    @Test
    void listIsEnrichedWithDistinctIdsOnly() {
        TestDto a = new TestDto(); a.setSpUserId("sp-1");
        TestDto b = new TestDto(); b.setSpUserId("sp-2");
        TestDto c = new TestDto(); c.setSpUserId("sp-1");  // 중복

        when(requestCache.getBatchOrLoad(anyList(), any())).thenReturn(Map.of(
                "sp-1", new UserInfo("sp-1", "A", null, "a@x", "STUDENT", false, "NONE"),
                "sp-2", new UserInfo("sp-2", "B", null, "b@x", "STUDENT", false, "NONE")
        ));

        enricher.enrich(List.of(a, b, c));

        assertThat(a.getName()).isEqualTo("A");
        assertThat(b.getName()).isEqualTo("B");
        assertThat(c.getName()).isEqualTo("A");
    }

    @Test
    void notFoundFallsBackToPlaceholder() {
        TestDto dto = new TestDto(); dto.setSpUserId("sp-deleted");

        when(requestCache.getBatchOrLoad(anyList(), any())).thenReturn(Map.of());

        enricher.enrich(dto);

        assertThat(dto.getName()).isEqualTo("(탈퇴 회원)");
    }

    @Test
    void nullItemIsNoOp() {
        enricher.enrich((TestDto) null);
        verify(requestCache, never()).getBatchOrLoad(anyList(), any());
    }

    @Test
    void itemWithNullSpUserIdIsSkipped() {
        TestDto dto = new TestDto();
        // spUserId null
        enricher.enrich(dto);
        verify(requestCache, never()).getBatchOrLoad(anyList(), any());
    }

    // ── 앱 캐시(Caffeine) 연동 시나리오 ──────────────────────────────────────

    @Test
    void 앱_캐시_hit시_SSO_호출_없음() {
        PersonInfoCacheStore appCacheStore = new PersonInfoCacheStore();
        // 앱 캐시 워밍
        appCacheStore.getOrLoad(
            List.of("user-cached"),
            ids -> Map.of("user-cached",
                new UserInfo("user-cached", "캐시된사용자", null, null, "TEACHER", false, "NONE"))
        );

        AtomicInteger ssoCallCount = new AtomicInteger(0);
        PersonInfoRequestCache rc = new PersonInfoRequestCache(appCacheStore);
        rc.getBatchOrLoad(
            List.of("user-cached"),
            ids -> { ssoCallCount.incrementAndGet(); return Map.of(); }
        );

        assertThat(ssoCallCount.get()).isEqualTo(0);
    }

    @Test
    void 앱_캐시_miss시_SSO_1회_호출_후_다음_요청은_캐시_hit() {
        PersonInfoCacheStore appCacheStore = new PersonInfoCacheStore();
        AtomicInteger ssoCallCount = new AtomicInteger(0);

        // 첫 번째 HTTP 요청 — 앱 캐시 miss → SSO 호출
        PersonInfoRequestCache rc1 = new PersonInfoRequestCache(appCacheStore);
        rc1.getBatchOrLoad(
            List.of("user-new"),
            ids -> {
                ssoCallCount.incrementAndGet();
                return Map.of("user-new",
                    new UserInfo("user-new", "새사용자", null, null, "STUDENT", false, "NONE"));
            }
        );

        // 두 번째 HTTP 요청 (새 RequestScope 인스턴스) — 앱 캐시 hit
        PersonInfoRequestCache rc2 = new PersonInfoRequestCache(appCacheStore);
        rc2.getBatchOrLoad(
            List.of("user-new"),
            ids -> { ssoCallCount.incrementAndGet(); return Map.of(); }
        );

        assertThat(ssoCallCount.get()).isEqualTo(1);
    }
}
