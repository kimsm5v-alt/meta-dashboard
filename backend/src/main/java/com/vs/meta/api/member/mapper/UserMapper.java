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

    /**
     * 그룹 동기화 프로비저닝 행 정리 (group-from-idp 02 §7) — 일간 전체 재동기화에서 호출.
     * provisioned='Y'(미로그인 선제 생성) 행 중 보유 근거(ACTIVE 멤버십·활성 호스트 그룹)가
     * 모두 사라진 행을 삭제. 정식 사용자(provisioned='N')는 절대 대상 아님.
     */
    int deleteOrphanProvisionedUsers();
}
