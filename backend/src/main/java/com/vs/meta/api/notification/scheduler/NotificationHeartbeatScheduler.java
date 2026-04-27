package com.vs.meta.api.notification.scheduler;

import com.vs.meta.api.notification.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * SSE 연결 유지용 Heartbeat.
 *
 * <p>30초마다 모든 활성 emitter에 주석(comment) 이벤트를 전송하여
 * 프록시/LB의 idle timeout으로 인한 연결 종료를 방지한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationHeartbeatScheduler {

    private final SseEmitterRegistry registry;

    @Scheduled(fixedDelay = 30_000L)
    public void heartbeat() {
        int connections = registry.totalActiveConnections();
        if (connections == 0) return;
        registry.broadcastHeartbeat();
        log.debug("[SSE] heartbeat sent to {} connections", connections);
    }
}
