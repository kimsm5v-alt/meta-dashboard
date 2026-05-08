package com.vs.meta.api.sso.service;

import com.vs.meta.api.group.mapper.GroupMemberMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * SSO 사용자 조회 + 개인정보 동기화 서비스.
 *
 * <p>SP 마이페이지에서 이름/이메일 변경이 가능해진 이후, AT refresh 시점의 JWT claim을
 * 학심정 user/group_member 스냅샷에 반영하는 역할도 수행한다.
 *
 * <p>호출 시점: FE의 useProfileCheck (`/api/v1/user/status`) 가 라우트마다 호출되므로
 * 그 시점에 claim ↔ DB 비교 후 변경된 경우에만 UPDATE.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SsoUserQueryService {

    private static final long LAST_LOGIN_DEBOUNCE_MINUTES = 10;

    private final UserMapper userMapper;
    private final GroupMemberMapper groupMemberMapper;

    /** sp_user_id로 학심정 user 조회. 없으면 null. */
    @Transactional(readOnly = true)
    public User findBySpUserId(String spUserId) {
        return userMapper.findBySpUserId(spUserId);
    }

    /**
     * 요청 진입 시 처리: SP claim 과 DB 비교 후 변경분 sync + last_login 디바운스 갱신.
     *
     * <ul>
     *   <li>nickname/email 이 SP claim 과 다르면 user 테이블 갱신 + group_member 스냅샷 cascade</li>
     *   <li>last_login_at 은 10분 디바운스 — 페이지 이동마다 UPDATE 나가는 것을 방지</li>
     *   <li>변경 없으면 UPDATE 미발생</li>
     * </ul>
     */
    @Transactional
    public void touchOnRequest(SpAuthenticatedUser spUser, User user) {
        boolean nicknameChanged = spUser.name() != null
                && !Objects.equals(spUser.name(), user.getNickname());
        boolean emailChanged = spUser.email() != null
                && !Objects.equals(spUser.email(), user.getEmail());
        boolean lastLoginDue = shouldUpdate(user.getLastLoginAt());

        if (!nicknameChanged && !emailChanged && !lastLoginDue) {
            return;
        }

        if (nicknameChanged) user.setNickname(spUser.name());
        if (emailChanged)    user.setEmail(spUser.email());
        if (lastLoginDue)    user.updateLastLogin();

        user.setUpdatedBy(user.getUserNo());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateUser(user);

        if (nicknameChanged || emailChanged) {
            int updated = groupMemberMapper.syncSnapshotByUserNo(
                    user.getUserNo(), user.getNickname(), user.getEmail());
            log.info("SP claim 변경 sync: userNo={}, nicknameChanged={}, emailChanged={}, gmRows={}",
                    user.getUserNo(), nicknameChanged, emailChanged, updated);
        }
    }

    private boolean shouldUpdate(LocalDateTime lastLoginAt) {
        if (lastLoginAt == null) return true;
        return lastLoginAt.isBefore(LocalDateTime.now().minusMinutes(LAST_LOGIN_DEBOUNCE_MINUTES));
    }
}
