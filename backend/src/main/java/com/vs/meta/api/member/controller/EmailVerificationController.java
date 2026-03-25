package com.vs.meta.api.member.controller;

import com.vs.meta.api.member.service.EmailVerificationService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@Tag(name = "이메일 인증 API", description = "회원가입/게스트참가 전 이메일 인증")
@AllArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping(value = "/member/send-code")
    @Operation(summary = "인증코드 발송", description = "이메일로 6자리 인증코드 발송 (5분 유효, 1분 재발송 제한)")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "인증코드발송", value =
                            "{\"email\":\"user@example.com\"}")
            }))
    public ResponseDTO<CustomBody> sendCode(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        emailVerificationService.sendCode((String) paramData.get("email"));
        return AidtCommonUtil.makeResultSuccess(paramData, null, "인증코드 발송 완료");
    }

    @PostMapping(value = "/member/verify-code")
    @Operation(summary = "인증코드 확인", description = "발송된 인증코드 검증")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "인증코드확인", value =
                            "{\"email\":\"user@example.com\", \"code\":\"482917\"}")
            }))
    public ResponseDTO<CustomBody> verifyCode(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        emailVerificationService.verifyCode(
                (String) paramData.get("email"),
                (String) paramData.get("code")
        );
        return AidtCommonUtil.makeResultSuccess(paramData, null, "인증 완료");
    }
}
