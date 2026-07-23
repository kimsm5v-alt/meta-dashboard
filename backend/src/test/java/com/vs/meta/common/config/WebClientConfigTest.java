package com.vs.meta.common.config;

import org.junit.jupiter.api.Test;
import reactor.netty.resources.ConnectionProvider;

import static org.assertj.core.api.Assertions.assertThat;

class WebClientConfigTest {

    @Test
    void spAuth_풀_구성값_회귀방지() {
        assertThat(WebClientConfig.SP_AUTH_MAX_IDLE).isPositive();
        assertThat(WebClientConfig.SP_AUTH_EVICT).isPositive();
        assertThat(WebClientConfig.SP_AUTH_MAX_IDLE).isLessThan(WebClientConfig.SP_AUTH_MAX_LIFE);
        assertThat(WebClientConfig.SP_AUTH_EVICT).isLessThan(WebClientConfig.SP_AUTH_MAX_LIFE);
    }

    @Test
    void spAuthConnectionProvider_는_프로바이더를_생성한다() {
        ConnectionProvider provider = WebClientConfig.spAuthConnectionProvider();
        assertThat(provider).isNotNull();
    }
}
