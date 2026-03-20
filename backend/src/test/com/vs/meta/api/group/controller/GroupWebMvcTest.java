package com.vs.meta.api.group.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vs.meta.api.group.service.GroupService;
import com.vs.meta.common.config.GlobalExceptionHandler;
import com.vs.meta.common.config.JwtAuthenticationFilter;
import com.vs.meta.common.config.SecurityConfig;
import com.vs.meta.admin.service.AdminUserDetailsService;
import com.vs.meta.common.security.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = GroupController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class GroupWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GroupService groupService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private AdminUserDetailsService adminUserDetailsService;

    @Test
    void createGroup_requiresAuthentication() throws Exception {
        mockMvc.perform(post("/group/create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "groupNm", "6-2",
                                "schoolLevel", "elementary",
                                "grade", "6",
                                "classNumber", 2
                        ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("AUTH_REQUIRED"));
    }

    @Test
    void createGroup_usesAuthenticatedUserNoFromJwt() throws Exception {
        Claims claims = Jwts.claims();
        claims.put("userNo", 1);
        claims.put("email", "teacher1@test.com");
        claims.put("userSeCd", "T");

        when(jwtUtil.getAllClaimsFromToken("valid-token")).thenReturn(claims);
        when(groupService.createGroup(anyMap())).thenReturn(Map.of("claId", "class-001", "inviteCode", "ABC123"));

        mockMvc.perform(post("/group/create")
                        .header("Authorization", "Bearer valid-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "groupNm", "6-2",
                                "schoolLevel", "elementary",
                                "grade", "6",
                                "classNumber", 2
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.resultData.claId").value("class-001"))
                .andExpect(jsonPath("$.resultData.inviteCode").value("ABC123"));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> captor = ArgumentCaptor.forClass(Map.class);
        verify(groupService).createGroup(captor.capture());
        assertThat(captor.getValue()).containsEntry("userNo", 1L);
    }

    @Test
    void joinGuest_isAccessibleWithoutAuthentication() throws Exception {
        when(groupService.joinGroupAsGuest(anyMap())).thenReturn(Map.of("memberId", 1L, "stdtId", "guest-001"));

        mockMvc.perform(post("/group/join-guest")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "inviteCode", "ABC123",
                                "nickname", "Guest",
                                "email", "guest@test.com"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.resultData.memberId").value(1))
                .andExpect(jsonPath("$.resultData.stdtId").value("guest-001"));
    }
}
