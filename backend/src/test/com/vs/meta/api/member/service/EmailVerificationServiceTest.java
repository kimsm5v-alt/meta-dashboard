package com.vs.meta.api.member.service;

import com.vs.meta.api.member.mapper.EmailVerificationMapper;
import com.vs.meta.common.utils.NcpMailSender;
import com.vs.meta.domain.EmailVerification;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private NcpMailSender ncpMailSender;

    @Mock
    private EmailVerificationMapper verificationMapper;

    @InjectMocks
    private EmailVerificationService emailVerificationService;

    @Test
    void sendCode_replacesExistingRecordAndSendsMail() {
        when(verificationMapper.findLatestByEmail("user@test.com")).thenReturn(null);

        emailVerificationService.sendCode("user@test.com");

        ArgumentCaptor<EmailVerification> captor = ArgumentCaptor.forClass(EmailVerification.class);
        verify(verificationMapper).deleteByEmail("user@test.com");
        verify(verificationMapper).insertVerification(captor.capture());
        verify(ncpMailSender).sendVerificationCode(org.mockito.ArgumentMatchers.eq("user@test.com"), anyString());

        EmailVerification saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("user@test.com");
        assertThat(saved.getVerified()).isFalse();
        assertThat(saved.getCode()).hasSize(6).matches("\\d{6}");
        assertThat(Duration.between(saved.getCreatedAt(), saved.getExpiresAt()).toMinutes()).isEqualTo(5);
    }

    @Test
    void sendCode_rejectsRapidResendInsideCooldown() {
        EmailVerification existing = EmailVerification.builder()
                .email("user@test.com")
                .code("123456")
                .verified(false)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        when(verificationMapper.findLatestByEmail("user@test.com")).thenReturn(existing);

        assertThatThrownBy(() -> emailVerificationService.sendCode("user@test.com"))
                .isInstanceOf(IllegalStateException.class);

        verify(verificationMapper, never()).deleteByEmail("user@test.com");
        verify(verificationMapper, never()).insertVerification(any());
        verify(ncpMailSender, never()).sendVerificationCode(anyString(), anyString());
    }

    @Test
    void verifyCode_marksLatestRecordVerified() {
        EmailVerification stored = EmailVerification.builder()
                .email("user@test.com")
                .code("654321")
                .verified(false)
                .createdAt(LocalDateTime.now().minusSeconds(10))
                .expiresAt(LocalDateTime.now().plusMinutes(3))
                .build();
        when(verificationMapper.findLatestByEmail("user@test.com")).thenReturn(stored);

        emailVerificationService.verifyCode("user@test.com", "654321");

        verify(verificationMapper).markVerified("user@test.com");
    }

    @Test
    void verifyCode_rejectsExpiredOrMismatchedCode() {
        EmailVerification stored = EmailVerification.builder()
                .email("user@test.com")
                .code("654321")
                .verified(false)
                .createdAt(LocalDateTime.now().minusMinutes(10))
                .expiresAt(LocalDateTime.now().minusSeconds(1))
                .build();
        when(verificationMapper.findLatestByEmail("user@test.com")).thenReturn(stored);

        assertThatThrownBy(() -> emailVerificationService.verifyCode("user@test.com", "000000"))
                .isInstanceOf(IllegalArgumentException.class);

        verify(verificationMapper, never()).markVerified("user@test.com");
    }

    @Test
    void consumeVerification_deletesVerificationRecord() {
        emailVerificationService.consumeVerification("user@test.com");

        verify(verificationMapper).deleteByEmail("user@test.com");
    }
}
