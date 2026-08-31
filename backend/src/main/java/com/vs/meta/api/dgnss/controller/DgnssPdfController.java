package com.vs.meta.api.dgnss.controller;

import com.vs.meta.api.dgnss.mapper.DgnssMapper;
import com.vs.meta.api.dgnss.service.DgnssService;
import com.vs.meta.common.exception.ValidationException;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * 학습심리검사 PDF/엑셀 API — 개별/요약 PDF, 일괄 ZIP, 샘플 엑셀 다운로드·응답 업로드.
 * (교사: DgnssTeacherController, 학생: DgnssStudentController, 그래프/운영: DgnssGraphController)
 */
@Slf4j
@RestController
@Tag(name = "학습심리검사 PDF/엑셀 API", description = "PDF 다운로드/업로드 · 샘플 엑셀")
@RequiredArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class DgnssPdfController {

    private final DgnssService dgnssService;
    private final DgnssMapper dgnssMapper;

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

    @GetMapping(path = "/api/dgnss/dgnss-download-all")
    @Operation(summary = "학습심리정서검사 일괄다운로드",
            description = "대상 PDF 들을 zip 으로 묶어 NAS 에 저장하고 tb_dgnss_info 의 type 별 zip URL 컬럼에 등록한 뒤 "
                    + "다운로드 URL 을 반환합니다. 이미 생성된 zip 이 있으면 그 URL 을 즉시 반환합니다. "
                    + "반환된 URL 은 /pfile-download 로 다운로드합니다(이어받기 지원).")
    public ResponseDTO<CustomBody> dgnssDownloadAll(
            @RequestParam(value = "jwtToken") String jwtToken,
            @RequestParam(value = "dgnssId") String dgnssId,
            @Parameter(name = "type", description = "다운로드 타입(1: 상세 보고서, 2: 요약 보고서, 3: 상세+요약 폴더 압축)")
            @RequestParam(name = "type", required = false, defaultValue = "1") String type,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData,
            HttpServletRequest request) throws Exception {
        try {
            String zipFileUrl = dgnssService.createDgnssDownloadAllZip(request, true, paramData);
            Map<String, Object> result = new HashMap<>();
            result.put("zipFileUrl", zipFileUrl);
            return AidtCommonUtil.makeResultSuccess(paramData, result, "학습심리정서검사 일괄다운로드");
        } catch (Exception e) {
            log.error("dgnss-download-all API 오류: dgnssId={}, type={}, requesterIp={}",
                    dgnssId,
                    type,
                    request != null ? request.getRemoteAddr() : "",
                    e);
            throw e;
        }
    }

    @RequestMapping(value = "/api/dgnss/pdf/search", method = {RequestMethod.GET})
    @Operation(summary = "학습심리정서검사 일괄다운로드 전 학생 조회", description = "")
    @Parameter(name = "dgnssId", description = "심리검사 ID", schema = @Schema(type = "int", example = "1"))
    public ResponseDTO<CustomBody> dgnssPdfStudentSearch(
            @RequestParam(name = "dgnssId", required = false) int dgnssId,
            @Parameter(name = "type", description = "생성 대상 타입(1: file_url 미생성, 2: summary_file_url 미생성, 3: 둘 중 하나라도 미생성)")
            @RequestParam(name = "type", required = false, defaultValue = "1") String type,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssService.selectMakePdfTargetList(paramData);
        String resultMessage = "학습심리정서검사 일괄다운로드 전 학생 조회";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
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

    @GetMapping(value = "/api/dgnss/tc/sample-excel",
            produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @Operation(summary = "(교사) 검사 응답 입력용 샘플 엑셀 다운로드", description = "검사별 학생 목록과 응답 입력란이 포함된 엑셀 파일을 다운로드합니다.")
    @Parameter(name = "dgnssId", description = "검사 ID", required = true,
            examples = {
                    @ExampleObject(name = "example", value = "1088", description = "검사 ID")
            })
    public ResponseEntity<byte[]> downloadSampleExcel(
            @RequestParam("dgnssId") int dgnssId
    ) throws Exception {
        byte[] excelBytes = dgnssService.generateSampleExcel(dgnssId);

        // 파일명 생성을 위한 검사 정보 조회
        Map<String, Object> dgnssInfo = dgnssMapper.selectDgnssInfoForExcelFilename(dgnssId);
        String groupName = dgnssInfo != null ? String.valueOf(dgnssInfo.get("groupName")) : "그룹";
        String ordNo = dgnssInfo != null ? String.valueOf(dgnssInfo.get("ordNo")) : "1";

        // 파일명: {그룹이름}_{회차}_샘플.xlsx
        String filename = groupName + "_" + ordNo + "_샘플.xlsx";
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + encodedFilename + "\"; filename*=UTF-8''" + encodedFilename)
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelBytes);
    }

    @PostMapping(value = "/api/dgnss/tc/upload-answers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "(교사) 엑셀 기반 응답값 일괄 업데이트", description = "샘플 엑셀에 입력된 응답값을 일괄 업데이트합니다. 유효성 검증 실패 시 전체 롤백됩니다.")
    @Parameter(name = "dgnssId", description = "검사 ID", required = true,
            examples = {
                    @ExampleObject(name = "example", value = "1088", description = "검사 ID")
            })
    public ResponseDTO<CustomBody> uploadAnswers(
            @RequestParam("dgnssId") int dgnssId,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("dgnssId", dgnssId);

        try {
            Map<String, Object> result = dgnssService.uploadAnswersFromExcel(dgnssId, file, request);
            String resultMessage = "응답값이 업데이트되고 검사가 종료되었습니다";
            return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
        } catch (ValidationException e) {
            log.warn("엑셀 업로드 유효성 검증 실패: dgnssId={}, errors={}", dgnssId, e.getErrors());
            Map<String, Object> errorData = new HashMap<>();
            errorData.put("errors", e.getErrors());
            return AidtCommonUtil.makeResultFail(paramData, errorData, e.getMessage());
        } catch (Exception e) {
            log.error("엑셀 업로드 처리 중 오류: dgnssId={}", dgnssId, e);
            return AidtCommonUtil.makeResultFail(paramData, null, "파일 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
