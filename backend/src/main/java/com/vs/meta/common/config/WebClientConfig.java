package com.vs.meta.common.config;

import io.netty.channel.ChannelOption;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

/**
 * WebClient 공통 설정.
 *
 * <p>SuperPlatform Auth 서버 호출용 WebClient + QCH ingest 호출용 WebClient 를 Bean 으로 등록하여
 * 커넥션 풀과 클라이언트 인스턴스를 재사용한다.
 */
@Configuration
public class WebClientConfig {

    private static final int CONNECT_TIMEOUT_MS = 5_000;
    private static final Duration RESPONSE_TIMEOUT = Duration.ofSeconds(10);

    @Bean
    public WebClient superPlatformAuthWebClient(SpAuthProperties spAuth) {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MS)
                .responseTimeout(RESPONSE_TIMEOUT);

        return WebClient.builder()
                .baseUrl(spAuth.getServerUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    /**
     * QCH ingest 호출용 WebClient.
     * timeout 은 QchProperties 에서 짧게(connect 3s / response 5s) — 본 서비스 응답 차단 방지.
     */
    @Bean
    public WebClient qchIngestWebClient(QchProperties qch) {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, qch.getConnectTimeoutMs())
                .responseTimeout(Duration.ofMillis(qch.getResponseTimeoutMs()));

        WebClient.Builder builder = WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient));

        if (qch.getBaseUrl() != null && !qch.getBaseUrl().isBlank()) {
            builder.baseUrl(qch.getBaseUrl());
        }
        return builder.build();
    }
}
