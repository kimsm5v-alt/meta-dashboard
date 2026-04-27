package com.vs.meta.api.notification.dispatcher;

import com.vs.meta.api.notification.dto.NotificationDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Redis Pub/Sub 채널 메시지 페이로드.
 * 발행 인스턴스 → Redis → 모든 인스턴스(자기 자신 포함) 가 받아서
 * 자신의 SseEmitterRegistry 에 해당 userNo 가 있으면 전송한다.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RedisDispatchMessage {
    private Long userNo;
    private NotificationDto dto;
}
