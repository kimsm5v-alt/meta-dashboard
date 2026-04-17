package com.vs.meta.common.config;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final UserMapper userMapper;

    /** request attribute 키 — SecurityUtil에서 이 키로 읽음 */
    public static final String ATTR_USER_NO = "sp.mapped.userNo";
    public static final String ATTR_USER = "sp.mapped.user";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof SpAuthenticatedUser spUser) {
            // 게스트는 학심정 user가 없으므로 매핑 스킵
            if (!"GUEST".equals(spUser.userType())) {
                try {
                    User user = userMapper.findBySpUserId(spUser.spUserId());
                    if (user != null) {
                        request.setAttribute(ATTR_USER_NO, user.getUserNo());
                        request.setAttribute(ATTR_USER, user);
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
}
