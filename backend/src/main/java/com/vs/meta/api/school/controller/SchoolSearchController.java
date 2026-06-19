package com.vs.meta.api.school.controller;

import com.vs.meta.api.school.service.SchoolSearchService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 학교 검색 — NEIS Open API 프록시. 검사 기본정보 입력의 학교 검색 모달이 호출.
 * 인증 필요(SecurityConfig 기본 anyRequest authenticated).
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "학교 검색 API", description = "NEIS 학교기본정보 검색 프록시")
@RequestMapping(value = "/api/v1/schools", produces = MediaType.APPLICATION_JSON_VALUE)
public class SchoolSearchController {

    private final SchoolSearchService schoolSearchService;

    @GetMapping("/search")
    @Operation(summary = "학교명 검색", description = "학교명 부분일치 검색(페이지네이션). keyword 1자 이상.")
    public ResponseDTO<CustomBody> search(
            @RequestParam("keyword") String keyword,
            @RequestParam(name = "page", defaultValue = "1") int page
    ) {
        Object resultData = schoolSearchService.search(keyword, page);
        return AidtCommonUtil.makeResultSuccess(null, resultData, "학교 검색 완료");
    }
}
