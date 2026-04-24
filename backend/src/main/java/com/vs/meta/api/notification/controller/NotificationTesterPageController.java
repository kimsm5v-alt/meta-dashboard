package com.vs.meta.api.notification.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 알림 기능 수동 검증용 HTML 페이지 서빙.
 * local profile에서만 bean 등록 — 운영/개발서버에서는 404.
 *
 * <p>클래스패스의 {@code notification-dev/tester.html} 을 그대로 반환한다.
 */
@Slf4j
@RestController
@Profile("local")
@RequestMapping("/dev")
@Tag(name = "Notification Debug (local only)", description = "로컬 환경 SSE 수동 테스트")
public class NotificationTesterPageController {

    @GetMapping(value = "/notification-tester", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "[local] 알림 테스터 페이지", description = "SSE 수신 + 이벤트 트리거 확인용")
    public ResponseEntity<Resource> page() {
        Resource resource = new ClassPathResource("notification-dev/tester.html");
        if (!resource.exists()) {
            log.warn("[Debug] tester.html 리소스를 찾을 수 없습니다.");
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(resource);
    }
}
