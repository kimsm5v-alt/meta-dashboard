package com.vs.meta.api.sso.service;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.common.utils.PiiMasker;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SSO 인증 사용자 ↔ 학심정 user 매핑/프로비저닝 진입점.
 *
 * <p>SP JWT 가 들어왔을 때 학심정 user 를 resolve 하는 영구 운영 로직.
 * 마이그레이션({@link SsoUserMigrationService}) 과 책임 분리 — 마이그레이션은 SSO 전환 1회성.
 *
 * <p>처리 분기:
 * <ol>
 *   <li>sp_user_id 로 찾으면 그대로 반환 (정상 케이스)</li>
 *   <li>못 찾으면 마이그레이션 매핑 시도 (SSO 전환 이전 회원)</li>
 *   <li>마이그레이션에서 <b>동일 이메일 + 다른 sp_user_id</b> 감지되면 → 탈퇴 후 재가입으로 판단,
 *       옛 row 를 {@link SsoUserWithdrawalService#withdraw} 로 정리하고 신규 가입 처리</li>
 *   <li>아무것도 못 찾고 userType 이 TEACHER/STUDENT 면 자동 가입</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SsoUserResolveService {

    private final UserMapper userMapper;
    private final SsoUserQueryService ssoUserQueryService;
    private final SsoUserRegistrationService ssoUserRegistrationService;
    private final SsoUserWithdrawalService ssoUserWithdrawalService;

    /**
     * SP JWT 의 사용자 정보로 학심정 user 를 resolve.
     *
     * @return 학심정 user (자동 가입 불가 + 미가입 케이스는 null — 호출자가 추가 정보 입력 화면으로 유도)
     */
    @Transactional
    public User resolveOrProvision(SpAuthenticatedUser spUser) {
        // 1) sp_user_id 정상 매핑
        User user = ssoUserQueryService.findBySpUserId(spUser.spUserId());
        if (user != null) return user;

        // 2) 이메일 기반 후보 조회 — 마이그레이션 케이스 + 재가입 케이스 모두 여기서 분기
        if (spUser.email() != null && !spUser.email().isBlank()) {
            User byEmail = userMapper.findByEmail(spUser.email());
            if (byEmail != null) {
                // 2-a) 재가입 케이스: 같은 이메일에 다른 sp_user_id 가 매핑되어 있음
                //      → 옛 row 탈퇴 처리 후 새 row insert (인격 분리 정책)
                if (byEmail.getSpUserId() != null
                        && !byEmail.getSpUserId().equals(spUser.spUserId())) {
                    log.info("SSO 재가입 감지 — 옛 회원 탈퇴 처리 후 신규 가입: oldUserNo={}, oldSpUserId={}, newSpUserId={}, email={}",
                            byEmail.getUserNo(), byEmail.getSpUserId(),
                            spUser.spUserId(), PiiMasker.email(spUser.email()));
                    ssoUserWithdrawalService.withdraw(byEmail, "SSO_REJOIN");
                    return registerIfAutoRegistrable(spUser);
                }
                // 2-b) 마이그레이션 케이스: 같은 이메일 + sp_user_id 미매핑 (SSO 전환 이전 회원)
                //      → 신규 sp_user_id 를 옛 row 에 박는다 (인격 동일, 단순 매핑)
                if (byEmail.getSpUserId() == null) {
                    byEmail.setSpUserId(spUser.spUserId());
                    byEmail.setUpdatedBy(byEmail.getUserNo());
                    byEmail.setUpdatedAt(java.time.LocalDateTime.now());
                    userMapper.updateUser(byEmail);
                    log.info("SSO 마이그레이션 매핑: userNo={}, spUserId={}, email={}",
                            byEmail.getUserNo(), spUser.spUserId(), PiiMasker.email(spUser.email()));
                    return byEmail;
                }
            }
        }

        // 3) 자동 가입 가능하면 신규 row insert
        return registerIfAutoRegistrable(spUser);
    }

    private User registerIfAutoRegistrable(SpAuthenticatedUser spUser) {
        if (!isAutoRegistrable(spUser.userType())) return null;
        try {
            User created = ssoUserRegistrationService.register(spUser, spUser.userType());
            log.info("SP 자동 가입: spUserId={}, userType={}, userNo={}",
                    spUser.spUserId(), spUser.userType(),
                    created != null ? created.getUserNo() : null);
            return created;
        } catch (IllegalStateException | org.springframework.dao.DataIntegrityViolationException e) {
            // 동시 요청 race — 한쪽이 먼저 insert 한 경우. 재조회.
            log.info("자동 가입 race 감지, 재조회: spUserId={}, error={}",
                    spUser.spUserId(), e.getMessage());
            return ssoUserQueryService.findBySpUserId(spUser.spUserId());
        }
    }

    /** TEACHER/STUDENT 만 자동 가입. UNSET 등은 추가 정보 입력 화면 필요. */
    private static boolean isAutoRegistrable(String userType) {
        return "TEACHER".equals(userType) || "STUDENT".equals(userType);
    }
}
