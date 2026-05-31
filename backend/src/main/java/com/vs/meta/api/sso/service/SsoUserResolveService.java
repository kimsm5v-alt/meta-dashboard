package com.vs.meta.api.sso.service;

import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SSO 인증 사용자 ↔ 학심정 user 매핑/프로비저닝 진입점.
 *
 * <p>SP JWT 가 들어왔을 때 학심정 user 를 resolve 하는 영구 운영 로직.
 *
 * <p>처리 분기:
 * <ol>
 *   <li>sp_user_id 로 찾으면 그대로 반환 (정상 케이스)</li>
 *   <li>못 찾고 userType 이 TEACHER/STUDENT 면 자동 가입</li>
 * </ol>
 *
 * <p>email 기반 재가입/마이그레이션 감지는 제거됨 (PII email 컬럼 DROP):
 * <ul>
 *   <li>재가입 — IdP 탈퇴 시 SSO 이벤트 폴링({@link SsoEventPollService})이 옛 row 를 WITHDRAWN 처리(인격분리).
 *       재가입 시 신규 sp_user_id 라 자동가입(빈 계정)으로 흐른다.</li>
 *   <li>마이그레이션 — SSO 전환 이전 회원이 없다(모든 회원 sp_user_id 보유).</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SsoUserResolveService {

    private final SsoUserQueryService ssoUserQueryService;
    private final SsoUserRegistrationService ssoUserRegistrationService;

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

        // 2) email 기반 재가입/마이그레이션 감지는 제거 (PII email 컬럼 DROP).
        //    재가입은 SSO 이벤트 폴링이 옛 row 를 WITHDRAWN 처리, 마이그레이션은 대상 회원 없음.
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
