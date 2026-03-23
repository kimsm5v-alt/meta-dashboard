package com.vs.meta.api.member.service;

import com.vs.meta.api.member.mapper.EmailVerificationMapper;
import com.vs.meta.common.utils.NcpMailSender;
import com.vs.meta.domain.EmailVerification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final NcpMailSender ncpMailSender;
    private final EmailVerificationMapper verificationMapper;

    private static final int CODE_TTL_MINUTES = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    @Transactional
    public void sendCode(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }

        // 재발송 쿨다운 체크
        EmailVerification existing = verificationMapper.findLatestByEmail(email);
        if (existing != null && !existing.getVerified()
                && existing.getExpiresAt().isAfter(LocalDateTime.now())
                && existing.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
            throw new IllegalStateException("1분 후에 다시 시도해주세요.");
        }

        String code = generateCode();
        LocalDateTime now = LocalDateTime.now();

        // 기존 미인증 레코드 삭제 후 새로 INSERT
        verificationMapper.deleteByEmail(email);
        EmailVerification verification = EmailVerification.builder()
                .email(email)
                .code(code)
                .verified(false)
                .expiresAt(now.plusMinutes(CODE_TTL_MINUTES))
                .createdAt(now)
                .build();
        verificationMapper.insertVerification(verification);

        ncpMailSender.sendVerificationCode(email, code);
        log.info("인증코드 발송: email={}", email);
    }

    @Transactional
    public void verifyCode(String email, String inputCode) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }
        if (inputCode == null || inputCode.isBlank()) {
            throw new IllegalArgumentException("인증코드는 필수입니다.");
        }

        EmailVerification stored = verificationMapper.findLatestByEmail(email);
        if (stored == null || stored.getVerified()
                || stored.getExpiresAt().isBefore(LocalDateTime.now())
                || !stored.getCode().equals(inputCode)) {
            throw new IllegalArgumentException("인증코드가 유효하지 않습니다.");
        }

        verificationMapper.markVerified(email);
        log.info("이메일 인증 완료: email={}", email);
    }

    @Transactional(readOnly = true)
    public boolean isVerified(String email) {
        EmailVerification latest = verificationMapper.findLatestByEmail(email);
        return latest != null && latest.getVerified();
    }

    @Transactional
    public void consumeVerification(String email) {
        verificationMapper.deleteByEmail(email);
    }

    private String generateCode() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }
}
