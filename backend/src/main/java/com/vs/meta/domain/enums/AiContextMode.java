package com.vs.meta.domain.enums;

public enum AiContextMode {
    all,
    classMode,
    student;

    public static AiContextMode from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("mode is required. allowed: all, class, student");
        }

        if ("class".equals(value)) {
            return classMode;
        }

        for (AiContextMode mode : values()) {
            if (mode.name().equals(value)) {
                return mode;
            }
        }
        throw new IllegalArgumentException("invalid mode: " + value + " (allowed: all, class, student)");
    }

    public String toApiValue() {
        if (this == classMode) {
            return "class";
        }
        return this.name();
    }
}
