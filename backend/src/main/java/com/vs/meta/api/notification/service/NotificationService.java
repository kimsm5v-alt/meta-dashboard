package com.vs.meta.api.notification.service;

import com.vs.meta.api.notification.dto.NotificationDto;
import com.vs.meta.api.notification.dto.NotificationListResponse;
import com.vs.meta.api.notification.mapper.NotificationMapper;
import com.vs.meta.domain.Notification;
import com.vs.meta.domain.enums.NotificationCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 알림 비즈니스 로직.
 *
 * <p>이벤트 리스너({@code NotificationEventHandler})에서 호출하여 알림 생성/전달.
 * REST 컨트롤러에서 호출하여 조회/읽음처리.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final NotificationMapper mapper;

    /**
     * 단건 알림 생성 (DB insert만 수행).
     * 실시간 전달은 호출자(NotificationEventHandler)가 AFTER_COMMIT 시점에
     * {@code NotificationDispatcher.dispatch}를 직접 호출한다.
     */
    @Transactional
    public Notification create(Long userNo, NotificationCategory category,
                               String eventCode, String content, String link) {
        Notification n = Notification.builder()
                .userNo(userNo)
                .category(category)
                .eventCode(eventCode)
                .content(content)
                .link(link)
                .createdAt(LocalDateTime.now())
                .build();
        mapper.insert(n);
        log.info("[Notification] created: userNo={}, eventCode={}, id={}", userNo, eventCode, n.getNotificationId());
        return n;
    }

    /**
     * 다건 알림 생성 (대량 발송).
     * 실시간 전달은 호출자가 반환된 리스트로 개별 dispatch 수행.
     */
    @Transactional
    public List<Notification> createBatch(List<Long> userNos, NotificationCategory category,
                                           String eventCode, String content, String link) {
        if (userNos == null || userNos.isEmpty()) return List.of();

        LocalDateTime now = LocalDateTime.now();
        List<Notification> list = userNos.stream()
                .map(userNo -> Notification.builder()
                        .userNo(userNo)
                        .category(category)
                        .eventCode(eventCode)
                        .content(content)
                        .link(link)
                        .createdAt(now)
                        .build())
                .collect(Collectors.toList());
        mapper.insertBatch(list);
        log.info("[Notification] batch created: count={}, eventCode={}", list.size(), eventCode);
        return list;
    }

    /**
     * 알림 목록 조회 (cursor 페이징).
     */
    @Transactional(readOnly = true)
    public NotificationListResponse list(Long userNo, Long cursor, Integer size,
                                          NotificationCategory category) {
        int pageSize = normalizeSize(size);
        List<Notification> rows = mapper.findByUserNoWithCursor(userNo, cursor, category, pageSize + 1);

        boolean hasMore = rows.size() > pageSize;
        List<Notification> items = hasMore ? rows.subList(0, pageSize) : rows;
        Long nextCursor = hasMore ? items.get(items.size() - 1).getNotificationId() : null;

        List<NotificationDto> dtos = items.stream()
                .map(NotificationDto::from)
                .collect(Collectors.toList());
        return new NotificationListResponse(dtos, nextCursor, hasMore);
    }

    /** 미확인 알림 개수 */
    @Transactional(readOnly = true)
    public int countUnread(Long userNo) {
        return mapper.countUnread(userNo);
    }

    /** 개별 읽음 처리 — 본인 알림만 대상, 이미 읽음이면 no-op */
    @Transactional
    public void markAsRead(Long userNo, Long notificationId) {
        mapper.markAsRead(userNo, notificationId);
    }

    /** 전체 읽음 처리 */
    @Transactional
    public int markAllAsRead(Long userNo) {
        return mapper.markAllAsRead(userNo);
    }

    /** N일 이전 알림 삭제 (배치용) */
    @Transactional
    public int deleteOlderThan(int days) {
        int deleted = mapper.deleteOlderThan(days);
        log.info("[Notification] deleted {} notifications older than {} days", deleted, days);
        return deleted;
    }

    private int normalizeSize(Integer size) {
        if (size == null || size <= 0) return DEFAULT_PAGE_SIZE;
        return Math.min(size, MAX_PAGE_SIZE);
    }
}
