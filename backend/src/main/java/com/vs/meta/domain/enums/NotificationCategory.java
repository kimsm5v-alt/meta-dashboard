package com.vs.meta.domain.enums;

/**
 * 알림 카테고리.
 *
 * <p>FE의 섹션 그룹핑 기준이 된다.
 */
public enum NotificationCategory {
    /** 검사 관련 (T3~T6, S1~S3, S6) */
    EXAM,
    /** 그룹 관련 (T1, T2, S4, S5) */
    GROUP,
    /** 공지/시스템 (T10, T11, S7 — 고도화) */
    NOTICE
}
