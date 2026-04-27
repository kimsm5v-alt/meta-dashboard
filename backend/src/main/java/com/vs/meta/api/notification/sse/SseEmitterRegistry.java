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
            } catch (IOException e) {
                log.warn("[SSE] 전송 실패: userNo={}, error={}", userNo, e.getMessage());
                emitter.completeWithError(e); // onError에서 remove 호출됨
            }
        }
        return sent;
    }

    /** Heartbeat 전송 — 모든 활성 emitter에 주석(ping) 전송 */
    public void broadcastHeartbeat() {
        store.forEach((userNo, emitters) -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                } catch (IOException ignored) {
                    // 실패한 emitter는 다음 전송 시 정리됨
                }
            }
        });
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
