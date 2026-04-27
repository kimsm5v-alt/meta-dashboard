package com.vs.meta.common.config;

import com.vs.meta.common.exception.AuthFailedException;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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
        log.debug("Client disconnected: {}", e.getMessage());
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
