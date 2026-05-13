package com.vs.meta.api.sso.service;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.common.utils.PiiMasker;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * SSO 마이그레이션 매핑 서비스.
 *
 * <p>SSO 전환 이전에 가입했던 회원(sp_user_id = NULL)을 email로 찾아
 * sp_user_id를 채워 넣는 1회성 매핑 로직. 첫 로그인 시 1회만 실행되며,
 * 매핑 완료 후에는 일반 조회(SsoUserQueryService)로 동작한다.
 *
 * <p>마이그레이션이 완료되고 운영이 안정화되면 이 클래스 전체 제거 가능.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SsoUserMigrationService {

    private final UserMapper userMapper;

    /**
     * email로 기존 회원 찾아 sp_user_id 매핑.
     *
     * @return 매핑 성공한 user (email이 없거나 학심정에 미가입된 경우 null)
     */
    @Transactional
    public User migrateBySpUserId(SpAuthenticatedUser spUser) {
        if (spUser.email() == null || spUser.email().isBlank()) return null;

        User user = userMapper.findByEmail(spUser.email());
        if (user == null) return null;

        // 이미 같은 sp_user_id로 매핑된 경우 → 이미 완료
        if (spUser.spUserId().equals(user.getSpUserId())) return user;

        // sp_user_id가 다른 값으로 매핑된 경우 → SSO 탈퇴 후 재가입 케이스
        // SSO는 이메일 유니크를 보장하므로 같은 이메일 = 동일 인물, 새 UUID로 재연결
        if (user.getSpUserId() != null) {
            log.info("SSO 재가입 감지 (탈퇴 후 재가입), sp_user_id 재연결: userNo={}, email={}",
                    user.getUserNo(), PiiMasker.email(spUser.email()));
        }

        user.setSpUserId(spUser.spUserId());
        user.setUpdatedBy(user.getUserNo());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateUser(user);
        log.info("기존 회원 SSO 매핑 완료: userNo={}, spUserId={}, email={}",
                user.getUserNo(), spUser.spUserId(), PiiMasker.email(spUser.email()));
        return user;
    }
}
