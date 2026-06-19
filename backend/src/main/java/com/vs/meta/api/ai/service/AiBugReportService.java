package com.vs.meta.api.ai.service;

import com.vs.meta.api.ai.dto.AiBugReportDto;
import com.vs.meta.api.ai.mapper.AiBugReportMapper;
import com.vs.meta.api.ai.mapper.AiConversationMapper;
import com.vs.meta.common.auth.UserInfoEnricher;
import com.vs.meta.common.auth.UserSlot;
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
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiBugReportService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final int MY_BUG_REPORT_PAGE_SIZE = 5;

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
    private final UserInfoEnricher userInfoEnricher;

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

        enrichReportUserInfo(bugReport);
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

        enrichReportsUserInfo(reports);

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

    /**
     * 특정 사용자가 제보한 버그 목록 조회 (페이지당 5개)
     */
    @Transactional(readOnly = true)
    public Object getMyBugReportList(Long userNo, Integer page, String status) {
        if (userNo == null) {
            throw new IllegalArgumentException("userNo is required.");
        }

        int resolvedPage = page == null || page < 1 ? 1 : page;
        int offset = (resolvedPage - 1) * MY_BUG_REPORT_PAGE_SIZE;

        // 상태 필터 유효성 검사
        String normalizedStatus = trimToNull(status);
        if (normalizedStatus != null && !VALID_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid status. Valid values: " + VALID_STATUSES);
        }

        List<AiBugReport> reports = aiBugReportMapper.selectMyBugReportList(
                userNo, normalizedStatus, MY_BUG_REPORT_PAGE_SIZE, offset);
        long totalCount = aiBugReportMapper.countMyBugReports(userNo, normalizedStatus);
        int totalPages = (int) Math.ceil((double) totalCount / MY_BUG_REPORT_PAGE_SIZE);

        List<Map<String, Object>> items = new ArrayList<>();
        for (AiBugReport report : reports) {
            items.add(AiBugReportDto.toMyBugReportItemResponse(report));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("page", resolvedPage);
        result.put("size", MY_BUG_REPORT_PAGE_SIZE);
        result.put("totalCount", totalCount);
        result.put("totalPages", totalPages);
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
        enrichReportUserInfo(updatedReport);
        return AiBugReportDto.toDetailResponse(updatedReport);
    }

    /**
     * Phase 3 enrich: 단건 report의 reporter/resolver 사용자 정보 보충
     */
    private void enrichReportUserInfo(AiBugReport report) {
        if (report == null) return;
        enrichReportsUserInfo(List.of(report));
    }

    /**
     * Phase 3 enrich: 배치 reports의 reporter/resolver 사용자 정보 보충
     * reporter와 resolver 각각에 대해 Map-patching 수행
     */
    private void enrichReportsUserInfo(List<AiBugReport> reports) {
        if (reports == null || reports.isEmpty()) return;

        // Reporter 정보 보충
        enrichReporters(reports);

        // Resolver 정보 보충
        enrichResolvers(reports);
    }

    /**
     * Reporter 정보 보충: reporterSpUserId → reporterNickname, reporterEmail
     */
    private void enrichReporters(List<AiBugReport> reports) {
        List<UserSlot> slots = reports.stream()
                .map(AiBugReport::getReporterSpUserId)
                .filter(Objects::nonNull)
                .distinct()
                .map(UserSlot::new)
                .toList();
        if (slots.isEmpty()) return;

        userInfoEnricher.enrich(slots);

        Map<String, UserSlot> bySpUserId = slots.stream()
                .collect(Collectors.toMap(UserSlot::getSpUserId, s -> s));
        reports.forEach(r -> {
            String spUserId = r.getReporterSpUserId();
            if (spUserId == null) return;
            UserSlot slot = bySpUserId.get(spUserId);
            if (slot != null) {
                r.setReporterNickname(slot.getName());
                r.setReporterEmail(slot.getEmail());
            } else {
                r.setReporterNickname("(탈퇴 회원)");
                r.setReporterEmail(null);
            }
        });
    }

    /**
     * Resolver 정보 보충: resolverSpUserId → resolverNickname, resolverEmail
     */
    private void enrichResolvers(List<AiBugReport> reports) {
        List<UserSlot> slots = reports.stream()
                .map(AiBugReport::getResolverSpUserId)
                .filter(Objects::nonNull)
                .distinct()
                .map(UserSlot::new)
                .toList();
        if (slots.isEmpty()) return;

        userInfoEnricher.enrich(slots);

        Map<String, UserSlot> bySpUserId = slots.stream()
                .collect(Collectors.toMap(UserSlot::getSpUserId, s -> s));
        reports.forEach(r -> {
            String spUserId = r.getResolverSpUserId();
            if (spUserId == null) return;
            UserSlot slot = bySpUserId.get(spUserId);
            if (slot != null) {
                r.setResolverNickname(slot.getName());
                r.setResolverEmail(slot.getEmail());
            } else {
                r.setResolverNickname("(탈퇴 회원)");
                r.setResolverEmail(null);
            }
        });
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
