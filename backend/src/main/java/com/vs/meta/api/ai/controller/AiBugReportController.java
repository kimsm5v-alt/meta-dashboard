package com.vs.meta.api.ai.controller;

import com.vs.meta.api.ai.service.AiBugReportService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "AI Bug Report API", description = "AI 버그리포트 신고 및 관리")
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class AiBugReportController {

    private final AiBugReportService aiBugReportService;

    @PostMapping(value = "/api/ai/bug-reports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "버그리포트 생성", description = "AI 대화 중 발생한 이상 응답을 신고합니다")
    public ResponseDTO<CustomBody> createBugReport(
            @RequestParam("conversationId") Long conversationId,
            @RequestParam(value = "messageId", required = false) Long messageId,
            @RequestParam("errorType") String errorType,
            @RequestParam("severity") String severity,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "screenshot", required = false) MultipartFile screenshot
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("conversationId", conversationId);
        paramData.put("messageId", messageId);
        paramData.put("errorType", errorType);
        paramData.put("severity", severity);

        Object resultData = aiBugReportService.createBugReport(
                conversationId, messageId, errorType, severity, description, screenshot, userNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "버그리포트가 접수되었습니다");
    }

    @GetMapping("/api/ai/bug-reports/my")
    @Operation(summary = "내가 제보한 버그 목록", description = "특정 사용자가 제보한 버그리포트 목록을 조회합니다 (페이지당 5개)")
    public ResponseDTO<CustomBody> getMyBugReportList(
            @RequestParam("userNo") Long userNo,
            @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
            @RequestParam(value = "status", required = false) String status
    ) {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("userNo", userNo);
        paramData.put("page", page);
        paramData.put("status", status);

        Object resultData = aiBugReportService.getMyBugReportList(userNo, page, status);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "내 버그리포트 목록");
    }

    @GetMapping("/api/ai/bug-reports")
    @Operation(summary = "버그리포트 목록 조회", description = "버그리포트 목록을 페이징하여 조회합니다 (관리자)")
    public ResponseDTO<CustomBody> getBugReportList(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "errorType", required = false) String errorType,
            @RequestParam(value = "severity", required = false) String severity
    ) {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("page", page);
        paramData.put("size", size);
        paramData.put("status", status);
        paramData.put("errorType", errorType);
        paramData.put("severity", severity);

        Object resultData = aiBugReportService.getBugReportList(page, size, status, errorType, severity);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "버그리포트 목록");
    }

    @GetMapping("/api/ai/bug-reports/{id}")
    @Operation(summary = "버그리포트 상세 조회", description = "버그리포트 상세 정보를 조회합니다")
    public ResponseDTO<CustomBody> getBugReport(@PathVariable Long id) {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("id", id);

        Object resultData = aiBugReportService.getBugReport(id);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "버그리포트 상세");
    }

    @PatchMapping("/api/ai/bug-reports/{id}/status")
    @Operation(summary = "버그리포트 상태 변경", description = "버그리포트 처리 상태를 변경합니다 (관리자)")
    public ResponseDTO<CustomBody> updateBugReportStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        String status = request.get("status");
        String resolutionNote = request.get("resolutionNote");

        Map<String, Object> paramData = new HashMap<>();
        paramData.put("id", id);
        paramData.put("status", status);

        Object resultData = aiBugReportService.updateStatus(id, status, resolutionNote, userNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "버그리포트 상태가 변경되었습니다");
    }
}
