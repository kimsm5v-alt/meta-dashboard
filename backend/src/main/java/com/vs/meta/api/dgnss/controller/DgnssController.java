package com.vs.meta.api.dgnss.controller;

import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.api.dgnss.service.DgnssService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@Tag(name = "대시보드 부가 기능 API", description = "META 자기조절학습")
@RequiredArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class DgnssController {
    private final DgnssService dgnssService;

    @RequestMapping(value = {"/api/dgnss/tc/info","/api/dgnss/tc/list"}, method = {RequestMethod.GET})
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
    @Parameter(name = "paperIdx", description = "시험지 정보",
            examples = {
                    @ExampleObject(name = "both", value = "1", description = "수학/영어 환경")
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

    @RequestMapping(value = "/api/dgnss/st/new", method = {RequestMethod.GET})
    @Operation(summary = "(학생)심리검사 새로하기", description = "")
    @Parameter(name = "dgnssResultId", description = "심리검사 상세 ID",
            examples = {
                    @ExampleObject(name = "math", value = "12509", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "2161", description = "영어 환경")
            })
    @Parameter(name = "paperIdx", description = "심리검사 종류",
            examples = {
                    @ExampleObject(name = "math", value = "1", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "2", description = "영어 환경")
            })
    @Parameter(name = "page", description = "페이지번호", required = false,
            examples = {
                    @ExampleObject(name = "both", value = "0", description = "수학/영어 환경")
            })
    @Parameter(name = "size", description = "페이지크기", required = false,
            examples = {
                    @ExampleObject(name = "both", value = "20", description = "수학/영어 환경")
            })
    public ResponseDTO<CustomBody> stMetaNew(
            @RequestParam(name = "dgnssResultId", required = false) int dgnssResultId,
            @RequestParam(name = "paperIdx", required = false, defaultValue = "0") int paperIdx,
            @Parameter(hidden = true) @PageableDefault(size = 20) Pageable pageable,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> resultMap = dgnssService.selectNewOmr(paramData, pageable);
        String resultMessage = "(학생)심리검사 새로하기";
        return AidtCommonUtil.makeResultSuccess(paramData, resultMap, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/st/submit", method = {RequestMethod.POST})
    @Operation(summary = "(학생)심리검사 제출", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "dgnssResultId": 1
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> stMetaSubmit(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssService.updateStSubmit(paramData);
        String resultMessage = "심리검사 제출";
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

    @RequestMapping(value = "/api/dgnss/pdf", method = {RequestMethod.POST})
    @Operation(summary = "자기조절학습 PDF 다운로드", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "userId": "mathbe2-s1",
                                "userType": "S",
                                "dgnssId": 184,
                                "answerIdx": 1161,
                                "ordNo": 1
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> metaPdfDownload(
            @RequestBody Map<String, Object> paramData,
            HttpServletRequest request
    ) throws Exception {
        Map<String, Object> result = dgnssService.pdfDownload(paramData, request);
        String resultMessage = "자기조절학습 PDF 다운로드";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/st/analysis", method = {RequestMethod.GET})
    @Operation(summary = "(학생) 학습심리정서검사 결과보기", description = "")
    @Parameter(name = "stdtId", description = "학생 ID",
            examples = {
                    @ExampleObject(name = "math", value = "rrmath016-s1", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "appleeng19-s2", description = "영어 환경")
            })
    @Parameter(name = "paperIdx", description = "심리검사 종류",
            examples = {
                    @ExampleObject(name = "both", value = "1", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "2", description = "영어 환경")
            })
    @Parameter(name = "ordNo", description = "현재 조회하는 회차",
            examples = {
                    @ExampleObject(name = "both", value = "1", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "1", description = "영어 환경")
            })
    @Parameter(name = "dgnssResultId", description = "심리검사 상세 ID",
            examples = {
                    @ExampleObject(name = "math", value = "1", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "1", description = "영어 환경")
            })
    public ResponseDTO<CustomBody> stMetaAnalysis(
            @RequestParam(name = "dgnssResultId", required = false) String dgnssResultId,
            @RequestParam(name = "paperIdx", required = false, defaultValue = "2") String paperIdx,
            @RequestParam(name = "ordNo", required = false, defaultValue = "1") String ordNo,
            @RequestParam(name = "stdtId", required = false) String stdtId,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssService.selectStAnalysis(paramData);
        String resultMessage = "(학생) 학습심리정서검사 결과보기";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @RequestMapping(value = {"/api/dgnss/tc/notsubm","/api/dgnss/tc/notsubm/list"}, method = {RequestMethod.GET})
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

    @RequestMapping(value = "/api/dgnss/tc/text/save", method = {RequestMethod.POST})
    @Operation(summary = "(선생님)학습심리정서검사 텍스트 저장", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "dgnssId": 882,
                                "dgnssText": "텍스트 내용"
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> tchTextUpdt(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssService.tcDgnssTextSave(paramData);
        String resultMessage = "(선생님)학습심리정서검사 텍스트 저장";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
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

    @GetMapping(path = "/api/dgnss/dgnss-download-all", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @Operation(summary = "학습심리정서검사 일괄다운로드", description = "")
    @ResponseBody
    public ResponseEntity<StreamingResponseBody> dgnssDownloadAll(
            @RequestParam(value = "jwtToken") String jwtToken,
            @RequestParam(value = "dgnssId") String dgnssId,
            @RequestParam(name = "type", required = false, defaultValue = "1") String type,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData,
            HttpServletRequest request) throws Exception {

        return dgnssService.dgnssDownloadAll(jwtToken, request, true, paramData);
    }

    @RequestMapping(value = "/api/dgnss/pdf/search", method = {RequestMethod.GET})
    @Operation(summary = "학습심리정서검사 일괄다운로드 전 학생 조회", description = "")
    @Parameter(name = "dgnssId", description = "심리검사 ID", schema = @Schema(type = "int", example = "1"))
    public ResponseDTO<CustomBody> dgnssPdfStudentSearch(
            @RequestParam(name = "dgnssId", required = false) int dgnssId,
            @RequestParam(name = "type", required = false, defaultValue = "1") String type,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssService.selectMakePdfTargetList(paramData);
        String resultMessage = "학습심리정서검사 일괄다운로드 전 학생 조회";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @PostMapping(value = {"/api/dgnss/st/answer", "/api/dgnss/stnt/answer/save"})
    @Operation(summary = "(학생)답 입력", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "omrIdx": 1,
                                "no": 1,
                                "answer": 1
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> updateStntAnswer(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        int result = dgnssService.updateStntAnswer(paramData);
        String resultMessage = "(학생)문제 풀이";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @PostMapping(value = "/api/dgnss/st/answer/random")
    @Operation(summary = "(학생)답안 무작위 일괄 입력", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "omrIdx": 1,
                                "paperIdx": 1
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> fillRandomAnswers(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssService.fillRandomAnswers(paramData);
        String resultMessage = "(학생)답안 무작위 일괄 입력";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @GetMapping(value = {"/api/dgnss/st/info", "/api/dgnss/stnt/list"})
    @Operation(summary = "(학생)학습심리정서검사 목록 조회", description = "")
    @Parameter(name = "claId", description = "클래스 ID",
            examples = {
                    @ExampleObject(name = "math", value = "eb1460dce8fc42889862e9a460beb4a0", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "121c5ae5a3074de38fec3374c5fccd38", description = "영어 환경")
            })
    @Parameter(name = "stdtId", description = "학생 ID",
            examples = {
                    @ExampleObject(name = "math", value = "rrmath016-s1", description = "수학 환경"),
                    @ExampleObject(name = "engl", value = "appleeng19-s2", description = "영어 환경")
            })
    public ResponseDTO<CustomBody> selectStntDgnssList(
            @RequestParam(name = "claId", required = false) String claId,
            @RequestParam(name = "stdtId", required = false) String stdtId,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        List<Map<String, Object>> resultList = dgnssService.selectStntDgnssList(paramData);
        String resultMessage = "(학생)학습심리정서검사 목록 조회";
        return AidtCommonUtil.makeResultSuccess(paramData, resultList, resultMessage);
    }

    @PostMapping(value = {"/api/dgnss/st/start", "/api/dgnss/stnt/start/update"})
    @Operation(summary = "(학생)META 자기조절학습 시작", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "dgnssResultId": 12509,
                                "paperIdx": 1,
                                "page": 0,
                                "size": 20
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> stMetaStart(
            @RequestBody Map<String, Object> paramData,
            @Parameter(hidden = true) @PageableDefault(size = 20) Pageable pageable
    ) throws Exception {
        Map<String, Object> resultMap = dgnssService.selectStDgnssStart(paramData, pageable);
        String resultMessage = "(학생)META 자기조절학습 시작";
        return AidtCommonUtil.makeResultSuccess(paramData, resultMap, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/summary/pdf", method = {RequestMethod.POST})
    @Operation(summary = "심리검사 요약본 업로드", description = "")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "answerIdx": 1
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> dgnssSummaryUpload(
            @RequestBody Map<String, Object> paramData,
            HttpServletRequest request
    ) throws Exception {
        Map<String, Object> result = dgnssService.summaryPdfUpload(paramData, request);
        String resultMessage = "심리검사 요약본 PDF 업로드";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }
}
