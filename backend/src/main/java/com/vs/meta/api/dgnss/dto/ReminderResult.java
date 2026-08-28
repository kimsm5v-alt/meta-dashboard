package com.vs.meta.api.dgnss.dto;

/**
 * (교사) 미제출 학생 독려 알림 발송 결과. POST /api/dgnss/tc/reminder
 * code: OK / NOT_FOUND / NOT_OWNER / NOT_IN_PROGRESS / NO_TARGET
 */
public record ReminderResult(
        String code,
        int requestedCount,
        int sentCount,
        int failedCount,
        String lastSentAt   // ISO8601(+09:00), 비발송 시 null
) {}
