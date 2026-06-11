package com.vs.meta.api.sso.client.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Auth RP Group API 그룹 객체 — 스냅샷(GET /rp/groups) item / 단건(GET /rp/groups/{id}) 응답.
 *
 * <p>members 는 ACTIVE 멤버만 포함. name 은 라이브 조인 성명 —
 * <b>영속화 금지</b> (그룹 표시·알림 문구 일회성 사용만 허용, Auth 거버넌스).
 *
 * @param schoolLevel ELEMENTARY / MIDDLE / HIGH / ETC
 * @param grade       자유텍스트 ("3학년"), nullable
 * @param classNo     자유텍스트 ("5반"), nullable
 */
public record RpGroupDto(
        Long groupId,
        String groupName,
        String schoolName,
        String schoolLevel,
        String schoolCode,
        String grade,
        String classNo,
        String subject,
        String status,
        LocalDateTime updatedAt,
        List<RpMemberDto> members,
        String ownerPublicUserId
) {}
