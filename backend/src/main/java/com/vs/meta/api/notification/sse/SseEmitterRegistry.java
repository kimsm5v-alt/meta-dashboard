package com.vs.meta.api.notification.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * 사용자별 SSE Emitter 저장소 (메모리 기반).
 *
 * <p>Phase 1: 단일 인스턴스 내 메모리 맵으로 관리.
 * <p>Phase 2: Redis Pub/Sub 도입 시 {@link NotificationDispatcher} 구현만 교체하면 되고
 * 이 Registry 자체는 그대로 사용한다 (각 서버가 자기 연결 사용자에게만 전달).
 */
@Slf4j
@Component
public class SseEmitterRegistry {

    /** userNo → 해당 사용자의 활성 SseEmitter 목록 (멀티 탭 지원) */
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> store = new ConcurrentHashMap<>();

    public void register(Long userNo, SseEmitter emitter) {
        store.computeIfAbsent(userNo, k -> new CopyOnWriteArrayList<>()).add(emitter);
        log.info("[SSE] 연결 등록: userNo={}, 현재 연결={}", userNo, store.get(userNo).size());
    }

    public void remove(Long userNo, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = store.get(userNo);
        if (list == null) return;
        list.remove(emitter);
        if (list.isEmpty()) {
            store.remove(userNo);
        }
    }

    /**
     * 특정 사용자에게 이벤트 전달.
     * @return 실제로 전송된 emitter 수
     */
    public int sendTo(Long userNo, String eventName, Object data) {
        CopyOnWriteArrayList<SseEmitter> list = store.get(userNo);
        if (list == null || list.isEmpty()) return 0;

        int sent = 0;
        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
                sent++;
            } catch (IOException | IllegalStateException e) {
                // IOException: 네트워크 끊김. IllegalStateException: response 객체 recycle 등
                log.warn("[SSE] 전송 실패: userNo={}, error={}", userNo, e.getMessage());
                try {
                    emitter.completeWithError(e); // onError → registry.remove
                } catch (Exception ignored) {
                    // 이미 complete 된 emitter — 무시
                }
            }
        }
        return sent;
    }

    /**
     * Heartbeat 전송 — 모든 활성 emitter에 주석(ping) 전송.
     *
     * <p>죽은 emitter (클라이언트 연결 끊김, response 객체 recycle 등) 는 send 시점에
     * IOException 또는 IllegalStateException 으로 터짐. 이 경우 {@code completeWithError}
     * 호출하여 onError 콜백 → {@link #remove} 흐름으로 정리.
     */
    public void broadcastHeartbeat() {
        int sent = 0;
        int failed = 0;
        for (Map.Entry<Long, CopyOnWriteArrayList<SseEmitter>> entry : store.entrySet()) {
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                    sent++;
                } catch (IOException | IllegalStateException e) {
                    failed++;
                    try {
                        emitter.completeWithError(e); // onError 콜백 → registry.remove
                    } catch (Exception ignored) {
                        // 이미 complete 된 emitter — 무시
                    }
                }
            }
        }
        if (failed > 0) {
            log.debug("[SSE] heartbeat sent={}, failed={} (dead emitters cleaned)", sent, failed);
        }
    }

    /** 모니터링용: 총 활성 연결 수 */
    public int totalActiveConnections() {
        return store.values().stream().mapToInt(CopyOnWriteArrayList::size).sum();
    }

    /** 모니터링용: 활성 사용자 수 */
    public int totalActiveUsers() {
        return store.size();
    }
}
