package com.vs.meta.api.member.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vs.meta.api.member.service.EmailVerificationService;
import com.vs.meta.api.member.service.MemberService;
import com.vs.meta.common.config.GlobalExceptionHandler;
import com.vs.meta.common.config.JwtAuthenticationFilter;
import com.vs.meta.common.config.SecurityConfig;
import com.vs.meta.admin.service.AdminUserDetailsService;
import com.vs.meta.common.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {MemberController.class, EmailVerificationController.class})
@AutoConfigureMockMvc(addFilters = true)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class MemberWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MemberService memberService;

    @MockBean
    private EmailVerificationService emailVerificationService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private AdminUserDetailsService adminUserDetailsService;

    @Test
    void login_isAccessibleWithoutAuthentication() throws Exception {
        when(memberService.login(eq("teacher1@test.com"), eq("Pass1234!"), any(), any()))
                .thenReturn(Map.of("email", "teacher1@test.com", "userNo", 1L, "accessToken", "access-token"));

        mockMvc.perform(post("/member/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "teacher1@test.com",
                                "password", "Pass1234!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.resultCode").value(200))
                .andExpect(jsonPath("$.resultData.email").value("teacher1@test.com"))
                .andExpect(jsonPath("$.resultData.accessToken").value("access-token"));
    }

    @Test
    void sendCode_isAccessibleWithoutAuthentication() throws Exception {
        mockMvc.perform(post("/member/send-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "user@test.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.resultCode").value(200));

        verify(emailVerificationService).sendCode("user@test.com");
    }

    @Test
    void memberInfo_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/member/info"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.resultCode").value(401))
                .andExpect(jsonPath("$.errorCode").value("AUTH_REQUIRED"));
    }

    @Test
    void memberInfo_usesAuthenticatedUserFromBearerToken() throws Exception {
        Claims claims = Jwts.claims();
        claims.put("userNo", 1L);
        claims.put("email", "teacher1@test.com");
        claims.put("userSeCd", "T");

        when(jwtUtil.getAllClaimsFromToken("valid-token")).thenReturn(claims);
        when(memberService.findMemberInfo(1L))
                .thenReturn(Map.of("userNo", 1L, "email", "teacher1@test.com", "nickname", "Teacher"));

        mockMvc.perform(get("/member/info")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.resultData.email").value("teacher1@test.com"))
                .andExpect(jsonPath("$.resultData.nickname").value("Teacher"));

        verify(memberService).findMemberInfo(1L);
        verify(jwtUtil).getAllClaimsFromToken("valid-token");
    }
}
