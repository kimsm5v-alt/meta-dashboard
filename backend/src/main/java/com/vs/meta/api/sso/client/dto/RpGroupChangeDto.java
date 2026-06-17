package com.vs.meta.api.sso.client.dto;

import java.time.LocalDateTime;

/**
 * 그룹 변경 피드 이벤트 (GET /rp/groups/changes item).
 *
 * @param changeType   GROUP_CREATE / GROUP_UPDATE / GROUP_DELETE / MEMBER_ADD / MEMBER_REMOVE
 * @param publicUserId MEMBER_* 이벤트만 값, GROUP_* 는 null
 * @param occurredAt   발생 시각 (Auth DATETIME(6) — 마이크로초 정밀도)
 */
public record RpGroupChangeDto(
        String changeType,
        Long groupId,
        String publicUserId,
        LocalDateTime occurredAt,
        String ownerPublicUserId
) {}
