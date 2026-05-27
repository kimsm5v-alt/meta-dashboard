package com.vs.meta.api.sso.client.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * IdP RP Event Feed 응답 (revocations / deletions 공통).
 *
 * <p>revocations 는 item 시각 필드가 revoked_at, deletions 는 deleted_at 으로 다르지만
 * 학심정 처리(=withdraw cascade)는 동일하므로 공통 형태로 정규화한다.
 *
 * @param items     탈퇴/연결끊기 사용자 목록
 * @param nextSince 다음 폴링 호출의 since cursor (items 비면 요청 since 그대로)
 */
public record SsoEventFeedResponse(List<Item> items, LocalDateTime nextSince) {

    /**
     * @param sub     IdP publicUserId (학심정 sp_user_id 매핑 키)
     * @param eventAt 이벤트 발생 시각 (revoked_at 또는 deleted_at)
     */
    public record Item(String sub, LocalDateTime eventAt) {}
}
