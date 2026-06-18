package com.vs.meta.api.sso.client.dto;

import java.time.LocalDateTime;

/**
 * Auth RP Group API 멤버 객체.
 *
 * @param publicUserId 학심정 user.sp_user_id 와 동일 식별자 (UUID)
 * @param name         라이브 조인 성명 — <b>영속화 금지</b> (알림 문구 일회성 사용만)
 * @param seqNo        그룹 내 표시 순번 — 교사가 mypage 에서 정한 값. 학심정 group_member.member_no 로 반영. nullable
 */
public record RpMemberDto(
        String publicUserId,
        String name,
        String status,
        Integer seqNo,
        LocalDateTime joinedAt,
        LocalDateTime updatedAt
) {}
