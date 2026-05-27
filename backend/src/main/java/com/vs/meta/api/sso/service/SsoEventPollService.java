package com.vs.meta.api.sso.service;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.sso.client.SpEventFeedClient;
import com.vs.meta.api.sso.client.SpServiceTokenProvider;
import com.vs.meta.api.sso.client.dto.SsoEventFeedResponse;
import com.vs.meta.api.sso.mapper.SsoPollCursorMapper;
import com.vs.meta.common.config.SpAuthProperties;
import com.vs.meta.common.config.SsoEventPollProperties;
import com.vs.meta.common.utils.PiiMasker;
import com.vs.meta.domain.SsoPollCursor;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDateTime;

/**
 * IdP RP Event Feed 폴링 → 학심정 탈퇴 cascade 적용.
 *
 * <ul>
 *   <li>REVOCATION — 사용자가 학심정 연결끊기. 즉시. reason=SSO_REVOKE</li>
 *   <li>DELETION   — 통합 회원 hard purge (탈퇴신청 +30일). reason=SSO_HARD_PURGE</li>
 * </ul>
 *
 * <p>둘 다 학심정 입장에선 동일 처리({@link SsoUserWithdrawalService#withdraw}). cursor 기반 incremental.
 * withdraw 는 건별 트랜잭션이라 한 건 실패가 다른 건 처리를 막지 않는다. 이미 WITHDRAWN 인
 * user 는 스킵(idempotent) — 중복 폴링/재처리 안전.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SsoEventPollService {

    /** 1회 폴링 사이클의 최대 페이지 수 — 비정상 폭주 방어 (limit 500 × 200 = 10만건). */
    private static final int MAX_PAGES = 200;

    private final SsoPollCursorMapper cursorMapper;
    private final SpServiceTokenProvider tokenProvider;
    private final SpEventFeedClient feedClient;
    private final UserMapper userMapper;
    private final SsoUserWithdrawalService withdrawalService;
    private final SpAuthProperties spAuth;
    private final SsoEventPollProperties props;

    @FunctionalInterface
    private interface FeedCall {
        SsoEventFeedResponse call(String serviceToken, LocalDateTime since, int limit);
    }

    /** REVOCATION feed 폴링 — 학심정 연결끊기 사용자 cascade. */
    public void pollRevocations() {
        poll("REVOCATION", "SSO_REVOKE",
                (token, since, limit) -> feedClient.revocations(token, spAuth.getClientId(), since, limit));
    }

    /** DELETION feed 폴링 — 통합 회원 hard purge 사용자 cascade. */
    public void pollDeletions() {
        poll("DELETION", "SSO_HARD_PURGE",
                (token, since, limit) -> feedClient.deletions(token, since, limit));
    }

    private void poll(String feedType, String reason, FeedCall feedCall) {
        SsoPollCursor cursor = cursorMapper.findByFeedType(feedType);
        if (cursor == null) {
            log.warn("[SSO-POLL] cursor 없음 — DDL 초기 INSERT 누락? feedType={}", feedType);
            return;
        }

        int limit = props.getLimit();
        LocalDateTime since = cursor.getLastSince();
        int totalProcessed = 0;

        for (int page = 0; page < MAX_PAGES; page++) {
            SsoEventFeedResponse resp = callWithTokenRetry(feedCall, since, limit);

            for (SsoEventFeedResponse.Item item : resp.items()) {
                if (applyWithdraw(item.sub(), reason)) {
                    totalProcessed++;
                }
            }

            // 페이지마다 cursor 전진 — 중단/장애 시에도 진행분 보존(멱등)
            cursorMapper.updateCursor(feedType, resp.nextSince(), LocalDateTime.now(), resp.items().size());

            if (resp.items().size() < limit) {
                break; // 끝까지 받음
            }
            since = resp.nextSince();
        }

        if (totalProcessed > 0) {
            log.info("[SSO-POLL] {} 처리 완료: 탈퇴 cascade {}건", feedType, totalProcessed);
        }
    }

    /** 토큰 만료(401) 시 1회 재발급 후 재시도. */
    private SsoEventFeedResponse callWithTokenRetry(FeedCall feedCall, LocalDateTime since, int limit) {
        try {
            return feedCall.call(tokenProvider.getToken(), since, limit);
        } catch (WebClientResponseException.Unauthorized e) {
            log.info("[SSO-POLL] service AT 401 — 재발급 후 재시도");
            tokenProvider.invalidate();
            return feedCall.call(tokenProvider.getToken(), since, limit);
        }
    }

    /**
     * 단건 탈퇴 적용. 학심정 미가입(null) 또는 이미 비활성(WITHDRAWN/SUSPENDED) 이면 스킵.
     * withdraw 는 자체 @Transactional — 건별 실패가 전체 폴링을 막지 않게 try/catch.
     *
     * @return 실제 탈퇴 처리했으면 true
     */
    private boolean applyWithdraw(String spUserId, String reason) {
        try {
            User user = userMapper.findBySpUserId(spUserId);
            if (user == null) return false;                       // 학심정 미가입
            if (user.getStatus() != UserStatus.ACTIVE) return false; // 이미 처리됨 (idempotent)
            withdrawalService.withdraw(user, reason);
            return true;
        } catch (Exception e) {
            log.warn("[SSO-POLL] 단건 탈퇴 처리 실패(스킵): spUserId={}, reason={}, error={}",
                    PiiMasker.maskUuid(spUserId), reason, e.getMessage());
            return false;
        }
    }
}
