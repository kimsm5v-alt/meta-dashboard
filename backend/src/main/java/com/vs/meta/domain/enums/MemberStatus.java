package com.vs.meta.domain.enums;

/**
 * 그룹 멤버 상태
 */
public enum MemberStatus {
    /** 활성 (참가 중) */
    ACTIVE,
    /** 자진 탈퇴 */
    LEFT,
    /** 방장에 의한 강퇴 */
    KICKED,
    /** 보관 (아카이브) */
    ARCHIVED,
    /** SSO 회원 탈퇴 cascade — IdP 탈퇴/재가입 감지 시 자동 처리 */
    WITHDRAWN
}
