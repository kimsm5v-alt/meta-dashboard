package com.vs.meta.api.sso.service;

import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.sso.client.RpGroupClient;
import com.vs.meta.api.sso.client.SpServiceTokenProvider;
import com.vs.meta.api.sso.client.dto.RpGroupChangeDto;
import com.vs.meta.api.sso.client.dto.RpGroupChangeFeedDto;
import com.vs.meta.api.sso.client.dto.RpGroupDto;
import com.vs.meta.api.sso.client.dto.RpGroupPageDto;
import com.vs.meta.api.sso.mapper.SsoPollCursorMapper;
import com.vs.meta.common.config.GroupSyncProperties;
import com.vs.meta.domain.GroupInfo;
import com.vs.meta.domain.SsoPollCursor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;

import static com.vs.meta.api.sso.client.SpServiceTokenProvider.SCOPE_GROUPS_READ;

/**
 * IDP 그룹 동기화 오케스트레이션 (group-from-idp 03-sync-design.md).
 *
 * <ul>
 *   <li><b>부트스트랩</b> — 커서 last_since=NULL 이면 스냅샷 전체 순회 후
 *       <b>첫 페이지</b>의 currentSince 를 커서로 기록 (마지막 페이지 값 사용 시 순회 중 변경분 유실)</li>
 *   <li><b>변경 피드 폴링</b> — 배치 단위로 [MEMBER_REMOVE/GROUP_DELETE 반영 + 재조회 upsert + 커서 전진]
 *       을 <b>동일 트랜잭션</b>으로 처리. 장애 시 커서 미전진 → 다음 주기에 재수신(멱등 흡수)</li>
 *   <li><b>전체 재동기화</b> — 스냅샷 재순회 + 스냅샷에 없는 동기화 그룹 비활성
 *       + 고아 프로비저닝 user 정리. 보정 건수 로그 (정상이면 0건 — 비0 반복 시 피드 처리 버그 신호)</li>
 * </ul>
 */
@Slf4j
@Service
public class GroupSyncService {

    static final String FEED_TYPE = "GROUP_CHANGES";
    /** 1회 사이클 최대 페이지 — 비정상 폭주 방어 (SsoEventPollService 와 동일 컨벤션). */
    private static final int MAX_PAGES = 200;

    private final SsoPollCursorMapper cursorMapper;
    private final SpServiceTokenProvider tokenProvider;
    private final RpGroupClient rpGroupClient;
    private final GroupUpsertService upsertService;
    private final GroupInfoMapper groupInfoMapper;
    private final UserMapper userMapper;
    private final GroupSyncProperties props;
    private final TransactionTemplate txTemplate;

    public GroupSyncService(SsoPollCursorMapper cursorMapper,
                            SpServiceTokenProvider tokenProvider,
                            RpGroupClient rpGroupClient,
                            GroupUpsertService upsertService,
                            GroupInfoMapper groupInfoMapper,
                            UserMapper userMapper,
                            GroupSyncProperties props,
                            PlatformTransactionManager txManager) {
        this.cursorMapper = cursorMapper;
        this.tokenProvider = tokenProvider;
        this.rpGroupClient = rpGroupClient;
        this.upsertService = upsertService;
        this.groupInfoMapper = groupInfoMapper;
        this.userMapper = userMapper;
        this.props = props;
        // 이벤트 반영 + 커서 전진 = 동일 TX (self-invocation 프록시 우회 문제로 프로그래매틱 TX 사용)
        this.txTemplate = new TransactionTemplate(txManager);
    }

    /** 폴링 스케줄러 진입점 — 부트스트랩 미완료면 부트스트랩, 완료면 변경 피드 폴링. */
    public void syncOnce() {
        SsoPollCursor cursor = cursorMapper.findByFeedType(FEED_TYPE);
        if (cursor == null) {
            log.warn("[GROUP-SYNC] cursor 없음 — migrations/01-sync-prep.sql 미적용? feedType={}", FEED_TYPE);
            return;
        }
        if (cursor.getLastSince() == null) {
            bootstrap();
            return;
        }
        pollChanges(cursor.getLastSince());
    }

    // ---- ① 부트스트랩 ----

    private void bootstrap() {
        log.info("[GROUP-SYNC] 부트스트랩 시작 (snapshotLimit={})", props.getSnapshotLimit());
        LocalDateTime firstPageSince = snapshotSweep(null, true);
        // 커서는 전체 순회 완료 후에만 기록 — 중단 시 NULL 유지 = 다음 주기에 처음부터 재실행(멱등)
        cursorMapper.updateCursor(FEED_TYPE, firstPageSince, LocalDateTime.now(), 0);
        log.info("[GROUP-SYNC] 부트스트랩 완료: cursor={}", firstPageSince);
    }

    // ---- ② 변경 피드 폴링 ----

    private void pollChanges(LocalDateTime since) {
        int limit = props.getFeedLimit();
        LocalDateTime cursor = since;
        int totalEvents = 0;

        for (int page = 0; page < MAX_PAGES; page++) {
            final LocalDateTime current = cursor;
            RpGroupChangeFeedDto feed = callWithTokenRetry(
                    () -> rpGroupClient.changes(tokenProvider.getToken(SCOPE_GROUPS_READ), current, limit));

            if (feed.items().isEmpty()) {
                // 변경 없음 — 모니터링 메타만 갱신
                cursorMapper.updateCursor(FEED_TYPE, feed.nextSince(), LocalDateTime.now(), 0);
                break;
            }

            applyBatch(feed);
            totalEvents += feed.items().size();
            cursor = feed.nextSince();

            if (feed.items().size() < limit) {
                break; // 수신 완료
            }
            // size == limit → 미수신분 존재, 즉시 재호출
        }

        if (totalEvents > 0) {
            log.info("[GROUP-SYNC] 변경 피드 반영: {}건, cursor={}", totalEvents, cursor);
        }
    }

    /**
     * 배치 1건 반영 — 재조회(HTTP)는 TX 밖, 반영+커서 전진은 동일 TX.
     *
     * <p>같은 배치에 같은 그룹 이벤트 다수 → groupId 중복 제거 후 그룹당 1회 재조회 (Auth 가이드 최적화).
     * 재조회는 "현재 상태" 라서 이벤트 순서 뉘앙스를 전체 교체가 흡수한다.
     */
    private void applyBatch(RpGroupChangeFeedDto feed) {
        Set<Long> refetchIds = new LinkedHashSet<>();
        for (RpGroupChangeDto ev : feed.items()) {
            switch (ev.changeType()) {
                case "GROUP_CREATE", "GROUP_UPDATE", "MEMBER_ADD" -> refetchIds.add(ev.groupId());
                default -> { /* GROUP_DELETE / MEMBER_REMOVE — TX 안에서 직접 반영 */ }
            }
        }

        // 재조회 (HTTP) — TX 밖. 404 = 조회 전 삭제 → null
        Map<Long, RpGroupDto> details = new HashMap<>();
        for (Long groupId : refetchIds) {
            details.put(groupId, callWithTokenRetry(
                    () -> rpGroupClient.detail(tokenProvider.getToken(SCOPE_GROUPS_READ), groupId)));
        }

        txTemplate.executeWithoutResult(tx -> {
            // 1) 개별 이벤트 (occurredAt ASC 순서대로)
            for (RpGroupChangeDto ev : feed.items()) {
                switch (ev.changeType()) {
                    case "GROUP_DELETE" -> upsertService.deactivateBySpGroupId(ev.groupId());
                    case "MEMBER_REMOVE" -> upsertService.removeMemberBySpUserId(
                            ev.groupId(), ev.publicUserId(), false);
                    default -> { /* 재조회 경로에서 처리 */ }
                }
            }
            // 2) 재조회 그룹 전체 교체
            for (Map.Entry<Long, RpGroupDto> e : details.entrySet()) {
                if (e.getValue() == null) {
                    upsertService.deactivateBySpGroupId(e.getKey()); // 조회 전 삭제됨
                } else {
                    upsertService.upsertGroupFromRp(e.getValue(), false);
                }
            }
            // 3) 커서 전진 — 반영과 동일 TX (Auth 가이드 필수 규약)
            cursorMapper.updateCursor(FEED_TYPE, feed.nextSince(), LocalDateTime.now(), feed.items().size());
        });
    }

    // ---- ③ 전체 재동기화 (일 1회) ----

    /** @return 보정 건수 — 정상 운영이면 0. 비0 반복 시 1·2차 피드 처리 버그 신호 (알람 대상). */
    public int fullResync() {
        log.info("[GROUP-SYNC] 전체 재동기화 시작");
        Set<Long> seen = new HashSet<>();
        int[] corrections = {0};

        LocalDateTime firstPageSince = snapshotSweep(seen, false, corrections);

        // 스냅샷에 없는 동기화 그룹 비활성 — 레거시(sp_group_id NULL) 불가침
        for (GroupInfo g : groupInfoMapper.findActiveSyncedGroups()) {
            if (!seen.contains(g.getSpGroupId())) {
                corrections[0] += upsertService.deactivateBySpGroupId(g.getSpGroupId());
                log.info("[GROUP-SYNC] 재동기화 비활성: spGroupId={}, claId={} (회원 purge CASCADE 등)",
                        g.getSpGroupId(), g.getClaId());
            }
        }

        // 보유 근거(멤버십) 소멸된 프로비저닝 user 정리 (02 §7)
        int orphans = userMapper.deleteOrphanProvisionedUsers();
        if (orphans > 0) {
            log.info("[GROUP-SYNC] 고아 프로비저닝 user 정리: {}건", orphans);
        }

        cursorMapper.updateCursor(FEED_TYPE, firstPageSince, LocalDateTime.now(), 0);
        // 보정 건수 요약 — 0건이 정상. 반복적으로 비0이면 피드 처리 버그 조사 (03 §5)
        log.info("[GROUP-SYNC] 전체 재동기화 완료: 보정 {}건, 고아 user {}건, cursor={}",
                corrections[0], orphans, firstPageSince);
        return corrections[0] + orphans;
    }

    private LocalDateTime snapshotSweep(Set<Long> seenOut, boolean isBootstrap) {
        return snapshotSweep(seenOut, isBootstrap, new int[]{0});
    }

    /** 스냅샷 전체 순회 — 페이지별 upsert(알림 억제). 첫 페이지 currentSince 반환. */
    private LocalDateTime snapshotSweep(Set<Long> seenOut, boolean isBootstrap, int[] correctionsOut) {
        int limit = props.getSnapshotLimit();
        LocalDateTime firstPageSince = null;
        Long afterId = null;
        int groups = 0;

        for (int page = 0; page < MAX_PAGES; page++) {
            final Long current = afterId;
            RpGroupPageDto resp = callWithTokenRetry(
                    () -> rpGroupClient.snapshot(tokenProvider.getToken(SCOPE_GROUPS_READ), current, limit));

            if (firstPageSince == null) {
                firstPageSince = resp.currentSince();
            }
            for (RpGroupDto rp : resp.items()) {
                // 부트스트랩/재동기화는 알림 억제 — 초기 적재/보정이 알림 폭주로 새면 안 됨 (03 §6.5)
                int changed = txTemplate.execute(tx -> upsertService.upsertGroupFromRp(rp, true));
                if (!isBootstrap) {
                    correctionsOut[0] += changed;
                }
                if (seenOut != null) {
                    seenOut.add(rp.groupId());
                }
            }
            groups += resp.items().size();
            afterId = resp.nextAfterId();
            if (resp.items().size() < limit) {
                break;
            }
        }

        log.info("[GROUP-SYNC] 스냅샷 순회 완료: 그룹 {}건, firstPageSince={}", groups, firstPageSince);
        // 빈 스냅샷이라도 Auth 가 currentSince 를 반환하지만, 방어적으로 now-5s fallback
        return firstPageSince != null ? firstPageSince : LocalDateTime.now().minusSeconds(5);
    }

    // ---- 공통 ----

    /** 토큰 만료(401) 시 1회 재발급 후 재시도 (SsoEventPollService 와 동일 컨벤션). */
    private <T> T callWithTokenRetry(Supplier<T> call) {
        try {
            return call.get();
        } catch (WebClientResponseException.Unauthorized e) {
            log.info("[GROUP-SYNC] service AT 401 — 재발급 후 재시도");
            tokenProvider.invalidate(SCOPE_GROUPS_READ);
            return call.get();
        }
    }
}
