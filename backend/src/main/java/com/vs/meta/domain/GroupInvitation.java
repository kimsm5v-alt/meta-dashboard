package com.vs.meta.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupInvitation {

    private Long id;
    private Long groupId;
    private String email;
    private String inviteCode;
    private String status;
    private Long sentBy;
    private LocalDateTime sentAt;
    private LocalDateTime expiresAt;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
}
