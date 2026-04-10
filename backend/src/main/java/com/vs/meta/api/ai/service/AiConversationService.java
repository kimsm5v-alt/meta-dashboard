package com.vs.meta.api.ai.service;

import com.vs.meta.api.ai.mapper.AiConversationMapper;
import com.vs.meta.domain.AiConversation;
import com.vs.meta.domain.AiMessage;
import com.vs.meta.domain.enums.AiContextMode;
import com.vs.meta.domain.enums.AiMessageRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiConversationService {

    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;
    private static final int DEFAULT_MESSAGE_SIZE = 50;
    private static final int MAX_MESSAGE_SIZE = 200;

    private final AiConversationMapper aiConversationMapper;

    @Transactional
    public Object createConversation(Map<String, Object> paramData, Long userNo) {
        String mode = AiContextMode.from((String) paramData.get("mode")).toApiValue();
        String contextLabel = trimToNull((String) paramData.get("contextLabel"));
        if (contextLabel == null) {
            throw new IllegalArgumentException("contextLabel is required.");
        }

        String title = trimToNull((String) paramData.get("title"));
        if (title == null) {
            title = "새 대화";
        }

        LocalDateTime now = LocalDateTime.now();
        AiConversation conversation = AiConversation.builder()
                .ownerUserNo(userNo)
                .title(title)
                .mode(mode)
                .contextLabel(contextLabel)
                .useYn("Y")
                .createdBy(userNo)
                .updatedBy(userNo)
                .createdAt(now)
                .updatedAt(now)
                .lastMessageAt(now)
                .build();
        aiConversationMapper.insertConversation(conversation);

        List<Map<String, Object>> insertedMessages = appendMessages(conversation, paramData.get("messages"), userNo);
        if (!insertedMessages.isEmpty()) {
            maybeUpdateTitleFromFirstUserMessage(conversation, insertedMessages, userNo);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("conversation", toConversationMap(conversation));
        result.put("messages", insertedMessages);
        return result;
    }

    @Transactional(readOnly = true)
    public Object getConversations(Long userNo, Integer page, Integer size) {
        int resolvedPage = page == null || page < 0 ? 0 : page;
        int resolvedSize = resolvePageSize(size, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
        int offset = resolvedPage * resolvedSize;

        List<AiConversation> conversations = aiConversationMapper.findConversationsByOwner(userNo, resolvedSize, offset);
        long totalCount = aiConversationMapper.countConversationsByOwner(userNo);

        List<Map<String, Object>> items = new ArrayList<>();
        for (AiConversation conversation : conversations) {
            Map<String, Object> item = toConversationMap(conversation);
            item.put("messageCount", aiConversationMapper.countMessagesByConversation(conversation.getId()));
            items.add(item);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("items", items);
        result.put("page", resolvedPage);
        result.put("size", resolvedSize);
        result.put("totalCount", totalCount);
        return result;
    }

    @Transactional(readOnly = true)
    public Object getConversationMessages(Long conversationId, Long userNo, Long beforeMessageId, Integer size) {
        AiConversation conversation = requireOwnedConversation(conversationId, userNo);
        int resolvedSize = resolvePageSize(size, DEFAULT_MESSAGE_SIZE, MAX_MESSAGE_SIZE);

        List<AiMessage> rows = aiConversationMapper.findMessagesByConversation(conversationId, beforeMessageId, resolvedSize);
        Collections.reverse(rows);

        List<Map<String, Object>> messages = new ArrayList<>();
        for (AiMessage message : rows) {
            messages.add(toMessageMap(message));
        }

        Long nextBeforeMessageId = null;
        if (!rows.isEmpty()) {
            nextBeforeMessageId = rows.get(0).getId();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("conversation", toConversationMap(conversation));
        result.put("messages", messages);
        result.put("nextBeforeMessageId", nextBeforeMessageId);
        result.put("size", resolvedSize);
        return result;
    }

    @Transactional
    public Object addMessages(Long conversationId, Map<String, Object> paramData, Long userNo) {
        AiConversation conversation = requireOwnedConversation(conversationId, userNo);
        Object payload = paramData.containsKey("messages") ? paramData.get("messages") : paramData;

        List<Map<String, Object>> insertedMessages = appendMessages(conversation, payload, userNo);
        if (insertedMessages.isEmpty()) {
            throw new IllegalArgumentException("messages is empty.");
        }

        maybeUpdateTitleFromFirstUserMessage(conversation, insertedMessages, userNo);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("conversation", toConversationMap(conversation));
        result.put("messages", insertedMessages);
        return result;
    }

    private List<Map<String, Object>> appendMessages(AiConversation conversation, Object payload, Long userNo) {
        List<Map<String, Object>> normalized = normalizeMessages(payload);
        List<Map<String, Object>> inserted = new ArrayList<>();
        LocalDateTime latestMessageAt = conversation.getLastMessageAt();

        for (Map<String, Object> item : normalized) {
            AiMessageRole role = AiMessageRole.from((String) item.get("role"));
            String content = trimToNull((String) item.get("content"));
            if (content == null) {
                throw new IllegalArgumentException("content is required.");
            }

            LocalDateTime messageAt = parseTimestamp((String) item.get("timestamp"));
            if (messageAt == null) {
                messageAt = LocalDateTime.now();
            }

            AiMessage message = AiMessage.builder()
                    .conversationId(conversation.getId())
                    .role(role)
                    .content(content)
                    .messageAt(messageAt)
                    .createdBy(userNo)
                    .createdAt(LocalDateTime.now())
                    .build();

            aiConversationMapper.insertMessage(message);
            inserted.add(toMessageMap(message));

            if (latestMessageAt == null || latestMessageAt.isBefore(messageAt)) {
                latestMessageAt = messageAt;
            }
        }

        if (latestMessageAt != null) {
            aiConversationMapper.updateConversationLastMessageAt(conversation.getId(), userNo, latestMessageAt);
            conversation.setLastMessageAt(latestMessageAt);
            conversation.setUpdatedAt(LocalDateTime.now());
            conversation.setUpdatedBy(userNo);
        }

        return inserted;
    }

    private List<Map<String, Object>> normalizeMessages(Object payload) {
        if (payload == null) {
            return Collections.emptyList();
        }

        if (payload instanceof List<?>) {
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object raw : (List<?>) payload) {
                if (!(raw instanceof Map<?, ?> rawMap)) {
                    throw new IllegalArgumentException("each message must be an object.");
                }
                result.add(castToStringObjectMap(rawMap));
            }
            return result;
        }

        if (payload instanceof Map<?, ?> rawMap) {
            return Collections.singletonList(castToStringObjectMap(rawMap));
        }

        throw new IllegalArgumentException("messages must be an object or array.");
    }

    private void maybeUpdateTitleFromFirstUserMessage(AiConversation conversation,
                                                      List<Map<String, Object>> insertedMessages,
                                                      Long userNo) {
        if (conversation.getTitle() != null && !"새 대화".equals(conversation.getTitle())) {
            return;
        }

        for (Map<String, Object> message : insertedMessages) {
            if ("user".equals(message.get("role"))) {
                String userContent = (String) message.get("content");
                String derivedTitle = deriveTitle(userContent);
                aiConversationMapper.updateConversationTitle(conversation.getId(), userNo, derivedTitle);
                conversation.setTitle(derivedTitle);
                return;
            }
        }
    }

    private String deriveTitle(String content) {
        if (content == null || content.isBlank()) {
            return "새 대화";
        }
        String normalized = content.replace('\n', ' ').trim();
        if (normalized.length() <= 30) {
            return normalized;
        }
        return normalized.substring(0, 30) + "...";
    }

    private AiConversation requireOwnedConversation(Long conversationId, Long userNo) {
        if (conversationId == null) {
            throw new IllegalArgumentException("conversationId is required.");
        }
        AiConversation conversation = aiConversationMapper.findConversationByIdAndOwner(conversationId, userNo);
        if (conversation == null) {
            throw new IllegalStateException("conversation not found or no permission. id=" + conversationId);
        }
        return conversation;
    }

    private int resolvePageSize(Integer requested, int defaultValue, int maxValue) {
        if (requested == null || requested <= 0) {
            return defaultValue;
        }
        return Math.min(requested, maxValue);
    }

    private Map<String, Object> toConversationMap(AiConversation conversation) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", conversation.getId());
        map.put("title", conversation.getTitle());
        map.put("mode", conversation.getMode());
        map.put("contextLabel", conversation.getContextLabel());
        map.put("createdAt", formatTs(conversation.getCreatedAt()));
        map.put("updatedAt", formatTs(conversation.getUpdatedAt()));
        map.put("lastMessageAt", formatTs(conversation.getLastMessageAt()));
        return map;
    }

    private Map<String, Object> toMessageMap(AiMessage message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", message.getId());
        map.put("role", message.getRole().name());
        map.put("content", message.getContent());
        map.put("timestamp", formatTs(message.getMessageAt()));
        return map;
    }

    private String formatTs(LocalDateTime value) {
        if (value == null) {
            return null;
        }
        return value.format(TS_FORMAT);
    }

    private LocalDateTime parseTimestamp(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value, TS_FORMAT);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("timestamp must be yyyy-MM-dd HH:mm:ss");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Map<String, Object> castToStringObjectMap(Map<?, ?> source) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : source.entrySet()) {
            map.put(String.valueOf(entry.getKey()), entry.getValue());
        }
        return map;
    }
}
