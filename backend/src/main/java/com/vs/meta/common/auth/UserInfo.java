package com.vs.meta.common.auth;

/**
 * Auth /api/v1/users 응답 모델.
 *
 * <p>{@link #placeholder} 가 true 면 조회 실패/탈퇴/Auth 장애 상황 — name 은 "(탈퇴 회원)".
 *
 * <p>{@code maskedReason} — Auth 가 PII 를 비운 사유 (NONE/NOT_CONSENTED/WITHDRAWN).
 * 호출 RP 미동의자(NOT_CONSENTED)는 name/email 이 null 로 오며, FE 에서 이 사유로
 * 마스킹 표시·안내 툴팁을 분기한다. 진짜 없는 사용자(notFound)는 NOT_FOUND.
 */
public record UserInfo(
        String publicUserId,
        String name,
        String nickname,
        String email,
        String userType,
        boolean placeholder,
        String maskedReason
) {
    public static UserInfo placeholder(String publicUserId) {
        return new UserInfo(publicUserId, "(탈퇴 회원)", null, null, null, true, "NOT_FOUND");
    }
}
