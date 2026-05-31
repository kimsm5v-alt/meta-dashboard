package com.vs.meta.common.auth;

/**
 * Auth /api/v1/users 응답 모델.
 *
 * <p>{@link #placeholder} 가 true 면 조회 실패/탈퇴/Auth 장애 상황 — name 은 "(탈퇴 회원)".
 */
public record UserInfo(
        String publicUserId,
        String name,
        String nickname,
        String email,
        String userType,
        boolean placeholder
) {
    public static UserInfo placeholder(String publicUserId) {
        return new UserInfo(publicUserId, "(탈퇴 회원)", null, null, null, true);
    }
}
