package com.vs.meta.admin.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 검사 유형 권한 admin 매퍼 (로컬 DB 전용).
 * 이름/이메일은 로컬에 없으므로 Auth API 로 채운다 — 여기서는 교사 계정(user_no/sp_user_id/가입일)과
 * 현재 권한(account_paper_permission)만 다룬다.
 */
@Mapper
public interface PaperPermissionAdminMapper {

    /** 교사 계정 수(tc_id 보유 + ACTIVE). 기본 목록 페이징용. */
    long countTeachers();

    /** 교사 계정 페이지 + 현재 권한(행 없으면 종합만). user_no DESC. */
    List<Map<String, Object>> selectTeacherPage(@Param("limit") int limit,
                                                @Param("offset") int offset);

    /** 검색 모드: Auth 검색으로 얻은 sp_user_id(publicUserId) 들에 해당하는 교사 계정 + 현재 권한. */
    List<Map<String, Object>> selectTeachersBySpUserIds(@Param("spUserIds") List<String> spUserIds);

    /** 계정 권한 UPSERT(체크박스 즉시 반영). */
    int upsertPaperPermission(@Param("userNo") long userNo,
                              @Param("comprehensiveYn") String comprehensiveYn,
                              @Param("selfregYn") String selfregYn,
                              @Param("updatedBy") long updatedBy);
}
