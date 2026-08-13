package com.vs.meta.api.permission.controller;

import com.vs.meta.api.permission.service.PaperPermissionService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;

/**
 * 검사 유형(paperIdx) 권한 API.
 * 현재 로그인 사용자의 종합/자기조절 허용 여부를 반환한다(FE 메뉴·토글 노출 판단용).
 */
@Slf4j
@RestController
@Tag(name = "검사 유형 권한 API", description = "계정별 종합(paperIdx=1)/자기조절(paperIdx=2) 검사 권한")
@RequiredArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class PaperPermissionController {

    private final PaperPermissionService paperPermissionService;

    @GetMapping("/api/dgnss/paper-permission/me")
    @Operation(summary = "(내) 검사 유형 권한 조회",
            description = "현재 로그인 사용자의 검사 유형 권한을 반환한다. { comprehensive, selfreg } (기본: 종합만 허용). "
                    + "FE 는 두 값에 따라 메뉴/토글 노출을 결정한다.")
    public ResponseDTO<CustomBody> myPaperPermission() {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Object resultData = paperPermissionService.getPermissions(userNo);
        return AidtCommonUtil.makeResultSuccess(new HashMap<>(), resultData, "검사 유형 권한 조회");
    }
}
