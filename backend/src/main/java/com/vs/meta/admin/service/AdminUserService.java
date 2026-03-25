package com.vs.meta.admin.service;

import com.vs.meta.admin.mapper.AuthSchoolMapMapper;
import com.vs.meta.admin.mapper.RoleGroupMapper;
import com.vs.meta.api.member.mapper.RefreshTokenMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.school.mapper.SchoolInfoMapper;
import com.vs.meta.domain.AuthSchoolMap;
import com.vs.meta.domain.RoleGroup;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vs.meta.common.utils.IdGenerator;
import com.vs.meta.common.utils.PageUtil;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserMapper userMapper;
    private final RoleGroupMapper roleGroupMapper;
    private final AuthSchoolMapMapper authSchoolMapMapper;
    private final SchoolInfoMapper schoolInfoMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final PasswordEncoder passwordEncoder;

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
     * 관리자 email로 userNo를 조회
     */
    @Transactional(readOnly = true)
    public Long resolveAdminUserNo(String adminEmail) {
        User admin = userMapper.findByEmailAndStatus(adminEmail, UserStatus.ACTIVE.name());
        return (admin != null) ? admin.getUserNo() : 0L;
    }

    /**
     * 관리자가 직접 계정 등록 (이메일 인증 스킵)
     */
    @Transactional
    public void createUserByAdmin(String password, String email,
                                   String nickname, String gender, String roleCode, Long adminUserNo) {
        if (userMapper.findByEmail(email) != null) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + email);
        }

        String tcId = null;
        String stdtId = null;
        if (IdGenerator.isTeacherRole(roleCode)) {
            tcId = IdGenerator.generateTcId();
        } else if ("STUDENT".equals(roleCode)) {
            stdtId = IdGenerator.generateStdtId();
        }

        User user = User.builder()
                .password(passwordEncoder.encode(password))
                .email(email)
                .nickname(nickname)
                .gender(gender)
                .roleCode(roleCode)
                .tcId(tcId)
                .stdtId(stdtId)
                .status(UserStatus.ACTIVE)
                .createdBy(adminUserNo)
                .updatedBy(adminUserNo)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        userMapper.insertUser(user);
        log.info("관리자 계정 등록: email={}, roleCode={}, by={}", email, roleCode, adminUserNo);
    }

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

        // 계정 정지/탈퇴 시 refreshToken 전체 삭제 → 30분 내 강제 로그아웃
        if ("SUSPENDED".equals(newStatus) || "WITHDRAWN".equals(newStatus)) {
            refreshTokenMapper.deleteByUserNo(userNo);
            log.info("계정 정지/탈퇴로 refreshToken 전체 삭제: userNo={}", userNo);
        }
        log.info("상태 변경: userNo={}, newStatus={}, by={}", userNo, newStatus, adminUserNo);
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
}
