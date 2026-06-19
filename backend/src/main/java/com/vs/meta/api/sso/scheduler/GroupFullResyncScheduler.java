package com.vs.meta.api.sso.scheduler;

import com.vs.meta.api.sso.service.GroupSyncService;
import com.vs.meta.common.config.GroupSyncProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * IDP 그룹 전체 재동기화 스케줄러 — 일 1회 새벽 (group-from-idp 03 §5).
 *
 * <p>3차 안전망: 1차=변경 피드(1분), 2차=DELETION 피드(15분, 회원 purge cascade).
 * 회원 30일 purge 의 DB CASCADE 삭제는 그룹 변경 이벤트를 만들지 않으므로
 * 스냅샷 전량 대조로 보정한다. 보정 건수가 반복적으로 비0이면 피드 처리 버그 신호.
 * <p>레거시 그룹(sp_group_id NULL)은 불가침. 폴링과 겹쳐도 멱등 upsert 라 안전(중복 반영만 발생).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GroupFullResyncScheduler {

    private final GroupSyncService groupSyncService;
    private final GroupSyncProperties props;

    @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")
    @SchedulerLock(name = "groupFullResync", lockAtMostFor = "PT1H", lockAtLeastFor = "PT5M")
    public void resync() {
        if (!props.isEnabled()) {
            return;
        }
        try {
            int corrections = groupSyncService.fullResync();
            if (corrections > 0) {
                // 보정 발생 — 운영 모니터링에서 잡히도록 WARN (정상이면 0건)
                log.warn("[GROUP-SYNC] 전체 재동기화 보정 {}건 발생 — 피드 처리 누락 여부 점검 필요", corrections);
            }
        } catch (Exception e) {
            log.error("[GROUP-SYNC] 전체 재동기화 실패: {}", e.getMessage(), e);
        }
    }
}
