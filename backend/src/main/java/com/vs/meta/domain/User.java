package com.vs.meta.domain;

import com.vs.meta.domain.enums.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    private Long userNo;
    private String spUserId;      // 슈퍼플랫폼 publicUserId (UUID)
    private String authProvider;  // 인증 제공자 (SSO)
    private String email;
    private String password;      // Step 3에서 제거 예정 (SSO 전환 완료 시)
    private String nickname;
    private String gender;
    private String roleCode;
    private String tcId;
    private String stdtId;
    private UserStatus status;
    private LocalDateTime lastLoginAt;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void assignTcId(String tcId) {
        if (this.tcId == null) {
            this.tcId = tcId;
            this.updatedBy = this.userNo;
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void assignStdtId(String stdtId) {
        if (this.stdtId == null) {
            this.stdtId = stdtId;
            this.updatedBy = this.userNo;
            this.updatedAt = LocalDateTime.now();
        }
    }

    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
        this.updatedBy = this.userNo;
        this.updatedAt = LocalDateTime.now();
    }
}
