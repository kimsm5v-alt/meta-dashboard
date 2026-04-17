package com.vs.meta.api.group.service;

import com.vs.meta.api.dgnss.service.DgnssService;
import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.group.mapper.GroupMemberMapper;
import com.vs.meta.api.group.mapper.GroupQueryMapper;
import com.vs.meta.api.guest.service.GuestAuthService;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.member.service.EmailVerificationService;
import com.vs.meta.api.member.service.MemberService;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupInfoMapper groupInfoMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final GroupQueryMapper groupQueryMapper;
    private final UserMapper userMapper;
    private final MemberService memberService;
    private final EmailVerificationService emailVerificationService;
    private final DgnssService dgnssService;
    private final GuestAuthService guestAuthService;

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
                .maxMemberCount(maxMemberCount != null ? maxMemberCount : 40)
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
            existing.updateStatus(MemberStatus.ACTIVE);
            existing.setNickname(user.getNickname());
            existing.setGender(user.getGender());
            existing.setEmail(user.getEmail());
            existing.setJoinedAt(LocalDateTime.now());
            existing.setLeftAt(null);
            existing.setUpdatedBy(userNo);
            groupMemberMapper.updateGroupMember(existing);

            paramData.put("stdtId", existing.getStdtId());
            paramData.put("memberId", existing.getId());

            log.info("회원 그룹 재가입: groupId={}, userNo={}, memberId={}", groupId, userNo, existing.getId());
            return paramData;
        }

        Integer maxNo = groupMemberMapper.findMaxMemberNoByGroupId(groupId);
        int memberNo = (maxNo != null ? maxNo : 0) + 1;

        GroupMember member = GroupMember.builder()
                .groupId(groupId)
                .userNo(userNo)
                .stdtId(user.getStdtId())
                .nickname(user.getNickname())
                .gender(user.getGender())
                .email(user.getEmail())
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

        log.info("회원 그룹 참가: groupId={}, userNo={}, memberNo={}", groupId, userNo, memberNo);
        return paramData;
    }

    @Transactional
    public Object joinGroupAsGuest(Map<String, Object> paramData) throws Exception {
        String email = (String) paramData.get("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }
        if (!emailVerificationService.isVerified(email)) {
            throw new IllegalArgumentException("이메일 인증이 필요합니다.");
        }

        User existingUser = userMapper.findByEmail(email);
        if (existingUser != null) {
            throw new IllegalArgumentException("이미 가입된 회원 이메일입니다. 회원으로 로그인하여 그룹에 참가해주세요.");
        }

        String inviteCode = (String) paramData.get("inviteCode");
        if (inviteCode == null || inviteCode.isBlank()) {
            throw new IllegalArgumentException("inviteCode는 필수입니다.");
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

        String gender = (String) paramData.get("gender");
        if (gender == null || gender.isBlank()) {
            throw new IllegalArgumentException("성별은 필수입니다.");
        }
        if (!"M".equals(gender) && !"F".equals(gender)) {
            throw new IllegalArgumentException("성별은 M 또는 F만 허용됩니다.");
        }

        String stdtId = IdGenerator.generateStdtId();

        Integer maxNo = groupMemberMapper.findMaxMemberNoByGroupId(groupId);
        int memberNo = (maxNo != null ? maxNo : 0) + 1;

        GroupMember member = GroupMember.builder()
                .groupId(groupId)
                .userNo(null)
                .stdtId(stdtId)
                .nickname((String) paramData.get("nickname"))
                .gender(gender)
                .email((String) paramData.get("email"))
                .memberNo(memberNo)
                .memberType(MemberType.GUEST)
                .status(MemberStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .createdBy(0L)
                .updatedBy(0L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        groupMemberMapper.insertGroupMember(member);

        paramData.put("stdtId", stdtId);
        paramData.put("memberId", member.getId());

        // 진행중인 검사가 있으면 restart 호출하여 게스트 검사 레코드 자동 생성
        Integer activeDgnssId = groupQueryMapper.findActiveDgnssId(groupInfo.getClaId());
        if (activeDgnssId != null) {
            String legacyGrade = SchoolLevel.fromCode(groupInfo.getSchoolLevel()).getLegacyGrade();
            Map<String, Object> restartParam = new HashMap<>();
            restartParam.put("dgnssId", activeDgnssId);
            restartParam.put("claId", groupInfo.getClaId());
            restartParam.put("grade", legacyGrade);
            dgnssService.tcDgnssRestart(restartParam);
            paramData.put("dgnssId", activeDgnssId);
            log.info("게스트 검사 자동 등록: dgnssId={}, stdtId={}", activeDgnssId, stdtId);
        }

        emailVerificationService.consumeVerification(email);

        // 게스트 토큰 발급 — Auth 서버 게스트 토큰 사용 (RT 없음)
        Map<String, Object> guestToken = guestAuthService.authenticateGuest(
                groupInfo.getInviteCode(), email, null, null);
        paramData.put("accessToken", guestToken.get("accessToken"));
        paramData.put("guestId", guestToken.get("guestId"));

        log.info("게스트 그룹 참가: groupId={}, email={}, memberNo={}", groupId, email, memberNo);
        return paramData;
    }

    @Transactional(readOnly = true)
    public Object findGroupList(Map<String, Object> paramData) throws Exception {
        Long userNo = ConvertUtils.toLong(paramData.get("userNo"));
        return groupQueryMapper.findGroupList(userNo);
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

        Map<String, Object> groupInfo = groupQueryMapper.findGroupDetail(groupId);
        returnMap.put("groupInfo", groupInfo);

        List<Map<String, Object>> memberList = groupQueryMapper.findGroupMemberList(groupId, offset, size);
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
        String hostNickname = (host != null) ? host.getNickname() : null;

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

}
