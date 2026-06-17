package com.vs.meta.api.sso.service;

import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.group.mapper.GroupMemberMapper;
import com.vs.meta.api.group.service.GroupService;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.notification.event.StudentJoinedGroupEvent;
import com.vs.meta.api.notification.event.StudentKickedEvent;
import com.vs.meta.api.school.mapper.SchoolInfoMapper;
import com.vs.meta.api.sso.client.dto.RpGroupDto;
import com.vs.meta.api.sso.client.dto.RpMemberDto;
import com.vs.meta.common.utils.IdGenerator;
import com.vs.meta.common.utils.PiiMasker;
import com.vs.meta.domain.GroupInfo;
import com.vs.meta.domain.GroupMember;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.MemberStatus;
import com.vs.meta.domain.enums.MemberType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Auth RP 그룹 객체 → 학심정 group_info/group_member 멱등 upsert (group-from-idp 02 §6).
 *
 * <p>핵심 규약:
 * <ul>
 *   <li><b>멱등</b> — 변경 피드 중복 전달(안전 지연 5초 경계)을 흡수. 모든 분기가
 *       "현재 상태와 다를 때만 변경+알림"</li>
 *   <li><b>알림</b> — 실제 INSERT/재활성(T1)·ACTIVE→KICKED 전이(S5) 시에만 발행.
 *       부트스트랩/전체 재동기화는 {@code suppressNotifications=true} 로 폭주 방지</li>
 *   <li><b>PII</b> — RP 응답의 멤버 성명(name)은 알림 문구 일회성 사용만. DB 영속화 금지</li>
 *   <li><b>cla_id/stdt_id</b> — 학심정 채번 유지 (검사·메모·상담·생기부 외래 식별자)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GroupUpsertService {

    private static final Pattern DIGITS = Pattern.compile("(\\d+)");

    private final GroupInfoMapper groupInfoMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final UserMapper userMapper;
    private final SchoolInfoMapper schoolInfoMapper;
    private final SsoUserProvisioningService provisioningService;
    private final GroupService groupService;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 그룹 + 멤버 명단 전체 교체 upsert.
     *
     * @return 변경(INSERT/UPDATE/전이) 건수 — 재동기화 보정 모니터링용 (정상 폴링 외 경로에서 비0이면 피드 누락 신호)
     */
    @Transactional
    public int upsertGroupFromRp(RpGroupDto rp, boolean suppressNotifications) {
        int changes = 0;
        GroupInfo g = groupInfoMapper.findBySpGroupId(rp.groupId());
        if (g == null) {
            g = insertGroup(rp);
            changes++;
        } else if (applyGroupFields(g, rp)) {
            g.setUpdatedBy(0L);
            g.setUpdatedAt(LocalDateTime.now());
            groupInfoMapper.updateGroupInfo(g);
            changes++;
        }
        changes += syncMembers(g, rp.members(), suppressNotifications);
        return changes;
    }

    /** GROUP_DELETE — use_yn='N' (기존 deleteGroup 과 동일 정책: 멤버 행은 불변, 조회가 use_yn 조인이라 자연 제외). */
    @Transactional
    public int deactivateBySpGroupId(Long spGroupId) {
        GroupInfo g = groupInfoMapper.findBySpGroupId(spGroupId);
        if (g == null || "N".equals(g.getUseYn())) {
            return 0; // 미보유/이미 비활성 — 멱등
        }
        g.deactivate();
        g.setUpdatedBy(0L);
        groupInfoMapper.updateGroupInfo(g);
        log.info("[GROUP-SYNC] 그룹 비활성: spGroupId={}, claId={}", spGroupId, g.getClaId());
        return 1;
    }

    /** MEMBER_REMOVE — 해당 멤버만 KICKED 전이 (재조회 불필요 경로). */
    @Transactional
    public int removeMemberBySpUserId(Long spGroupId, String publicUserId, boolean suppressNotifications) {
        GroupInfo g = groupInfoMapper.findBySpGroupId(spGroupId);
        if (g == null) {
            return 0; // 미보유 그룹 — 이후 GROUP_* 이벤트의 재조회 경로가 자연 해소
        }
        User u = userMapper.findBySpUserId(publicUserId);
        if (u == null) {
            return 0; // 로컬에 없는 사용자 — 멤버 행도 없음
        }
        GroupMember gm = groupMemberMapper.findByGroupIdAndUserNo(g.getGroupId(), u.getUserNo());
        if (gm == null || gm.getStatus() != MemberStatus.ACTIVE) {
            return 0; // 멱등
        }
        gm.setUpdatedBy(0L);
        gm.updateStatus(MemberStatus.KICKED);
        groupMemberMapper.updateGroupMember(gm);
        if (!suppressNotifications && gm.getUserNo() != null) {
            eventPublisher.publishEvent(new StudentKickedEvent(gm.getUserNo(), g.getGroupNm()));
        }
        return 1;
    }

    // ---- group ----

    private GroupInfo insertGroup(RpGroupDto rp) {
        User host = provisioningService.ensureUser(rp.ownerPublicUserId(), "TEACHER");
        if (host.getTcId() == null) {
            host.assignTcId(IdGenerator.generateTcId());
            userMapper.updateUser(host);
        }
        GroupInfo g = GroupInfo.builder()
                .claId(IdGenerator.generateClaId())
                .spGroupId(rp.groupId())
                .hostUserNo(host.getUserNo())
                .groupNm(safeGroupNm(rp.groupName()))
                .schoolLevel(mapSchoolLevel(rp.schoolLevel()))
                .grade(parseGrade(rp.grade()))
                .classNumber(parseClassNo(rp.classNo()))
                .subject(rp.subject())
                .schoolCode(fkSafeSchoolCode(rp.schoolCode()))
                .schoolName(rp.schoolName())
                .inviteCode(null)           // Auth 응답에 미포함 — 코드 합류는 mypage 책임
                .maxMemberCount(100)        // group_info.max_member_count NOT NULL — 정원은 Auth 책임이라 학심정 미사용, 기본값 고정(createGroup 과 동일)
                .useYn("Y")
                .createdBy(0L)
                .updatedBy(0L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        groupInfoMapper.insertGroupInfo(g);
        log.info("[GROUP-SYNC] 그룹 생성: spGroupId={}, claId={}, groupNm={}",
                rp.groupId(), g.getClaId(), rp.groupName());
        return g;
    }

    /** RP 필드를 도메인에 반영. 실제로 달라진 게 있을 때만 true (멱등 — 무변경이면 UPDATE 생략). */
    private boolean applyGroupFields(GroupInfo g, RpGroupDto rp) {
        boolean dirty = false;
        // group_nm NOT NULL — Auth groupName 이 null 로 와도 기존 값을 null 로 덮지 않음
        if (rp.groupName() != null) {
            dirty |= setIfChanged(g.getGroupNm(), rp.groupName(), g::setGroupNm);
        }
        dirty |= setIfChanged(g.getSchoolLevel(), mapSchoolLevel(rp.schoolLevel()), g::setSchoolLevel);
        dirty |= setIfChanged(g.getGrade(), parseGrade(rp.grade()), g::setGrade);
        Integer classNo = parseClassNo(rp.classNo());
        if (!classNo.equals(g.getClassNumber())) {
            g.setClassNumber(classNo);
            dirty = true;
        }
        dirty |= setIfChanged(g.getSubject(), rp.subject(), g::setSubject);
        dirty |= setIfChanged(g.getSchoolCode(), fkSafeSchoolCode(rp.schoolCode()), g::setSchoolCode);
        dirty |= setIfChanged(g.getSchoolName(), rp.schoolName(), g::setSchoolName);
        if (!"Y".equals(g.getUseYn())) {
            g.setUseYn("Y"); // 스냅샷/상세는 ACTIVE 만 반환 — 재활성
            dirty = true;
        }
        return dirty;
    }

    private boolean setIfChanged(String current, String next, java.util.function.Consumer<String> setter) {
        if (java.util.Objects.equals(current, next)) {
            return false;
        }
        setter.accept(next);
        return true;
    }

    // ---- members ----

    /** ACTIVE 명단 전체 교체 — RP 에 있으면 ACTIVE 보장, 없는 로컬 ACTIVE 는 KICKED. */
    private int syncMembers(GroupInfo g, List<RpMemberDto> rpMembers, boolean suppress) {
        int changes = 0;
        List<GroupMember> locals = groupMemberMapper.findByGroupId(g.getGroupId());
        Map<Long, GroupMember> byUserNo = new HashMap<>();
        int maxNo = 0;
        for (GroupMember gm : locals) {
            if (gm.getUserNo() != null) {
                byUserNo.put(gm.getUserNo(), gm);
            }
            if (gm.getMemberNo() != null && gm.getMemberNo() > maxNo) {
                maxNo = gm.getMemberNo();
            }
        }

        Set<Long> rpUserNos = new HashSet<>();
        for (RpMemberDto m : rpMembers) {
            if (!"ACTIVE".equals(m.status())) {
                continue; // 스냅샷/상세는 ACTIVE 만 오지만 방어
            }
            User u = provisioningService.ensureUser(m.publicUserId(), "STUDENT");
            if (u == null) {
                continue;
            }
            if (u.getStdtId() == null) {
                u.assignStdtId(IdGenerator.generateStdtId());
                userMapper.updateUser(u);
            }
            rpUserNos.add(u.getUserNo());

            GroupMember gm = byUserNo.get(u.getUserNo());
            boolean joined = false;
            if (gm == null) {
                GroupMember created = GroupMember.builder()
                        .groupId(g.getGroupId())
                        .userNo(u.getUserNo())
                        .stdtId(u.getStdtId())
                        .memberType(MemberType.STUDENT)
                        .memberNo(++maxNo)
                        .status(MemberStatus.ACTIVE)
                        .joinedAt(m.joinedAt() != null ? m.joinedAt() : LocalDateTime.now())
                        .createdBy(0L)
                        .updatedBy(0L)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                groupMemberMapper.insertGroupMember(created);
                joined = true;
            } else if (gm.getStatus() != MemberStatus.ACTIVE && gm.getStatus() != MemberStatus.WITHDRAWN) {
                // WITHDRAWN(학심정 연결끊기/탈퇴) 은 재활성하지 않음 — 동의 철회가 우선 (02 §4.1)
                gm.setStatus(MemberStatus.ACTIVE);
                gm.setLeftAt(null);
                gm.setUpdatedBy(0L);
                gm.setUpdatedAt(LocalDateTime.now());
                groupMemberMapper.updateGroupMember(gm);
                joined = true;
            }

            if (joined) {
                changes++;
                if (!suppress) {
                    // name 은 알림 문구 일회성 사용 — 영속화 금지 (Auth 거버넌스)
                    publishJoined(g, m.name());
                }
                registerActiveDgnssSafely(g, u.getStdtId());
            }
        }

        for (GroupMember gm : locals) {
            if (gm.getStatus() != MemberStatus.ACTIVE) {
                continue;
            }
            if (gm.getUserNo() == null || !rpUserNos.contains(gm.getUserNo())) {
                gm.setUpdatedBy(0L);
                gm.updateStatus(MemberStatus.KICKED);
                groupMemberMapper.updateGroupMember(gm);
                changes++;
                if (!suppress && gm.getUserNo() != null) {
                    eventPublisher.publishEvent(new StudentKickedEvent(gm.getUserNo(), g.getGroupNm()));
                }
            }
        }
        return changes;
    }

    private void publishJoined(GroupInfo g, String studentName) {
        if (g.getHostUserNo() == null) {
            return;
        }
        eventPublisher.publishEvent(new StudentJoinedGroupEvent(
                g.getHostUserNo(), g.getClaId(), g.getGroupNm(), studentName));
    }

    /**
     * 활성 검사 자동 등록 — 합류 즉시 응시 가능 플로우 유지 (group-from-idp 01 §4).
     * 검사 등록 실패가 동기화 전체를 막으면 안 되므로 격리. schoolLevel=etc 는 검사 매핑이 없어 skip.
     */
    private void registerActiveDgnssSafely(GroupInfo g, String stdtId) {
        if (!isStandardSchoolLevel(g.getSchoolLevel())) {
            return;
        }
        try {
            groupService.registerActiveDgnssIfNeeded(g.getClaId(), g.getSchoolLevel(), stdtId);
        } catch (Exception e) {
            log.warn("[GROUP-SYNC] 활성 검사 자동 등록 실패(스킵): claId={}, stdtId={}, error={}",
                    g.getClaId(), PiiMasker.maskUuid(stdtId), e.getMessage());
        }
    }

    // ---- Auth → 학심정 매핑 (02-schema-and-mapping.md §3) ----

    /** group_nm NOT NULL 방어 — Auth groupName 이 비어 오면 대체 표시값. */
    static String safeGroupNm(String groupName) {
        return (groupName == null || groupName.isBlank()) ? "(이름 없는 그룹)" : groupName;
    }

    /** ELEMENTARY/MIDDLE/HIGH → elementary/middle/high. ETC 등 비표준은 소문자 그대로 (검사 자동 등록은 skip). */
    static String mapSchoolLevel(String authLevel) {
        if (authLevel == null || authLevel.isBlank()) {
            return "etc";
        }
        return switch (authLevel) {
            case "ELEMENTARY" -> "elementary";
            case "MIDDLE" -> "middle";
            case "HIGH" -> "high";
            default -> authLevel.toLowerCase();
        };
    }

    static boolean isStandardSchoolLevel(String level) {
        return "elementary".equals(level) || "middle".equals(level) || "high".equals(level);
    }

    /** "3학년" → "3". 숫자 없으면 원문(표시 호환), null/blank 는 "0". */
    static String parseGrade(String raw) {
        if (raw == null || raw.isBlank()) {
            return "0";
        }
        Matcher m = DIGITS.matcher(raw);
        return m.find() ? m.group(1) : raw;
    }

    /** "5반" → 5. 숫자 없으면 0 (class_number INT NOT NULL). */
    static Integer parseClassNo(String raw) {
        if (raw == null || raw.isBlank()) {
            return 0;
        }
        Matcher m = DIGITS.matcher(raw);
        if (!m.find()) {
            return 0;
        }
        try {
            return Integer.parseInt(m.group(1));
        } catch (NumberFormatException e) {
            return 0; // 자릿수 초과 등
        }
    }

    /** school_info FK 위반 방지 — 미등록 NEIS 코드는 NULL 저장 (school_name 으로 표시). */
    private String fkSafeSchoolCode(String schoolCode) {
        if (schoolCode == null || schoolCode.isBlank()) {
            return null;
        }
        return schoolInfoMapper.existsBySchoolCode(schoolCode) ? schoolCode : null;
    }
}
