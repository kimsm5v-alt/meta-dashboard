package com.vs.meta.api.notification.scheduler;

import com.vs.meta.api.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 90일 경과 알림 자동 삭제 스케줄러.
 *
 * <p>Phase 1: 단일 인스턴스 환경 — {@code @Scheduled}만 사용.
 * <p>Phase 2: BE 2대 이상 환경 — {@code @SchedulerLock}(ShedLock) 추가 예정.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationRetentionScheduler {

    private static final int RETENTION_DAYS = 90;

    private final NotificationService service;

    /**
     * 매일 03:00 (Asia/Seoul) — 90일 경과 알림 삭제.
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")
    public void cleanupOldNotifications() {
        try {
            int deleted = service.deleteOlderThan(RETENTION_DAYS);
            log.info("[Notification] 90일 경과 알림 정리: {}건 삭제", deleted);
        } catch (Exception e) {
            log.error("[Notification] 90일 경과 삭제 실패", e);
        }
    }
}
