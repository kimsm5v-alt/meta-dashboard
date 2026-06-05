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

    /**
     * SSO 탈퇴 cascade — 옛 user_no 가 호스트인 활성 그룹을 use_yn='N' 으로 비활성화.
     * 호스트가 사라진 유령 그룹 발생 방지. 운영 중인 그룹의 사후 처리(아카이브/이양)는
     * 어드민이 수동으로 진행.
     */
    int deactivateByHostUserNo(@Param("hostUserNo") Long hostUserNo);
}
