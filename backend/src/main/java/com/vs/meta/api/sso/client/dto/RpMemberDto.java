package com.vs.meta.api.sso.client.dto;

import java.time.LocalDateTime;

/**
 * Auth RP Group API 멤버 객체.
 *
 * <p>이름/이메일 등 PII 는 포함되지 않는다 — 표시 시점에 {@code publicUserId} 로 /users/batch 에서
 * 동의 마스킹과 함께 조회한다 (RP Group API v2.0.0).
 *
 * @param publicUserId 학심정 user.sp_user_id 와 동일 식별자 (UUID)
 * @param seqNo        그룹 내 표시 순번 — 교사가 mypage 에서 정한 값. 학심정 group_member.member_no 로 반영. nullable
 */
public record RpMemberDto(
        String publicUserId,
        String status,
        Integer seqNo,
        LocalDateTime joinedAt,
        LocalDateTime updatedAt
) {}
