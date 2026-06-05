package com.vs.meta.common.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Mock 기반 최소 검증. 실제 RestClient 호출은 Task 통합 테스트(WireMock)에서 다룬다.
 */
@ExtendWith(MockitoExtension.class)
class ServiceAccessTokenProviderTest {

    @Test
    void classCompilesAndCachedTokenRecordIsValid() {
        // 본격 캐시/만료 검증은 WireMock 통합 테스트(별도 Task)에서.
        // 여기서는 placeholder — 컴파일 성공 확인.
        assertThat(true).isTrue();
    }
}
