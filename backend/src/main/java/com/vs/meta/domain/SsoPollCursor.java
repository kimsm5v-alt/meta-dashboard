package com.vs.meta.domain;

import lombok.*;

import java.time.LocalDateTime;

/**
 * SSO 이벤트 폴링 커서 (sso_poll_cursor).
 * IdP RP Event Feed 폴링 시 다음 호출의 since 값을 영속화한다.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SsoPollCursor {

    /** REVOCATION | DELETION */
    private String feedType;
    /** 다음 폴링 호출의 since 파라미터 */
    private LocalDateTime lastSince;
    /** 마지막 폴링 성공 시각 */
    private LocalDateTime lastPolledAt;
    /** 마지막 응답 item 수 (모니터링용) */
    private int lastItemCount;
    private LocalDateTime updatedAt;
}
