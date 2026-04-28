package com.vs.meta.api.notification.event;

/**
 * T1 — 학생이 그룹에 가입.
 *
 * @param teacherUserNo    수신자 (그룹 오너 교사)
 * @param claId            그룹 claId (딥링크 /groups/{claId} 용)
 * @param groupName        그룹명 (문구 박제)
 * @param studentNickname  가입한 학생 닉네임 (문구 박제)
 */
public record StudentJoinedGroupEvent(
        Long teacherUserNo,
        String claId,
        String groupName,
        String studentNickname
) {}
