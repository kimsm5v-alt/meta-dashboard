package com.vs.meta.api.dgnss.service;

import com.vs.meta.api.dgnss.mapper.DgnssMapper;
import com.vs.meta.api.notification.dispatcher.NotificationDispatcher;
import com.vs.meta.api.notification.dto.NotificationDto;
import com.vs.meta.api.notification.service.NotificationService;
import com.vs.meta.common.utils.SecurityUtil;
import com.vs.meta.domain.Notification;
import com.vs.meta.domain.enums.NotificationCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 미제출 학생 독려 알림 발송.
 * dgnssId 기준으로 담당교사·진행중 검증 후 미제출 학생을 재조회해 학심정 내부 알림(저장 + SSE)으로 발송한다.
 * 재발송 제한(쿨다운)은 FE 버튼 비활성화로 처리 — 서버는 언제 눌러도 받아 미제출자에게만 다시 알린다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExamReminderService {

    private static final String EVENT_CODE = "S7";
    private static final String LINK = "/student/exams";
    private static final String CONTENT =
            "아직 검사를 완료하지 않았어요. 지금 검사에 참여하고 마지막 제출까지 완료해 주세요.";

    private final DgnssMapper dgnssMapper;
    private final NotificationService notificationService;
    private final NotificationDispatcher dispatcher;

    /**
     * 미제출 학생 독려 알림 발송.
     * 결과 code: OK / NOT_FOUND / NOT_OWNER / NOT_IN_PROGRESS / NO_TARGET
     */
    public Map<String, Object> sendUnsubmittedReminder(int dgnssId) {
        long teacherUserNo = SecurityUtil.requireCurrentUserNo();

        Map<String, Object> info = dgnssMapper.selectTcDgnssInfoOneWithDgnssId(
                Collections.singletonMap("dgnssId", dgnssId));
        if (MapUtils.isEmpty(info)) {
            return result("NOT_FOUND", 0, 0, null);
        }
        // 담당 교사 검증 (group_info.host_user_no)
        Long ownerUserNo = MapUtils.getLong(info, "teacherUserNo");
        if (ownerUserNo == null || ownerUserNo.longValue() != teacherUserNo) {
            return result("NOT_OWNER", 0, 0, null);
        }
        // 진행 중인 검사만 (dgnss_at='Y')
        if (!"Y".equalsIgnoreCase(MapUtils.getString(info, "dgnssAt", ""))) {
            return result("NOT_IN_PROGRESS", 0, 0, null);
        }

        // 요청 시점 기준 미제출 학생 재조회 (탈퇴/미매핑/제출자 제외)
        List<Long> targets = dgnssMapper.selectUnsubmittedStudentUserNoListByDgnssId(dgnssId).stream()
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (CollectionUtils.isEmpty(targets)) {
            return result("NO_TARGET", 0, 0, null);
        }

        // 내부 알림 생성(저장) + 실시간 dispatch (best-effort — 저장은 완료되므로 재접속 시 노출)
        List<Notification> notifications = notificationService.createBatch(
                targets, NotificationCategory.EXAM, EVENT_CODE, CONTENT, LINK);
        for (Notification n : notifications) {
            try {
                dispatcher.dispatch(n.getUserNo(), NotificationDto.from(n));
            } catch (Exception ex) {
                log.warn("[Reminder] 실시간 dispatch 실패 userNo={} (알림은 저장됨)", n.getUserNo(), ex);
            }
        }

        String lastSentAt = OffsetDateTime.now(ZoneOffset.ofHours(9))
                .format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        return result("OK", targets.size(), notifications.size(), lastSentAt);
    }

    private Map<String, Object> result(String code, int requested, int sent, String lastSentAt) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", code);
        m.put("requestedCount", requested);
        m.put("sentCount", sent);
        m.put("failedCount", Math.max(0, requested - sent));
        m.put("lastSentAt", lastSentAt);
        return m;
    }
}
