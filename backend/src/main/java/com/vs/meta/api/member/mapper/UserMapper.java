package com.vs.meta.api.member.mapper;

import com.vs.meta.domain.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    User findByUserNo(@Param("userNo") Long userNo);

    User findBySpUserId(@Param("spUserId") String spUserId);

    void insertUser(User user);

    void updateUser(User user);

    /**
     * SSO 탈퇴 처리 — status=WITHDRAWN + PII 마스킹 + 식별자 NULL.
     * email/tc_id/stdt_id UNIQUE 제약 회피용. sp_user_id 도 NULL 로 비워서
     * 같은 sp_user_id 가 다른 user_no 와 충돌하는 케이스 방지.
     */
    int markWithdrawn(@Param("userNo") Long userNo);
}
