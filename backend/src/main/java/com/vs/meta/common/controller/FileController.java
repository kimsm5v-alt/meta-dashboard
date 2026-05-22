package com.vs.meta.common.controller;

import com.vs.meta.common.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 개인정보 포함 파일 다운로드 Controller
 * vlms-extra에서 이관
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "File API", description = "파일 다운로드 API")
@RequestMapping("/files")
public class FileController {

    private final FileService fileService;

    /**
     * 개인정보 포함된 파일 다운로드 처리
     * @param url 파일 URL
     * @param jwtToken JWT 토큰
     * @param pionadaYn 피어나다 여부
     * @param partnerActivityYn 짝꿍 활동 여부
     * @param request HttpServletRequest
     * @return 파일 리소스
     * @throws Exception
     */
    @Operation(summary = "개인정보 포함 파일 다운로드", description = "개인정보가 포함된 파일을 다운로드합니다.")
    @GetMapping(path = "/pfile-download", produces = {"application/octet-stream"})
    public ResponseEntity<Object> pfileDownload(
            @RequestParam("url") String url,
            @RequestParam(value = "jwtToken") String jwtToken,
            @RequestParam(value = "pionadaYn", required = false) String pionadaYn,
            @RequestParam(value = "partnerActivityYn", required = false) String partnerActivityYn,
            HttpServletRequest request) throws Exception {

        return fileService.downloadFile(url, jwtToken, request, true, pionadaYn, partnerActivityYn);
    }
}
