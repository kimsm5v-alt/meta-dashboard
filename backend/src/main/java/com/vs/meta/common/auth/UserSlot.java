package com.vs.meta.common.auth;

/**
 * sp_user_id 한 개를 감싸는 경량 DTO.
 * UserInfoEnricher.enrich(slot) 한 줄로 name/email을 채울 수 있다.
 *
 * <p>GroupService 같이 User 도메인 객체에서 nickname 을 직접 꺼낼 수 없는
 * Phase 3 전환 구간에서 임시 홀더로 사용한다.
 * Task 16 이후 다른 도메인에서도 재사용 가능.
 */
public class UserSlot implements HasUserInfo {

    private final String spUserId;
    private String name;
    private String email;

    public UserSlot(String spUserId) {
        this.spUserId = spUserId;
    }

    @Override
    public String getSpUserId() {
        return spUserId;
    }

    @Override
    public void setName(String name) {
        this.name = name;
    }

    @Override
    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }
}
