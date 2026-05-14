package com.vs.meta.api.ai.dto;

import com.vs.meta.domain.AiBugReport;
import lombok.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

public class AiBugReportDto {

    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Long conversationId;
        private Long messageId;
        private String errorType;
        private String severity;
        private String description;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateStatusRequest {
        private String status;
        private String resolutionNote;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListRequest {
        private Integer page;
        private Integer size;
        private String status;
        private String errorType;
        private String severity;
    }

    public static Map<String, Object> toResponse(AiBugReport report) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", report.getId());
        map.put("conversationId", report.getConversationId());
        map.put("messageId", report.getMessageId());
        map.put("errorType", report.getErrorType());
        map.put("severity", report.getSeverity());
        map.put("description", report.getDescription());
        map.put("screenshotUrl", report.getScreenshotUrl());
        map.put("status", report.getStatus());
        map.put("reportedBy", report.getReportedBy());
        map.put("reportedAt", formatTs(report.getReportedAt()));
        map.put("resolvedBy", report.getResolvedBy());
        map.put("resolvedAt", formatTs(report.getResolvedAt()));
        map.put("resolutionNote", report.getResolutionNote());
        return map;
    }

    public static Map<String, Object> toDetailResponse(AiBugReport report) {
        Map<String, Object> map = toResponse(report);
        // 조인된 정보 추가
        Map<String, Object> conversation = new LinkedHashMap<>();
        conversation.put("id", report.getConversationId());
        conversation.put("title", report.getConversationTitle());
        conversation.put("mode", report.getConversationMode());
        conversation.put("contextLabel", report.getConversationContextLabel());
        map.put("conversation", conversation);

        // 문제된 메시지 정보 추가
        if (report.getMessageId() != null) {
            Map<String, Object> message = new LinkedHashMap<>();
            message.put("id", report.getMessageId());
            message.put("role", report.getMessageRole());
            message.put("content", report.getMessageContent());
            map.put("message", message);
        }

        map.put("reporterEmail", report.getReporterEmail());
        map.put("resolverEmail", report.getResolverEmail());
        return map;
    }

    public static Map<String, Object> toListItemResponse(AiBugReport report) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", report.getId());
        map.put("conversationId", report.getConversationId());
        map.put("messageId", report.getMessageId());
        map.put("conversationTitle", report.getConversationTitle());
        map.put("errorType", report.getErrorType());
        map.put("severity", report.getSeverity());
        map.put("status", report.getStatus());
        map.put("reportedAt", formatTs(report.getReportedAt()));
        map.put("reporterEmail", report.getReporterEmail());
        return map;
    }

    /**
     * 내가 제보한 버그 목록용 응답 (스크린샷 URL 포함)
     */
    public static Map<String, Object> toMyBugReportItemResponse(AiBugReport report) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", report.getId());
        map.put("conversationId", report.getConversationId());
        map.put("messageId", report.getMessageId());
        map.put("conversationTitle", report.getConversationTitle());
        map.put("errorType", report.getErrorType());
        map.put("severity", report.getSeverity());
        map.put("description", report.getDescription());
        map.put("screenshotUrl", report.getScreenshotUrl());
        map.put("status", report.getStatus());
        map.put("reportedAt", formatTs(report.getReportedAt()));
        map.put("resolvedAt", formatTs(report.getResolvedAt()));
        map.put("resolutionNote", report.getResolutionNote());
        return map;
    }

    private static String formatTs(LocalDateTime value) {
        if (value == null) {
            return null;
        }
        return value.format(TS_FORMAT);
    }
}
