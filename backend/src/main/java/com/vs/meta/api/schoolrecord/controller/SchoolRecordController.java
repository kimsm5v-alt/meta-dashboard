package com.vs.meta.api.schoolrecord.controller;

import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.api.schoolrecord.service.SchoolRecordService;
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
@Tag(name = "생기부 API", description = "생활기록부 CRUD")
@AllArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class SchoolRecordController {

    private final SchoolRecordService schoolRecordService;
    private final AuthTcIdResolver authTcIdResolver;

    @GetMapping(value = "/api/school-records/student/{studentId}")
    @Operation(summary = "학생별 생기부 조회", description = "특정 학생의 생기부 중 본인이 작성한 건만 최신순으로 조회")
    @Parameter(name = "studentId", description = "학생 ID (stdt_id)", required = true,
            examples = @ExampleObject(value = "a1b2c3d4e5f67890abcdef1234567890"))
    public ResponseDTO<CustomBody> getSchoolRecordsByStudent(
            @PathVariable String studentId
    ) throws Exception {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("studentId", studentId);
        authTcIdResolver.enforceAuthTcId(paramData);
        Object resultData = schoolRecordService.getSchoolRecordsByStudent(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "생기부 목록 조회");
    }

    @PostMapping(value = "/api/school-records")
    @Operation(summary = "생기부 저장", description = "학생에 대한 생기부를 저장 (tcId는 JWT 토큰에서 자동 설정)")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "생기부저장", value =
                            "{\"studentId\":\"a1b2c3d4e5f67890abcdef1234567890\", \"classId\":\"abcd1234\", \"category\":\"comprehensive\", \"content\":\"학습에 대한 열의가 높고 자기주도적으로 학습 계획을 세우는 모습을 보임\"}")
            }))
    public ResponseDTO<CustomBody> createSchoolRecord(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        authTcIdResolver.enforceAuthTcId(paramData);
        Object resultData = schoolRecordService.createSchoolRecord(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "생기부 저장 완료");
    }

    @DeleteMapping(value = "/api/school-records/{id}")
    @Operation(summary = "생기부 삭제", description = "생기부를 삭제 (본인 작성 건만 삭제 가능)")
    public ResponseDTO<CustomBody> deleteSchoolRecord(
            @PathVariable Long id
    ) throws Exception {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("id", id);
        authTcIdResolver.enforceAuthTcId(paramData);
        String authTcId = (String) paramData.get("tcId");
        Long userNo = (Long) paramData.get("userNo");
        Object resultData = schoolRecordService.deleteSchoolRecord(id, authTcId, userNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "생기부 삭제 완료");
    }
}
