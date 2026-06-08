package com.vs.meta.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
@RequiredArgsConstructor
public class PersonInfoClientConfig {

    private final SpAuthProperties spAuthProperties;

    /**
     * Auth Internal API 전용 RestClient.
     * timeout/baseUrl 설정 격리 — 다른 RestClient 와 충돌 없음.
     */
    @Bean("personInfoRestClient")
    public RestClient personInfoRestClient() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(spAuthProperties.getInternalApi().getConnectTimeoutMs()));
        factory.setReadTimeout(Duration.ofMillis(spAuthProperties.getInternalApi().getReadTimeoutMs()));

        return RestClient.builder()
                .baseUrl(spAuthProperties.getInternalApi().getBaseUrl())
                .requestFactory(factory)
                .build();
    }
}
