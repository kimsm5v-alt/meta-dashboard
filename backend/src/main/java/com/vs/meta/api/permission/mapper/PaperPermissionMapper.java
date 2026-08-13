package com.vs.meta.api.permission.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Map;

/**
 * 계정별 검사 유형(paperIdx) 권한 매퍼.
 * account_paper_permission: 행이 없으면 기본값(종합만 허용)으로 간주한다.
 */
@Mapper
public interface PaperPermissionMapper {

    /** 계정 권한 1건 조회. 없으면 null(=기본값). @return {comprehensiveYn, selfregYn} */
    Map<String, Object> selectByUserNo(@Param("userNo") long userNo);
}
