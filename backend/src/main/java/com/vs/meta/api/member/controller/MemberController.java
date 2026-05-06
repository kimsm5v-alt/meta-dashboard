package com.vs.meta.api.member.controller;

import com.vs.meta.api.member.service.MemberService;
import com.vs.meta.api.sso.service.SsoUserMigrationService;
import com.vs.meta.api.sso.service.SsoUserQueryService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.domain.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@RestController
@Tag(name = "회원 API", description = "회원 정보 조회")
@AllArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class MemberController {

    private final MemberService memberService;
    private final SsoUserQueryService ssoUserQueryService;
    private final SsoUserMigrationService ssoUserMigrationService;

    // ── SSO 전환으로 제거된 엔드포인트 ──
    // POST /member/signup        → Auth 서버에서 가입
    // POST /member/login         → Auth 서버 SSO 로그인
    // POST /member/token/refresh → Auth 프록시 (/api/v1/auth/refresh)
    // POST /member/logout        → Auth 프록시 (/api/v1/auth/logout)

    @GetMapping(value = "/member/info")
    @Operation(summary = "회원 정보 조회", description = "현재 인증된 사용자의 학심정 서비스 정보 조회")
    public ResponseDTO<CustomBody> memberInfo(
            @AuthenticationPrincipal SpAuthenticatedUser spUser,
            @RequestParam Map<String, Object> paramData
    ) throws Exception {
        // SP 사용자 → 학심정 user 조회 (없으면 마이그레이션 매핑)
        User user = ssoUserQueryService.findBySpUserId(spUser.spUserId());
        if (user == null) {
            user = ssoUserMigrationService.migrateBySpUserId(spUser);
        }
        if (user == null) {
            throw new IllegalStateException("학심정에 등록되지 않은 사용자입니다. 추가 정보 입력이 필요합니다.");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userNo", user.getUserNo());
        result.put("spUserId", user.getSpUserId());
        result.put("email", user.getEmail());
        result.put("nickname", user.getNickname());
        result.put("roleCode", user.getRoleCode());
        result.put("tcId", user.getTcId());
        result.put("stdtId", user.getStdtId());
        result.put("status", user.getStatus());
        result.put("lastLoginAt", user.getLastLoginAt());

        return AidtCommonUtil.makeResultSuccess(paramData, result, "회원 정보 조회");
    }
}
