package com.vs.meta.api.notification.event;

/**
 * S4 — 교사가 이메일로 그룹 초대 발송.
 * 수신자는 해당 이메일로 가입된 학심정 회원.
 * 이메일 주인이 미가입이면 이 이벤트는 발행하지 않음 (이메일만 발송).
 *
 * @param inviteeUserNo    수신자 (초대받은 회원의 userNo)
 * @param groupName        그룹명 (문구 박제)
 * @param inviteCode       초대 코드 (딥링크용 — /student/groups?code=XXXX)
 */
public record GroupInvitedEvent(
        Long inviteeUserNo,
        String groupName,
        String inviteCode
) {}
