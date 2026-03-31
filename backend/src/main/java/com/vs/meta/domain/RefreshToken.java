package com.vs.meta.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    private Long id;
    private Long userNo;
    private String stdtId;
    private String tokenHash;
    private String deviceInfo;
    private String ipAddress;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
