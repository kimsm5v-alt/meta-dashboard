package com.vs.meta.api.notification.controller;

import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * 알림 SSE 찍먹용 컨트롤러.
 * <p>DB/Redis/이벤트 없이 메모리 맵만으로 연결 + 메시지 전달 동작 확인.
 * 실제 구현은 이 클래스 지우고 본 설계대로 교체한다.
 */
@Slf4j
@RestController
@RequestMapping(value = "/api/v1/notifications", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Notification (POC)", description = "알림 SSE 찍먹용 — 메모리 기반")
public class NotificationTestController {

    private static final long SSE_TIMEOUT_MS = 3600_000L; // 1시간

    /** userNo -> 해당 사용자의 활성 SseEmitter 목록 (멀티 탭 지원) */
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> store = new ConcurrentHashMap<>();

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "SSE 스트림 연결", description = "현재 로그인 사용자의 알림 스트림 연결")
    public SseEmitter stream() {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);

        store.computeIfAbsent(userNo, k -> new CopyOnWriteArrayList<>()).add(emitter);
        log.info("[SSE] 연결 성공: userNo={}, 현재 연결 수={}", userNo, store.get(userNo).size());

        emitter.onCompletion(() -> removeEmitter(userNo, emitter, "completion"));
        emitter.onTimeout(() -> removeEmitter(userNo, emitter, "timeout"));
        emitter.onError(e -> removeEmitter(userNo, emitter, "error"));

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            log.warn("[SSE] 초기 이벤트 전송 실패: userNo={}", userNo);
        }

        return emitter;
    }

    @PostMapping("/test-send")
    @Operation(summary = "테스트 알림 발송", description = "본인에게 테스트 알림을 SSE로 푸시")
    public ResponseDTO<CustomBody> testSend(
            @RequestParam(defaultValue = "테스트 알림입니다") String msg
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        CopyOnWriteArrayList<SseEmitter> emitters = store.get(userNo);

        int sent = 0;
        if (emitters != null) {
            for (SseEmitter emitter : emitters) {
                try {
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("content", msg);
                    payload.put("at", System.currentTimeMillis());
                    emitter.send(SseEmitter.event().name("notification").data(payload));
                    sent++;
                } catch (IOException e) {
                    log.warn("[SSE] 전송 실패: userNo={}", userNo);
                    emitter.completeWithError(e);
                }
            }
        }

        log.info("[SSE] 테스트 알림 발송: userNo={}, 전송={}건", userNo, sent);
        Map<String, Object> result = new HashMap<>();
        result.put("sent", sent);
        return AidtCommonUtil.makeResultSuccess(null, result, "OK");
    }

    private void removeEmitter(Long userNo, SseEmitter emitter, String reason) {
        CopyOnWriteArrayList<SseEmitter> list = store.get(userNo);
        if (list != null) {
            list.remove(emitter);
            log.info("[SSE] 연결 종료({}): userNo={}, 남은 연결={}", reason, userNo, list.size());
        }
    }
}
