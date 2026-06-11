package com.vs.meta.api.sso.scheduler;

import com.vs.meta.api.sso.service.GroupSyncService;
import com.vs.meta.common.config.GroupSyncProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * IDP 그룹 변경 피드 폴링 스케줄러 (group-from-idp 03 §4).
 *
 * <p>주기: 1분 — 그룹 참여/퇴장 SSE 알림(T1/S5) UX 때문에 회원 피드(15분)보다 짧다.
 * 부트스트랩 미완료(커서 NULL)면 폴링 대신 부트스트랩을 수행.
 * <p>분산 락: {@code notification.shedlock.enabled=true} 면 단일 인스턴스 실행 보장.
 * <p>활성화: {@code group-sync.enabled=true} (기본 false). ENV(GROUP_SYNC_ENABLED) 토글로 점진 배포.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GroupSyncScheduler {

    private final GroupSyncService groupSyncService;
    private final GroupSyncProperties props;

    @Scheduled(cron = "0 */1 * * * *", zone = "Asia/Seoul")
    @SchedulerLock(name = "pollGroupChanges", lockAtMostFor = "PT5M", lockAtLeastFor = "PT10S")
    public void poll() {
        if (!props.isEnabled()) {
            return;
        }
        try {
            groupSyncService.syncOnce();
        } catch (Exception e) {
            // IdP 다운 등 일시 장애 — 커서 미전진이라 다음 주기에 catch-up. ERROR 한 줄.
            log.error("[GROUP-SYNC] 폴링 사이클 실패: {}", e.getMessage(), e);
        }
    }
}
