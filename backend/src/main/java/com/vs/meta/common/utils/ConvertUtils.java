package com.vs.meta.common.utils;

/**
 * Map 기반 파라미터 형변환 유틸리티
 */
public final class ConvertUtils {

    private ConvertUtils() {}

    public static Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Long) return (Long) value;
        if (value instanceof Number) return ((Number) value).longValue();
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
