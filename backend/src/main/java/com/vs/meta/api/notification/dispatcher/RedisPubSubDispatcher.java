package com.vs.meta.api.notification.dispatcher;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.vs.meta.api.notification.dto.NotificationDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Phase 2 — Redis Pub/Sub 기반 분산 디스패처.
 *
 * <p>알림을 Redis 채널에 PUBLISH 하면 모든 인스턴스(발행 인스턴스 본인 포함) 가
 * SUBSCRIBE 하여 자신의 SseEmitterRegistry 에 해당 userNo 가 있으면 SSE 로 전송한다.
 *
 * <p>{@code notification.pubsub.enabled=true} 일 때만 빈 등록 — InMemoryDispatcher 와 상호 배타.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "notification.pubsub.enabled", havingValue = "true")
public class RedisPubSubDispatcher implements NotificationDispatcher {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public RedisPubSubDispatcher(
            @Qualifier("notificationStringRedisTemplate") StringRedisTemplate redisTemplate,
            @Qualifier("notificationObjectMapper") ObjectMapper objectMapper
    ) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void dispatch(Long userNo, NotificationDto dto) {
        try {
            String payload = objectMapper.writeValueAsString(new RedisDispatchMessage(userNo, dto));
            redisTemplate.convertAndSend(NotificationRedisConfig.CHANNEL_DISPATCH, payload);
            log.debug("[Dispatch] Redis publish userNo={}, notificationId={}", userNo, dto.getNotificationId());
        } catch (JacksonException e) {
            log.warn("[Dispatch] Redis 직렬화 실패 userNo={}, notificationId={}", userNo, dto.getNotificationId(), e);
        } catch (Exception e) {
            // Redis 일시 장애 — 본 비즈 로직은 이미 커밋된 상태이므로 알림만 못 받고 끝
            log.warn("[Dispatch] Redis publish 실패 userNo={}, notificationId={}", userNo, dto.getNotificationId(), e);
        }
    }
}
