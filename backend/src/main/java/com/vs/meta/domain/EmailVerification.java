package com.vs.meta.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerification {

    private Long id;
    private String email;
    private String code;
    private Boolean verified;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
