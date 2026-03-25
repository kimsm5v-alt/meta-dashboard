package com.vs.meta.api.group.mapper;

import com.vs.meta.domain.GroupInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GroupInfoMapper {

    GroupInfo findByInviteCodeAndUseYn(@Param("inviteCode") String inviteCode, @Param("useYn") String useYn);

    GroupInfo findByInviteCodeAndUseYnForUpdate(@Param("inviteCode") String inviteCode, @Param("useYn") String useYn);

    GroupInfo findByClaId(@Param("claId") String claId);

    GroupInfo findGroupInfoById(@Param("groupId") Long groupId);

    List<GroupInfo> findActiveGroupsByHostUserNo(@Param("hostUserNo") Long hostUserNo);

    void insertGroupInfo(GroupInfo groupInfo);

    void updateGroupInfo(GroupInfo groupInfo);

    long countActiveGroups();
}
