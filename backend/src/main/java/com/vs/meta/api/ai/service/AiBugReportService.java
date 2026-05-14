package com.vs.meta.api.ai.service;

import com.vs.meta.api.ai.dto.AiBugReportDto;
import com.vs.meta.api.ai.mapper.AiBugReportMapper;
import com.vs.meta.api.ai.mapper.AiConversationMapper;
import com.vs.meta.common.service.NcpStorageService;
import com.vs.meta.domain.AiBugReport;
import com.vs.meta.domain.AiConversation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiBugReportService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private static final Set<String> VALID_ERROR_TYPES = Set.of(
            "hallucination", "data_mismatch", "missing_info", "sensitive", "ui_bug", "other"
    );

    private static final Set<String> VALID_SEVERITIES = Set.of(
            "critical", "high", "medium", "low"
    );

    private static final Set<String> VALID_STATUSES = Set.of(
            "pending", "reviewing", "resolved", "dismissed"
    );

    private final AiBugReportMapper aiBugReportMapper;
    private final AiConversationMapper aiConversationMapper;
    private final NcpStorageService ncpStorageService;

    @Transactional
    public Object createBugReport(Long conversationId, Long messageId, String errorType, String severity,
                                  String description, MultipartFile screenshot, Long userNo) {
        // Validation
        if (conversationId == null) {
            throw new IllegalArgumentException("conversationId is required.");
        }

        // 대화방 존재 여부 확인
        AiConversation conversation = aiConversationMapper.findConversationByIdAndOwner(conversationId, userNo);
        if (conversation == null) {
            throw new IllegalStateException("conversation not found or no permission. id=" + conversationId);
        }

        if (errorType == null || errorType.isBlank()) {
            throw new IllegalArgumentException("errorType is required.");
        }
        if (!VALID_ERROR_TYPES.contains(errorType)) {
            throw new IllegalArgumentException("Invalid errorType. Valid values: " + VALID_ERROR_TYPES);
        }

        if (severity == null || severity.isBlank()) {
            throw new IllegalArgumentException("severity is required.");
        }
        if (!VALID_SEVERITIES.contains(severity)) {
            throw new IllegalArgumentException("Invalid severity. Valid values: " + VALID_SEVERITIES);
        }

        // 스크린샷 업로드
        String screenshotUrl = null;
        if (screenshot != null && !screenshot.isEmpty()) {
            try {
                screenshotUrl = ncpStorageService.uploadBugReportImage(screenshot);
            } catch (IOException e) {
                log.error("스크린샷 업로드 실패", e);
                throw new IllegalStateException("스크린샷 업로드에 실패했습니다.");
            }
        }

        // 버그리포트 생성
        AiBugReport bugReport = AiBugReport.builder()
                .conversationId(conversationId)
                .messageId(messageId)
                .errorType(errorType)
                .severity(severity)
                .description(trimToNull(description))
                .screenshotUrl(screenshotUrl)
                .status("pending")
                .reportedBy(userNo)
                .reportedAt(LocalDateTime.now())
                .build();

        aiBugReportMapper.insertBugReport(bugReport);
        log.info("버그리포트 생성 완료: id={}, conversationId={}, messageId={}, errorType={}",
                bugReport.getId(), conversationId, messageId, errorType);

        return AiBugReportDto.toResponse(bugReport);
    }

    @Transactional(readOnly = true)
    public Object getBugReport(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("id is required.");
        }

        AiBugReport bugReport = aiBugReportMapper.selectBugReportDetail(id);
        if (bugReport == null) {
            throw new IllegalStateException("bug report not found. id=" + id);
        }

        return AiBugReportDto.toDetailResponse(bugReport);
    }

    @Transactional(readOnly = true)
    public Object getBugReportList(Integer page, Integer size, String status,
                                   String errorType, String severity) {
        int resolvedPage = page == null || page < 0 ? 0 : page;
        int resolvedSize = resolvePageSize(size);
        int offset = resolvedPage * resolvedSize;

        // 필터 유효성 검사
        if (status != null && !status.isBlank() && !VALID_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Invalid status. Valid values: " + VALID_STATUSES);
        }
        if (errorType != null && !errorType.isBlank() && !VALID_ERROR_TYPES.contains(errorType)) {
            throw new IllegalArgumentException("Invalid errorType. Valid values: " + VALID_ERROR_TYPES);
        }
        if (severity != null && !severity.isBlank() && !VALID_SEVERITIES.contains(severity)) {
            throw new IllegalArgumentException("Invalid severity. Valid values: " + VALID_SEVERITIES);
        }

        String normalizedStatus = trimToNull(status);
        String normalizedErrorType = trimToNull(errorType);
        String normalizedSeverity = trimToNull(severity);

        List<AiBugReport> reports = aiBugReportMapper.selectBugReportList(
                normalizedStatus, normalizedErrorType, normalizedSeverity, resolvedSize, offset);
        long totalCount = aiBugReportMapper.countBugReports(
                normalizedStatus, normalizedErrorType, normalizedSeverity);

        List<Map<String, Object>> items = new ArrayList<>();
        for (AiBugReport report : reports) {
            items.add(AiBugReportDto.toListItemResponse(report));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("page", resolvedPage);
        result.put("size", resolvedSize);
        result.put("totalCount", totalCount);
        return result;
    }

    @Transactional
    public Object updateStatus(Long id, String status, String resolutionNote, Long userNo) {
        if (id == null) {
            throw new IllegalArgumentException("id is required.");
        }
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("status is required.");
        }
        if (!VALID_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Invalid status. Valid values: " + VALID_STATUSES);
        }

        // 존재 여부 확인
        AiBugReport existingReport = aiBugReportMapper.selectBugReportById(id);
        if (existingReport == null) {
            throw new IllegalStateException("bug report not found. id=" + id);
        }

        int affected = aiBugReportMapper.updateBugReportStatus(id, status, trimToNull(resolutionNote), userNo);
        if (affected <= 0) {
            throw new IllegalStateException("Failed to update bug report status. id=" + id);
        }

        log.info("버그리포트 상태 변경: id={}, status={}, resolvedBy={}", id, status, userNo);

        // 변경된 데이터 조회 후 반환
        AiBugReport updatedReport = aiBugReportMapper.selectBugReportDetail(id);
        return AiBugReportDto.toDetailResponse(updatedReport);
    }

    private int resolvePageSize(Integer requested) {
        if (requested == null || requested <= 0) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(requested, MAX_PAGE_SIZE);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
