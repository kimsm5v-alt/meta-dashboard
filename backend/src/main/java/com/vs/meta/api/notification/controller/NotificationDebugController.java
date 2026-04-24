package com.vs.meta.api.notification.controller;

import com.vs.meta.api.notification.service.NotificationService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.utils.SecurityUtil;
import com.vs.meta.domain.enums.NotificationCategory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;

/**
 * 알림 기능 개발/디버그 전용 엔드포인트.
 * local profile에서만 동작. 운영/개발서버에서는 비활성.
 *
 * <p>FE의 {@code /dev/sse} 페이지가 이 엔드포인트를 사용해 SSE 수동 검증.
 */
@RestController
@RequiredArgsConstructor
@Profile("local")
@RequestMapping(value = "/api/v1/notifications", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Notification Debug (local only)", description = "로컬 환경 SSE 수동 테스트")
public class NotificationDebugController {

    private final NotificationService service;

    @PostMapping("/test-send")
    @Operation(summary = "[local] 본인에게 테스트 알림 발송", description = "로컬 환경에서 SSE 동작 확인용")
    public ResponseDTO<CustomBody> testSend(
            @RequestParam(defaultValue = "테스트 알림입니다") String msg
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        service.create(userNo, NotificationCategory.NOTICE, "TEST", msg, null);
        return AidtCommonUtil.makeResultSuccess(null, Collections.singletonMap("userNo", userNo), "sent");
    }

    @PostMapping("/cleanup-old")
    @Operation(summary = "[local] N일 경과 알림 즉시 삭제", description = "Retention 스케줄러 동작 검증용")
    public ResponseDTO<CustomBody> cleanupOld(@RequestParam(defaultValue = "90") int days) {
        int deleted = service.deleteOlderThan(days);
        return AidtCommonUtil.makeResultSuccess(null, Collections.singletonMap("deleted", deleted), "OK");
    }
}
