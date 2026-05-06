package com.vs.meta.common.config;

import com.vs.meta.api.sso.service.SsoUserMigrationService;
import com.vs.meta.api.sso.service.SsoUserQueryService;
import com.vs.meta.api.sso.service.SsoUserRegistrationService;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * SP JWT 인증 후 spUserId → 학심정 userNo 매핑을 수행하는 필터.
 * 매핑 결과를 request attribute에 저장하여, SecurityUtil.getCurrentUserNo()에서 읽는다.
 *
 * <p>Spring Security의 oauth2ResourceServer().jwt()가 먼저 실행되어
 * SecurityContext에 SpAuthenticatedUser가 설정된 후에 이 필터가 동작한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SpUserMappingFilter extends OncePerRequestFilter {

    private final SsoUserQueryService ssoUserQueryService;
    private final SsoUserMigrationService ssoUserMigrationService;
    private final SsoUserRegistrationService ssoUserRegistrationService;

    /** request attribute 키 — SecurityUtil에서 이 키로 읽음 */
    public static final String ATTR_USER_NO = "sp.mapped.userNo";
    public static final String ATTR_USER = "sp.mapped.user";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof SpAuthenticatedUser spUser) {
            // 인증되자마자 spUserId 박음 (게스트 포함, 매핑 SQL 단계 로그도 식별 가능하게)
            // UUID 앞 8자만 사용 — 가독성 (full UUID는 36자라 패턴이 길어짐)
            String spUserId = spUser.spUserId();
            if (spUserId != null && spUserId.length() >= 8) {
                MDC.put(MdcLoggingFilter.MDC_SP_USER_ID, spUserId.substring(0, 8));
            }

            // 게스트는 학심정 user가 없으므로 매핑 스킵
            if (!"GUEST".equals(spUser.userType())) {
                try {
                    // sp_user_id로 조회 실패 시 마이그레이션 매핑 시도 (기존 회원 1회성)
                    User user = ssoUserQueryService.findBySpUserId(spUser.spUserId());
                    if (user == null) {
                        user = ssoUserMigrationService.migrateBySpUserId(spUser);
                    }

                    // 매핑 실패 + userType 이 TEACHER/STUDENT 면 자동 가입.
                    // (userType=UNSET 인 경우만 학심정 추가 정보 입력 화면(/auth/complete-profile)을 통과시킨다)
                    if (user == null && isAutoRegistrable(spUser.userType())) {
                        user = autoRegister(spUser);
                    }

                    if (user != null) {
                        // 정지/탈퇴 계정 차단
                        if (user.getStatus() != com.vs.meta.domain.enums.UserStatus.ACTIVE) {
                            response.setStatus(403);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write(
                                "{\"success\":false,\"resultCode\":403,\"resultMessage\":\"" +
                                (user.getStatus() == com.vs.meta.domain.enums.UserStatus.SUSPENDED ? "정지된 계정입니다." : "탈퇴된 계정입니다.") +
                                "\",\"errorCode\":\"ACCOUNT_" + user.getStatus().name() + "\"}");
                            return;
                        }
                        request.setAttribute(ATTR_USER_NO, user.getUserNo());
                        request.setAttribute(ATTR_USER, user);
                        // MdcLoggingFilter 가 가장 앞에서 requestId/clientIp 박았고, 여기서 userNo 추가.
                        // MDC.clear() 는 MdcLoggingFilter 의 finally 에서 일괄 처리되므로 여기선 put 만.
                        MDC.put(MdcLoggingFilter.MDC_USER_NO, String.valueOf(user.getUserNo()));
                    }
                } catch (Exception e) {
                    log.warn("spUserId → userNo 매핑 실패: spUserId={}, error={}", spUser.spUserId(), e.getMessage());
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // public 경로는 매핑 불필요
        return path.startsWith("/api/v1/auth")
                || path.startsWith("/admin")
                || path.startsWith("/actuator")
                || path.startsWith("/swagger")
                || path.startsWith("/v3/api-docs");
    }

    /**
     * SP JWT 의 userType 이 자동 가입 가능한 값인지 판정.
     * TEACHER/STUDENT 만 자동 가입. UNSET 등은 추가 정보 입력 화면을 통해 사용자가 직접 역할 선택해야 함.
     */
    private static boolean isAutoRegistrable(String userType) {
        return "TEACHER".equals(userType) || "STUDENT".equals(userType);
    }

    /**
     * SP JWT 의 사용자 정보로 학심정 user 자동 생성.
     *
     * <p>동시 요청 race condition 대비: 동시 요청이 둘 다 register 시도하면,
     * <ul>
     *   <li>register 진입 시 findBySpUserId 로 기존 row 발견 → IllegalStateException</li>
     *   <li>또는 INSERT 단계에서 UNIQUE 제약 위반 → DataIntegrityViolationException</li>
     * </ul>
     * 두 케이스 모두 catch 후 재조회로 복구한다.
     */
    private User autoRegister(SpAuthenticatedUser spUser) {
        try {
            User created = ssoUserRegistrationService.register(spUser, spUser.userType());
            log.info("SP 자동 가입: spUserId={}, userType={}, userNo={}",
                    spUser.spUserId(), spUser.userType(),
                    created != null ? created.getUserNo() : null);
            return created;
        } catch (IllegalStateException | DataIntegrityViolationException e) {
            log.info("자동 가입 race 감지, 재조회: spUserId={}, error={}",
                    spUser.spUserId(), e.getMessage());
            return ssoUserQueryService.findBySpUserId(spUser.spUserId());
        }
    }
}
