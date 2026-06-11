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
    private String roleCode;
    private String tcId;
    private String stdtId;
    private UserStatus status;
    /**
     * Y=그룹 동기화가 선제 생성한 행 (학심정 미로그인, 보유 근거=그룹 멤버십).
     * 첫 로그인 시 N 전환, 멤버십 소멸 시 일간 재동기화가 행 삭제. (group-from-idp 02 §7)
     */
    private String provisioned;
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
