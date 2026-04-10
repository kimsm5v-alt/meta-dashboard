package com.vs.meta.api.ai.controller;

import com.vs.meta.api.ai.service.AiConversationService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "AI Conversation API", description = "AI 어시스턴트 대화 저장/조회")
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class AiConversationController {

    private final AiConversationService aiConversationService;

    @PostMapping("/api/ai/conversations")
    @Operation(summary = "AI 대화방 생성", description = "mode/contextLabel 기반 대화방 생성 및 초기 메시지 저장")
    public ResponseDTO<CustomBody> createConversation(@RequestBody Map<String, Object> paramData) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Object resultData = aiConversationService.createConversation(paramData, userNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "AI 대화방 생성 완료");
    }

    @GetMapping("/api/ai/conversations")
    @Operation(summary = "AI 대화방 목록 조회", description = "현재 로그인 사용자의 대화방 목록 조회")
    public ResponseDTO<CustomBody> getConversations(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("page", page);
        paramData.put("size", size);

        Object resultData = aiConversationService.getConversations(userNo, page, size);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "AI 대화방 목록 조회");
    }

    @GetMapping("/api/ai/conversations/{conversationId}/messages")
    @Operation(summary = "AI 메시지 조회", description = "대화방 메시지 조회 (beforeMessageId 기반 페이징)")
    public ResponseDTO<CustomBody> getConversationMessages(
            @PathVariable Long conversationId,
            @RequestParam(value = "beforeMessageId", required = false) Long beforeMessageId,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("conversationId", conversationId);
        paramData.put("beforeMessageId", beforeMessageId);
        paramData.put("size", size);

        Object resultData = aiConversationService.getConversationMessages(conversationId, userNo, beforeMessageId, size);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "AI 메시지 조회");
    }

    @PostMapping("/api/ai/conversations/{conversationId}/messages")
    @Operation(summary = "AI 메시지 저장", description = "단건 또는 배열(messages) 형태로 메시지 저장")
    public ResponseDTO<CustomBody> addMessages(
            @PathVariable Long conversationId,
            @RequestBody Map<String, Object> paramData
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Map<String, Object> enriched = new HashMap<>(paramData);
        enriched.put("conversationId", conversationId);

        Object resultData = aiConversationService.addMessages(conversationId, paramData, userNo);
        return AidtCommonUtil.makeResultSuccess(enriched, resultData, "AI 메시지 저장 완료");
    }
}
