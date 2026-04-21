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
 * SSO 로그인 시 학심정 user 자동 생성/동기화 서비스.
 *
 * <p>플로우:
 * <ol>
 *   <li>sp_user_id로 학심정 user 조회</li>
 *   <li>있으면: email/nickname 동기화 (JWT와 다르면 UPDATE) + userNo 반환</li>
 *   <li>없으면: null 반환 (추가 정보 입력 필요 → CompleteProfile)</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SsoUserService {

    private final UserMapper userMapper;

    /**
     * SP 사용자 ID로 학심정 user 조회.
     * 있으면 개인정보 동기화 후 반환, 없으면 null.
     */
    @Transactional
    public User findAndSyncUser(SpAuthenticatedUser spUser) {
        User user = userMapper.findBySpUserId(spUser.spUserId());

        // sp_user_id로 못 찾으면 email로 기존 회원 매칭 (마이그레이션 회원: sp_user_id가 NULL)
        if (user == null && spUser.email() != null && !spUser.email().isBlank()) {
            user = userMapper.findByEmail(spUser.email());
            if (user != null && user.getSpUserId() == null) {
                user.setSpUserId(spUser.spUserId());
                user.setUpdatedBy(user.getUserNo());
                user.setUpdatedAt(LocalDateTime.now());
                userMapper.updateUser(user);
                log.info("기존 회원 SSO 매핑 완료: userNo={}, spUserId={}, email={}", user.getUserNo(), spUser.spUserId(), spUser.email());
            } else if (user != null && user.getSpUserId() != null) {
                // email은 같지만 다른 sp_user_id가 이미 매핑된 경우 → 다른 사람
                user = null;
            }
        }

        if (user == null) {
            return null;
        }

        // 개인정보 동기화 (Auth JWT name/email이 변경되었을 수 있음)
        boolean changed = false;
        if (spUser.email() != null && !spUser.email().isBlank()
                && !spUser.email().equals(user.getEmail())) {
            user.setEmail(spUser.email());
            changed = true;
        }
        if (spUser.name() != null && !spUser.name().isBlank()
                && !spUser.name().equals(user.getNickname())) {
            user.setNickname(spUser.name());
            changed = true;
        }

        if (changed) {
            user.setUpdatedBy(user.getUserNo());
            user.setUpdatedAt(LocalDateTime.now());
            userMapper.updateUser(user);
            log.info("SSO 사용자 개인정보 동기화: userNo={}, spUserId={}", user.getUserNo(), spUser.spUserId());
        }

        // 마지막 로그인 시간 업데이트
        user.updateLastLogin();
        userMapper.updateUser(user);

        return user;
    }

    /**
     * 학심정 user 신규 생성 (추가 정보 입력 완료 후 호출).
     *
     * @param spUser   SP JWT에서 추출한 사용자 정보
     * @param gender   성별 (M/F) — 학심정 추가 수집
     * @param roleCode 역할 (TEACHER/STUDENT) — userType이 UNSET이면 추가 수집
     */
    @Transactional
    public User createUser(SpAuthenticatedUser spUser, String gender, String roleCode) {
        // 이미 존재하면 에러
        User existing = userMapper.findBySpUserId(spUser.spUserId());
        if (existing != null) {
            throw new IllegalStateException("이미 등록된 사용자입니다: " + spUser.spUserId());
        }

        // roleCode 결정: JWT userType이 UNSET이 아니면 그대로 사용
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
                .email(spUser.email() != null ? spUser.email() : "")
                .nickname(spUser.name() != null ? spUser.name() : "")
                .gender(gender)
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
        log.info("SSO 신규 사용자 생성: userNo={}, spUserId={}, roleCode={}", user.getUserNo(), spUser.spUserId(), finalRoleCode);
        return user;
    }

    /**
     * SP userType → 학심정 roleCode 매핑
     */
    private String mapUserType(String userType) {
        if (userType == null) return "TEACHER";
        switch (userType) {
            case "TEACHER": return "TEACHER";
            case "STUDENT": return "STUDENT";
            case "ADMIN": return "ADMIN";
            default: return "TEACHER"; // UNSET 등
        }
    }
}
