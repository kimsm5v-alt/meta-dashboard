package com.vs.meta.common.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

/**
 * QCH /api/v1/ingest/trace 페이로드. doc-1444 §2.2 스키마.
 *
 * <p>{@link Payload} 의 4개 nested key (queryParams, requestHeaders, requestBody, responseBody) 는
 * 그대로 jsonb 컬럼에 적재되므로 4개 모두 채워야 한다 (없으면 빈 객체).
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QchTraceEvent {

    private final String serviceKey;
    private final String env;
    private final String source;
    private final String appName;
    private final String createdAt;
    private final String method;
    private final String endpoint;
    private final Integer statusCode;
    private final Long responseTimeMs;
    private final String testcoverage;
    private final Boolean testAllowed;
    private final String userId;
    private final String userType;
    private final String traceId;
    private final Payload payload;
    private final Map<String, Object> extra;

    @Getter
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Payload {
        private final Map<String, Object> queryParams;
        private final Map<String, Object> requestHeaders;
        private final Object requestBody;
        private final Object responseBody;
    }
}
