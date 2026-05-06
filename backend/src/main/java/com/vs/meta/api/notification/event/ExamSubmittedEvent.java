package com.vs.meta.api.notification.event;

/**
 * T3 — 학생 검사 제출.
 *
 * @param teacherUserNo   수신자(교사 userNo)
 * @param studentNickname 제출한 학생 닉네임
 * @param round           회차(1, 2 ...)
 * @param examName        검사명
 */
public record ExamSubmittedEvent(
        Long teacherUserNo,
        String studentNickname,
        int round,
        String examName
) {}
