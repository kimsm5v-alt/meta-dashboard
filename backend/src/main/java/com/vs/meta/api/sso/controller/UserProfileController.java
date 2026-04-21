package com.vs.meta.api.sso.controller;

import com.vs.meta.api.sso.service.SsoUserService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.domain.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * SSO 최초 로그인 후 추가 정보 입력 API.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/api/v1/user", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "SSO 사용자 프로필", description = "SSO 최초 로그인 시 추가 정보 입력")
public class UserProfileController {

    private final SsoUserService ssoUserService;

    /**
     * 추가 정보 입력 (성별 + 역할).
     * SSO 최초 로그인 후 학심정 user가 없을 때 호출.
     */
    @PostMapping("/complete-profile")
    @Operation(summary = "추가 정보 입력", description = "SSO 최초 로그인 시 성별/역할 입력 → 학심정 user 생성")
    public ResponseDTO<CustomBody> completeProfile(
            @AuthenticationPrincipal SpAuthenticatedUser spUser,
            @RequestBody Map<String, String> body
    ) {
        String gender = body.get("gender");
        if (gender == null || (!gender.equals("M") && !gender.equals("F"))) {
            throw new IllegalArgumentException("성별은 M 또는 F만 허용됩니다.");
        }

        String roleCode = body.get("roleCode"); // userType=UNSET일 때만 필수

        User user = ssoUserService.createUser(spUser, gender, roleCode);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userNo", user.getUserNo());
        result.put("spUserId", user.getSpUserId());
        result.put("roleCode", user.getRoleCode());
        result.put("tcId", user.getTcId());
        result.put("stdtId", user.getStdtId());

        return AidtCommonUtil.makeResultSuccess(null, result, "프로필 등록 완료");
    }

    /**
     * 현재 SSO 사용자의 학심정 등록 상태 확인.
     * 학심정 user가 있으면 사용자 정보 반환, 없으면 needsProfile=true.
     */
    @GetMapping("/status")
    @Operation(summary = "사용자 등록 상태 확인", description = "학심정에 user가 있는지 확인")
    public ResponseDTO<CustomBody> status(@AuthenticationPrincipal SpAuthenticatedUser spUser) {
        User user = ssoUserService.findAndSyncUser(spUser);

        Map<String, Object> result = new LinkedHashMap<>();
        if (user != null) {
            result.put("registered", true);
            result.put("userNo", user.getUserNo());
            result.put("roleCode", user.getRoleCode());
            result.put("tcId", user.getTcId());
            result.put("stdtId", user.getStdtId());
            result.put("needsProfile", false);
        } else {
            result.put("registered", false);
            result.put("needsProfile", true);
            // userType이 UNSET이면 역할 선택도 필요
            result.put("needsRoleSelection", "UNSET".equals(spUser.userType()));
        }

        return AidtCommonUtil.makeResultSuccess(null, result, "상태 확인");
    }
}
