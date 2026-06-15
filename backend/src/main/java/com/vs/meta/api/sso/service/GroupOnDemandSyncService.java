package com.vs.meta.api.sso.service;

import com.vs.meta.api.sso.client.RpGroupClient;
import com.vs.meta.api.sso.client.SpServiceTokenProvider;
import com.vs.meta.api.sso.client.dto.RpGroupDto;
import com.vs.meta.common.config.GroupSyncProperties;
import com.vs.meta.common.utils.PiiMasker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import static com.vs.meta.api.sso.client.SpServiceTokenProvider.SCOPE_GROUPS_READ;

/**
 * 그룹 on-demand 동기화 (group-from-idp) — 사용자가 학심정 그룹 화면에 진입하는 시점에
 * 그 사용자 본인 그룹만 즉시 Auth 에서 당겨와 로컬에 반영. 1분 폴링의 지연(텀)을 0 으로.
 *
 * <p>흐름: 본인 user AT 로 "내 그룹 id 목록" 조회(발견) → 각 id 를 service AT 로
 * {@code GET /rp/groups/{id}} 단건 조회(멤버+owner 완전, <b>안전지연 없음</b>) → {@link GroupUpsertService} upsert.
 *
 * <p>RP API 엔 "특정 사용자의 그룹" 필터가 없어 본인 user API 로 소속 그룹을 알아내야 하고,
 * user API 는 멤버 명단을 안 주므로 실제 데이터는 RP 단건으로 받는 2단 구조.
 *
 * <p>알림은 억제(suppress) — on-demand 는 "보기 위한 sync" 이고, 알림(T1/S5)은 폴링(변경 피드)이
 * 정확한 시점에 보낸다. 디바운스(메모리)로 호출 폭주 방지.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GroupOnDemandSyncService {

    /** 같은 사용자의 재동기화 최소 간격 — 이 시간 내 재호출은 skip. */
    private static final long DEBOUNCE_MS = 30_000L;

    private final RpGroupClient rpGroupClient;
    private final SpServiceTokenProvider tokenProvider;
    private final GroupUpsertService upsertService;
    private final GroupSyncProperties props;

    /** spUserId → 마지막 sync epoch millis. 재기동/멀티인스턴스에 느슨해도 무방(호출 줄이기 목적). */
    private final ConcurrentHashMap<String, Long> lastSyncAt = new ConcurrentHashMap<>();

    /**
     * 현재 사용자 본인 그룹을 즉시 동기화. 실패는 호출 측 화면을 막지 않도록 내부에서 흡수(로그만).
     *
     * @param spUserId    Auth publicUserId (JWT sub)
     * @param userType    TEACHER / STUDENT
     * @param bearerToken 사용자 본인 AT (Auth user API forward 용)
     */
    public void syncMyGroups(String spUserId, String userType, String bearerToken) {
        if (!props.isEnabled() || spUserId == null || bearerToken == null) {
            return;
        }
        if (!isDue(spUserId)) {
            return; // 디바운스 — 최근 동기화함
        }
        try {
            List<Long> groupIds = switch (userType == null ? "" : userType) {
                case "TEACHER" -> rpGroupClient.myTeacherGroupIds(bearerToken);
                case "STUDENT" -> rpGroupClient.myStudentGroupIds(bearerToken);
                default -> List.of();
            };
            if (groupIds.isEmpty()) {
                lastSyncAt.put(spUserId, now());
                return;
            }
            String serviceToken = tokenProvider.getToken(SCOPE_GROUPS_READ);
            int synced = 0;
            for (Long groupId : groupIds) {
                RpGroupDto rp = rpGroupClient.detail(serviceToken, groupId);
                if (rp != null) {
                    upsertService.upsertGroupFromRp(rp, true); // 알림 억제
                    synced++;
                }
            }
            lastSyncAt.put(spUserId, now());
            log.debug("[GROUP-SYNC] on-demand 완료: spUserId={}, userType={}, groups={}",
                    PiiMasker.maskUuid(spUserId), userType, synced);
        } catch (Exception e) {
            // Auth 장애/토큰 등 — 로컬 DB 기준으로 화면은 보여줘야 하므로 흡수. 폴링이 백업.
            log.warn("[GROUP-SYNC] on-demand 실패(스킵): spUserId={}, userType={}, error={}",
                    PiiMasker.maskUuid(spUserId), userType, e.getMessage());
        }
    }

    private boolean isDue(String spUserId) {
        Long last = lastSyncAt.get(spUserId);
        return last == null || (now() - last) >= DEBOUNCE_MS;
    }

    private long now() {
        return System.currentTimeMillis();
    }
}
