package com.vs.meta.common.exception;

/**
 * 계정에 허용되지 않은 검사 유형(paperIdx)으로 검사 생성/진행을 시도할 때 발생.
 * GlobalExceptionHandler 에서 403 / errorCode "PAPER_NOT_ALLOWED" 로 응답한다.
 */
public class PaperPermissionDeniedException extends RuntimeException {

    public PaperPermissionDeniedException(String message) {
        super(message);
    }
}
