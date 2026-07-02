package com.vs.meta.common.config;

import io.netty.channel.ChannelOption;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import reactor.netty.resources.ConnectionProvider;

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

    static final Duration SP_AUTH_MAX_IDLE = Duration.ofSeconds(20);   // 게이트웨이 keep-alive(통상 60s)보다 짧게 → 유휴 커넥션 선제 폐기
    static final Duration SP_AUTH_MAX_LIFE = Duration.ofMinutes(5);    // 총수명 백스톱
    static final Duration SP_AUTH_EVICT    = Duration.ofSeconds(30);   // 신규 acquire 없어도 주기적으로 유휴 회수(저트래픽 필수)

    static ConnectionProvider spAuthConnectionProvider() {
        // 기존 전역 기본 풀과 동일한 용량/대기 타임아웃(maxConnections 500, pendingAcquire 기본 45s) 유지 —
        // 이번 변경의 의도는 오직 유휴 커넥션 eviction 추가(회귀 최소화).
        return ConnectionProvider.builder("sp-auth")
                .maxConnections(500)                       // 기존 전역 기본풀 상한(용량 회귀 방지)
                .maxIdleTime(SP_AUTH_MAX_IDLE)
                .maxLifeTime(SP_AUTH_MAX_LIFE)
                .evictInBackground(SP_AUTH_EVICT)
                // pendingAcquireTimeout: reactor-netty 기본값(45s) 그대로 유지 — 기존과 동일
                .build();
    }

    @Bean
    public WebClient superPlatformAuthWebClient(SpAuthProperties spAuth) {
        HttpClient httpClient = HttpClient.create(spAuthConnectionProvider())
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
