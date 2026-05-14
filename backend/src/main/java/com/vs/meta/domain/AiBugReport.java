package com.vs.meta.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiBugReport {

    private Long id;
    private Long conversationId;
    private Long messageId;
    private String errorType;
    private String severity;
    private String description;
    private String screenshotUrl;
    private String status;
    private Long reportedBy;
    private LocalDateTime reportedAt;
    private Long resolvedBy;
    private LocalDateTime resolvedAt;
    private String resolutionNote;

    // 조인 필드 (조회용)
    private String conversationTitle;
    private String conversationMode;
    private String conversationContextLabel;
    private String conversationContextData;
    private String messageContent;
    private String messageRole;
    private String reporterEmail;
    private String reporterNickname;
    private String resolverEmail;
    private String resolverNickname;
}
