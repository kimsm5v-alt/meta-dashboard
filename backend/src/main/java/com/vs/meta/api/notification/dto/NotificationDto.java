package com.vs.meta.api.notification.dto;

import com.vs.meta.domain.Notification;
import com.vs.meta.domain.enums.NotificationCategory;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 알림 API 응답/SSE 전달용 DTO.
 * 수신자 user_no는 외부 노출 불필요 ("내 알림"이라 자명).
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {

    private Long notificationId;
    private NotificationCategory category;
    private String eventCode;
    private String content;
    private String link;
    private boolean read;
    private LocalDateTime createdAt;

    public static NotificationDto from(Notification n) {
        return new NotificationDto(
                n.getNotificationId(),
                n.getCategory(),
                n.getEventCode(),
                n.getContent(),
                n.getLink(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
