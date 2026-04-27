package com.vs.meta.api.notification.controller;

import com.vs.meta.api.notification.dto.NotificationListResponse;
import com.vs.meta.api.notification.service.NotificationService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.utils.SecurityUtil;
import com.vs.meta.domain.enums.NotificationCategory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

/**
 * 알림 REST API.
 *
 * <p>모든 API는 현재 로그인 사용자(JWT)를 기준으로 동작.
 * FE는 별도 ID를 전달할 필요 없음.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/v1/notifications", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Notification", description = "알림 목록/카운트/읽음 처리")
public class NotificationController {

    private final NotificationService service;

    @GetMapping
    @Operation(summary = "알림 목록 조회", description = "cursor 기반 페이징. category 필터 선택적.")
    public ResponseDTO<CustomBody> list(
            @RequestParam(required = false) Long cursor,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) NotificationCategory category
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        NotificationListResponse result = service.list(userNo, cursor, size, category);
        return AidtCommonUtil.makeResultSuccess(null, result, "OK");
    }

    @GetMapping("/unread-count")
    @Operation(summary = "미확인 알림 개수", description = "뱃지 표시 / fallback 폴링용 경량 API")
    public ResponseDTO<CustomBody> unreadCount() {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        int count = service.countUnread(userNo);
        return AidtCommonUtil.makeResultSuccess(null, Collections.singletonMap("count", count), "OK");
    }

    @PostMapping("/{notificationId}/read")
    @Operation(summary = "개별 읽음 처리", description = "본인 알림만 대상. 이미 읽음이면 no-op.")
    public ResponseDTO<CustomBody> markAsRead(@PathVariable Long notificationId) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        service.markAsRead(userNo, notificationId);
        return AidtCommonUtil.makeResultSuccess(null, null, "읽음 처리 완료");
    }

    @PostMapping("/read-all")
    @Operation(summary = "전체 읽음 처리", description = "본인의 모든 미확인 알림을 읽음 처리")
    public ResponseDTO<CustomBody> markAllAsRead() {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        int updated = service.markAllAsRead(userNo);
        Map<String, Object> result = Collections.singletonMap("updatedCount", updated);
        return AidtCommonUtil.makeResultSuccess(null, result, "OK");
    }
}
