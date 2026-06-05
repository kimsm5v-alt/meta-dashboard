package com.vs.meta.common.utils;

import com.vs.meta.common.config.SpUserMappingFilter;
import com.vs.meta.common.security.SpAuthenticatedUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

/**
 * SecurityContext에서 인증된 사용자 정보를 추출하는 유틸.
 * SSO 전환 후 SpAuthenticatedUser (SP JWT Claims 기반)를 사용한다.
 *
 * <p>spUserId → userNo 매핑은 {@link SpUserMappingFilter}에서 수행하고
 * request attribute에 캐싱한다. 이 클래스는 그 캐시를 읽는다.
 */
public class SecurityUtil {

    private SecurityUtil() {}

    /**
     * SecurityContext에서 SpAuthenticatedUser를 가져온다.
     */
    public static SpAuthenticatedUser getCurrentSpUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof SpAuthenticatedUser) {
            return (SpAuthenticatedUser) auth.getPrincipal();
        }
        return null;
    }

    /**
     * 현재 인증된 SP 사용자 ID (publicUserId) 반환.
     */
    public static String getCurrentSpUserId() {
        SpAuthenticatedUser user = getCurrentSpUser();
        return (user != null) ? user.spUserId() : null;
    }

    /**
     * 현재 인증된 사용자 번호(userNo)를 가져온다.
     *
     * <p>SP JWT 인증: SpUserMappingFilter가 request attribute에 캐싱한 userNo를 읽는다.
     * <p>Admin 세션: principal(String)에서 직접 파싱한다.
     */
    public static Long getCurrentUserNo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;

        Object principal = auth.getPrincipal();

        // SP JWT 인증 → request attribute에서 매핑된 userNo 읽기
        if (principal instanceof SpAuthenticatedUser) {
            HttpServletRequest request = getCurrentRequest();
            if (request != null) {
                Object userNo = request.getAttribute(SpUserMappingFilter.ATTR_USER_NO);
                if (userNo instanceof Long) {
                    return (Long) userNo;
                }
            }
            return null;
        }

        // Admin 세션 (Spring Security UserDetails — username이 email)
        if (principal instanceof org.springframework.security.core.userdetails.User) {
            // Admin은 userNo가 아닌 email로 인증하므로 여기서는 null
            // Admin 전용 컨트롤러에서 resolveAdminUserNo()를 사용
            return null;
        }

        // 기타 String principal (레거시 호환)
        if (principal instanceof String) {
            try {
                return Long.valueOf((String) principal);
            } catch (NumberFormatException e) {
                return null;
            }
        }

        return null;
    }

    /**
     * 현재 인증된 사용자 번호를 가져오되, 없으면 예외를 던진다.
     */
    public static Long requireCurrentUserNo() {
        Long userNo = getCurrentUserNo();
        if (userNo == null) {
            throw new IllegalStateException("인증된 사용자 정보가 없습니다.");
        }
        return userNo;
    }

    /**
     * 현재 HttpServletRequest를 가져온다 (RequestContextHolder 경유).
     */
    private static HttpServletRequest getCurrentRequest() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes) {
            return ((ServletRequestAttributes) attrs).getRequest();
        }
        return null;
    }
}
