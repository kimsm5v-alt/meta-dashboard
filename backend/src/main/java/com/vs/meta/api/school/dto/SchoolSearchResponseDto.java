package com.vs.meta.api.school.dto;

import java.util.List;

/**
 * 학교 검색 페이지 응답. totalCount 는 NEIS list_total_count(전체 매칭 수) — 프론트가 "더 보기" 판정에 사용.
 */
public record SchoolSearchResponseDto(
        List<SchoolSearchResultDto> items,
        int totalCount,
        int page,
        int pageSize
) {}
