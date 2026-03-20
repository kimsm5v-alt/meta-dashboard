package com.vs.meta.common.utils;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 페이징 공통 유틸리티.
 *
 * <p>Admin UI (1-indexed)와 REST API (0-indexed) 모두 지원.
 * Mapper 파라미터는 항상 {@code limit}, {@code offset}으로 통일.
 */
public class PageUtil {

    private PageUtil() {}

    /**
     * 0-indexed page → offset 계산 (REST API용).
     *
     * @param page 0부터 시작하는 페이지 번호
     * @param size 페이지 크기
     * @return offset 값
     */
    public static int offset(int page, int size) {
        return Math.max(page, 0) * size;
    }

    /**
     * 1-indexed page → offset 계산 (Admin UI용).
     *
     * @param page 1부터 시작하는 페이지 번호
     * @param size 페이지 크기
     * @return offset 값
     */
    public static int offsetOneIndexed(int page, int size) {
        return (Math.max(page, 1) - 1) * size;
    }

    /**
     * 전체 페이지 수 계산.
     */
    public static int totalPages(long totalCount, int size) {
        if (size <= 0) return 1;
        return Math.max(1, (int) Math.ceil((double) totalCount / size));
    }

    /**
     * 1-indexed page 보정 (Admin UI용).
     * page가 1 미만이면 1, totalPages 초과면 totalPages로 보정.
     */
    public static int clampPage(int page, int totalPages) {
        if (page < 1) return 1;
        if (page > totalPages) return totalPages;
        return page;
    }

    /**
     * REST API용 페이징 응답 Map 생성 (0-indexed).
     *
     * @param page       0-indexed 현재 페이지
     * @param size       페이지 크기
     * @param totalCount 전체 건수
     * @return {page, size, totalCount, totalPages}
     */
    public static Map<String, Object> of(int page, int size, long totalCount) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("page", page);
        map.put("size", size);
        map.put("totalCount", totalCount);
        map.put("totalPages", totalPages(totalCount, size));
        return map;
    }
}
