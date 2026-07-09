package com.vs.meta.common.aop;

import com.vs.meta.common.exception.AuthFailedException;
import org.apache.catalina.connector.ClientAbortException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

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

    // ─────────────────────────────────────────────────────
    // statusFromException — 던져진 예외에서 상태코드 역추정
    //   (aspect finally 는 GlobalExceptionHandler 보다 먼저 unwind 돼 response.getStatus() 가 아직 200)
    // ─────────────────────────────────────────────────────

    @Test
    @DisplayName("statusFromException — 미처리 예외(catch-all)는 500")
    void statusFromException_기본은_500() {
        assertThat(QchTraceAspect.statusFromException(new Exception("boom"))).isEqualTo(500);
        assertThat(QchTraceAspect.statusFromException(new RuntimeException("boom"))).isEqualTo(500);
    }

    @Test
    @DisplayName("statusFromException — Spring ErrorResponse(표준 웹 예외)는 자체 status 사용")
    void statusFromException_ErrorResponse는_자체status() {
        assertThat(QchTraceAspect.statusFromException(
                new ResponseStatusException(HttpStatus.NOT_FOUND))).isEqualTo(404);
        assertThat(QchTraceAspect.statusFromException(
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "dpop nonce required"))).isEqualTo(401);
    }

    @Test
    @DisplayName("statusFromException — 학심정 고유 예외 매핑 (GlobalExceptionHandler 와 동일 기준)")
    void statusFromException_앱예외_매핑() {
        assertThat(QchTraceAspect.statusFromException(new AuthFailedException("bad"))).isEqualTo(401);
        assertThat(QchTraceAspect.statusFromException(new IllegalArgumentException("x"))).isEqualTo(400);
        assertThat(QchTraceAspect.statusFromException(new IllegalStateException("x"))).isEqualTo(409);
        assertThat(QchTraceAspect.statusFromException(new DataIntegrityViolationException("x"))).isEqualTo(409);
    }

    @Test
    @DisplayName("statusFromException — cause 체인을 언랩해 원인 예외로 판정")
    void statusFromException_cause_언랩() {
        assertThat(QchTraceAspect.statusFromException(
                new RuntimeException(new AuthFailedException("bad")))).isEqualTo(401);
    }

    @Test
    @DisplayName("statusFromException — 클라이언트 끊김/정상 종료(void 핸들러)는 499(비에러)")
    void statusFromException_클라끊김은_499() {
        assertThat(QchTraceAspect.statusFromException(new ClientAbortException("Broken pipe"))).isEqualTo(499);
        assertThat(QchTraceAspect.statusFromException(new AsyncRequestTimeoutException())).isEqualTo(499);
        assertThat(QchTraceAspect.statusFromException(new IOException("Connection reset by peer"))).isEqualTo(499);
    }

    @Test
    @DisplayName("statusFromException — 진짜 서버 IO 오류(끊김 아님)는 500")
    void statusFromException_진짜IO오류는_500() {
        assertThat(QchTraceAspect.statusFromException(new IOException("disk write failed"))).isEqualTo(500);
    }

    @Test
    @DisplayName("분류 종단 — 미처리 예외는 ERROR/isError=true, 클라 끊김은 WARN/isError=false")
    void 분류_종단() {
        int serverErr = QchTraceAspect.statusFromException(new Exception("boom"));
        assertThat(QchTraceAspect.isError(serverErr)).isTrue();
        assertThat(QchTraceAspect.logType(serverErr)).isEqualTo("ERROR");

        int disconnect = QchTraceAspect.statusFromException(new ClientAbortException("Broken pipe"));
        assertThat(QchTraceAspect.isError(disconnect)).isFalse();
        assertThat(QchTraceAspect.logType(disconnect)).isEqualTo("WARN");
    }
}
