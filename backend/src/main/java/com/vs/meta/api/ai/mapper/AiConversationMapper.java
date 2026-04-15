package com.vs.meta.api.ai.mapper;

import com.vs.meta.domain.AiConversation;
import com.vs.meta.domain.AiMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface AiConversationMapper {

    void insertConversation(AiConversation conversation);

    AiConversation findConversationByIdAndOwner(@Param("id") Long id, @Param("ownerUserNo") Long ownerUserNo);

    List<AiConversation> findConversationsByOwner(@Param("ownerUserNo") Long ownerUserNo,
                                                  @Param("limit") int limit,
                                                  @Param("offset") int offset);

    long countConversationsByOwner(@Param("ownerUserNo") Long ownerUserNo);

    void insertMessage(AiMessage message);

    List<AiMessage> findMessagesByConversation(@Param("conversationId") Long conversationId,
                                               @Param("beforeMessageId") Long beforeMessageId,
                                               @Param("limit") int limit);

    void updateConversationLastMessageAt(@Param("id") Long id,
                                         @Param("updatedBy") Long updatedBy,
                                         @Param("lastMessageAt") LocalDateTime lastMessageAt);

    void updateConversationTitle(@Param("id") Long id,
                                 @Param("updatedBy") Long updatedBy,
                                 @Param("title") String title);

    int softDeleteConversation(@Param("id") Long id,
                               @Param("updatedBy") Long updatedBy);
}
