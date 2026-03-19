package com.vs.meta.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestConversionLog {

    private Long id;
    private Long memberId;
    private String guestEmail;
    private Long convertedUserNo;
    private String mergeYn;
    private LocalDateTime convertedAt;
}
