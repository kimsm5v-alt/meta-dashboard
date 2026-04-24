package com.vs.meta.domain;

import com.vs.meta.domain.enums.NotificationCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 사용자 알림 메시지 엔티티.
 *
 * <p>알림 문구(content)는 생성 시점에 렌더링된 최종 문자열로 저장 (닉네임/그룹명 박제).
 * Auth 서버/학심정 DB 변경과 무관하게 알림 표시는 불변.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    private Long notificationId;
    private Long userNo;
    private NotificationCategory category;
    private String eventCode;
    private String content;
    private String link;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    public boolean isRead() {
        return readAt != null;
    }
}
