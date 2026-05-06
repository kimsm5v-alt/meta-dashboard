package com.vs.meta.api.notification.controller;

import com.vs.meta.api.notification.sse.SseEmitterRegistry;
import com.vs.meta.common.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;

/**
 * 알림 SSE 스트림 엔드포인트.
 *
 * <p>FE는 {@code @microsoft/fetch-event-source}로 이 경로에 연결한다 (브라우저 기본 EventSource는 Bearer 헤더 미지원).
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notification SSE", description = "알림 실시간 스트림")
public class NotificationStreamController {

    private static final long SSE_TIMEOUT_MS = Duration.ofHours(1).toMillis();

    private final SseEmitterRegistry registry;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "SSE 스트림 연결", description = "현재 로그인 사용자의 알림 스트림 연결 (최대 1시간)")
    public SseEmitter stream() {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        registry.register(userNo, emitter);

        emitter.onCompletion(() -> {
            registry.remove(userNo, emitter);
            log.debug("[SSE] completion: userNo={}", userNo);
        });
        emitter.onTimeout(() -> {
            registry.remove(userNo, emitter);
            log.debug("[SSE] timeout: userNo={}", userNo);
        });
        emitter.onError(e -> {
            registry.remove(userNo, emitter);
            log.debug("[SSE] error: userNo={}, error={}", userNo, e.getMessage());
        });

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            log.warn("[SSE] 초기 이벤트 전송 실패: userNo={}", userNo);
        }

        return emitter;
    }
}
