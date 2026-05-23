package com.vs.meta.api.sso.service;

import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.domain.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * SSO 마이그레이션 매핑 서비스.
 *
 * <p>Phase 4 (user-info-from-idp): user.email 컬럼 DROP에 따라 email 기반 fallback 제거.
 * Phase 4 이후 모든 기존 회원은 sp_user_id 매핑 완료 가정 — email fallback 불필요.
 *
 * <p>호출 site(SpUserMappingFilter, UserProfileController, MemberController) 는 유지되므로
 * Bean은 존재하되 항상 null 반환. sp_user_id 미매핑 미가입 회원은 자동 가입(SsoUserRegistrationService)
 * 경로로 처리된다.
 *
 * <p>이 클래스 자체는 모든 호출 site가 정리된 이후 제거 가능.
 */
@Slf4j
@Service
public class SsoUserMigrationService {

    /**
     * Phase 4에서 email 컬럼 DROP으로 email 기반 매핑 로직 제거됨.
     * 항상 null 반환 → 호출자는 자동 가입(register) 경로로 진행.
     */
    public User migrateBySpUserId(SpAuthenticatedUser spUser) {
        log.debug("SsoUserMigrationService: email fallback 제거됨 (Phase 4), spUserId={}",
                spUser.spUserId() != null && spUser.spUserId().length() >= 8
                        ? spUser.spUserId().substring(0, 8) + "..." : spUser.spUserId());
        return null;
    }
}
