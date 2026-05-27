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

    int updateGuestToStudent(@Param("email") String email, @Param("userNo") Long userNo);

    Integer findMaxMemberNoByGroupId(@Param("groupId") Long groupId);

    GroupMember findActiveGuestByGroupIdAndEmail(@Param("groupId") Long groupId, @Param("email") String email);

    GroupMember findByGroupIdAndUserNo(@Param("groupId") Long groupId, @Param("userNo") Long userNo);

    int syncSnapshotByUserNo(@Param("userNo") Long userNo,
                             @Param("nickname") String nickname,
                             @Param("email") String email);

    /**
     * SSO 탈퇴 cascade — 옛 user_no 의 비종결 멤버십(ACTIVE 등)을 모두 WITHDRAWN 처리.
     * nickname/email 스냅샷도 마스킹해서 그룹 화면에 PII 노출 방지.
     * status='WITHDRAWN' 은 어떤 멤버 조회 쿼리에도 매칭되지 않으므로 유령 멤버 발생 안 함.
     */
    int withdrawByUserNo(@Param("userNo") Long userNo);
}
