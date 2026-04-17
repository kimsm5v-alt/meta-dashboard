package com.vs.meta.admin.service;

import com.vs.meta.admin.mapper.AuthSchoolMapMapper;
import com.vs.meta.admin.mapper.RoleGroupMapper;
import com.vs.meta.api.dgnss.mapper.DgnssMapper;
import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.group.mapper.GroupQueryMapper;
import com.vs.meta.admin.mapper.AdminAccountMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.school.mapper.SchoolInfoMapper;
import com.vs.meta.common.utils.IdGenerator;
import com.vs.meta.common.utils.NcpMailSender;
import com.vs.meta.domain.AdminAccount;
import com.vs.meta.domain.AuthSchoolMap;
import com.vs.meta.domain.GroupInfo;
import com.vs.meta.domain.RoleGroup;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.MemberType;
import com.vs.meta.domain.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vs.meta.common.utils.IdGenerator;
import com.vs.meta.common.utils.PageUtil;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserMapper userMapper;
    private final RoleGroupMapper roleGroupMapper;
    private final AuthSchoolMapMapper authSchoolMapMapper;
    private final SchoolInfoMapper schoolInfoMapper;
    private final AdminAccountMapper adminAccountMapper;
    private final PasswordEncoder passwordEncoder;
    private final GroupInfoMapper groupInfoMapper;
    private final GroupQueryMapper groupQueryMapper;
    private final DgnssMapper dgnssMapper;
    private final NcpMailSender ncpMailSender;

    // ===== 사용자 관리 =====

    @Transactional(readOnly = true)
    public List<User> findAllUsers() {
        return userMapper.findAllUsers();
    }

    @Transactional(readOnly = true)
    public List<User> findUsersPaged(String keyword, String roleCode, String status, int page, int size) {
        return userMapper.findUsersPaged(keyword, roleCode, status, size, PageUtil.offsetOneIndexed(page, size));
    }

    @Transactional(readOnly = true)
    public long countUsers(String keyword, String roleCode, String status) {
        return userMapper.countUsersPaged(keyword, roleCode, status);
    }

    @Transactional(readOnly = true)
    public User findUserByEmail(String email) {
        return userMapper.findByEmailAndStatus(email, UserStatus.ACTIVE.name());
    }

    @Transactional(readOnly = true)
    public User findUserByUserNo(Long userNo) {
        return userMapper.findByUserNo(userNo);
    }

    /**
     * 관리자 email로 admin ID를 조회
     */
    @Transactional(readOnly = true)
    public Long resolveAdminUserNo(String adminEmail) {
        AdminAccount admin = adminAccountMapper.findByEmail(adminEmail);
        return (admin != null) ? admin.getId() : 0L;
    }

    // createUserByAdmin 제거 — SSO 전환 후 회원 생성은 Auth 서버에서만 가능

    /**
     * 역할 변경 (승격/강등)
     */
    @Transactional
    public void updateUserRole(Long userNo, String newRoleCode, Long adminUserNo) {
        User user = userMapper.findByUserNo(userNo);
        if (user == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: userNo=" + userNo);
        }
        user.setRoleCode(newRoleCode);
        user.setUpdatedBy(adminUserNo);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateUser(user);
        log.info("역할 변경: userNo={}, newRole={}, by={}", userNo, newRoleCode, adminUserNo);
    }

    /**
     * 상태 변경 (ACTIVE/WITHDRAWN/SUSPENDED)
     */
    @Transactional
    public void updateUserStatus(Long userNo, String newStatus, Long adminUserNo) {
        User user = userMapper.findByUserNo(userNo);
        if (user == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다: userNo=" + userNo);
        }
        user.setStatus(UserStatus.valueOf(newStatus));
        user.setUpdatedBy(adminUserNo);
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.updateUser(user);

        // SSO 전환 후: refresh_token은 Auth 서버가 관리
        // 계정 정지/탈퇴 시 Auth 서버 AT 만료(15분) 후 자연 로그아웃
        log.info("상태 변경: userNo={}, newStatus={}, by={}", userNo, newStatus, adminUserNo);
    }

    // ===== 비밀번호 초기화 =====

    // ===== Admin 계정 비밀번호 초기화 (admin_account 전용) =====

    /**
     * Admin 비밀번호 초기화 (admin_account 테이블).
     * 일반 회원은 Auth 서버가 비밀번호 관리 → 학심정에서 초기화 불가.
     */
    @Transactional
    public String resetAdminPassword(Long adminId) {
        AdminAccount admin = adminAccountMapper.findById(adminId);
        if (admin == null) {
            throw new IllegalArgumentException("존재하지 않는 관리자 계정입니다.");
        }

        String tempPassword = generateTempPassword();
        String encoded = passwordEncoder.encode(tempPassword);

        adminAccountMapper.updatePassword(adminId, encoded);

        log.info("Admin 비밀번호 초기화: adminId={}", adminId);
        return tempPassword;
    }

    /**
     * Admin 임시 비밀번호 이메일 발송
     */
    public void sendAdminTempPasswordEmail(Long adminId, String tempPassword) {
        AdminAccount admin = adminAccountMapper.findById(adminId);
        if (admin == null) {
            throw new IllegalArgumentException("존재하지 않는 관리자 계정입니다.");
        }

        ncpMailSender.sendTempPassword(admin.getEmail(), tempPassword);
        log.info("Admin 임시 비밀번호 이메일 발송: adminId={}, email={}", adminId, admin.getEmail());
    }

    /**
     * 랜덤 임시 비밀번호 생성 (10자: 대문자2 + 소문자4 + 숫자2 + 특수문자2)
     */
    private String generateTempPassword() {
        SecureRandom random = new SecureRandom();
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghjkmnpqrstuvwxyz";
        String digits = "23456789";
        String special = "!@#$%&*";

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 2; i++) sb.append(upper.charAt(random.nextInt(upper.length())));
        for (int i = 0; i < 4; i++) sb.append(lower.charAt(random.nextInt(lower.length())));
        for (int i = 0; i < 2; i++) sb.append(digits.charAt(random.nextInt(digits.length())));
        for (int i = 0; i < 2; i++) sb.append(special.charAt(random.nextInt(special.length())));

        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }
        return new String(chars);
    }

    // ===== 역할 관리 =====

    @Transactional(readOnly = true)
    public List<RoleGroup> findAllRoles() {
        return roleGroupMapper.findAllOrderByLevelDesc();
    }

    @Transactional(readOnly = true)
    public List<RoleGroup> findRolesPaged(int page, int size) {
        return roleGroupMapper.findRolesPaged(size, PageUtil.offsetOneIndexed(page, size));
    }

    @Transactional(readOnly = true)
    public long countRoles() {
        return roleGroupMapper.countRoles();
    }

    @Transactional
    public void upsertRole(RoleGroup roleGroup) {
        roleGroupMapper.upsertRole(roleGroup);
    }

    // ===== 학교 매핑 =====

    @Transactional(readOnly = true)
    public List<AuthSchoolMap> findSchoolMappings(Long userNo) {
        return authSchoolMapMapper.findActiveByUserNo(userNo);
    }

    @Transactional
    public void assignSchool(Long userNo, String schoolCode, Long adminUserNo) {
        if (!schoolInfoMapper.existsBySchoolCode(schoolCode)) {
            throw new IllegalArgumentException("존재하지 않는 학교코드입니다: " + schoolCode);
        }
        AuthSchoolMap mapping = AuthSchoolMap.builder()
                .userNo(userNo)
                .schoolCode(schoolCode)
                .grantedBy(adminUserNo)
                .status("ACTIVE")
                .createdBy(adminUserNo)
                .updatedBy(adminUserNo)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        authSchoolMapMapper.upsertAuthSchoolMap(mapping);
        log.info("학교 매핑 추가: userNo={}, schoolCode={}, by={}", userNo, schoolCode, adminUserNo);
    }

    @Transactional
    public int assignSchools(Long userNo, List<String> schoolCodes, Long adminUserNo) {
        int count = 0;
        LocalDateTime now = LocalDateTime.now();
        for (String schoolCode : schoolCodes) {
            if (!schoolInfoMapper.existsBySchoolCode(schoolCode)) {
                log.warn("학교 매핑 스킵 (존재하지 않는 학교코드): userNo={}, schoolCode={}", userNo, schoolCode);
                continue;
            }
            AuthSchoolMap mapping = AuthSchoolMap.builder()
                    .userNo(userNo)
                    .schoolCode(schoolCode)
                    .grantedBy(adminUserNo)
                    .status("ACTIVE")
                    .createdBy(adminUserNo)
                    .updatedBy(adminUserNo)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
            authSchoolMapMapper.upsertAuthSchoolMap(mapping);
            count++;
        }
        log.info("학교 배치 매핑: userNo={}, requested={}, assigned={}, by={}", userNo, schoolCodes.size(), count, adminUserNo);
        return count;
    }

    @Transactional
    public void revokeAllSchoolMappings(Long userNo, Long adminUserNo) {
        authSchoolMapMapper.revokeAllByUserNo(userNo, adminUserNo);
        log.info("학교 매핑 전체 해제: userNo={}, by={}", userNo, adminUserNo);
    }

    @Transactional
    public void revokeSchoolMapping(Long userNo, String schoolCode, Long adminUserNo) {
        authSchoolMapMapper.revokeByUserNoAndSchoolCode(userNo, schoolCode, adminUserNo);
        log.info("학교 매핑 개별 해제: userNo={}, schoolCode={}, by={}", userNo, schoolCode, adminUserNo);
    }

    // ===== API 테스트 보조 =====

    @Transactional(readOnly = true)
    public List<Map<String, Object>> findApiTestTeachers() {
        return userMapper.findAllUsers().stream()
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .filter(user -> IdGenerator.isTeacherRole(user.getRoleCode()))
                .filter(user -> user.getTcId() != null && !user.getTcId().isBlank())
                .map(user -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("userNo", user.getUserNo());
                    item.put("email", user.getEmail());
                    item.put("nickname", user.getNickname());
                    item.put("roleCode", user.getRoleCode());
                    item.put("tcId", user.getTcId());
                    return item;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> findApiTestGroupsByTeacher(Long teacherUserNo) {
        return groupInfoMapper.findActiveGroupsByHostUserNo(teacherUserNo).stream()
                .map(group -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("groupId", group.getGroupId());
                    item.put("claId", group.getClaId());
                    item.put("groupNm", group.getGroupNm());
                    item.put("schoolName", group.getSchoolName());
                    item.put("schoolLevel", group.getSchoolLevel());
                    item.put("grade", group.getGrade());
                    item.put("classNumber", group.getClassNumber());
                    item.put("inviteCode", group.getInviteCode());
                    return item;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> findApiTestGroupMembers(String claId) {
        GroupInfo groupInfo = groupInfoMapper.findByClaId(claId);
        if (groupInfo == null) {
            throw new IllegalArgumentException("그룹을 찾을 수 없습니다: " + claId);
        }

        User teacher = userMapper.findByUserNo(groupInfo.getHostUserNo());
        List<Map<String, Object>> students = groupQueryMapper.findGroupMemberList(groupInfo.getGroupId(), 0, 500).stream()
                .filter(member -> member.get("stdtId") != null)
                .filter(member -> "ACTIVE".equals(member.get("status")))
                .filter(member -> MemberType.STUDENT.name().equals(member.get("memberType")) || MemberType.GUEST.name().equals(member.get("memberType")))
                .collect(Collectors.toList());

        Map<String, Object> teacherInfo = new LinkedHashMap<>();
        teacherInfo.put("userNo", groupInfo.getHostUserNo());
        teacherInfo.put("nickname", teacher != null ? teacher.getNickname() : null);
        teacherInfo.put("tcId", teacher != null ? teacher.getTcId() : null);
        teacherInfo.put("roleCode", teacher != null ? teacher.getRoleCode() : null);

        Map<String, Object> groupData = new LinkedHashMap<>();
        groupData.put("groupId", groupInfo.getGroupId());
        groupData.put("claId", groupInfo.getClaId());
        groupData.put("groupNm", groupInfo.getGroupNm());
        groupData.put("schoolName", groupInfo.getSchoolName());
        groupData.put("schoolLevel", groupInfo.getSchoolLevel());
        groupData.put("grade", groupInfo.getGrade());
        groupData.put("classNumber", groupInfo.getClassNumber());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("teacher", teacherInfo);
        result.put("group", groupData);
        result.put("students", students);
        return result;
    }

    @Transactional
    public Map<String, Object> fillRandomDgnssAnswers(int omrIdx, int paperIdx) {
        if (omrIdx <= 0) {
            throw new IllegalArgumentException("omrIdx가 올바르지 않습니다.");
        }
        if (paperIdx != 1 && paperIdx != 2) {
            throw new IllegalArgumentException("paperIdx는 1 또는 2만 가능합니다.");
        }

        int maxQuestionNo = paperIdx == 1 ? 124 : 77;
        int updatedCount = 0;

        for (int no = 1; no <= maxQuestionNo; no++) {
            Map<String, Object> param = new HashMap<>();
            param.put("omrIdx", omrIdx);
            param.put("no", no);
            param.put("answer", ThreadLocalRandom.current().nextInt(1, 6));
            updatedCount += dgnssMapper.updateStntAnswer(param);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("omrIdx", omrIdx);
        result.put("paperIdx", paperIdx);
        result.put("questionCount", maxQuestionNo);
        result.put("updatedCount", updatedCount);
        result.put("success", updatedCount == maxQuestionNo ? "success" : "partial");
        return result;
    }
}
