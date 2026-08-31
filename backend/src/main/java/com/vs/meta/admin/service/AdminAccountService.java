package com.vs.meta.admin.service;

import com.vs.meta.admin.mapper.AdminAccountMapper;
import com.vs.meta.domain.AdminAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * 관리자 계정 관리(SUPER_ADMIN 전용).
 * 생성 시 임시비밀번호는 {@code {아이디}!12} 고정 + 최초 로그인 변경 필요(must_change_password='Y').
 * 본인 계정의 상태/권한 변경은 잠금 방지를 위해 차단한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAccountService {

    private static final Set<String> ROLES = Set.of("SUPER_ADMIN", "ADMIN");
    private static final Set<String> STATUSES = Set.of("ACTIVE", "SUSPENDED");

    private final AdminAccountMapper mapper;
    private final PasswordEncoder passwordEncoder;

    /** 임시비밀번호 규칙: 아이디 + "!12". */
    public static String tempPasswordOf(String loginId) {
        return loginId + "!12";
    }

    @Transactional
    public void create(String loginId, String nickname, String role) {
        loginId = StringUtils.trimToEmpty(loginId);
        nickname = StringUtils.trimToEmpty(nickname);
        if (loginId.isEmpty()) {
            throw new IllegalArgumentException("아이디는 필수입니다.");
        }
        if (StringUtils.containsWhitespace(loginId)) {
            throw new IllegalArgumentException("아이디에 공백을 포함할 수 없습니다.");
        }
        if (nickname.isEmpty()) {
            throw new IllegalArgumentException("이름은 필수입니다.");
        }
        if (!ROLES.contains(role)) {
            throw new IllegalArgumentException("올바르지 않은 권한입니다: " + role);
        }
        if (mapper.countByEmail(loginId) > 0) {
            throw new IllegalStateException("이미 존재하는 아이디입니다: " + loginId);
        }

        AdminAccount account = AdminAccount.builder()
                .email(loginId)
                .nickname(nickname)
                .role(role)
                .password(passwordEncoder.encode(tempPasswordOf(loginId)))
                .status("ACTIVE")
                .mustChangePassword("Y")
                .build();
        mapper.insert(account);
        log.info("[AdminAccount] 생성: loginId={}, role={}", loginId, role);
    }

    /** 비밀번호 초기화 → 임시비밀번호(평문) 반환(화면 안내용). */
    @Transactional
    public String resetPassword(Long id) {
        AdminAccount account = mapper.findById(id);
        if (account == null) {
            throw new IllegalArgumentException("존재하지 않는 계정입니다.");
        }
        String tempPassword = tempPasswordOf(account.getEmail());
        mapper.updatePasswordAndFlag(id, passwordEncoder.encode(tempPassword), "Y");
        log.info("[AdminAccount] 비밀번호 초기화: id={}", id);
        return tempPassword;
    }

    @Transactional
    public void updateStatus(Long id, String status, Long actorId) {
        if (!STATUSES.contains(status)) {
            throw new IllegalArgumentException("올바르지 않은 상태입니다: " + status);
        }
        if (id.equals(actorId)) {
            throw new IllegalStateException("본인 계정의 상태는 변경할 수 없습니다.");
        }
        mapper.updateStatus(id, status);
        log.info("[AdminAccount] 상태 변경: id={}, status={}", id, status);
    }

    @Transactional
    public void updateRole(Long id, String role, Long actorId) {
        if (!ROLES.contains(role)) {
            throw new IllegalArgumentException("올바르지 않은 권한입니다: " + role);
        }
        if (id.equals(actorId)) {
            throw new IllegalStateException("본인 계정의 권한은 변경할 수 없습니다.");
        }
        mapper.updateRole(id, role);
        log.info("[AdminAccount] 권한 변경: id={}, role={}", id, role);
    }
}
