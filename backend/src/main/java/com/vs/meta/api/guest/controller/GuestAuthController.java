package com.vs.meta.api.guest.controller;

import com.vs.meta.api.guest.service.GuestAuthService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@Tag(name = "게스트 인증 API", description = "게스트 참가 여부 확인 / 재인증")
@RequiredArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class GuestAuthController {

    private final GuestAuthService guestAuthService;

    @GetMapping(value = "/guest/exists")
    @Operation(summary = "게스트 참가 여부 확인", description = "해당 그룹에 이 이메일로 참가한 게스트가 있는지 확인")
    @Parameter(name = "inviteCode", description = "그룹 초대코드", required = true, examples = @ExampleObject(value = "ABC123"))
    @Parameter(name = "email", description = "게스트 이메일", required = true, examples = @ExampleObject(value = "guest@test.com"))
    public ResponseDTO<CustomBody> checkGuestExists(
            @RequestParam String inviteCode,
            @RequestParam String email
    ) throws Exception {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("inviteCode", inviteCode);
        paramData.put("email", email);
        Object resultData = guestAuthService.checkGuestExists(inviteCode, email);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "게스트 참가 여부 확인");
    }

    @PostMapping(value = "/guest/auth")
    @Operation(summary = "게스트 재인증", description = "이메일 인증 후 게스트 토큰 재발급 (토큰 불필요)")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "게스트재인증", value =
                            "{\"inviteCode\":\"ABC123\", \"email\":\"guest@test.com\"}")
            }))
    public ResponseDTO<CustomBody> authenticateGuest(
            @RequestBody Map<String, Object> paramData,
            HttpServletRequest request
    ) throws Exception {
        String inviteCode = (String) paramData.get("inviteCode");
        String email = (String) paramData.get("email");
        String deviceInfo = request.getHeader("User-Agent");
        String ipAddress = request.getRemoteAddr();

        Object resultData = guestAuthService.authenticateGuest(inviteCode, email, deviceInfo, ipAddress);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "게스트 재인증 완료");
    }
}
