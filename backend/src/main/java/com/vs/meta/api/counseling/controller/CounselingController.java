package com.vs.meta.api.counseling.controller;

import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.api.counseling.service.CounselingService;
import com.vs.meta.common.utils.AuthTcIdResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@Tag(name = "상담 API", description = "상담 일정/기록 CRUD + 상태 관리")
@AllArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class CounselingController {

    private final CounselingService counselingService;
    private final AuthTcIdResolver authTcIdResolver;

    @GetMapping(value = "/api/counseling")
    @Operation(summary = "전체 상담 기록 조회", description = "모든 상담 기록을 조회")
    public ResponseDTO<CustomBody> getAll(
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Object resultData = counselingService.getAll(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "상담 목록 조회");
    }

    @GetMapping(value = "/api/counseling/student/{studentId}")
    @Operation(summary = "학생별 상담 기록 조회", description = "특정 학생의 상담 기록을 조회")
    @Parameter(name = "studentId", description = "학생 ID (stdt_id)", required = true,
            examples = @ExampleObject(value = "viva-s-00000001"))
    public ResponseDTO<CustomBody> getByStudentId(
            @PathVariable String studentId
    ) throws Exception {
        Map<String, Object> paramData = Map.of("studentId", studentId);
        Object resultData = counselingService.getByStudentId(studentId);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "학생별 상담 조회");
    }

    @GetMapping(value = "/api/counseling/class/{classId}")
    @Operation(summary = "학급별 상담 기록 조회", description = "특정 학급의 상담 기록을 조회")
    @Parameter(name = "classId", description = "학급 ID (cla_id)", required = true,
            examples = @ExampleObject(value = "abcd1234"))
    public ResponseDTO<CustomBody> getByClassId(
            @PathVariable String classId
    ) throws Exception {
        Map<String, Object> paramData = Map.of("classId", classId);
        Object resultData = counselingService.getByClassId(classId);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "학급별 상담 조회");
    }

    @GetMapping(value = "/api/counseling/status/{status}")
    @Operation(summary = "상태별 상담 기록 조회", description = "scheduled/completed/cancelled 별 조회")
    @Parameter(name = "status", description = "상담 상태", required = true,
            examples = @ExampleObject(value = "scheduled"))
    public ResponseDTO<CustomBody> getByStatus(
            @PathVariable String status
    ) throws Exception {
        Map<String, Object> paramData = Map.of("status", status);
        Object resultData = counselingService.getByStatus(status);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "상태별 상담 조회");
    }

    @GetMapping(value = "/api/counseling/{id}")
    @Operation(summary = "단일 상담 기록 조회", description = "특정 상담 기록을 조회")
    public ResponseDTO<CustomBody> getById(
            @PathVariable Long id
    ) throws Exception {
        Map<String, Object> paramData = Map.of("id", id);
        Object resultData = counselingService.getById(id);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "상담 상세 조회");
    }

    @PostMapping(value = "/api/counseling")
    @Operation(summary = "상담 기록 생성", description = "상담 일정/기록을 생성 (tcId는 JWT 토큰에서 자동 설정)")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "상담생성", value =
                            "{\"classId\":\"abcd1234\", \"scheduledAt\":\"2026-03-12 14:30\", \"types\":[\"regular\"], \"areas\":[\"academic\",\"emotion\"], \"methods\":[\"face-to-face\"], \"status\":\"scheduled\", \"reason\":\"학업 부진 상담\", \"students\":[{\"id\":\"viva-s-00000001\",\"name\":\"학생1\",\"number\":1,\"classId\":\"abcd1234\"}]}")
            }))
    public ResponseDTO<CustomBody> create(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        authTcIdResolver.enforceAuthTcId(paramData);
        Object resultData = counselingService.create(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "상담 생성 완료");
    }

    @PatchMapping(value = "/api/counseling/{id}")
    @Operation(summary = "상담 기록 수정", description = "상담 기록을 부분 수정 (본인 작성 건만 수정 가능)")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "상담수정", value =
                            "{\"scheduledAt\":\"2026-03-13 10:00\", \"areas\":[\"academic\",\"career\"]}")
            }))
    public ResponseDTO<CustomBody> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        authTcIdResolver.enforceAuthTcId(paramData);
        Object resultData = counselingService.update(id, paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "상담 수정 완료");
    }

    @PostMapping(value = "/api/counseling/{id}/complete")
    @Operation(summary = "상담 완료 처리", description = "예정 상담을 완료 처리 (본인 작성 건만 가능, duration/summary 필수)")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "상담완료", value =
                            "{\"duration\":30, \"summary\":\"학업 부진 원인 파악, 학습 계획 수립\", \"nextSteps\":\"2주 후 후속 상담\"}")
            }))
    public ResponseDTO<CustomBody> complete(
            @PathVariable Long id,
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        authTcIdResolver.enforceAuthTcId(paramData);
        Object resultData = counselingService.complete(id, paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "상담 완료 처리");
    }

    @PostMapping(value = "/api/counseling/{id}/cancel")
    @Operation(summary = "상담 취소", description = "상담을 취소 처리 (본인 작성 건만 가능)")
    public ResponseDTO<CustomBody> cancel(
            @PathVariable Long id
    ) throws Exception {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("id", id);
        authTcIdResolver.enforceAuthTcId(paramData);
        String authTcId = (String) paramData.get("tcId");
        Long userNo = (Long) paramData.get("userNo");
        Object resultData = counselingService.cancel(id, authTcId, userNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "상담 취소 완료");
    }

    @DeleteMapping(value = "/api/counseling/{id}")
    @Operation(summary = "상담 기록 삭제", description = "상담 기록을 삭제 (본인 작성 건만 가능)")
    public ResponseDTO<CustomBody> delete(
            @PathVariable Long id
    ) throws Exception {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("id", id);
        authTcIdResolver.enforceAuthTcId(paramData);
        String authTcId = (String) paramData.get("tcId");
        Long userNo = (Long) paramData.get("userNo");
        Object resultData = counselingService.delete(id, authTcId, userNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "상담 삭제 완료");
    }
}
