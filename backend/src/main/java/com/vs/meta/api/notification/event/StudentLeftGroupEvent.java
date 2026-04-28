package com.vs.meta.api.notification.event;

/**
 * T2 — 학생이 그룹에서 자발적으로 탈퇴 (MemberStatus.LEFT).
 * 추방(KICKED)은 별도 이벤트(StudentKickedEvent)로 분리.
 *
 * @param teacherUserNo    수신자 (그룹 오너 교사)
 * @param claId            그룹 claId (딥링크용)
 * @param studentNickname  탈퇴한 학생 닉네임 (문구 박제)
 */
public record StudentLeftGroupEvent(
        Long teacherUserNo,
        String claId,
        String studentNickname
) {}
