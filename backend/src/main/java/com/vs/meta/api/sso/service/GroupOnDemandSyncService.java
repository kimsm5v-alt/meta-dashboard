package com.vs.meta.api.sso.service;

import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.sso.client.RpGroupClient;
import com.vs.meta.api.sso.client.SpServiceTokenProvider;
import com.vs.meta.api.sso.client.dto.RpGroupDto;
import com.vs.meta.common.config.GroupSyncProperties;
import com.vs.meta.common.utils.PiiMasker;
import com.vs.meta.domain.GroupInfo;
import com.vs.meta.domain.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
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
public class GroupOnDemandSyncService {

    /**
     * 같은 사용자의 재동기화 최소 간격 — 이 시간 내 재호출은 skip.
     * 화면 진입 시 group/list 연타(중복 호출)는 묶되, "mypage 수정 후 복귀" 는 반영되도록 짧게.
     * (30초는 수정 직후 복귀를 막아 반영 지연 발생 → 5초로 단축)
     */
    private static final long DEBOUNCE_MS = 5_000L;

    private final RpGroupClient rpGroupClient;
    private final SpServiceTokenProvider tokenProvider;
    private final GroupUpsertService upsertService;
    private final GroupSyncProperties props;
    private final UserMapper userMapper;
    private final GroupInfoMapper groupInfoMapper;
    private final TransactionTemplate requiresNewTx;

    /** spUserId → 마지막 sync epoch millis. 재기동/멀티인스턴스에 느슨해도 무방(호출 줄이기 목적). */
    private final ConcurrentHashMap<String, Long> lastSyncAt = new ConcurrentHashMap<>();

    public GroupOnDemandSyncService(RpGroupClient rpGroupClient,
                                    SpServiceTokenProvider tokenProvider,
                                    GroupUpsertService upsertService,
                                    GroupSyncProperties props,
                                    UserMapper userMapper,
                                    GroupInfoMapper groupInfoMapper,
                                    PlatformTransactionManager txManager) {
        this.rpGroupClient = rpGroupClient;
        this.tokenProvider = tokenProvider;
        this.upsertService = upsertService;
        this.props = props;
        this.userMapper = userMapper;
        this.groupInfoMapper = groupInfoMapper;
        // 각 그룹 작업을 outer sync* 트랜잭션에서 분리 — 한 그룹 실패가 공유 tx를 rollback-only로 오염시키지 않도록.
        TransactionTemplate t = new TransactionTemplate(txManager);
        t.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.requiresNewTx = t;
    }

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
                try {
                    RpGroupDto rp = rpGroupClient.detail(serviceToken, groupId); // HTTP — tx 밖
                    if (rp != null) {
                        requiresNewTx.execute(status -> {
                            upsertService.upsertGroupFromRp(rp, true); // 알림 억제
                            return null;
                        });
                        synced++;
                    }
                } catch (Exception e) {
                    // 그룹별 격리 — 한 그룹 실패(중복 race 등)가 나머지 그룹·요청을 막지 않음. 폴링이 백업.
                    log.warn("[GROUP-SYNC] on-demand 그룹 sync 실패(스킵): groupId={}, error={}",
                            groupId, e.getMessage());
                }
            }
            // 삭제 즉시 반영 — Auth "내 그룹 목록"에 없는 로컬 활성 그룹을 비활성 (추가/수정과 달리 목록에 안 와서 별도 처리).
            int reconciled = reconcileDeleted(spUserId, userType, groupIds);
            lastSyncAt.put(spUserId, now());
            log.debug("[GROUP-SYNC] on-demand 완료: spUserId={}, userType={}, synced={}, reconciledDeleted={}",
                    PiiMasker.maskUuid(spUserId), userType, synced, reconciled);
        } catch (Exception e) {
            // Auth 장애/토큰 등 — 로컬 DB 기준으로 화면은 보여줘야 하므로 흡수. 폴링이 백업.
            log.warn("[GROUP-SYNC] on-demand 실패(스킵): spUserId={}, userType={}, error={}",
                    PiiMasker.maskUuid(spUserId), userType, e.getMessage());
        }
    }

    /**
     * 삭제 reconcile — Auth "내 그룹 목록"에 없는 로컬 활성 그룹을 비활성(use_yn='N').
     *
     * <p>안전 가드 (오삭제 방지가 최우선):
     * <ul>
     *   <li><b>교사(host)만</b> — 학생 user API 는 "내가 멤버인 그룹"만 줘서 reconcile 기준으로 부적합 (멤버 제외는 폴링이 처리)</li>
     *   <li><b>authGroupIds 비어있으면 스킵</b> — user API 일시적 빈/이상 응답 시 그 교사 전체 그룹이 삭제되는 사고 방지.
     *       "마지막 1개까지 전부 삭제" 케이스는 폴링(GROUP_DELETE)이 1분 내 처리</li>
     *   <li><b>sp_group_id 있는 동기화 그룹만</b> — 레거시(NULL) 불가침</li>
     *   <li>{@code deactivateBySpGroupId} 는 이미 use_yn='N' 이면 no-op (멱등)</li>
     * </ul>
     *
     * @return 비활성 처리한 그룹 수
     */
    private int reconcileDeleted(String spUserId, String userType, List<Long> authGroupIds) {
        if (!"TEACHER".equals(userType) || authGroupIds.isEmpty()) {
            return 0;
        }
        User teacher = userMapper.findBySpUserId(spUserId);
        if (teacher == null || teacher.getUserNo() == null) {
            return 0;
        }
        Set<Long> authSet = new HashSet<>(authGroupIds);
        int count = 0;
        for (GroupInfo g : groupInfoMapper.findActiveGroupsByHostUserNo(teacher.getUserNo())) {
            if (g.getSpGroupId() == null) {
                continue; // 레거시(학심정 자체 생성) 그룹 불가침
            }
            if (!authSet.contains(g.getSpGroupId())) {
                if (upsertService.deactivateBySpGroupId(g.getSpGroupId()) > 0) {
                    count++;
                    log.info("[GROUP-SYNC] on-demand 삭제 반영: spGroupId={}, claId={}",
                            g.getSpGroupId(), g.getClaId());
                }
            }
        }
        return count;
    }

    private boolean isDue(String spUserId) {
        Long last = lastSyncAt.get(spUserId);
        return last == null || (now() - last) >= DEBOUNCE_MS;
    }

    private long now() {
        return System.currentTimeMillis();
    }
}
