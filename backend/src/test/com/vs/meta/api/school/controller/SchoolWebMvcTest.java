package com.vs.meta.api.school.controller;

import com.vs.meta.api.school.service.SchoolSyncService;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SchoolController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, GlobalExceptionHandler.class})
class SchoolWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SchoolSyncService schoolSyncService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private AdminUserDetailsService adminUserDetailsService;

    @Test
    void importSchools_isAccessibleWithoutAuthentication() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "schools.csv", "text/csv",
                "SD_SCHUL_CODE,SCHUL_NM,SCHUL_KND_SC_NM\n7010569,비상초등학교,초등학교".getBytes());

        when(schoolSyncService.importSchools(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new SchoolSyncService.SchoolImportResult("schools.csv", 1, 1, 0, 0, 0, List.of(), 1L));

        mockMvc.perform(multipart("/school/import").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void importSchools_acceptsAuthenticatedUpload() throws Exception {
        Claims claims = Jwts.claims();
        claims.put("userNo", 1);
        claims.put("email", "teacher1@test.com");
        claims.put("userSeCd", "T");

        MockMultipartFile file = new MockMultipartFile("file", "schools.csv", "text/csv",
                "SD_SCHUL_CODE,SCHUL_NM,SCHUL_KND_SC_NM\n7010569,비상초등학교,초등학교".getBytes());

        when(jwtUtil.getAllClaimsFromToken("valid-token")).thenReturn(claims);
        when(schoolSyncService.importSchools(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new SchoolSyncService.SchoolImportResult("schools.csv", 1, 1, 0, 0, 0, List.of(), 1L));

        mockMvc.perform(multipart("/school/import")
                        .file(file)
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.resultData.sourceName").value("schools.csv"))
                .andExpect(jsonPath("$.resultData.upsertedCount").value(1));

        verify(schoolSyncService).importSchools(org.mockito.ArgumentMatchers.any());
    }
}
