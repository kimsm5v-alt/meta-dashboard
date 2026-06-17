package com.vs.meta.api.sso.client.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 그룹 변경 피드 응답 (GET /rp/groups/changes).
 *
 * <p>items 는 occurredAt 오름차순. 변경 없으면 빈 리스트 + nextSince 는 요청값 그대로.
 * items.size == limit 이면 미수신분 존재 — 즉시 재호출.
 */
public record RpGroupChangeFeedDto(
        List<RpGroupChangeDto> items,
        LocalDateTime nextSince
) {}
