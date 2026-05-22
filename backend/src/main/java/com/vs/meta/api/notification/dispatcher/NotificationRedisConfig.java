package com.vs.meta.api.notification.dispatcher;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import tools.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

/**
 * Phase 2 — Redis Pub/Sub 인프라 설정.
 *
 * <p>{@code notification.pubsub.enabled=true} 일 때만 빈 등록.
 * false (기본값) 시에는 이 설정 자체가 활성화되지 않아 Redis 연결 시도조차 없음.
 *
 * <p>채널 한 개 ({@link #CHANNEL_DISPATCH}) 로 모든 알림 분산 전달.
 */
@Configuration
@ConditionalOnProperty(name = "notification.pubsub.enabled", havingValue = "true")
public class NotificationRedisConfig {

    /** 알림 분산 전달 채널명 */
    public static final String CHANNEL_DISPATCH = "notification:dispatch";

    /**
     * 알림 페이로드(JSON) 직렬화 전용 ObjectMapper.
     * 다른 곳에서 사용하는 ObjectMapper 와 격리하기 위해 별도 빈으로 분리.
     */
    @Bean(name = "notificationObjectMapper")
    public ObjectMapper notificationObjectMapper() {
        // Jackson 3: java.time 모듈 자동 등록, ObjectMapper immutable → JsonMapper.builder() 권장.
        // 날짜 ISO 문자열 직렬화가 기본(WRITE_DATES_AS_TIMESTAMPS 옵션 제거됨). FIELD visibility 만 명시.
        return tools.jackson.databind.json.JsonMapper.builder()
                .changeDefaultVisibility(vc -> vc.withFieldVisibility(JsonAutoDetect.Visibility.ANY))
                .build();
    }

    /**
     * Pub/Sub 메시지 수신 컨테이너.
     * {@link RedisPubSubSubscriber} 를 {@link #CHANNEL_DISPATCH} 채널에 구독시킴.
     */
    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            RedisPubSubSubscriber subscriber
    ) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        // MessageListener 직접 구현체 등록 — adapter 우회로 NPE 회피
        container.addMessageListener(subscriber, new ChannelTopic(CHANNEL_DISPATCH));
        return container;
    }

    /**
     * 발행용 StringRedisTemplate.
     * Spring Boot 가 기본 제공하긴 하지만, 토글 ON 시점에만 명시적으로 노출하기 위해 선언.
     */
    @Bean(name = "notificationStringRedisTemplate")
    public StringRedisTemplate notificationStringRedisTemplate(RedisConnectionFactory cf) {
        return new StringRedisTemplate(cf);
    }
}
