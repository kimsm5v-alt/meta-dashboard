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

    /** 그룹 동기화 upsert 키 조회 — Auth group id 매핑 (group-from-idp). */
    GroupInfo findBySpGroupId(@Param("spGroupId") Long spGroupId);

    /**
     * 전체 재동기화용 — 동기화 행(sp_group_id NOT NULL) 중 활성 그룹 전부.
     * 레거시(sp_group_id NULL) 행은 재동기화 정리 대상이 아니므로 제외 (group-from-idp 02 §5).
     */
    List<GroupInfo> findActiveSyncedGroups();
}
