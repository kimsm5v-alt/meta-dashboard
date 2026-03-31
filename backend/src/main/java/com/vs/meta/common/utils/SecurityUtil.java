package com.vs.meta.common.utils;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * JWT 토큰에서 인증된 사용자 번호(userNo)를 추출하는 유틸
 */
public class SecurityUtil {

    private SecurityUtil() {}

    /**
     * SecurityContext에서 현재 인증된 사용자 번호를 가져온다.
     * JwtAuthenticationFilter에서 설정한 principal(userNo 문자열)을 반환.
     *
     * @return 인증된 userNo (미인증 시 null)
     */
    public static Long getCurrentUserNo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof String) {
            try {
                return Long.valueOf((String) auth.getPrincipal());
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
     * 게스트 인증 여부 확인 (principal이 "GUEST:" 접두어)
     */
    public static boolean isGuestAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof String) {
            return ((String) auth.getPrincipal()).startsWith("GUEST:");
        }
        return false;
    }

    /**
     * 게스트 학생 ID 추출
     */
    public static String getCurrentStdtId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof String) {
            String principal = (String) auth.getPrincipal();
            if (principal.startsWith("GUEST:")) {
                return principal.substring("GUEST:".length());
            }
        }
        return null;
    }
}
