package com.vs.meta.common.aop;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * QCH trace 의 에러/로그레벨 분류 단위 테스트.
 *
 * <p>QCH ingest 는 {@code isError}/{@code logType} 미전송 시 {@code statusCode >= 400} 을 전부
 * 에러로 폴백 분류한다(IngestPersistenceService.computeIsError). 예상된 4xx(로그인 실패·토큰만료·
 * DPoP nonce 챌린지 등)가 에러 지표로 오적재되지 않도록, aspect 가 mypage/auth 와 동일 기준으로
 * 두 값을 명시 계산해 전송해야 한다.
 */
class QchTraceAspectTest {

    @Test
    @DisplayName("isError — 5xx(서버 오류)만 true, 4xx/2xx 는 false")
    void isError_는_5xx만_true() {
        assertThat(QchTraceAspect.isError(500)).isTrue();
        assertThat(QchTraceAspect.isError(503)).isTrue();
        assertThat(QchTraceAspect.isError(401)).isFalse();
        assertThat(QchTraceAspect.isError(404)).isFalse();
        assertThat(QchTraceAspect.isError(409)).isFalse();
        assertThat(QchTraceAspect.isError(200)).isFalse();
    }

    @Test
    @DisplayName("logType — 5xx→ERROR, 4xx→WARN, 그 외→INFO")
    void logType_임계값() {
        assertThat(QchTraceAspect.logType(500)).isEqualTo("ERROR");
        assertThat(QchTraceAspect.logType(401)).isEqualTo("WARN");
        assertThat(QchTraceAspect.logType(404)).isEqualTo("WARN");
        assertThat(QchTraceAspect.logType(200)).isEqualTo("INFO");
        assertThat(QchTraceAspect.logType(302)).isEqualTo("INFO");
    }
}
