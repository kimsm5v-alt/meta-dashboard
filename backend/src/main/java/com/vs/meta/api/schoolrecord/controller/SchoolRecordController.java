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

    @GetMapping(value = "/api/school-records/class/{classId}")
    @Operation(summary = "생기부 작업본 리스트 조회(학급)",
            description = "학급 단위 경량 리스트 — 학생별 강점/보완 TOP3·작성상태·최근수정. observation_input 등 상세는 미포함. "
                    + "본인(tcId)이 작성한 종합의견 작업본만 반환.")
    @Parameter(name = "classId", description = "학급 ID (cla_id)", required = true)
    public ResponseDTO<CustomBody> getSchoolRecordDraftList(
            @PathVariable String classId
    ) throws Exception {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("classId", classId);
        authTcIdResolver.enforceAuthTcId(paramData);
        String tcId = (String) paramData.get("tcId");
        Object resultData = schoolRecordService.getDraftListByClass(classId, tcId);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "생기부 작업본 리스트 조회");
    }

    @GetMapping(value = "/api/school-records/student/{studentId}/draft")
    @Operation(summary = "생기부 작업본 상세 조회(학생 1명)",
            description = "학생 1명 작업본 전체(관찰입력·문구·이전문구 포함). 작업본이 없으면 resultData=null.")
    @Parameter(name = "studentId", description = "학생 ID (stdt_id)", required = true)
    public ResponseDTO<CustomBody> getSchoolRecordDraft(
            @PathVariable String studentId
    ) throws Exception {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("studentId", studentId);
        authTcIdResolver.enforceAuthTcId(paramData);
        String tcId = (String) paramData.get("tcId");
        Object resultData = schoolRecordService.getDraftByStudent(studentId, tcId);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "생기부 작업본 상세 조회");
    }

    @PostMapping(value = "/api/school-records/draft")
    @Operation(summary = "생기부 작업본 저장(UPSERT)",
            description = "생기부 작성 고도화 — 학생 1명 단위 작업본 저장. 학생당 1건(재저장 시 in-place 수정, 직전 문구는 previous_content 보존). "
                    + "tcId 는 JWT 에서 자동 설정. category 는 종합의견 단일 고정. 일괄 저장은 이 API 를 학생별로 반복 호출.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "작업본저장", value = """
                            {
                              "studentId": "a1b2c3d4e5f67890abcdef1234567890",
                              "classId": "abcd1234",
                              "status": "3",
                              "source": "3",
                              "content": "학습에 대한 열의가 높고 자기주도적으로 계획을 세우는 모습을 보임",
                              "strengths": ["자기효능감", "시간관리"],
                              "improvements": ["게임 과몰입"],
                              "observationInput": {
                                "observations": [{"factor": "자기효능감", "type": "strength", "behaviorCodes": ["b1", "b2"]}],
                                "freeText": "모둠 발표에서 자료를 스스로 정리해 발표함",
                                "counselingRefs": [123]
                              }
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> saveSchoolRecordDraft(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        authTcIdResolver.enforceAuthTcId(paramData);
        Object resultData = schoolRecordService.saveDraft(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "생기부 작업본 저장 완료");
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
