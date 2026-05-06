package com.vs.meta.api.notification.scheduler;

import com.vs.meta.api.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 90일 경과 알림 자동 삭제 스케줄러.
 *
 * <p>Phase 1 (단일 인스턴스): {@code @Scheduled} 만 사용. {@code @SchedulerLock} 어노테이션은
 *   {@code notification.shedlock.enabled=false} 시 무시되어 그대로 단일 실행.
 * <p>Phase 2 (다중 인스턴스): {@code notification.shedlock.enabled=true} 시
 *   {@link NotificationShedLockConfig} 가 활성화되어 분산 락으로 한 인스턴스에서만 실행.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationRetentionScheduler {

    private static final int RETENTION_DAYS = 90;

    private final NotificationService service;

    /**
     * 매일 03:00 (Asia/Seoul) — 90일 경과 알림 삭제.
     *
     * <p>{@code lockAtMostFor}: 락 최대 보유 시간. 인스턴스가 죽어도 이 시간 후 다른 인스턴스가 획득 가능.
     * <p>{@code lockAtLeastFor}: 작업이 빨리 끝나도 이 시간 동안 락 유지 (다른 인스턴스 즉시 재실행 방지).
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")
    @SchedulerLock(name = "cleanupOldNotifications", lockAtMostFor = "PT10M", lockAtLeastFor = "PT1M")
    public void cleanupOldNotifications() {
        try {
            int deleted = service.deleteOlderThan(RETENTION_DAYS);
            log.info("[Notification] 90일 경과 알림 정리: {}건 삭제", deleted);
        } catch (Exception e) {
            log.error("[Notification] 90일 경과 삭제 실패", e);
        }
    }
}
