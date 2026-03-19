package com.vs.meta.api.guest.controller;

import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.api.guest.service.GuestService;
import com.vs.meta.common.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@Tag(name = "게스트 전환 API", description = "게스트 기록 조회 / 게스트 → 회원 전환")
@AllArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class GuestController {

    private final GuestService guestService;

    @GetMapping(value = "/guest/check")
    @Operation(summary = "게스트 이메일 매칭 확인", description = "회원가입 시 해당 이메일로 참가한 게스트 기록이 있는지 조회")
    @Parameter(name = "email", description = "회원가입 이메일", required = true,
            examples = @ExampleObject(value = "guest@test.com"))
    public ResponseDTO<CustomBody> checkGuestRecords(
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Object resultData = guestService.findGuestRecordsByEmail(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "게스트 기록 조회");
    }

    @PostMapping(value = "/guest/convert")
    @Operation(summary = "게스트 → 회원 전환", description = "게스트 검사 결과를 회원으로 합산 여부 선택 가능")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "게스트전환", value =
                            "{\"memberId\":1, \"mergeYn\":\"Y\", \"email\":\"guest@test.com\", \"guestStdtId\":\"viva-s-00000001\"}")
            }))
    public ResponseDTO<CustomBody> convertGuest(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        paramData.put("userNo", SecurityUtil.requireCurrentUserNo());
        Object resultData = guestService.convertGuestToMember(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "게스트 전환 완료");
    }
}
