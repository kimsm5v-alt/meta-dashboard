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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "AI Conversation API", description = "AI conversation save and query")
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class AiConversationController {

    private final AiConversationService aiConversationService;

    @PostMapping("/api/ai/conversations")
    @Operation(summary = "Create AI conversation", description = "Create conversation and optionally save initial messages")
    public ResponseDTO<CustomBody> createConversation(@RequestBody Map<String, Object> paramData) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Object resultData = aiConversationService.createConversation(paramData, userNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "AI conversation created");
    }

    @GetMapping("/api/ai/conversations")
    @Operation(summary = "List AI conversations", description = "List conversations owned by current user")
    public ResponseDTO<CustomBody> getConversations(
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("page", page);
        paramData.put("size", size);

        Object resultData = aiConversationService.getConversations(userNo, page, size);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "AI conversation list");
    }

    @GetMapping("/api/ai/conversations/{conversationId}/messages")
    @Operation(summary = "Get AI messages", description = "Load conversation messages with cursor pagination")
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
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "AI message list");
    }

    @PostMapping("/api/ai/conversations/{conversationId}/messages")
    @Operation(summary = "Save AI messages", description = "Save single message or array payload")
    public ResponseDTO<CustomBody> addMessages(
            @PathVariable Long conversationId,
            @RequestBody Map<String, Object> paramData
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Map<String, Object> enriched = new HashMap<>(paramData);
        enriched.put("conversationId", conversationId);

        Object resultData = aiConversationService.addMessages(conversationId, paramData, userNo);
        return AidtCommonUtil.makeResultSuccess(enriched, resultData, "AI messages saved");
    }

    @PostMapping("/api/ai/conversations/{conversationId}/title")
    @Operation(summary = "Update AI conversation title", description = "Rename conversation title (owner only)")
    public ResponseDTO<CustomBody> updateConversationTitle(
            @PathVariable Long conversationId,
            @RequestBody Map<String, Object> paramData
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Map<String, Object> enriched = new HashMap<>(paramData);
        enriched.put("conversationId", conversationId);

        Object resultData = aiConversationService.updateTitle(conversationId, paramData, userNo);
        return AidtCommonUtil.makeResultSuccess(enriched, resultData, "AI conversation title updated");
    }

    @PostMapping("/api/ai/conversations/{conversationId}/delete")
    @Operation(summary = "Delete AI conversation", description = "Soft delete conversation by setting useYn to N")
    public ResponseDTO<CustomBody> deleteConversation(@PathVariable Long conversationId) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("conversationId", conversationId);

        Object resultData = aiConversationService.deleteConversation(conversationId, userNo);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "AI conversation deleted");
    }
}
