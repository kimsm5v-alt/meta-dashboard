package com.vs.meta.domain;

import com.vs.meta.common.auth.HasUserInfo;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupInvitation implements HasUserInfo {

    private Long id;
    private Long groupId;
    private String email;  // 초대받을 이메일 (invitee) — 유지 (회원/비회원 모두 가능)
    private String inviteCode;
    private String status;
    private Long sentBy;
    private String sentBySpUserId;  // 초대 발송자의 sp_user_id (Phase 3 initiator enrich)
    private LocalDateTime sentAt;
    private LocalDateTime expiresAt;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // HasUserInfo implementation — initiator(sent_by user)의 정보를 enrich
    private String senderName;     // UserInfoEnricher가 채움
    private String senderEmail;    // UserInfoEnricher가 채움

    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    @Override
    public String getSpUserId() {
        return sentBySpUserId;
    }

    @Override
    public void setName(String name) {
        this.senderName = name;
    }

    @Override
    public void setEmail(String email) {
        this.senderEmail = email;
    }
}
