package com.vs.meta.api.notification.mapper;

import com.vs.meta.domain.Notification;
import com.vs.meta.domain.enums.NotificationCategory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationMapper {

    /** 단건 insert — AUTO_INCREMENT된 id가 파라미터 객체에 주입됨 */
    void insert(Notification notification);

    /** 다건 insert (대량 발송용) */
    void insertBatch(@Param("list") List<Notification> notifications);

    /** cursor 페이징 조회. cursor 이전(notification_id 작은) 건을 size만큼 반환 */
    List<Notification> findByUserNoWithCursor(
            @Param("userNo") Long userNo,
            @Param("cursor") Long cursor,
            @Param("category") NotificationCategory category,
            @Param("size") int size
    );

    /** 미확인 개수 */
    int countUnread(@Param("userNo") Long userNo);

    /** 개별 읽음 처리 — 본인 알림만 대상 */
    int markAsRead(@Param("userNo") Long userNo, @Param("notificationId") Long notificationId);

    /** 전체 읽음 처리 */
    int markAllAsRead(@Param("userNo") Long userNo);

    /** N일 이전 알림 삭제 (배치용) */
    int deleteOlderThan(@Param("days") int days);
}
