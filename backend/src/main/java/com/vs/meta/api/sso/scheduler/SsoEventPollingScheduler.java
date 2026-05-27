package com.vs.meta.api.sso.scheduler;

import com.vs.meta.api.sso.service.SsoEventPollService;
import com.vs.meta.common.config.SsoEventPollProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * SSO 이벤트 폴링 스케줄러 — IdP RP Event Feed 를 주기적으로 끌어와 학심정 탈퇴 cascade 적용.
 *
 * <p>주기: 15분 (IdP 권장). revocations → deletions 순차 호출.
 * <p>분산 락: {@code notification.shedlock.enabled=true} 면 shedlock 테이블로 단일 인스턴스 실행 보장.
 *   false(단일 인스턴스)면 {@code @SchedulerLock} 은 무해 마커, 일반 {@code @Scheduled} 동작.
 * <p>활성화: {@code sso.poll.enabled=true} (기본 false). ENV 토글로 점진 배포.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SsoEventPollingScheduler {

    private final SsoEventPollService pollService;
    private final SsoEventPollProperties props;

    @Scheduled(cron = "0 */15 * * * *", zone = "Asia/Seoul")
    @SchedulerLock(name = "pollSsoEvents", lockAtMostFor = "PT10M", lockAtLeastFor = "PT30S")
    public void poll() {
        if (!props.isEnabled()) {
            return;
        }
        try {
            pollService.pollRevocations();
            pollService.pollDeletions();
        } catch (Exception e) {
            // IdP 다운 등 일시 장애 — 다음 주기에 cursor 기준으로 catch-up 되므로 ERROR 한 줄.
            log.error("[SSO-POLL] 폴링 사이클 실패: {}", e.getMessage(), e);
        }
    }
}
