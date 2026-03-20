package com.vs.meta.api.group.mapper;

import com.vs.meta.domain.GroupInvitation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GroupInvitationMapper {

    void insertInvitation(GroupInvitation invitation);

    List<GroupInvitation> findByGroupId(@Param("groupId") Long groupId);

    GroupInvitation findById(@Param("id") Long id);

    GroupInvitation findByGroupIdAndEmailAndStatus(@Param("groupId") Long groupId,
                                                    @Param("email") String email,
                                                    @Param("status") String status);

    void updateStatus(@Param("id") Long id,
                      @Param("status") String status,
                      @Param("updatedBy") Long updatedBy);

    void expireOverdue();
}
