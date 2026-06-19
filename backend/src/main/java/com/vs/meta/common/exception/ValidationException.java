package com.vs.meta.common.exception;

import java.util.List;
import java.util.Map;

public class ValidationException extends RuntimeException {
    private final List<Map<String, Object>> errors;

    public ValidationException(String message, List<Map<String, Object>> errors) {
        super(message);
        this.errors = errors;
    }

    public List<Map<String, Object>> getErrors() {
        return errors;
    }
}
