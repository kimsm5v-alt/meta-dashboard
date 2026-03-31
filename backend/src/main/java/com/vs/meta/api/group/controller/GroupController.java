package com.vs.meta.api.group.controller;

import com.vs.meta.api.group.service.GroupInvitationService;
import com.vs.meta.api.group.service.GroupService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.utils.PageUtil;
import com.vs.meta.common.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@Tag(name = "그룹 API", description = "그룹 생성/참가/조회/관리")
@AllArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class GroupController {

    private final GroupService groupService;
    private final GroupInvitationService groupInvitationService;

    @PostMapping(value = "/group/create")
    @Operation(summary = "그룹 생성", description = "방장 역할, tc_id lazy 채번")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "그룹생성", value =
                            "{\"groupNm\":\"6학년 2반\", \"schoolLevel\":\"elementary\", \"grade\":\"6\", \"classNumber\":2, \"schoolName\":\"비상초등학교\", \"groupDesc\":\"설명\"}")
            }))
    public ResponseDTO<CustomBody> createGroup(@RequestBody Map<String, Object> paramData) throws Exception {
        paramData.put("userNo", SecurityUtil.requireCurrentUserNo());
        Object resultData = groupService.createGroup(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "그룹 생성 완료");
    }

    @PostMapping(value = "/group/join")
    @Operation(summary = "그룹 참가 회원(STUDENT)", description = "초대코드로 참가, stdt_id lazy 채번")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "회원참가", value =
                            "{\"inviteCode\":\"ABC123\"}")
            }))
    public ResponseDTO<CustomBody> joinGroup(@RequestBody Map<String, Object> paramData) throws Exception {
        paramData.put("userNo", SecurityUtil.requireCurrentUserNo());
        Object resultData = groupService.joinGroupAsPlayer(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "그룹 참가 완료");
    }

    @PostMapping(value = "/group/join-guest")
    @Operation(summary = "그룹 참가 게스트(GUEST)", description = "비회원 참가, 매번 새 stdt_id 채번")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "게스트참가", value =
                            "{\"inviteCode\":\"ABC123\", \"nickname\":\"게스트\", \"email\":\"guest@test.com\", \"gender\":\"M\"}")
            }))
    public ResponseDTO<CustomBody> joinGroupAsGuest(@RequestBody Map<String, Object> paramData) throws Exception {
        Object resultData = groupService.joinGroupAsGuest(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "게스트 참가 완료");
    }

    @GetMapping(value = "/group/list")
    @Operation(summary = "내 그룹 목록 조회", description = "방장/플레이어 모두 포함, 전체 목록 반환")
    public ResponseDTO<CustomBody> groupList(
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        paramData.put("userNo", SecurityUtil.requireCurrentUserNo());
        Object resultData = groupService.findGroupList(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "그룹 목록 조회");
    }

    @GetMapping(value = "/group/detail")
    @Operation(summary = "그룹 상세 조회", description = "그룹 정보와 멤버 목록 포함")
    @Parameter(name = "claId", description = "학급 ID (UUID)", required = true, examples = @ExampleObject(value = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"))
    public ResponseDTO<CustomBody> groupDetail(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        paramData.put("userNo", SecurityUtil.requireCurrentUserNo());
        Object resultData = groupService.findGroupDetail(paramData, page, size);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "그룹 상세 조회");
    }

    @GetMapping(value = "/group/invite")
    @Operation(summary = "초대코드로 그룹 조회", description = "참가 전 그룹 정보를 미리 조회")
    @Parameter(name = "code", description = "초대 코드 (6자리)", required = true, examples = @ExampleObject(value = "ABC123"))
    public ResponseDTO<CustomBody> findGroupByInviteCode(@Parameter(hidden = true) @RequestParam Map<String, Object> paramData) throws Exception {
        paramData.put("userNo", SecurityUtil.requireCurrentUserNo());
        Object resultData = groupService.findGroupByInviteCode(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "초대코드 그룹 조회");
    }

    @PutMapping(value = "/group/update")
    @Operation(summary = "그룹 수정", description = "방장만 그룹명, 설명, 학교명을 수정할 수 있습니다")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "그룹수정", value =
                            "{\"claId\":\"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6\", \"groupNm\":\"수정된 그룹명\", \"groupDesc\":\"수정된 설명\", \"schoolName\":\"비상초등학교\"}")
            }))
    public ResponseDTO<CustomBody> updateGroup(@RequestBody Map<String, Object> paramData) throws Exception {
        paramData.put("userNo", SecurityUtil.requireCurrentUserNo());
        Object resultData = groupService.updateGroup(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "그룹 수정 완료");
    }

    @PostMapping(value = "/group/member/leave")
    @Operation(summary = "그룹 멤버 탈퇴")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "탈퇴", value = "{\"memberId\":7}")
            }))
    public ResponseDTO<CustomBody> leaveGroup(@RequestBody Map<String, Object> paramData) throws Exception {
        paramData.put("userNo", SecurityUtil.requireCurrentUserNo());
        Object resultData = groupService.leaveGroup(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "그룹 탈퇴 완료");
    }

    @PostMapping(value = "/group/member/kick")
    @Operation(summary = "그룹 멤버 강퇴", description = "방장 전용")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "강퇴", value = "{\"memberId\":7}")
            }))
    public ResponseDTO<CustomBody> kickMember(@RequestBody Map<String, Object> paramData) throws Exception {
        paramData.put("hostUserNo", SecurityUtil.requireCurrentUserNo());
        Object resultData = groupService.kickMember(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "멤버 강퇴 완료");
    }

    @DeleteMapping(value = "/group/delete")
    @Operation(summary = "그룹 삭제", description = "방장 전용")
    @Parameter(name = "claId", description = "학급 ID (UUID)", required = true, examples = @ExampleObject(value = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"))
    public ResponseDTO<CustomBody> deleteGroup(@Parameter(hidden = true) @RequestParam Map<String, Object> paramData) throws Exception {
        paramData.put("userNo", SecurityUtil.requireCurrentUserNo());
        Object resultData = groupService.deleteGroup(paramData);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "그룹 삭제 완료");
    }

    // ===== 이메일 초대 =====

    @PostMapping(value = "/group/invite/email")
    @Operation(summary = "이메일 초대 발송", description = "방장 전용, 7일 유효")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "초대발송", value =
                            "{\"claId\":\"a1b2c3d4e5f67890abcdef1234567890\", \"email\":\"student@test.com\"}")
            }))
    public ResponseDTO<CustomBody> sendInvitation(@RequestBody Map<String, Object> paramData) throws Exception {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        String claId = (String) paramData.get("claId");
        String email = (String) paramData.get("email");
        Object resultData = groupInvitationService.sendInvitation(claId, email, userNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "초대 발송 완료");
    }

    @GetMapping(value = "/group/invite/list")
    @Operation(summary = "초대 목록 조회", description = "방장 전용")
    @Parameter(name = "claId", description = "학급 ID (UUID)", required = true, examples = @ExampleObject(value = "a1b2c3d4e5f67890abcdef1234567890"))
    public ResponseDTO<CustomBody> getInvitationList(@RequestParam String claId) throws Exception {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        List<Map<String, Object>> resultData = groupInvitationService.getInvitationList(claId, userNo);
        Map<String, Object> paramData = Map.of("claId", claId);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "초대 목록 조회");
    }

    @DeleteMapping(value = "/group/invite/{invitationId}")
    @Operation(summary = "초대 취소", description = "방장 전용")
    public ResponseDTO<CustomBody> cancelInvitation(@PathVariable Long invitationId) throws Exception {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        groupInvitationService.cancelInvitation(invitationId, userNo);
        Map<String, Object> paramData = Map.of("invitationId", invitationId);
        return AidtCommonUtil.makeResultSuccess(paramData, null, "초대 취소 완료");
    }
}
