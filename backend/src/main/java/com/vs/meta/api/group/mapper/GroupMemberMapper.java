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
}
