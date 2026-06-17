package com.vs.meta.api.group.service;

import com.vs.meta.api.dgnss.service.DgnssService;
import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.group.mapper.GroupMemberMapper;
import com.vs.meta.api.group.mapper.GroupQueryMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.member.service.MemberService;
import com.vs.meta.api.notification.event.StudentJoinedGroupEvent;
import com.vs.meta.api.notification.event.StudentKickedEvent;
import com.vs.meta.api.notification.event.StudentLeftGroupEvent;
import com.vs.meta.common.auth.UserInfoEnricher;
import com.vs.meta.common.auth.UserSlot;
import com.vs.meta.common.utils.ConvertUtils;
import com.vs.meta.common.utils.IdGenerator;
import com.vs.meta.common.utils.PageUtil;
import com.vs.meta.domain.GroupInfo;
import com.vs.meta.domain.GroupMember;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.MemberStatus;
import com.vs.meta.domain.enums.MemberType;
import com.vs.meta.domain.enums.SchoolLevel;
import com.vs.meta.domain.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupInfoMapper groupInfoMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final GroupQueryMapper groupQueryMapper;
    private final UserMapper userMapper;
    private final MemberService memberService;
    private final DgnssService dgnssService;
    private final ApplicationEventPublisher eventPublisher;
    private final UserInfoEnricher userInfoEnricher;

    @Transactional
    public Object createGroup(Map<String, Object> paramData) throws Exception {
        Long userNo = ConvertUtils.toLong(paramData.get("userNo"));
        if (userNo == null) {
            throw new IllegalArgumentException("userNo는 필수입니다.");
        }
        String groupNm = (String) paramData.get("groupNm");
        if (groupNm == null || groupNm.isBlank()) {
            throw new IllegalArgumentException("groupNm은 필수입니다.");
        }

        SchoolLevel schoolLevel = SchoolLevel.fromCode((String) paramData.get("schoolLevel"));
        if (paramData.get("grade") == null) {
            throw new IllegalArgumentException("grade는 필수입니다.");
        }
        int gradeNum = Integer.parseInt(paramData.get("grade").toString());
        schoolLevel.validateGrade(gradeNum);
        if (paramData.get("classNumber") == null) {
            throw new IllegalArgumentException("classNumber는 필수입니다.");
        }

        User user = userMapper.findByUserNo(userNo);
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: userNo=" + userNo);
        }

        boolean isFirstCreate = (user.getTcId() == null);
        if (isFirstCreate) {
            String tcId = IdGenerator.generateTcId();
            user.assignTcId(tcId);
            userMapper.updateUser(user);
        }

        String claId = IdGenerator.generateClaId();
        String inviteCode = IdGenerator.generateInviteCode();

        Integer maxMemberCount = paramData.get("maxMemberCount") != null
                ? Integer.valueOf(paramData.get("maxMemberCount").toString()) : null;
        Integer classNumber = paramData.get("classNumber") != null
                ? Integer.valueOf(paramData.get("classNumber").toString()) : null;

        GroupInfo groupInfo = GroupInfo.builder()
                .claId(claId)
                .hostUserNo(userNo)
                .groupNm((String) paramData.get("groupNm"))
                .groupDesc((String) paramData.get("groupDesc"))
                .schoolLevel((String) paramData.get("schoolLevel"))
                .grade((String) paramData.get("grade"))
                .classNumber(classNumber)
                .schoolName((String) paramData.get("schoolName"))
                .schoolCode((String) paramData.get("schoolCode"))
                .inviteCode(inviteCode)
                .maxMemberCount(maxMemberCount != null ? maxMemberCount : 100)
                .useYn("Y")
                .createdBy(userNo)
                .updatedBy(userNo)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        groupInfoMapper.insertGroupInfo(groupInfo);

        paramData.put("claId", claId);
        paramData.put("inviteCode", inviteCode);

        log.info("그룹 생성: groupId={}, claId={}, inviteCode={}, hostUserNo={}", groupInfo.getGroupId(), claId, inviteCode, userNo);
        return paramData;
    }

    @Transactional
    public Object joinGroupAsPlayer(Map<String, Object> paramData) throws Exception {
        Long userNo = ConvertUtils.toLong(paramData.get("userNo"));
        if (userNo == null) {
            throw new IllegalArgumentException("userNo는 필수입니다.");
        }
        String inviteCode = (String) paramData.get("inviteCode");
        if (inviteCode == null || inviteCode.isBlank()) {
            throw new IllegalArgumentException("inviteCode는 필수입니다.");
        }

        User user = userMapper.findByUserNo(userNo);
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: userNo=" + userNo);
        }

        if ("TEACHER".equals(user.getRoleCode())) {
            throw new IllegalStateException("교사 계정은 다른 교사의 그룹에 참여할 수 없습니다. 직접 그룹을 생성해주세요.");
        }

        GroupInfo groupInfo = groupInfoMapper.findByInviteCodeAndUseYnForUpdate(inviteCode.toUpperCase(), "Y");
        if (groupInfo == null) {
            throw new IllegalArgumentException("유효한 초대코드가 아닙니다: " + inviteCode);
        }
        Long groupId = groupInfo.getGroupId();

        long activeCount = groupMemberMapper.countByGroupIdAndStatus(groupId, MemberStatus.ACTIVE.name());
        if (groupInfo.getMaxMemberCount() != null && activeCount >= groupInfo.getMaxMemberCount()) {
            throw new IllegalStateException("그룹 최대 인원(" + groupInfo.getMaxMemberCount() + "명)을 초과할 수 없습니다.");
        }

        boolean isFirstJoin = (user.getStdtId() == null);
        if (isFirstJoin) {
            String stdtId = IdGenerator.generateStdtId();
            user.assignStdtId(stdtId);
            userMapper.updateUser(user);
        }

        // 기존 멤버 조회 (탈퇴/강퇴 이력 확인)
        GroupMember existing = groupMemberMapper.findByGroupIdAndUserNo(groupId, userNo);
        if (existing != null) {
            if (existing.getStatus() == MemberStatus.ACTIVE) {
                throw new IllegalStateException("이미 해당 그룹에 가입되어 있습니다.");
            }
            if (existing.getStatus() == MemberStatus.KICKED) {
                throw new IllegalStateException("강퇴된 그룹에는 재가입할 수 없습니다.");
            }
            // LEFT 상태: 재가입 허용 (기존 row 재활성화)
            // Phase 3: nickname/email snapshot 복사 제거 — IDP enricher가 읽기 시점에 채운다.
            existing.updateStatus(MemberStatus.ACTIVE);
            existing.setJoinedAt(LocalDateTime.now());
            existing.setLeftAt(null);
            existing.setUpdatedBy(userNo);
            groupMemberMapper.updateGroupMember(existing);

            paramData.put("stdtId", existing.getStdtId());
            paramData.put("memberId", existing.getId());

            List<Integer> assignedDgnssIds = registerActiveDgnssIfNeeded(
                    groupInfo.getClaId(),
                    groupInfo.getSchoolLevel(),
                    existing.getStdtId()
            );
            if (!assignedDgnssIds.isEmpty()) {
                paramData.put("dgnssIds", assignedDgnssIds);
            }

            log.info("회원 그룹 재가입: groupId={}, userNo={}, memberId={}", groupId, userNo, existing.getId());
            // Phase 4: nickname 컬럼 제거, IDP enrich 후 name 사용
            existing.setSpUserId(user.getSpUserId());
            userInfoEnricher.enrich(existing);
            publishStudentJoined(groupInfo, existing.getName());
            return paramData;
        }

        Integer maxNo = groupMemberMapper.findMaxMemberNoByGroupId(groupId);
        int memberNo = (maxNo != null ? maxNo : 0) + 1;

        // Phase 3: nickname/email snapshot 제거 — IDP enricher가 읽기 시점에 채운다.
        // INSERT 시 nickname/email은 null이 되므로 DB NOT NULL 제약이 있다면 Phase 4에서 컬럼 DROP 후 해결.
        // 현재 Phase 3에서 NOT NULL 제약은 기존 데이터를 위해 유지되므로 user 값을 넘긴다.
        GroupMember member = GroupMember.builder()
                .groupId(groupId)
                .userNo(userNo)
                .stdtId(user.getStdtId())
                .memberNo(memberNo)
                .memberType(MemberType.STUDENT)
                .status(MemberStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .createdBy(userNo)
                .updatedBy(userNo)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        groupMemberMapper.insertGroupMember(member);

        paramData.put("stdtId", user.getStdtId());
        paramData.put("memberId", member.getId());

        List<Integer> assignedDgnssIds = registerActiveDgnssIfNeeded(
                groupInfo.getClaId(),
                groupInfo.getSchoolLevel(),
                user.getStdtId()
        );
        if (!assignedDgnssIds.isEmpty()) {
            paramData.put("dgnssIds", assignedDgnssIds);
        }

        log.info("회원 그룹 참가: groupId={}, userNo={}, memberNo={}", groupId, userNo, memberNo);
        // Phase 3: User.spUserId로 enrich — user 객체가 이 시점에 살아있으므로 UserSlot 경유
        UserSlot joinSlot = new UserSlot(user.getSpUserId());
        userInfoEnricher.enrich(joinSlot);
        publishStudentJoined(groupInfo, joinSlot.getName());
        return paramData;
    }


    /**
     * T1 알림 이벤트 발행 — 그룹 오너 교사에게.
     * hostUserNo가 없는 경우는 건너뛴다.
     */
    private void publishStudentJoined(GroupInfo groupInfo, String studentNickname) {
        if (groupInfo == null || groupInfo.getHostUserNo() == null) return;
        eventPublisher.publishEvent(new StudentJoinedGroupEvent(
                groupInfo.getHostUserNo(),
                groupInfo.getClaId(),
                groupInfo.getGroupNm(),
                studentNickname
        ));
    }

    /**
     * 그룹 가입 시 진행 중인 학심정 검사를 가입 학생에게 배부한다.
     * 종합(paperIdx=1)/자기조절(paperIdx=2) 모두 대상이며, 다른 학급 응시 이력자는 제외된다.
     * 그룹 동기화(MEMBER_ADD 반영, group-from-idp)에서도 호출되므로 public.
     *
     * @return 배부된 검사들의 dgnssId 목록 (없으면 빈 목록)
     */
    public List<Integer> registerActiveDgnssIfNeeded(String claId, String schoolLevel, String stdtId) throws Exception {
        if (stdtId == null || stdtId.isBlank()) {
            return List.of();
        }
        String legacyGrade = SchoolLevel.fromCode(schoolLevel).getLegacyGrade();
        List<Integer> assignedDgnssIds = dgnssService.assignActiveDgnssToStudent(claId, legacyGrade, stdtId);
        if (!assignedDgnssIds.isEmpty()) {
            log.info("가입 시 활성 검사 자동 배부: claId={}, stdtId={}, dgnssIds={}", claId, stdtId, assignedDgnssIds);
        }
        return assignedDgnssIds;
    }

    @Transactional(readOnly = true)
    public Object findGroupList(Map<String, Object> paramData) throws Exception {
        Long userNo = ConvertUtils.toLong(paramData.get("userNo"));
        boolean includeInactive = Boolean.parseBoolean(
                String.valueOf(paramData.getOrDefault("includeInactive", "false")));
        return groupQueryMapper.findGroupList(userNo, includeInactive);
    }

    @Transactional(readOnly = true)
    public Object findGroupDetail(Map<String, Object> paramData, int page, int size) throws Exception {
        Long userNo = ConvertUtils.toLong(paramData.get("userNo"));
        String claId = (String) paramData.get("claId");
        if (claId == null || claId.isBlank()) {
            throw new IllegalArgumentException("claId는 필수입니다.");
        }
        int offset = PageUtil.offset(page, size);
        var returnMap = new LinkedHashMap<>();

        GroupInfo group = groupInfoMapper.findByClaId(claId);
        if (group == null) {
            throw new IllegalArgumentException("그룹을 찾을 수 없습니다: " + claId);
        }
        Long groupId = group.getGroupId();
        boolean isHost = group.getHostUserNo().equals(userNo);
        boolean isMember = groupMemberMapper.existsByGroupIdAndUserNoAndStatus(groupId, userNo, MemberStatus.ACTIVE.name());
        if (!isHost && !isMember) {
            throw new IllegalStateException("그룹 상세 조회 권한이 없습니다. 그룹 멤버만 조회할 수 있습니다.");
        }

        Map<String, Object> groupInfo = groupQueryMapper.findGroupDetail(groupId, userNo);
        // Phase 3: hostSpUserId → hostNickname/hostEmail 복원 (FE 호환)
        enrichMap(groupInfo, "hostSpUserId", "hostNickname", "hostEmail");
        returnMap.put("groupInfo", groupInfo);

        List<Map<String, Object>> memberList = groupQueryMapper.findGroupMemberList(groupId, offset, size);
        // Phase 3: spUserId → nickname/email 복원 (FE 호환)
        enrichMaps(memberList, "spUserId", "nickname", "email");
        long total = groupQueryMapper.countGroupMemberList(groupId);

        returnMap.put("memberList", memberList);
        returnMap.put("page", PageUtil.of(page, size, total));
        return returnMap;
    }

    @Transactional
    public Object leaveGroup(Map<String, Object> paramData) throws Exception {
        Long userNo = ConvertUtils.toLong(paramData.get("userNo"));
        if (userNo == null) {
            throw new IllegalArgumentException("userNo는 필수입니다.");
        }
        if (paramData.get("memberId") == null) {
            throw new IllegalArgumentException("memberId는 필수입니다.");
        }
        Long memberId = Long.valueOf(paramData.get("memberId").toString());
        GroupMember member = groupMemberMapper.findGroupMemberById(memberId);
        if (member == null) {
            throw new IllegalArgumentException("멤버를 찾을 수 없습니다: " + memberId);
        }

        if (!userNo.equals(member.getUserNo())) {
            throw new IllegalStateException("본인의 멤버 레코드만 탈퇴할 수 있습니다.");
        }

        member.updateStatus(MemberStatus.LEFT);
        member.setUpdatedBy(userNo);
        groupMemberMapper.updateGroupMember(member);
        log.info("그룹 멤버 탈퇴: memberId={}, userNo={}", memberId, userNo);

        // T2: 그룹 오너 교사에게 알림
        // Phase 4: nickname 컬럼 제거, IDP enrich 후 name 사용
        GroupInfo groupInfo = groupInfoMapper.findGroupInfoById(member.getGroupId());
        if (groupInfo != null && groupInfo.getHostUserNo() != null) {
            userInfoEnricher.enrich(member);
            eventPublisher.publishEvent(new StudentLeftGroupEvent(
                    groupInfo.getHostUserNo(),
                    groupInfo.getClaId(),
                    member.getName()
            ));
        }
        return paramData;
    }

    @Transactional
    public Object kickMember(Map<String, Object> paramData) throws Exception {
        Long hostUserNo = ConvertUtils.toLong(paramData.get("hostUserNo"));
        if (hostUserNo == null) {
            throw new IllegalArgumentException("hostUserNo는 필수입니다.");
        }
        if (paramData.get("memberId") == null) {
            throw new IllegalArgumentException("memberId는 필수입니다.");
        }
        Long memberId = Long.valueOf(paramData.get("memberId").toString());
        GroupMember member = groupMemberMapper.findGroupMemberById(memberId);
        if (member == null) {
            throw new IllegalArgumentException("멤버를 찾을 수 없습니다: " + memberId);
        }

        GroupInfo groupInfo = groupInfoMapper.findGroupInfoById(member.getGroupId());
        if (groupInfo == null) {
            throw new IllegalArgumentException("그룹을 찾을 수 없습니다: " + member.getGroupId());
        }
        if (!groupInfo.getHostUserNo().equals(hostUserNo)) {
            throw new IllegalStateException("강퇴 권한이 없습니다. 방장만 강퇴할 수 있습니다.");
        }

        member.updateStatus(MemberStatus.KICKED);
        member.setUpdatedBy(hostUserNo);
        groupMemberMapper.updateGroupMember(member);
        log.info("그룹 멤버 강퇴: memberId={}, by={}", memberId, hostUserNo);

        // S5: 추방된 학생(회원만)에게 알림. 게스트(userNo=null)는 인앱 알림 불가 → 스킵
        if (member.getUserNo() != null) {
            eventPublisher.publishEvent(new StudentKickedEvent(
                    member.getUserNo(),
                    groupInfo.getGroupNm()
            ));
        }
        return paramData;
    }

    @Transactional(readOnly = true)
    public Object findGroupByInviteCode(Map<String, Object> paramData) throws Exception {
        String code = (String) paramData.get("code");
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("code는 필수입니다.");
        }

        GroupInfo groupInfo = groupInfoMapper.findByInviteCodeAndUseYn(code.toUpperCase(), "Y");
        if (groupInfo == null) {
            throw new IllegalArgumentException("유효한 초대코드가 아닙니다: " + code);
        }

        User host = userMapper.findByUserNo(groupInfo.getHostUserNo());
        // Phase 3: host.getNickname()은 DB에서 신뢰할 수 없으므로 UserSlot으로 IDP enrich
        String hostNickname = null;
        if (host != null && host.getSpUserId() != null) {
            UserSlot hostSlot = new UserSlot(host.getSpUserId());
            userInfoEnricher.enrich(hostSlot);
            hostNickname = hostSlot.getName();
        }

        long memberCount = groupMemberMapper.countByGroupIdAndStatus(groupInfo.getGroupId(), MemberStatus.ACTIVE.name());

        boolean alreadyJoined = false;
        Long userNo = ConvertUtils.toLong(paramData.get("userNo"));
        if (userNo != null) {
            alreadyJoined = groupMemberMapper.existsByGroupIdAndUserNoAndStatus(groupInfo.getGroupId(), userNo, MemberStatus.ACTIVE.name());
        }

        var result = new LinkedHashMap<String, Object>();
        result.put("groupId", groupInfo.getGroupId());
        result.put("claId", groupInfo.getClaId());
        result.put("groupNm", groupInfo.getGroupNm());
        result.put("inviteCode", groupInfo.getInviteCode());
        result.put("schoolLevel", groupInfo.getSchoolLevel());
        result.put("grade", groupInfo.getGrade());
        result.put("classNumber", groupInfo.getClassNumber());
        result.put("schoolName", groupInfo.getSchoolName());
        result.put("hostNickname", hostNickname);
        result.put("memberCount", memberCount);
        result.put("alreadyJoined", alreadyJoined);
        return result;
    }

    @Transactional
    public Object updateGroup(Map<String, Object> paramData) throws Exception {
        Long userNo = ConvertUtils.toLong(paramData.get("userNo"));
        if (userNo == null) {
            throw new IllegalArgumentException("userNo는 필수입니다.");
        }
        String claId = (String) paramData.get("claId");
        if (claId == null || claId.isBlank()) {
            throw new IllegalArgumentException("claId는 필수입니다.");
        }

        GroupInfo groupInfo = groupInfoMapper.findByClaId(claId);
        if (groupInfo == null) {
            throw new IllegalArgumentException("그룹을 찾을 수 없습니다: " + claId);
        }

        if (!groupInfo.getHostUserNo().equals(userNo)) {
            throw new IllegalStateException("그룹 수정 권한이 없습니다. 방장만 수정할 수 있습니다.");
        }

        groupInfo.updateGroupInfo(
                (String) paramData.get("groupNm"),
                (String) paramData.get("groupDesc"),
                (String) paramData.get("schoolName")
        );
        groupInfo.setUpdatedBy(userNo);
        groupInfoMapper.updateGroupInfo(groupInfo);

        log.info("그룹 수정: claId={}, by={}", claId, userNo);
        paramData.put("updatedAt", groupInfo.getUpdatedAt());
        return paramData;
    }

    @Transactional
    public Object deleteGroup(Map<String, Object> paramData) throws Exception {
        Long userNo = ConvertUtils.toLong(paramData.get("userNo"));
        if (userNo == null) {
            throw new IllegalArgumentException("userNo는 필수입니다.");
        }
        String claId = (String) paramData.get("claId");
        if (claId == null || claId.isBlank()) {
            throw new IllegalArgumentException("claId는 필수입니다.");
        }
        GroupInfo groupInfo = groupInfoMapper.findByClaId(claId);
        if (groupInfo == null) {
            throw new IllegalArgumentException("그룹을 찾을 수 없습니다: " + claId);
        }

        if (!groupInfo.getHostUserNo().equals(userNo)) {
            throw new IllegalStateException("그룹 삭제 권한이 없습니다. 방장만 삭제할 수 있습니다.");
        }

        groupInfo.deactivate();
        groupInfo.setUpdatedBy(userNo);
        groupInfoMapper.updateGroupInfo(groupInfo);
        log.info("그룹 삭제: claId={}, by={}", claId, userNo);
        return paramData;
    }

    // -----------------------------------------------------------------------
    // Phase 3 Map-enrich 헬퍼 — FE 호환 키(nickname/email 등) 복원
    // HasUserInfo 타입이 아닌 List<Map> 응답에서 spUserId 기준으로 IDP 회원정보를 채운다.
    // Task 12 hotfix: GroupQueryMapper SELECT에서 PII 컬럼이 제거된 Map 응답을 보정.
    // -----------------------------------------------------------------------

    /**
     * spUserId 필드로 식별되는 Map 목록을 Auth 회원정보로 enrich.
     * Phase 3 동안 List<Map<String,Object>> 응답에서 FE 호환 키(nickname/email)를 복원하기 위한 패턴.
     *
     * @param items        enrich 대상 Map 목록
     * @param spUserIdKey  Map 안의 sp_user_id 필드 키 이름 (예: "spUserId", "hostSpUserId")
     * @param nicknameKey  Map에 채워 넣을 닉네임 응답 키 이름 (예: "nickname", "hostNickname")
     * @param emailKey     Map에 채워 넣을 이메일 응답 키 이름 (예: "email", "hostEmail")
     */
    private void enrichMaps(
            List<Map<String, Object>> items,
            String spUserIdKey,
            String nicknameKey,
            String emailKey
    ) {
        if (items == null || items.isEmpty()) return;

        List<UserSlot> slots = items.stream()
                .map(m -> (String) m.get(spUserIdKey))
                .filter(Objects::nonNull)
                .distinct()
                .map(UserSlot::new)
                .toList();
        if (slots.isEmpty()) return;

        userInfoEnricher.enrich(slots);

        Map<String, UserSlot> bySpUserId = slots.stream()
                .collect(Collectors.toMap(UserSlot::getSpUserId, s -> s));
        items.forEach(m -> {
            String spUserId = (String) m.get(spUserIdKey);
            if (spUserId == null) return;
            UserSlot slot = bySpUserId.get(spUserId);
            if (slot != null) {
                m.put(nicknameKey, slot.getName());
                m.put(emailKey, slot.getEmail());
            } else {
                m.put(nicknameKey, "(탈퇴 회원)");
                m.put(emailKey, null);
            }
        });
    }

    /**
     * 단건 Map enrich.
     *
     * @see #enrichMaps(List, String, String, String)
     */
    private void enrichMap(
            Map<String, Object> item,
            String spUserIdKey,
            String nicknameKey,
            String emailKey
    ) {
        if (item == null) return;
        enrichMaps(List.of(item), spUserIdKey, nicknameKey, emailKey);
    }

}
