package com.vs.meta.api.notification.dispatcher;

import com.vs.meta.api.notification.dto.NotificationDto;
import com.vs.meta.api.notification.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Phase 1 구현 — 메모리 기반 Registry로 직접 전달.
 *
 * <p>단일 인스턴스 환경에서만 유효. 다중 인스턴스 시 다른 서버에 연결된 사용자는
 * 이벤트를 수신하지 못함 → Phase 2에서 RedisPubSubDispatcher로 교체.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "notification.pubsub.enabled", havingValue = "false", matchIfMissing = true)
public class InMemoryDispatcher implements NotificationDispatcher {

    private final SseEmitterRegistry registry;

    @Override
    public void dispatch(Long userNo, NotificationDto dto) {
        int sent = registry.sendTo(userNo, "notification", dto);
        log.debug("[Dispatch] InMemory userNo={}, notificationId={}, sent={}", userNo, dto.getNotificationId(), sent);
    }
}
