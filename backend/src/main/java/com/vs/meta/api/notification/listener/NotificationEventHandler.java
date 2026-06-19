package com.vs.meta.api.notification.listener;

import com.vs.meta.api.notification.dispatcher.NotificationDispatcher;
import com.vs.meta.api.notification.dto.NotificationDto;
import com.vs.meta.api.notification.event.ExamSubmittedEvent;
import com.vs.meta.api.notification.event.StudentExamNotificationEvent;
import com.vs.meta.api.notification.event.TeacherExamNotificationEvent;
import com.vs.meta.api.notification.event.GroupInvitedEvent;
import com.vs.meta.api.notification.event.StudentJoinedGroupEvent;
import com.vs.meta.api.notification.event.StudentKickedEvent;
import com.vs.meta.api.notification.event.StudentLeftGroupEvent;
import com.vs.meta.api.notification.service.NotificationService;
import com.vs.meta.common.auth.PersonInfoClient;
import com.vs.meta.common.auth.UserInfo;
import com.vs.meta.domain.Notification;
import com.vs.meta.domain.enums.NotificationCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

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
    private final PersonInfoClient personInfoClient;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onExamSubmitted(ExamSubmittedEvent e) {
        try {
            String content = String.format("%s 학생이 %d차 %s를 제출했습니다.",
                    e.studentNickname(), e.round(), e.examName());
            Notification n = notificationService.create(
                    e.teacherUserNo(),
                    NotificationCategory.EXAM,
                    "T3",
                    content,
                    "/assessment"
            );
            dispatcher.dispatch(e.teacherUserNo(), NotificationDto.from(n));
        } catch (Exception ex) {
            log.warn("[Notification] T3 처리 실패", ex);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onTeacherExamNotification(TeacherExamNotificationEvent e) {
        try {
            String eventCode;
            String link;
            String content;
            if (e.kind() == TeacherExamNotificationEvent.Kind.T4_ALL_SUBMITTED) {
                eventCode = "T4";
                link = "/assessment";
                content = String.format("%s %d차 %s 전원 제출이 완료되었습니다. [검사 종료] 시 리포트가 생성됩니다.",
                        e.groupName(), e.round(), e.examName());
            } else {
                eventCode = "T6";
                link = "/dashboard";
                content = String.format("%s %d차 %s 리포트가 생성되었습니다. 대시보드에서 결과를 확인해 보세요.",
                        e.groupName(), e.round(), e.examName());
            }
            Notification n = notificationService.create(
                    e.teacherUserNo(),
                    NotificationCategory.EXAM,
                    eventCode,
                    content,
                    link
            );
            dispatcher.dispatch(e.teacherUserNo(), NotificationDto.from(n));
        } catch (Exception ex) {
            log.warn("[Notification] 교사 검사 알림 처리 실패", ex);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onStudentExamNotification(StudentExamNotificationEvent e) {
        try {
            List<Long> targets = e.studentUserNos();
            if (targets == null || targets.isEmpty()) {
                return;
            }
            String eventCode;
            String link;
            String content;
            if (e.kind() == StudentExamNotificationEvent.Kind.S1_ASSIGNED) {
                eventCode = "S1";
                link = "/student/exams";
                content = String.format("%s %d차 %s 검사가 시작되었어요.",
                        e.groupName(), e.round(), e.examName());
            } else if (e.kind() == StudentExamNotificationEvent.Kind.S6_REEXAM_REQUESTED) {
                eventCode = "S6";
                link = "/student/exams";
                content = String.format("선생님이 %d차 %s 다시 한번 응시를 요청했어요.",
                        e.round(), e.examName());
            } else {
                eventCode = "S3";
                link = "/student/result";
                content = String.format("%s %d차 %s 리포트가 생성되었어요. 대시보드에서 결과를 확인해 보세요.",
                        e.groupName(), e.round(), e.examName());
            }
            List<Notification> notifications = notificationService.createBatch(
                    targets,
                    NotificationCategory.EXAM,
                    eventCode,
                    content,
                    link
            );
            for (Notification n : notifications) {
                dispatcher.dispatch(n.getUserNo(), NotificationDto.from(n));
            }
        } catch (Exception ex) {
            log.warn("[Notification] 학생 검사 알림 처리 실패", ex);
        }
    }

    // ───────────────────────────────────────────────────────────
    // T1 — 학생 그룹 가입
    // ───────────────────────────────────────────────────────────
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onStudentJoined(StudentJoinedGroupEvent e) {
        try {
            String name = resolveJoinedStudentName(e);
            String content = (name != null && !name.isBlank())
                    ? String.format("%s 학생이 '%s' 그룹에 참여했습니다.", name, e.groupName())
                    : String.format("'%s' 그룹에 새 학생이 참여했어요. 학생이 로그인·동의하면 이름이 표시됩니다.", e.groupName());
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

    /**
     * 합류 알림용 학생 이름 해석.
     * 이미 보유한 이름이 있으면 그대로 사용하고, 없으면 publicUserId 로 Auth /users 단건 조회 —
     * 호출 RP(학심정)에 SERVICE 동의한 학생만 이름이 채워지고(maskedReason=NONE), 미동의/탈퇴/조회실패는
     * null 을 반환해 호출부가 이름 없는 일반 문구로 처리한다. (그룹 API 는 PII 미제공 — 동의 마스킹은 /users 가 책임)
     */
    private String resolveJoinedStudentName(StudentJoinedGroupEvent e) {
        if (e.studentNickname() != null && !e.studentNickname().isBlank()) {
            return e.studentNickname();
        }
        if (e.studentPublicUserId() == null) {
            return null;
        }
        UserInfo info = personInfoClient.getOne(e.studentPublicUserId());
        if (info != null && "NONE".equals(info.maskedReason())
                && info.name() != null && !info.name().isBlank()) {
            return info.name();
        }
        return null;
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
