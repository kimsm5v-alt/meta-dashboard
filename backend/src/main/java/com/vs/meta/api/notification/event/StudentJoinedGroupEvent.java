package com.vs.meta.api.notification.event;

/**
 * T1 — 학생이 그룹에 가입.
 *
 * @param teacherUserNo       수신자 (그룹 오너 교사)
 * @param claId               그룹 claId (딥링크 /groups/{claId} 용)
 * @param groupName           그룹명 (문구 박제)
 * @param studentNickname     가입한 학생 이름 — 이미 보유한 경로(로컬 합류 등)에서만 채움. 없으면 null
 * @param studentPublicUserId 가입한 학생 publicUserId — name 이 null 일 때 리스너가 /users/batch 로
 *                            동의 마스킹과 함께 이름을 해석한다(동의자만 이름 표시). nullable
 */
public record StudentJoinedGroupEvent(
        Long teacherUserNo,
        String claId,
        String groupName,
        String studentNickname,
        String studentPublicUserId
) {}
