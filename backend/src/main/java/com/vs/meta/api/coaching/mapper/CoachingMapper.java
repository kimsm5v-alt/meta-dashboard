package com.vs.meta.api.coaching.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 개인화 코칭 v2 텍스트 조회 매퍼 (RDB 편집·서빙 원본).
 * 선별 키는 Neo4j({@code DgnssGraphService.selectCoachingSelectionByAnswerIdx})에서 나오고,
 * 문구 텍스트는 이 매퍼로 조회한다.
 */
@Mapper
public interface CoachingMapper {

    /** 강점 문구 조회 — (학교급, LPA유형, 요인) 키. 요인 여러 개를 한 번에 조회한다. */
    List<Map<String, Object>> selectStrengthTexts(@Param("schoolLevel") String schoolLevel,
                                                  @Param("lpaClass") String lpaClass,
                                                  @Param("factors") List<String> factors);

    /** 보완점(코칭) 문구 조회 — moderation_id 키. */
    Map<String, Object> selectModerationText(@Param("moderationId") String moderationId);
}
