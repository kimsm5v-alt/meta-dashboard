package com.vs.meta.api.notification.event;

import java.util.List;

/**
 * 학생 대상 검사 알림 공통 이벤트.
 */
public record StudentExamNotificationEvent(
        Kind kind,
        List<Long> studentUserNos,
        String groupName,
        int round,
        String examName
) {
    public enum Kind {
        S1_ASSIGNED,
        S3_RESULT_PUBLISHED,
        S6_REEXAM_REQUESTED
    }
}
