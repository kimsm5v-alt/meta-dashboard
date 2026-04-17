package com.vs.meta.common.utils;

import com.vs.meta.common.security.SpAuthenticatedUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * SecurityContext에서 인증된 사용자 정보를 추출하는 유틸.
 * SSO 전환 후 SpAuthenticatedUser (SP JWT Claims 기반)를 사용한다.
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
     * SpAuthenticatedUser → spUserId → UserMapper.findBySpUserId() → userNo
     *
     * 주의: 이 메서드는 DB 조회가 필요하므로 빈번한 호출 시 캐시 고려.
     *       현재는 request scope에서 1회 호출 후 request attribute에 저장하는 패턴 권장.
     *
     * TODO: SsoUserService 연동 후 spUserId → userNo 매핑 캐시 적용
     */
    public static Long getCurrentUserNo() {
        // 기존 호환: principal이 String(userNo)인 경우 (Admin 세션 등)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            Object principal = auth.getPrincipal();

            // SP JWT 인증 (SpAuthenticatedUser)
            if (principal instanceof SpAuthenticatedUser) {
                // spUserId → userNo 매핑은 SsoUserService에서 처리
                // 여기서는 request attribute에 캐싱된 userNo를 반환
                // TODO: 매핑 구현 후 연동
                return null;
            }

            // 기존 Admin 세션 (String principal)
            if (principal instanceof String) {
                try {
                    return Long.valueOf((String) principal);
                } catch (NumberFormatException e) {
                    return null;
                }
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
     * 게스트 인증 여부 확인
     */
    public static boolean isGuestAuthenticated() {
        SpAuthenticatedUser user = getCurrentSpUser();
        return user != null && "GUEST".equals(user.userType());
    }

    /**
     * 게스트 ID 추출 (SP JWT sub: "guest_xxx")
     */
    public static String getCurrentGuestId() {
        SpAuthenticatedUser user = getCurrentSpUser();
        if (user != null && "GUEST".equals(user.userType())) {
            return user.spUserId();
        }
        return null;
    }
}
