package com.vs.meta.common.service;

import com.vs.meta.common.config.QchAsyncConfig;
import com.vs.meta.common.config.QchProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

/**
 * QCH /api/v1/ingest/trace 발송 클라이언트 (best-effort 비동기).
 *
 * <p>{@code @Async("qchTraceExecutor")} 로 본 서비스 응답 스레드와 격리.
 * 모든 예외는 WARN 로그로만 남기고 호출자에 전파하지 않음 — 적재 실패가 본 서비스에 영향 주면 안 됨.
 *
 * <p>doc-1444 §2.4 권장 패턴 — try/catch + best-effort.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class QchTraceClient {

    private static final String TRACE_PATH = "/api/v1/ingest/trace";

    private final WebClient qchIngestWebClient;
    private final QchProperties qch;

    @Async(QchAsyncConfig.QCH_TRACE_EXECUTOR)
    public void sendTrace(QchTraceEvent event) {
        if (!qch.isEnabled()) {
            return;
        }
        if (event == null) {
            return;
        }
        try {
            qchIngestWebClient.post()
                    .uri(TRACE_PATH)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(event)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (WebClientResponseException ex) {
            log.warn("[QCH] trace failed (HTTP {} - {}): {} {}",
                    ex.getRawStatusCode(), ex.getStatusText(), event.getMethod(), event.getEndpoint());
        } catch (Exception ex) {
            log.warn("[QCH] trace failed: {} {} - {}", event.getMethod(), event.getEndpoint(), ex.getMessage());
        }
    }
}
