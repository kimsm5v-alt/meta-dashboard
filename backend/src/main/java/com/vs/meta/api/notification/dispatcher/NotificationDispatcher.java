package com.vs.meta.api.notification.dispatcher;

import com.vs.meta.api.notification.dto.NotificationDto;

/**
 * 알림 실시간 전달 디스패처.
 *
 * <p>Phase 1 (단일 인스턴스): {@link InMemoryDispatcher} — 메모리 Registry로 직접 전달
 * <p>Phase 2 (다중 인스턴스): RedisPubSubDispatcher — Redis로 PUBLISH하여 서버 간 공유
 *
 * <p>전환 방법: {@code notification.pubsub.enabled} 환경변수로 구현체 토글
 */
public interface NotificationDispatcher {

    /**
     * 특정 사용자에게 실시간으로 알림 전달.
     * DB insert는 호출 전에 이미 완료되어 있어야 함.
     */
    void dispatch(Long userNo, NotificationDto dto);
}
