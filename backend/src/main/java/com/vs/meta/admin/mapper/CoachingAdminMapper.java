package com.vs.meta.admin.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 개인화 코칭(강점/보완점) admin 편집 매퍼.
 * 목록/필터 조회, 문구 수정, 수정 직전 스냅샷 이력(pre-image), 이력 조회·롤백을 담당한다.
 */
@Mapper
public interface CoachingAdminMapper {

    // ---------- 강점 ----------
    long countStrength(@Param("schoolLevel") String schoolLevel,
                       @Param("lpaClass") String lpaClass,
                       @Param("factor") String factor);

    List<Map<String, Object>> selectStrengthList(@Param("schoolLevel") String schoolLevel,
                                                 @Param("lpaClass") String lpaClass,
                                                 @Param("factor") String factor,
                                                 @Param("limit") int limit,
                                                 @Param("offset") int offset);

    Map<String, Object> selectStrengthById(@Param("id") long id);

    List<Map<String, Object>> selectStrengthLpaClasses();

    int insertStrengthHistoryFromCurrent(@Param("id") long id,
                                         @Param("action") String action,
                                         @Param("changedBy") long changedBy);

    int updateStrength(@Param("id") long id,
                       @Param("observation") String observation,
                       @Param("line") String line,
                       @Param("question") String question,
                       @Param("updatedBy") long updatedBy);

    List<Map<String, Object>> selectStrengthHistory(@Param("strengthId") long strengthId);

    Map<String, Object> selectStrengthHistoryById(@Param("historyId") long historyId);

    // ---------- 보완점 ----------
    long countModeration(@Param("schoolLevel") String schoolLevel,
                         @Param("lpaClass") String lpaClass,
                         @Param("keyword") String keyword);

    List<Map<String, Object>> selectModerationList(@Param("schoolLevel") String schoolLevel,
                                                   @Param("lpaClass") String lpaClass,
                                                   @Param("keyword") String keyword,
                                                   @Param("limit") int limit,
                                                   @Param("offset") int offset);

    Map<String, Object> selectModerationById(@Param("id") long id);

    List<Map<String, Object>> selectModerationLpaClasses();

    int insertModerationHistoryFromCurrent(@Param("id") long id,
                                           @Param("action") String action,
                                           @Param("changedBy") long changedBy);

    int updateModeration(@Param("id") long id,
                         @Param("interpretation") String interpretation,
                         @Param("coaching1Method") String coaching1Method,
                         @Param("coaching1Line") String coaching1Line,
                         @Param("coaching2Action") String coaching2Action,
                         @Param("coaching2Line") String coaching2Line,
                         @Param("updatedBy") long updatedBy);

    List<Map<String, Object>> selectModerationHistory(@Param("moderationRowId") long moderationRowId);

    Map<String, Object> selectModerationHistoryById(@Param("historyId") long historyId);
}
