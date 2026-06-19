package com.vs.meta.api.sso.service;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * SSO 사용자 조회 서비스.
 *
 * <p>sp_user_id로 학심정 user를 조회하고 last_login_at을 갱신한다.
 * Auth 서버의 PII(이름/이메일)는 더 이상 DB에 미러링하지 않는다 (Phase 3).
 *
 * <p>호출 시점: FE의 useProfileCheck (`/api/v1/user/status`) 가 라우트마다 호출되므로
 * 그 시점에 last_login_at 디바운스 갱신을 처리한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SsoUserQueryService {

    private static final long LAST_LOGIN_DEBOUNCE_MINUTES = 10;

    private final UserMapper userMapper;

    /** sp_user_id로 학심정 user 조회. 없으면 null. */
    @Transactional(readOnly = true)
    public User findBySpUserId(String spUserId) {
        return userMapper.findBySpUserId(spUserId);
    }

    /**
     * 요청 진입 시 처리: last_login_at 디바운스 갱신.
     *
     * <p>last_login_at 은 10분 디바운스 — 페이지 이동마다 UPDATE 나가는 것을 방지.
     */
    @Transactional
    public void touchOnRequest(SpAuthenticatedUser spUser, User user) {
        boolean lastLoginDue = shouldUpdate(user.getLastLoginAt());

        if (!lastLoginDue) {
            return;
        }

        user.updateLastLogin();
        user.setUpdatedBy(user.getUserNo());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateUser(user);
    }

    private boolean shouldUpdate(LocalDateTime lastLoginAt) {
        if (lastLoginAt == null) return true;
        return lastLoginAt.isBefore(LocalDateTime.now().minusMinutes(LAST_LOGIN_DEBOUNCE_MINUTES));
    }
}
