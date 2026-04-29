package com.vs.meta.common.config;

import com.vs.meta.common.exception.AuthFailedException;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Handles API exceptions with the project's local response format.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseDTO<CustomBody> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        log.error("DB constraint violation: {}", e.getMostSpecificCause().getMessage());

        String message = extractConstraintMessage(e);

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", HttpStatus.CONFLICT.value());
        errorData.put("name", "DataIntegrityViolation");
        errorData.put("message", message);

        return AidtCommonUtil.makeResultFail(null, errorData, message);
    }

    @ExceptionHandler(AuthFailedException.class)
    public ResponseDTO<CustomBody> handleAuthFailed(AuthFailedException e) {
        log.warn("Authentication failed: {}", e.getMessage());

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", HttpStatus.UNAUTHORIZED.value());
        errorData.put("name", "AuthFailed");
        errorData.put("message", e.getMessage());

        return AidtCommonUtil.makeResultFail(null, errorData, e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseDTO<CustomBody> handleIllegalArgument(IllegalArgumentException e) {
        log.warn("Invalid argument: {}", e.getMessage());

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", HttpStatus.BAD_REQUEST.value());
        errorData.put("name", "IllegalArgument");
        errorData.put("message", e.getMessage());

        return AidtCommonUtil.makeResultFail(null, errorData, e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseDTO<CustomBody> handleIllegalState(IllegalStateException e) {
        log.warn("Illegal state: {}", e.getMessage());

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", HttpStatus.CONFLICT.value());
        errorData.put("name", "IllegalState");
        errorData.put("message", e.getMessage());

        return AidtCommonUtil.makeResultFail(null, errorData, e.getMessage());
    }

    @ExceptionHandler(org.apache.catalina.connector.ClientAbortException.class)
    public void handleClientAbort(org.apache.catalina.connector.ClientAbortException e) {
        // 클라이언트 측 끊김 — ERROR 가 아니라 WARN 으로 가시화 (빈도 모니터링 용도, 스택트레이스 X)
        log.warn("Client disconnected: {}", e.getMessage());
    }

    /**
     * SSE 등 long-lived 연결에서 클라이언트가 비정상 끊김 시 발생하는 IOException 처리.
     * "Connection reset by peer", "Broken pipe" 등은 정상 운영 흐름 (사용자 탭 닫기, 모바일 백그라운드,
     * LB idle timeout) 이므로 WARN 으로 한 줄만 (스택트레이스 X). 그 외 진짜 서버 측 IO 문제는 ERROR 유지.
     *
     * <p>{@link org.apache.catalina.connector.ClientAbortException} 은 IOException 하위라 그쪽 핸들러에서 우선 처리.
     */
    @ExceptionHandler(java.io.IOException.class)
    public void handleIOException(java.io.IOException e) {
        String msg = e.getMessage() != null ? e.getMessage() : "";
        if (msg.contains("Connection reset") || msg.contains("Broken pipe") || msg.contains("aborted")) {
            log.warn("Client disconnected (IO): {}", msg);
            return;
        }
        log.error("Server I/O error: {}", msg, e);
    }

    // ─────────────────────────────────────────────────────
    // Spring Web 표준 클라이언트 에러 (4xx) — 명확한 메시지로 분리
    // 기존엔 모두 generic Exception 핸들러에서 500 + "서버 내부 오류" 로 처리됐는데,
    // 실제로는 클라이언트의 잘못된 호출이라 사용자/FE 에 정확한 원인 전달 필요.
    // 로그도 ERROR → WARN 으로 다운그레이드 (운영 알람 정확화).
    // ─────────────────────────────────────────────────────

    /** 405 — 지원하지 않는 HTTP method (예: PUT 으로 호출했는데 컨트롤러는 PATCH 만 정의) */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseDTO<CustomBody> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        String supported = e.getSupportedHttpMethods() != null
                ? e.getSupportedHttpMethods().toString()
                : "";
        String message = String.format("지원하지 않는 요청 방식입니다. (요청: %s, 허용: %s)",
                e.getMethod(), supported);
        log.warn("Method not supported: {}", message);

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", HttpStatus.METHOD_NOT_ALLOWED.value());
        errorData.put("name", "MethodNotAllowed");
        errorData.put("message", message);
        errorData.put("requestedMethod", e.getMethod());
        errorData.put("supportedMethods", e.getSupportedHttpMethods());
        return AidtCommonUtil.makeResultFail(null, errorData, message);
    }

    /** 415 — 지원하지 않는 Content-Type (예: text/xml 보냈는데 application/json 만 받음) */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseDTO<CustomBody> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException e) {
        String message = String.format("지원하지 않는 요청 형식입니다. (요청: %s)", e.getContentType());
        log.warn("Media type not supported: {}", message);

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", HttpStatus.UNSUPPORTED_MEDIA_TYPE.value());
        errorData.put("name", "UnsupportedMediaType");
        errorData.put("message", message);
        return AidtCommonUtil.makeResultFail(null, errorData, message);
    }

    /** 400 — 필수 쿼리 파라미터 누락 */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseDTO<CustomBody> handleMissingParameter(MissingServletRequestParameterException e) {
        String message = String.format("필수 파라미터가 누락되었습니다: %s", e.getParameterName());
        log.warn("Missing parameter: {}", message);

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", HttpStatus.BAD_REQUEST.value());
        errorData.put("name", "MissingParameter");
        errorData.put("message", message);
        errorData.put("parameter", e.getParameterName());
        return AidtCommonUtil.makeResultFail(null, errorData, message);
    }

    /** 400 — 파라미터 타입 변환 실패 (예: Long 인데 "abc" 들어옴) */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseDTO<CustomBody> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        String message = String.format("파라미터 형식이 잘못되었습니다: %s", e.getName());
        log.warn("Type mismatch: param={}, value={}, requiredType={}",
                e.getName(), e.getValue(),
                e.getRequiredType() != null ? e.getRequiredType().getSimpleName() : "?");

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", HttpStatus.BAD_REQUEST.value());
        errorData.put("name", "TypeMismatch");
        errorData.put("message", message);
        errorData.put("parameter", e.getName());
        return AidtCommonUtil.makeResultFail(null, errorData, message);
    }

    /** 400 — 요청 body JSON 파싱 실패 */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseDTO<CustomBody> handleMessageNotReadable(HttpMessageNotReadableException e) {
        String message = "요청 본문 형식이 올바르지 않습니다.";
        log.warn("Message not readable: {}", e.getMessage());

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", HttpStatus.BAD_REQUEST.value());
        errorData.put("name", "BadRequestBody");
        errorData.put("message", message);
        return AidtCommonUtil.makeResultFail(null, errorData, message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseDTO<CustomBody> handleException(Exception e) {
        log.error("Server error: {}", e.getMessage(), e);

        Map<String, Object> errorData = new LinkedHashMap<>();
        errorData.put("code", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorData.put("name", e.getClass().getSimpleName());
        errorData.put("message", "서버 내부 오류가 발생했습니다.");

        return AidtCommonUtil.makeResultFail(null, errorData, "서버 내부 오류가 발생했습니다.");
    }

    private String extractConstraintMessage(DataIntegrityViolationException e) {
        String cause = e.getMostSpecificCause().getMessage();
        if (cause == null) {
            return "데이터 무결성 오류가 발생했습니다.";
        }

        String lowerCause = cause.toLowerCase();

        if (lowerCause.contains("duplicate entry") || lowerCause.contains("unique")) {
            if (lowerCause.contains("user_no") || lowerCause.contains("primary")) {
                return "이미 존재하는 사용자입니다.";
            }
            if (lowerCause.contains("email")) {
                return "이미 사용 중인 이메일입니다.";
            }
            if (lowerCause.contains("invite_code")) {
                return "초대코드가 중복되었습니다. 다시 시도해주세요.";
            }
            return "중복된 데이터가 존재합니다.";
        }

        if (lowerCause.contains("foreign key")
                || lowerCause.contains("cannot delete or update a parent")
                || lowerCause.contains("a foreign key constraint fails")) {
            return "참조 중인 데이터가 있어 처리할 수 없습니다.";
        }

        if (lowerCause.contains("cannot be null") || lowerCause.contains("not-null")) {
            return "필수 입력값이 누락되었습니다.";
        }

        return "데이터 무결성 오류가 발생했습니다.";
    }
}
