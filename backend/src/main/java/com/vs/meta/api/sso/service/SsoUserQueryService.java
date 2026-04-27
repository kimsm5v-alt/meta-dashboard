package com.vs.meta.api.sso.service;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * SSO 사용자 조회 서비스.
 *
 * <p>순수 조회 + 마지막 로그인 시각 디바운스 업데이트만 담당한다.
 * 개인정보 동기화(email/nickname/roleCode)는 하지 않는다 —
 * Auth 서버가 단일 진실(source of truth)이며 변경 기능이 없어 sync 불필요.
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
     * 마지막 로그인 시각 업데이트 (디바운스 — 최소 10분 간격).
     * 페이지 이동마다 UPDATE 쿼리가 나가는 것을 방지한다.
     */
    @Transactional
    public void touchLastLogin(User user) {
        if (!shouldUpdate(user.getLastLoginAt())) return;
        user.updateLastLogin();
        userMapper.updateUser(user);
    }

    private boolean shouldUpdate(LocalDateTime lastLoginAt) {
        if (lastLoginAt == null) return true;
        return lastLoginAt.isBefore(LocalDateTime.now().minusMinutes(LAST_LOGIN_DEBOUNCE_MINUTES));
    }
}
