package com.vs.meta.api.group.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface GroupQueryMapper {

    /**
     * 내 그룹 목록 조회.
     *
     * @param userNo           대상 사용자 user_no
     * @param includeInactive  false (기본): ACTIVE 상태 그룹만 반환 (기존 동작).
     *                         true: LEFT/KICKED/ARCHIVED 도 포함 (탈퇴/추방 그룹의 검사 결과 이력 조회 용도).
     */
    List<Map<String, Object>> findGroupList(@Param("userNo") Long userNo,
                                             @Param("includeInactive") boolean includeInactive);

    List<Map<String, Object>> findGroupMemberList(@Param("groupId") Long groupId, @Param("offset") int offset, @Param("limit") int limit);

    long countGroupMemberList(@Param("groupId") Long groupId);

    Map<String, Object> findGroupDetail(@Param("groupId") Long groupId, @Param("userNo") Long userNo);

    List<Map<String, Object>> findGuestMembersByEmail(@Param("email") String email);

    Integer findActiveDgnssId(@Param("claId") String claId);

    // Admin 그룹 관리
    List<Map<String, Object>> findAdminGroupList(@Param("keyword") String keyword,
                                                   @Param("schoolLevel") String schoolLevel,
                                                   @Param("useYn") String useYn,
                                                   @Param("limit") int limit,
                                                   @Param("offset") int offset);

    long countAdminGroupList(@Param("keyword") String keyword,
                              @Param("schoolLevel") String schoolLevel,
                              @Param("useYn") String useYn);

    Map<String, Object> findAdminGroupDetail(@Param("groupId") Long groupId);

    List<Map<String, Object>> findAdminGroupMemberList(@Param("groupId") Long groupId,
                                                         @Param("limit") int limit,
                                                         @Param("offset") int offset);

    long countAdminGroupMemberList(@Param("groupId") Long groupId);
}
