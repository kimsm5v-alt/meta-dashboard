package com.vs.meta.api.notification.event;

/**
 * 교사 대상 검사 알림 공통 이벤트.
 */
public record TeacherExamNotificationEvent(
        Kind kind,
        Long teacherUserNo,
        String groupName,
        int round,
        String examName
) {
    public enum Kind {
        T4_ALL_SUBMITTED,
        T6_REPORT_READY
    }
}
