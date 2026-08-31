package com.vs.meta.api.dgnss.controller;

import com.vs.meta.api.dgnss.service.DgnssService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 학습심리검사 학생 API — 응시(시작/이어하기/답입력/제출/새로하기) + 결과 조회.
 * (교사 API 는 DgnssTeacherController, 그래프/운영은 DgnssGraphController)
 */
@Slf4j
@RestController
@Tag(name = "학습심리검사 학생 API", description = "학생 응시/결과 조회")
@RequiredArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class DgnssStudentController {

    private final DgnssService dgnssService;

    @RequestMapping(value = "/api/dgnss/st/new", method = {RequestMethod.GET})
    @Operation(summary = "(학생)심리검사 새로하기",
            description = "schoolName/schoolCode/grade/classNumber/gender/nickname을 함께 넘기면 st/start와 동일하게 tb_dgnss_result_info에 저장된다(전달된 값만). grade/classNumber는 숫자만 저장, gender는 'M'/'F'.")
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
            @RequestBody Map<String, Object> paramData,
            HttpServletRequest request
    ) throws Exception {
        Map<String, Object> result = dgnssService.updateStSubmit(paramData, request);
        String resultMessage = "심리검사 제출";
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
    @Parameter(name = "graphYn", description = "지식그래프 추천 포함 여부(Y/N, 기본 N)",
            examples = {
                    @ExampleObject(name = "off", value = "N", description = "지식그래프 조회 안함"),
                    @ExampleObject(name = "on", value = "Y", description = "지식그래프 조회 포함")
            })
    public ResponseDTO<CustomBody> stMetaAnalysis(
            @RequestParam(name = "dgnssResultId", required = false) String dgnssResultId,
            @RequestParam(name = "paperIdx", required = false, defaultValue = "2") String paperIdx,
            @RequestParam(name = "ordNo", required = false, defaultValue = "1") String ordNo,
            @RequestParam(name = "stdtId", required = false) String stdtId,
            @RequestParam(name = "claId", required = false) String claId,
            @RequestParam(name = "graphYn", required = false, defaultValue = "N") String graphYn,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssService.selectStAnalysis(paramData);
        String resultMessage = "(학생) 학습심리정서검사 결과보기";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @PostMapping(value = "/api/dgnss/st/answer")
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

    @GetMapping(value = "/api/dgnss/st/info")
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

    @PostMapping(value = "/api/dgnss/st/start")
    @Operation(summary = "(학생)META 자기조절학습 시작",
            description = "schoolName/grade/classNo/gender는 선택값. 교사 그룹정보 미입력 시 학생 입력값을 시작 시 1회만 전송하면 tb_dgnss_result_info에 저장된다(페이지 이동 호출에는 미전송 권장). gender는 'M'/'F'만 허용.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "dgnssResultId": 12509,
                                "paperIdx": 1,
                                "page": 0,
                                "size": 20,
                                "schoolName": "비상중학교",
                                "schoolCode": "B000012345",
                                "grade": "2",
                                "classNumber": "3",
                                "gender": "M",
                                "nickname": "홍길동"
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

    @GetMapping(value = "/api/dgnss/st/resume")
    @Operation(summary = "(학생)META 자기조절학습 이어하기 진입 정보",
            description = "중간에 종료한 학생이 이어하기 시 마지막으로 응답한 문항번호와 진입해야 할 페이지(0-base, 첫 페이지=0)를 반환한다. "
                    + "반환된 page 는 /api/dgnss/st/start 의 page(0-base)에 그대로 전달할 수 있다.")
    @Parameter(name = "dgnssResultId", description = "심리검사 상세 ID", required = true,
            examples = {
                    @ExampleObject(name = "학습종합", value = "12509", description = "학습종합검사"),
                    @ExampleObject(name = "META자기조절", value = "2161", description = "META자기조절검사")
            })
    @Parameter(name = "paperIdx", description = "심리검사 종류(1:학습종합, 2:META자기조절)", required = true,
            examples = {
                    @ExampleObject(name = "학습종합", value = "1", description = "학습종합검사"),
                    @ExampleObject(name = "META자기조절", value = "2", description = "META자기조절검사")
            })
    public ResponseDTO<CustomBody> stMetaResume(
            @RequestParam(name = "dgnssResultId") int dgnssResultId,
            @RequestParam(name = "paperIdx", required = false, defaultValue = "2") int paperIdx,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        if (dgnssResultId == 0) {
            return AidtCommonUtil.makeResultFail(paramData, null, "필수 파라미터 누락");
        }
        Map<String, Object> resultMap = dgnssService.selectStDgnssResume(paramData);
        String resultMessage = "(학생)META 자기조절학습 이어하기 진입 정보";
        return AidtCommonUtil.makeResultSuccess(paramData, resultMap, resultMessage);
    }
}
