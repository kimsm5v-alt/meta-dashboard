package com.vs.meta.api.notification.event;

/**
 * S5 — 교사가 학생을 그룹에서 추방 (MemberStatus.KICKED).
 * 게스트 멤버(userNo == null)는 인앱 알림 불가 → 이벤트 발행 스킵.
 *
 * @param studentUserNo  수신자 (추방된 학생)
 * @param groupName      그룹명 (문구 박제)
 */
public record StudentKickedEvent(
        Long studentUserNo,
        String groupName
) {}
