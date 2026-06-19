package com.vs.meta.api.group.mapper;

import com.vs.meta.domain.GroupMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GroupMemberMapper {

    long countByGroupIdAndStatus(@Param("groupId") Long groupId, @Param("status") String status);

    List<GroupMember> findByGroupIdAndStatus(@Param("groupId") Long groupId, @Param("status") String status);

    boolean existsByGroupIdAndUserNoAndStatus(@Param("groupId") Long groupId, @Param("userNo") Long userNo, @Param("status") String status);

    GroupMember findGroupMemberById(@Param("id") Long id);

    void insertGroupMember(GroupMember groupMember);

    void updateGroupMember(GroupMember groupMember);

    Integer findMaxMemberNoByGroupId(@Param("groupId") Long groupId);

    GroupMember findByGroupIdAndUserNo(@Param("groupId") Long groupId, @Param("userNo") Long userNo);

    /**
     * SSO 탈퇴 cascade — 옛 user_no 의 비종결 멤버십(ACTIVE 등)을 모두 WITHDRAWN 처리.
     * status='WITHDRAWN' 은 어떤 멤버 조회 쿼리에도 매칭되지 않으므로 유령 멤버 발생 안 함.
     */
    int withdrawByUserNo(@Param("userNo") Long userNo);

    /** 그룹 동기화 명단 교체용 — status 무관 전체 멤버 (group-from-idp). */
    List<GroupMember> findByGroupId(@Param("groupId") Long groupId);
}
