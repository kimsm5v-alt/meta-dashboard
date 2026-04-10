package com.vs.meta.domain;

import com.vs.meta.domain.enums.AiMessageRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiMessage {

    private Long id;
    private Long conversationId;
    private AiMessageRole role;
    private String content;
    private LocalDateTime messageAt;
    private Long createdBy;
    private LocalDateTime createdAt;
}
