package com.vs.meta.api.memo.controller;

import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.api.memo.service.MemoService;
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
@Tag(name = "관찰 메모 API", description = "학생 관찰 메모 CRUD")
@AllArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class MemoController {

    private final MemoService memoService;
    private final AuthTcIdResolver authTcIdResolver;

    @GetMapping(value = "/api/memos/student/{studentId}")
    @Operation(summary = "학생별 메모 조회", description = "특정 학생의 관찰 메모 목록을 최신순으로 조회")
    @Parameter(name = "studentId", description = "학생 ID (stdt_id)", required = true,
            examples = @ExampleObject(value = "viva-s-00000001"))
    public ResponseDTO<CustomBody> getMemosByStudent(
            @PathVariable String studentId
    ) throws Exception {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("studentId", studentId);
        Object resultData = memoService.getMemosByStudent(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "메모 목록 조회");
    }

    @PostMapping(value = "/api/memos")
    @Operation(summary = "메모 생성", description = "학생에 대한 관찰 메모를 생성 (tcId는 JWT 토큰에서 자동 설정)")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "메모생성", value =
                            "{\"studentId\":\"viva-s-00000001\", \"classId\":\"abcd1234\", \"date\":\"2026-03-11\", \"category\":\"behavior\", \"content\":\"수업 시간에 집중력이 좋았음\", \"isImportant\":false}")
            }))
    public ResponseDTO<CustomBody> createMemo(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        authTcIdResolver.enforceAuthTcId(paramData);
        Object resultData = memoService.createMemo(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "메모 생성 완료");
    }

    @PatchMapping(value = "/api/memos/{id}")
    @Operation(summary = "메모 수정", description = "관찰 메모를 부분 수정 (본인 작성 건만 수정 가능, tcId 자동 검증)")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "메모수정", value =
                            "{\"content\":\"수정된 메모 내용\", \"category\":\"academic\"}"),
                    @ExampleObject(name = "중요표시토글", value =
                            "{\"isImportant\":true}")
            }))
    public ResponseDTO<CustomBody> updateMemo(
            @PathVariable Long id,
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        authTcIdResolver.enforceAuthTcId(paramData);
        Object resultData = memoService.updateMemo(id, paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "메모 수정 완료");
    }

    @DeleteMapping(value = "/api/memos/{id}")
    @Operation(summary = "메모 삭제", description = "관찰 메모를 삭제 (본인 작성 건만 삭제 가능)")
    public ResponseDTO<CustomBody> deleteMemo(
            @PathVariable Long id
    ) throws Exception {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("id", id);
        authTcIdResolver.enforceAuthTcId(paramData);
        String authTcId = (String) paramData.get("tcId");
        Long userNo = (Long) paramData.get("userNo");
        Object resultData = memoService.deleteMemo(id, authTcId, userNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "메모 삭제 완료");
    }
}
