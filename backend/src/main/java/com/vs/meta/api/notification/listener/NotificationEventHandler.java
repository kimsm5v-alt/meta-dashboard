package com.vs.meta.api.notification.listener;

import com.vs.meta.api.notification.dispatcher.NotificationDispatcher;
import com.vs.meta.api.notification.dto.NotificationDto;
import com.vs.meta.api.notification.event.GroupInvitedEvent;
import com.vs.meta.api.notification.event.StudentJoinedGroupEvent;
import com.vs.meta.api.notification.event.StudentKickedEvent;
import com.vs.meta.api.notification.event.StudentLeftGroupEvent;
import com.vs.meta.api.notification.service.NotificationService;
import com.vs.meta.domain.Notification;
import com.vs.meta.domain.enums.NotificationCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 알림 이벤트 리스너.
 *
 * <p>비즈니스 로직 트랜잭션이 커밋된 후에만 알림을 생성/전달한다 (AFTER_COMMIT).
 * 리스너 자체는 새 트랜잭션으로 실행하여 insert + dispatch가 완결되도록 한다.
 *
 * <p>리스너 실패 시 본 업무에 영향 없음 (fire-and-forget).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventHandler {

    private final NotificationService notificationService;
    private final NotificationDispatcher dispatcher;

    // ───────────────────────────────────────────────────────────
    // T1 — 학생 그룹 가입
    // ───────────────────────────────────────────────────────────
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onStudentJoined(StudentJoinedGroupEvent e) {
        try {
            String content = String.format("%s 학생이 '%s' 그룹에 참여했습니다.",
                    e.studentNickname(), e.groupName());
            String link = "/groups/" + e.claId();
            Notification n = notificationService.create(
                    e.teacherUserNo(),
                    NotificationCategory.GROUP,
                    "T1",
                    content,
                    link
            );
            dispatcher.dispatch(e.teacherUserNo(), NotificationDto.from(n));
        } catch (Exception ex) {
            log.warn("[Notification] T1 처리 실패", ex);
        }
    }

    // ───────────────────────────────────────────────────────────
    // T2 — 학생 그룹 탈퇴 (자발적)
    // ───────────────────────────────────────────────────────────
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onStudentLeft(StudentLeftGroupEvent e) {
        try {
            String content = String.format("%s 학생이 그룹을 탈퇴했습니다.",
                    e.studentNickname());
            String link = "/groups/" + e.claId();
            Notification n = notificationService.create(
                    e.teacherUserNo(),
                    NotificationCategory.GROUP,
                    "T2",
                    content,
                    link
            );
            dispatcher.dispatch(e.teacherUserNo(), NotificationDto.from(n));
        } catch (Exception ex) {
            log.warn("[Notification] T2 처리 실패", ex);
        }
    }

    // ───────────────────────────────────────────────────────────
    // S4 — 그룹 초대 수신
    // ───────────────────────────────────────────────────────────
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onGroupInvited(GroupInvitedEvent e) {
        try {
            String content = String.format("%s 그룹에 초대 되었어요.", e.groupName());
            String link = "/student/groups?code=" + e.inviteCode();
            Notification n = notificationService.create(
                    e.inviteeUserNo(),
                    NotificationCategory.GROUP,
                    "S4",
                    content,
                    link
            );
            dispatcher.dispatch(e.inviteeUserNo(), NotificationDto.from(n));
        } catch (Exception ex) {
            log.warn("[Notification] S4 처리 실패", ex);
        }
    }

    // ───────────────────────────────────────────────────────────
    // S5 — 학생 추방
    // ───────────────────────────────────────────────────────────
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onStudentKicked(StudentKickedEvent e) {
        try {
            String content = String.format("%s 그룹에서 퇴장 되었어요.", e.groupName());
            String link = "/student/groups";
            Notification n = notificationService.create(
                    e.studentUserNo(),
                    NotificationCategory.GROUP,
                    "S5",
                    content,
                    link
            );
            dispatcher.dispatch(e.studentUserNo(), NotificationDto.from(n));
        } catch (Exception ex) {
            log.warn("[Notification] S5 처리 실패", ex);
        }
    }
}
