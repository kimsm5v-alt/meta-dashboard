package com.vs.meta.api.sso.service;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.common.utils.IdGenerator;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * SSO 신규 회원 가입 서비스.
 *
 * <p>Auth 서버에서 가입한 신규 사용자를 학심정 user 테이블에 insert한다.
 * 추가 정보(roleCode) 입력 후 호출된다. 성별은 회원가입 시 받지 않고
 * 심리검사 시작 시점에 별도 수집하는 정책으로 변경 (Phase 1 — gender 컬럼 정리).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SsoUserRegistrationService {

    private final UserMapper userMapper;

    /**
     * 학심정 user 신규 생성.
     *
     * @param spUser   SP JWT에서 추출한 사용자 정보
     * @param roleCode 역할 (TEACHER/STUDENT) — userType이 UNSET이면 FE에서 전달
     */
    @Transactional
    public User register(SpAuthenticatedUser spUser, String roleCode) {
        User existing = userMapper.findBySpUserId(spUser.spUserId());
        if (existing != null) {
            throw new IllegalStateException("이미 등록된 사용자입니다: " + spUser.spUserId());
        }

        String finalRoleCode = roleCode;
        if (finalRoleCode == null || finalRoleCode.isBlank()) {
            finalRoleCode = mapUserType(spUser.userType());
        }

        String tcId = null;
        String stdtId = null;
        if (IdGenerator.isTeacherRole(finalRoleCode)) {
            tcId = IdGenerator.generateTcId();
        } else if ("STUDENT".equals(finalRoleCode)) {
            stdtId = IdGenerator.generateStdtId();
        }

        User user = User.builder()
                .spUserId(spUser.spUserId())
                .roleCode(finalRoleCode)
                .tcId(tcId)
                .stdtId(stdtId)
                .status(UserStatus.ACTIVE)
                .lastLoginAt(LocalDateTime.now())
                .createdBy(0L)
                .updatedBy(0L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userMapper.insertUser(user);
        log.info("SSO 신규 사용자 생성: userNo={}, spUserId={}, roleCode={}",
                user.getUserNo(), spUser.spUserId(), finalRoleCode);
        return user;
    }

    /** SP userType → 학심정 roleCode 매핑 (UNSET 등은 기본값 TEACHER) */
    private String mapUserType(String userType) {
        if (userType == null) return "TEACHER";
        switch (userType) {
            case "TEACHER": return "TEACHER";
            case "STUDENT": return "STUDENT";
            case "ADMIN":   return "ADMIN";
            default:        return "TEACHER";
        }
    }
}
