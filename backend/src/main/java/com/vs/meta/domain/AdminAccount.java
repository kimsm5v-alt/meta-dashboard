package com.vs.meta.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAccount {

    private Long id;
    private String email;
    private String password;
    private String nickname;
    private String role;                 // SUPER_ADMIN / ADMIN
    private String status;               // ACTIVE / SUSPENDED
    private String mustChangePassword;   // Y / N (최초·초기화 후 변경 필요)
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
