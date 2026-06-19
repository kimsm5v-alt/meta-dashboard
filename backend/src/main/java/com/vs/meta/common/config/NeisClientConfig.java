package com.vs.meta.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * NEIS Open API 전용 RestClient. baseUrl 은 neis.base-url, 인증키는 호출 시 쿼리파라미터(KEY)로 부착.
 */
@Configuration
@RequiredArgsConstructor
public class NeisClientConfig {

    private final NeisProperties neisProperties;

    @Bean("neisRestClient")
    public RestClient neisRestClient() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        return RestClient.builder()
                .baseUrl(neisProperties.getBaseUrl())
                .requestFactory(factory)
                .build();
    }
}
