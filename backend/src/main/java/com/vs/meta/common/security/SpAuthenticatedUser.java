package com.vs.meta.common.security;

/**
 * SuperPlatform JWT에서 추출한 인증 사용자 정보.
 * SecurityContext의 principal로 설정된다.
 *
 * @param spUserId  Auth 서버 publicUserId (JWT sub)
 * @param email     이메일 (JWT email claim)
 * @param name      이름 (JWT name claim)
 * @param userType  사용자 유형 (TEACHER / STUDENT / GUEST / UNSET)
 */
public record SpAuthenticatedUser(
        String spUserId,
        String email,
        String name,
        String userType
) {}
