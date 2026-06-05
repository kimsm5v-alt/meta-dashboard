package com.vs.meta.domain.enums;

public enum AiMessageRole {
    user,
    assistant,
    system;

    public static AiMessageRole from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("role is required. allowed: user, assistant, system");
        }
        for (AiMessageRole role : values()) {
            if (role.name().equals(value)) {
                return role;
            }
        }
        throw new IllegalArgumentException("invalid role: " + value + " (allowed: user, assistant, system)");
    }
}
