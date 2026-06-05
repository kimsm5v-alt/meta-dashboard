package com.vs.meta.domain;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiConversation {

    private Long id;
    private Long ownerUserNo;
    private String title;
    private String mode;
    private String contextLabel;
    private String contextData;
    private String useYn;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastMessageAt;
    private Long messageCount;
}
