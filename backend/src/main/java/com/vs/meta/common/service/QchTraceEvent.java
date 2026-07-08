package com.vs.meta.common.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    // QCH ingest 는 logType/isError 미전송 시 statusCode>=400 을 전부 에러로 폴백 분류
    //   (IngestPersistenceService.computeIsError). 예상된 4xx(로그인 실패·토큰만료·nonce 챌린지)가
    //   에러 지표로 오적재되지 않도록, mypage/auth 와 동일 기준으로 명시 전송한다.
    private final String logType;
    @JsonProperty("isError")
    private final Boolean isError;
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
