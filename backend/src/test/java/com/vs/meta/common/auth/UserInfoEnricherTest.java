package com.vs.meta.common.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

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
                .thenReturn(Map.of("sp-123", new UserInfo("sp-123", "홍길동", null, "a@b.c", "STUDENT", false)));

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
                "sp-1", new UserInfo("sp-1", "A", null, "a@x", "STUDENT", false),
                "sp-2", new UserInfo("sp-2", "B", null, "b@x", "STUDENT", false)
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
}
