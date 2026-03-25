package com.vs.meta.api.group.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface GroupQueryMapper {

    List<Map<String, Object>> findGroupList(@Param("userNo") Long userNo);

    List<Map<String, Object>> findGroupMemberList(@Param("groupId") Long groupId, @Param("offset") int offset, @Param("limit") int limit);

    long countGroupMemberList(@Param("groupId") Long groupId);

    Map<String, Object> findGroupDetail(@Param("groupId") Long groupId);

    List<Map<String, Object>> findGuestMembersByEmail(@Param("email") String email);

    Integer findActiveDgnssId(@Param("claId") String claId);
}
