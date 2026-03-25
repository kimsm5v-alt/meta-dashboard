package com.vs.meta.api.group.mapper;

import com.vs.meta.domain.GroupInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface GroupInfoMapper {

    GroupInfo findByInviteCodeAndUseYn(@Param("inviteCode") String inviteCode, @Param("useYn") String useYn);

    GroupInfo findByInviteCodeAndUseYnForUpdate(@Param("inviteCode") String inviteCode, @Param("useYn") String useYn);

    GroupInfo findByClaId(@Param("claId") String claId);

    GroupInfo findGroupInfoById(@Param("groupId") Long groupId);

    void insertGroupInfo(GroupInfo groupInfo);

    void updateGroupInfo(GroupInfo groupInfo);

    long countActiveGroups();
}