package com.vs.meta.api.notification.dispatcher;

import tools.jackson.databind.ObjectMapper;
import com.vs.meta.api.notification.sse.SseEmitterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Phase 2 — Redis Pub/Sub 채널 구독자.
 *
 * <p>{@link MessageListener} 직접 구현 — {@code MessageListenerAdapter} 의 reflection 기반
 * 위임은 {@code afterPropertiesSet()} 호출 의존성이 있어 NPE 가능. 직접 구현이 더 안전.
 *
 * <p>채널 {@link NotificationRedisConfig#CHANNEL_DISPATCH} 의 메시지를 받아
 * 자신의 {@link SseEmitterRegistry} 에 해당 userNo 가 있으면 SSE 로 전송한다.
 * 없으면 무시 (다른 인스턴스에 연결된 사용자라는 의미).
 *
 * <p>모든 인스턴스가 같은 채널을 구독하므로 발행 인스턴스 본인도 다시 받는다 —
 * 그래서 PUBLISH 한 인스턴스에 연결돼있던 사용자도 정상 전달됨.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "notification.pubsub.enabled", havingValue = "true")
public class RedisPubSubSubscriber implements MessageListener {

    private final ObjectMapper objectMapper;
    private final SseEmitterRegistry registry;

    public RedisPubSubSubscriber(
            @Qualifier("notificationObjectMapper") ObjectMapper objectMapper,
            SseEmitterRegistry registry
    ) {
        this.objectMapper = objectMapper;
        this.registry = registry;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String body = new String(message.getBody(), StandardCharsets.UTF_8);
        try {
            RedisDispatchMessage msg = objectMapper.readValue(body, RedisDispatchMessage.class);
            int sent = registry.sendTo(msg.getUserNo(), "notification", msg.getDto());
            log.debug("[Dispatch] Redis subscribe userNo={}, notificationId={}, sent={}",
                    msg.getUserNo(), msg.getDto().getNotificationId(), sent);
        } catch (Exception e) {
            log.warn("[Dispatch] Redis 메시지 처리 실패 body={}", body, e);
        }
    }
}
