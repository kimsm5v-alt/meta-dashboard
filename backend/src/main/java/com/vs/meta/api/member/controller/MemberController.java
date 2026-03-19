package com.vs.meta.api.member.controller;

import com.vs.meta.api.member.service.MemberService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import javax.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@Tag(name = "회원 API", description = "회원 가입/로그인/조회/토큰갱신")
@AllArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class MemberController {

    private final MemberService memberService;

    @PostMapping(value = "/member/signup")
    @Operation(summary = "회원가입", description = "비밀번호 정책: 10~64자, 영문대/소/숫자/특수문자 중 2가지 이상, 동일문자 4회 연속 금지, 이메일 포함 금지")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "회원가입", value =
                            "{\"password\":\"Test1234!@\", \"email\":\"test@test.com\", \"nickname\":\"테스터\"}")
            }))
    public ResponseDTO<CustomBody> signup(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        Object resultData = memberService.createUser(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "회원가입 완료");
    }

    @PostMapping(value = "/member/login")
    @Operation(summary = "로그인 (비밀번호 확인 → 자체 JWT 발급)", description = "accessToken, refreshToken 반환")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "로그인", value =
                            "{\"email\":\"test@test.com\", \"password\":\"Test1234!@\"}")
            }))
    public ResponseDTO<CustomBody> login(
            @RequestBody Map<String, Object> paramData,
            HttpServletRequest request
    ) throws Exception {
        String deviceInfo = request.getHeader("User-Agent");
        String ipAddress = request.getRemoteAddr();
        Object resultData = memberService.login(
                (String) paramData.get("email"),
                (String) paramData.get("password"),
                deviceInfo, ipAddress
        );
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "로그인 성공");
    }

    @PostMapping(value = "/member/token/refresh")
    @Operation(summary = "토큰 갱신", description = "refreshToken으로 새 accessToken 발급. refreshToken 만료 시 재로그인 필요")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "토큰갱신", value =
                            "{\"refreshToken\":\"eyJ...\"}")
            }))
    public ResponseDTO<CustomBody> refreshToken(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        Object resultData = memberService.refreshToken((String) paramData.get("refreshToken"));
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "토큰 갱신 성공");
    }

    @PostMapping(value = "/member/logout")
    @Operation(summary = "로그아웃", description = "refreshToken 무효화 (DB에서 삭제)")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "로그아웃", value =
                            "{\"refreshToken\":\"eyJ...\"}")
            }))
    public ResponseDTO<CustomBody> logout(
            @RequestBody Map<String, Object> paramData
    ) {
        memberService.logout((String) paramData.get("refreshToken"));
        return AidtCommonUtil.makeResultSuccess(paramData, null, "로그아웃 완료");
    }

    @GetMapping(value = "/member/info")
    @Operation(summary = "회원 정보 조회", description = "tcId, stdtId, 상태, 최근 로그인 등 조회")
    public ResponseDTO<CustomBody> memberInfo(
            @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Long authUserNo = SecurityUtil.requireCurrentUserNo();
        paramData.put("userNo", authUserNo);
        Object resultData = memberService.findMemberInfo(authUserNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "회원 정보 조회");
    }
}
