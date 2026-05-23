package com.vs.meta.common.auth;

/**
 * Auth API 호출 실패 시 — 로깅용. Service/Controller까지 전파하지 않음
 * (UserInfoEnricher가 catch 후 placeholder fallback).
 */
public class AuthApiException extends RuntimeException {
    public AuthApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
