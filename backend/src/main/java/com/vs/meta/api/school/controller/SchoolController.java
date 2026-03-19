package com.vs.meta.api.school.controller;

import com.vs.meta.api.school.service.SchoolSyncService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@Tag(name = "학교 API", description = "학교 정보 파일 적재")
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class SchoolController {

    private final SchoolSyncService schoolSyncService;

    @PostMapping(value = "/school/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "학교 정보 파일 적재", description = "CSV/TSV 파일을 school_info 테이블에 upsert 합니다.")
    public ResponseDTO<CustomBody> importSchools(@RequestPart("file") MultipartFile file) throws Exception {
        Object resultData = schoolSyncService.importSchools(file);
        return AidtCommonUtil.makeResultSuccess(null, resultData, "학교 정보 적재 완료");
    }
}
