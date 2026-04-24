package com.vs.meta.api.notification.controller;

import com.vs.meta.api.notification.event.GroupInvitedEvent;
import com.vs.meta.api.notification.event.StudentJoinedGroupEvent;
import com.vs.meta.api.notification.event.StudentKickedEvent;
import com.vs.meta.api.notification.event.StudentLeftGroupEvent;
import com.vs.meta.api.notification.service.NotificationService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import com.vs.meta.common.utils.SecurityUtil;
import com.vs.meta.domain.enums.NotificationCategory;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 알림 기능 개발/디버그 전용 엔드포인트.
 * local profile에서만 동작. 운영/개발서버에서는 비활성.
 *
 * <p>FE의 {@code /dev/notification-tester} 페이지가 이 엔드포인트를 사용해 SSE/이벤트 수동 검증.
 *
 * <p>각 fire 엔드포인트는 {@code @Transactional} 로 감싸져 있어 AFTER_COMMIT 리스너가 정상 동작한다.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@Profile("local")
@RequestMapping(value = "/api/v1/notifications", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Notification Debug (local only)", description = "로컬 환경 SSE 수동 테스트")
public class NotificationDebugController {

    private final NotificationService service;
    private final ApplicationEventPublisher eventPublisher;

    @PostMapping("/test-send")
    @Operation(summary = "[local] 본인에게 테스트 알림 발송", description = "로컬 환경에서 SSE 동작 확인용")
    public ResponseDTO<CustomBody> testSend(
            @RequestParam(defaultValue = "테스트 알림입니다") String msg
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo();
        service.create(userNo, NotificationCategory.NOTICE, "TEST", msg, null);
        return AidtCommonUtil.makeResultSuccess(null, Collections.singletonMap("userNo", userNo), "sent");
    }

    @PostMapping("/cleanup-old")
    @Operation(summary = "[local] N일 경과 알림 즉시 삭제", description = "Retention 스케줄러 동작 검증용")
    public ResponseDTO<CustomBody> cleanupOld(@RequestParam(defaultValue = "90") int days) {
        int deleted = service.deleteOlderThan(days);
        return AidtCommonUtil.makeResultSuccess(null, Collections.singletonMap("deleted", deleted), "OK");
    }

    // ───────────────────────────────────────────────────────────
    // 이벤트 트리거 — 실제 비즈 로직을 우회하여 이벤트만 publish
    // AFTER_COMMIT 리스너가 동작하려면 트랜잭션 컨텍스트가 필요하므로
    // 각 엔드포인트는 @Transactional 로 감싼다.
    // ───────────────────────────────────────────────────────────

    @PostMapping("/debug/fire/t1")
    @Operation(summary = "[local] T1 발화 — 학생 그룹 참여")
    @Transactional
    public ResponseDTO<CustomBody> fireT1(@RequestBody T1Body body) {
        eventPublisher.publishEvent(new StudentJoinedGroupEvent(
                body.teacherUserNo, body.claId, body.groupName, body.studentNickname
        ));
        log.info("[Debug] T1 published: {}", body);
        return AidtCommonUtil.makeResultSuccess(null, echo("T1", body), "published");
    }

    @PostMapping("/debug/fire/t2")
    @Operation(summary = "[local] T2 발화 — 학생 그룹 탈퇴(자발)")
    @Transactional
    public ResponseDTO<CustomBody> fireT2(@RequestBody T2Body body) {
        eventPublisher.publishEvent(new StudentLeftGroupEvent(
                body.teacherUserNo, body.claId, body.studentNickname
        ));
        log.info("[Debug] T2 published: {}", body);
        return AidtCommonUtil.makeResultSuccess(null, echo("T2", body), "published");
    }

    @PostMapping("/debug/fire/s4")
    @Operation(summary = "[local] S4 발화 — 그룹 초대 수신")
    @Transactional
    public ResponseDTO<CustomBody> fireS4(@RequestBody S4Body body) {
        eventPublisher.publishEvent(new GroupInvitedEvent(
                body.inviteeUserNo, body.groupName, body.inviteCode
        ));
        log.info("[Debug] S4 published: {}", body);
        return AidtCommonUtil.makeResultSuccess(null, echo("S4", body), "published");
    }

    @PostMapping("/debug/fire/s5")
    @Operation(summary = "[local] S5 발화 — 학생 추방")
    @Transactional
    public ResponseDTO<CustomBody> fireS5(@RequestBody S5Body body) {
        eventPublisher.publishEvent(new StudentKickedEvent(
                body.studentUserNo, body.groupName
        ));
        log.info("[Debug] S5 published: {}", body);
        return AidtCommonUtil.makeResultSuccess(null, echo("S5", body), "published");
    }

    private Map<String, Object> echo(String code, Object body) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("eventCode", code);
        m.put("payload", body);
        return m;
    }

    // ─── 요청 바디 ─────────────────────────────────────────────
    public static class T1Body {
        public Long teacherUserNo;
        public String claId;
        public String groupName;
        public String studentNickname;
        @Override public String toString() {
            return "T1{teacherUserNo=" + teacherUserNo + ", claId=" + claId
                    + ", groupName=" + groupName + ", studentNickname=" + studentNickname + "}";
        }
    }

    public static class T2Body {
        public Long teacherUserNo;
        public String claId;
        public String studentNickname;
        @Override public String toString() {
            return "T2{teacherUserNo=" + teacherUserNo + ", claId=" + claId
                    + ", studentNickname=" + studentNickname + "}";
        }
    }

    public static class S4Body {
        public Long inviteeUserNo;
        public String groupName;
        public String inviteCode;
        @Override public String toString() {
            return "S4{inviteeUserNo=" + inviteeUserNo + ", groupName=" + groupName
                    + ", inviteCode=" + inviteCode + "}";
        }
    }

    public static class S5Body {
        public Long studentUserNo;
        public String groupName;
        @Override public String toString() {
            return "S5{studentUserNo=" + studentUserNo + ", groupName=" + groupName + "}";
        }
    }
}
