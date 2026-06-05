package com.vs.meta.api.notification.controller;

import com.vs.meta.api.notification.sse.SseEmitterRegistry;
import com.vs.meta.common.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

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
    public ResponseEntity<?> stream() {
        // JWT 는 통과했지만 학심정 user 매핑이 안 된 케이스 — JIT 가입 race, 추가 정보 입력 미완료 등.
        // requireCurrentUserNo() 가 IllegalStateException 을 던지면 GlobalExceptionHandler 가 409 로 매핑되어
        // FE 의 SSE 401 가드 경로를 안 타고 무한 retry 가 안 돼서 좋지만, 사유가 불명확.
        // → 명시적 401 + errorCode 로 정렬해서 FE 가드가 정확히 분기할 수 있게.
        Long userNo = SecurityUtil.getCurrentUserNo();
        if (userNo == null) {
            log.warn("[SSE] user_no 매핑 실패 — SSE 거부. spUserId={}", SecurityUtil.getCurrentSpUserId());
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("success", false);
            body.put("resultCode", 401);
            body.put("resultMessage", "사용자 매핑이 완료되지 않았습니다.");
            body.put("errorCode", "USER_NOT_MAPPED");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body);
        }
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

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .body(emitter);
    }
}
