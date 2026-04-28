package com.vs.meta.api.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 알림 목록 페이징 응답 래퍼.
 * cursor 기반 페이징 — FE는 nextCursor를 다음 요청에 전달.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationListResponse {

    private List<NotificationDto> items;
    private Long nextCursor;
    private boolean hasMore;
}
