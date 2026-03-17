package com.meta.dashboard.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 시스템 상태 확인을 위한 기본 컨트롤러입니다.
 */
@RestController
public class HealthCheckController {

    /**
     * 서버 연결 상태를 확인합니다.
     * @return 서버 상태 메시지
     */
    @GetMapping("/")
    public Map<String, String> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Meta Dashboard Backend is running on port 8081");
        return response;
    }
}
