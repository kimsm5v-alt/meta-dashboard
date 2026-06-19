package com.vs.meta.common.auth;

/**
 * PII(name/email)가 필요한 DTO 가 구현하는 인터페이스.
 * UserInfoEnricher 가 sp_user_id 로 Auth 조회 후 setter 호출.
 */
public interface HasUserInfo {
    String getSpUserId();
    void setName(String name);
    void setEmail(String email);

    /**
     * Auth 가 PII 를 비운 사유 (NONE/NOT_CONSENTED/WITHDRAWN/NOT_FOUND).
     * 기본 no-op — 사유가 필요한 DTO(예: 그룹 멤버 enrich)만 override 한다.
     */
    default void setMaskedReason(String maskedReason) { /* no-op */ }
}
