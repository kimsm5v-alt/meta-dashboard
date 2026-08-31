package com.vs.meta.api.dgnss.controller;

import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.api.dgnss.service.DgnssService;
import com.vs.meta.api.dgnss.service.ExamReminderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@Tag(name = "학습심리검사 교사 API", description = "교사 검사 관리·조회 (학생: DgnssStudentController, PDF/엑셀: DgnssPdfController, 그래프/운영: DgnssGraphController)")
@RequiredArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class DgnssTeacherController {
    private final DgnssService dgnssService;
    private final ExamReminderService examReminderService;

    @RequestMapping(value = "/api/dgnss/tc/info", method = {RequestMethod.GET})
    @Operation(summary = "(선생님) 학습심리정서검사 목록 조회", description = "")
    @Parameter(name = "claId", description = "학급 ID",
            examples = {
                    @ExampleObject(name = "math", value = "eb1460dce8fc42889862e9a460beb4a0", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "121c5ae5a3074de38fec3374c5fccd38", description = "영어 환경")
            })
    @Parameter(name = "tcId", description = "선생님 ID",
            examples = {
                    @ExampleObject(name = "math", value = "rrmath016-t", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "appleeng19-t", description = "영어 환경")
            })
    @Parameter(name = "paperIdx", description = "검사 유형(1:종합학습검사, 2:자기조절). 미전송/0 이면 1·2 모두 조회, 전송 시 해당 값만 조회",
            examples = {
                    @ExampleObject(name = "전체", value = "0", description = "1·2 모두"),
                    @ExampleObject(name = "종합", value = "1", description = "종합학습검사만"),
                    @ExampleObject(name = "자기조절", value = "2", description = "자기조절만")
            })
    public ResponseDTO<CustomBody> tchMetaInfo(
            @RequestParam(name = "claId", required = false) String claId,
            @RequestParam(name = "tcId", required = false) String tcId,
            @RequestParam(name = "paperIdx", required = false, defaultValue = "0") int paperIdx,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> resultMap = dgnssService.selectTcDgnssInfo(paramData);
        String resultMessage = "(선생님)학습심리정서검사 목록 조회";
        return AidtCommonUtil.makeResultSuccess(paramData, resultMap, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/tc/start", method = {RequestMethod.POST})
    @Operation(summary = "(선생님) 학습심리정서검사 시작(시작시 데이터 삽입)", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "claId": "eb1460dce8fc42889862e9a460beb4a0",
                                "tcId": "rrmath016-t",
                                "ordNo": 2,
                                "grade": "el",
                                "paperIdx": 1
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> tchMetaStart(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> resultMap = dgnssService.insertTcDgnssStart(paramData);
        String resultMessage = "(선생님) 학습심리정서검사 시작";
        return AidtCommonUtil.makeResultSuccess(paramData, resultMap, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/tc/start/preview", method = {RequestMethod.GET})
    @Operation(summary = "(교사) 학습심리정서검사 출제 사전 검증",
            description = "2회차 진입 직전 호출. 현재 학급 group_member 를 ELIGIBLE / BLOCKED_OTHER_CLASS / NO_HISTORY 로 분류하여 출제 가능 여부를 미리 알려준다. canStart=false 면 출제 불가.")
    @Parameter(name = "claId", description = "클래스 ID", required = true,
            examples = {
                    @ExampleObject(name = "math", value = "eb1460dce8fc42889862e9a460beb4a0", description = "수학 환경")
            })
    @Parameter(name = "paperIdx", description = "심리검사 종류 (1: 학습종합, 2: META자기조절)", required = true,
            examples = {
                    @ExampleObject(name = "meta", value = "2", description = "META 자기조절")
            })
    @Parameter(name = "ordNo", description = "검사 회차 (현재는 2회차 진입 시에만 호출됨)", required = true,
            examples = {
                    @ExampleObject(name = "ord2", value = "2", description = "2회차")
            })
    public ResponseDTO<CustomBody> tchMetaStartPreview(
            @RequestParam(name = "claId") String claId,
            @RequestParam(name = "paperIdx") int paperIdx,
            @RequestParam(name = "ordNo") int ordNo,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        if (StringUtils.isBlank(claId) || paperIdx <= 0) {
            return AidtCommonUtil.makeResultFail(paramData, null, "필수 파라미터 누락");
        }
        Map<String, Object> result = dgnssService.selectTcDgnssStartPreview(paramData);
        String resultMessage = "(교사) 학습심리정서검사 출제 사전 검증";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/tc/end", method = {RequestMethod.POST})
    @Operation(summary = "(선생님) 학습심리정서검사 종료", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "dgnssId": 1088
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> tchMetaEnd(
            @RequestBody Map<String, Object> paramData,
            HttpServletRequest request
    ) throws Exception {
        Map<String, Object> resultMap = dgnssService.updateTcDgnssEnd(paramData, request);
        String resultMessage = "(선생님) 학습심리정서검사 종료";
        return AidtCommonUtil.makeResultSuccess(paramData, resultMap, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/tc/cancel", method = {RequestMethod.POST})
    @Operation(summary = "(선생님)학습심리정서검사 취소", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "dgnssId": 1084
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> tchMetaCancel(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        dgnssService.deleteTcDgnssCancel(paramData);
        String resultMessage = "(선생님)학습심리정서검사 취소";
        return AidtCommonUtil.makeResultSuccess(paramData, null, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/tc/restart", method = {RequestMethod.POST})
    @Operation(summary = "(선생님)학습심리정서검사 재시작", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "dgnssId": 1084,
                                "claId": "eb1460dce8fc42889862e9a460beb4a0",
                                "grade": "el"
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> tchMetaRestart(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssService.tcDgnssRestart(paramData);
        String resultMessage = "(선생님)학습심리정서검사 재시작";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/tc/stinfolist", method = {RequestMethod.GET})
    @Operation(summary = "(교사) 대시보드 - 학생 목록", description = "")
    @Parameter(name = "dgnssId", description = "심리검사 ID",
            examples = {
                    @ExampleObject(name = "math", value = "882", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "211", description = "영어 환경")
            })
    @Parameter(name = "paperIdx", description = "심리검사 종류",
            examples = {
                    @ExampleObject(name = "both", value = "1", description = "수학/영어 환경")
            })
    @Parameter(name = "type", description = "타입(1:신뢰도, 2:동기전략, 3:인지전략, 4:행동전략)",
            examples = {
                    @ExampleObject(name = "math", value = "1", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "5", description = "영어 환경")
            })
    @Parameter(name = "testFlag", description = "테스트 플래그 YN", schema = @Schema(type = "string", example = "N"))
    public ResponseDTO<CustomBody> tcMetaStInfoList(
            @RequestParam(name = "dgnssId", required = false) int dgnssId,
            @RequestParam(name = "type", required = false) int type,
            @RequestParam(name = "paperIdx", required = false, defaultValue = "2") int paperIdx,
            @RequestParam(name = "testFlag", required = false, defaultValue = "N") String testFlag,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssService.selectStInfoList(paramData);
        String resultMessage = "대시보드 - 학생 목록";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/students/{studentId}/learning-status", method = {RequestMethod.GET})
    @Operation(summary = "(변화추적) 학생 회차별 학습현황",
            description = "학생(stdt_id)의 회차(ord_no)별 학습현황(LSANS01~05)을 고정 코드값으로 반환. "
                    + "기본 종합검사(paperIdx=1). 미응시/미제출 회차는 제외.")
    @Parameter(name = "studentId", description = "학생 stdt_id", example = "abc123")
    @Parameter(name = "claId", description = "학급 ID", example = "class-uuid")
    @Parameter(name = "paperIdx", description = "검사 유형(1=종합, 2=자기조절). 0/음수면 전체", example = "1")
    public ResponseDTO<CustomBody> studentLearningStatus(
            @PathVariable("studentId") String studentId,
            @RequestParam(name = "claId") String claId,
            @RequestParam(name = "paperIdx", required = false, defaultValue = "1") int paperIdx
    ) {
        var result = dgnssService.getStudentLearningStatus(studentId, claId, paperIdx);
        return AidtCommonUtil.makeResultSuccess(new HashMap<>(), result, "학생 회차별 학습현황");
    }

    @RequestMapping(value = "/api/dgnss/tc/reminder", method = {RequestMethod.POST})
    @Operation(summary = "(교사) 미제출 학생 독려 알림 발송",
            description = "dgnssId 기준으로 미제출 학생을 재조회해 학심정 내부 알림을 발송. "
                    + "담당교사·진행중 검증 후 발송. 결과 code: OK/NOT_FOUND/NOT_OWNER/NOT_IN_PROGRESS/NO_TARGET. "
                    + "재발송 제한은 FE 버튼 비활성화로 처리.")
    public ResponseDTO<CustomBody> sendUnsubmittedReminder(@RequestBody Map<String, Object> body) {
        int dgnssId = MapUtils.getInteger(body, "dgnssId", 0);
        if (dgnssId <= 0) {
            throw new IllegalArgumentException("dgnssId는 필수입니다.");
        }
        var result = examReminderService.sendUnsubmittedReminder(dgnssId);
        return AidtCommonUtil.makeResultSuccess(new HashMap<>(), result, "미제출 학생 독려 알림 발송");
    }

    @RequestMapping(value = "/api/dgnss/tc/submissions", method = {RequestMethod.GET})
    @Operation(summary = "(교사) 학생 제출 현황 목록",
            description = "dgnssId 기준 학급 학생들의 제출 여부(submAt Y/N)와 제출일시(submDt, 미제출 시 null)를 반환. "
                    + "학생 이름은 FE 가 stdtId 로 Auth 조회.")
    @Parameter(name = "dgnssId", description = "심리검사 ID", required = true, example = "1088")
    public ResponseDTO<CustomBody> tchMetaSubmissions(
            @RequestParam(name = "dgnssId") int dgnssId
    ) {
        if (dgnssId <= 0) {
            throw new IllegalArgumentException("dgnssId는 필수입니다.");
        }
        var result = dgnssService.selectTcSubmissions(dgnssId);
        return AidtCommonUtil.makeResultSuccess(new HashMap<>(), result, "학생 제출 현황 목록");
    }

    @RequestMapping(value = "/api/dgnss/tc/detail", method = {RequestMethod.GET})
    @Operation(summary = "(선생님)학습심리정서검사 상세 내용", description = "")
    @Parameter(name = "dgnssId", description = "심리검사 ID",
            examples = {
                    @ExampleObject(name = "math", value = "882", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "211", description = "영어 환경")
            })
    public ResponseDTO<CustomBody> tchMetaDetail(
            @RequestParam(name = "dgnssId", required = false) int dgnssId,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> resultMap = dgnssService.selectTcDgnssDetailInfo(paramData);
        String resultMessage = "학습심리정서검사 상세 내용";
        return AidtCommonUtil.makeResultSuccess(paramData, resultMap, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/tc/notsubm", method = {RequestMethod.GET})
    @Operation(summary = "(선생님)학습심리정서검사 미제출 인원 목록", description = "")
    @Parameter(name = "dgnssId", description = "심리검사 ID",
            examples = {
                    @ExampleObject(name = "math", value = "883", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "290", description = "영어 환경")
            })
    public ResponseDTO<CustomBody> tchMetaNotSubmSt(
            @RequestParam(name = "dgnssId", required = false) int dgnssId,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        List<Map<String, Object>> resultMap = dgnssService.selectTcDgnssNotSubmStList(paramData);
        String resultMessage = "학습심리정서검사 미제출 인원 목록";
        return AidtCommonUtil.makeResultSuccess(paramData, resultMap, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/tc/need", method = {RequestMethod.GET})
    @Operation(summary = "(교사)학습심리정서검사 상담 및 지도가 필요한 학생", description = "")
    @Parameter(name = "dgnssId", description = "진단평가 ID",
            examples = {
                    @ExampleObject(name = "math", value = "1088", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "211", description = "영어 환경")
            })
    @Parameter(name = "paperIdx", description = "진단평가 ID",
            examples = {
                    @ExampleObject(name = "both", value = "1", description = "수학/영어 환경")
            })
    public ResponseDTO<CustomBody> tcMetaNeed(
            @RequestParam(name = "dgnssId", required = false) int dgnssId,
            @RequestParam(name = "paperIdx", required = false, defaultValue = "2") int paperIdx,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        if (dgnssId == 0) {
            return AidtCommonUtil.makeResultFail(paramData,null, "필수 파라미터 누락");
        }
        Map<String, Object> result = dgnssService.selectTcNeedInfo(paramData);
        String resultMessage = "(교사)학습심리정서검사 상담 및 지도가 필요한 학생 전달";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/tc/analysis", method = {RequestMethod.GET})
    @Operation(summary = "(교사) 대시보드 - 학습심리검사 종합 분석", description = "")
    @Parameter(name = "claId", description = "클래스 ID", required = true,
            examples = {
                    @ExampleObject(name = "math", value = "eb1460dce8fc42889862e9a460beb4a0", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "121c5ae5a3074de38fec3374c5fccd38", description = "영어 환경")
            })
    @Parameter(name = "paperIdx", description = "심리검사 종류", required = true,
            examples = {
                    @ExampleObject(name = "math", value = "1", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "1", description = "영어 환경")
            })
    @Parameter(name = "ordNo", description = "현재 조회하는 회차", required = true,
            examples = {
                    @ExampleObject(name = "math", value = "1", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "1", description = "영어 환경")
            })
    public ResponseDTO<CustomBody> tcMetaStAnalysis(
            @RequestParam(name = "claId", required = false) String claId,
            @RequestParam(name = "paperIdx", required = false, defaultValue = "2") String paperIdx,
            @RequestParam(name = "ordNo", required = false, defaultValue = "2") String ordNo,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssService.selectTcAnalysis(paramData);
        String resultMessage = "(교사) 대시보드 - 종합 분석";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

}
