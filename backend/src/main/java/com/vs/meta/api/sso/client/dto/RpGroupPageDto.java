package com.vs.meta.api.sso.client.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 스냅샷 페이지 (GET /rp/groups) 응답.
 *
 * @param nextAfterId  다음 페이지의 afterId. items.size &lt; limit 이면 순회 완료
 * @param currentSince 변경 피드 초기 커서 — <b>부트스트랩 첫 페이지 값만 사용</b>
 */
public record RpGroupPageDto(
        List<RpGroupDto> items,
        Long nextAfterId,
        LocalDateTime currentSince
) {}
