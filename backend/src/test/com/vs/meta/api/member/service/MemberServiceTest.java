package com.vs.meta.api.member.service;

import com.vs.meta.api.member.mapper.RefreshTokenMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.common.exception.AuthFailedException;
import com.vs.meta.common.exception.JwtExpiredException;
import com.vs.meta.common.security.JwtUtil;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.UserStatus;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private RefreshTokenMapper refreshTokenMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private EmailVerificationService emailVerificationService;

    @InjectMocks
    private MemberService memberService;

    @Test
    void createUser_createsTeacherAfterEmailVerification() throws Exception {
        Map<String, Object> paramData = new LinkedHashMap<>();
        paramData.put("password", "Pass1234!@");
        paramData.put("email", "teacher1@test.com");
        paramData.put("nickname", "Teacher");

        when(emailVerificationService.isVerified("teacher1@test.com")).thenReturn(true);
        when(passwordEncoder.encode("Pass1234!@")).thenReturn("encoded-password");

        Object result = memberService.createUser(paramData);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).insertUser(userCaptor.capture());
        verify(emailVerificationService).consumeVerification("teacher1@test.com");

        User saved = userCaptor.getValue();
        assertThat(saved.getPassword()).isEqualTo("encoded-password");
        assertThat(saved.getEmail()).isEqualTo("teacher1@test.com");
        assertThat(saved.getNickname()).isEqualTo("Teacher");
        assertThat(saved.getRoleCode()).isEqualTo("TEACHER");
        assertThat(saved.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(saved.getCreatedBy()).isEqualTo(0L);
        assertThat(saved.getUpdatedBy()).isEqualTo(0L);

        @SuppressWarnings("unchecked")
        Map<String, Object> resultMap = (Map<String, Object>) result;
        assertThat(resultMap)
                .containsEntry("email", "teacher1@test.com")
                .doesNotContainKey("password");
    }

    @Test
    void createUser_rejectsSignupWhenEmailNotVerified() {
        Map<String, Object> paramData = new LinkedHashMap<>();
        paramData.put("password", "Pass1234!@");
        paramData.put("email", "teacher1@test.com");
        paramData.put("nickname", "Teacher");

        when(emailVerificationService.isVerified("teacher1@test.com")).thenReturn(false);

        assertThatThrownBy(() -> memberService.createUser(paramData))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userMapper, never()).insertUser(any());
        verify(emailVerificationService, never()).consumeVerification(anyString());
    }

    @Test
    void login_returnsTokensAndUpdatesLastLogin() throws Exception {
        User user = User.builder()
                .userNo(1L)
                .password("encoded-password")
                .email("teacher1@test.com")
                .nickname("Teacher")
                .roleCode("TEACHER")
                .tcId("tc-001")
                .status(UserStatus.ACTIVE)
                .build();

        when(userMapper.findByEmailAndStatus("teacher1@test.com", UserStatus.ACTIVE.name())).thenReturn(user);
        when(passwordEncoder.matches("Pass1234!@", "encoded-password")).thenReturn(true);
        when(jwtUtil.generateAccessToken(eq(1L), eq("teacher1@test.com"), eq("T"), anyString())).thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(eq(1L), eq("teacher1@test.com"), eq("T"), anyString())).thenReturn("refresh-token");

        Map<String, Object> result = memberService.login("teacher1@test.com", "Pass1234!@", "TestAgent", "127.0.0.1");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).updateUser(userCaptor.capture());

        assertThat(userCaptor.getValue().getLastLoginAt()).isNotNull();
        assertThat(result)
                .containsEntry("email", "teacher1@test.com")
                .containsEntry("userNo", 1L)
                .containsEntry("accessToken", "access-token")
                .containsEntry("refreshToken", "refresh-token")
                .containsEntry("tcId", "tc-001");
    }

    @Test
    void login_rejectsWrongPassword() {
        User user = User.builder()
                .userNo(1L)
                .password("encoded-password")
                .email("teacher1@test.com")
                .status(UserStatus.ACTIVE)
                .build();

        when(userMapper.findByEmailAndStatus("teacher1@test.com", UserStatus.ACTIVE.name())).thenReturn(user);
        when(passwordEncoder.matches("WrongPass1!", "encoded-password")).thenReturn(false);

        assertThatThrownBy(() -> memberService.login("teacher1@test.com", "WrongPass1!", "TestAgent", "127.0.0.1"))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userMapper, never()).updateUser(any());
    }

    @Test
    void refreshToken_convertsExpiredJwtIntoAuthFailure() {
        when(jwtUtil.getAllClaimsFromToken("expired-refresh-token"))
                .thenThrow(new JwtExpiredException("expired"));

        assertThatThrownBy(() -> memberService.refreshToken("expired-refresh-token"))
                .isInstanceOf(AuthFailedException.class)
                .hasMessageContaining("refreshToken");
    }
}
