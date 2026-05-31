package com.vs.meta.common.auth;

/**
 * PII(name/email)가 필요한 DTO 가 구현하는 인터페이스.
 * UserInfoEnricher 가 sp_user_id 로 Auth 조회 후 setter 호출.
 */
public interface HasUserInfo {
    String getSpUserId();
    void setName(String name);
    void setEmail(String email);
}
