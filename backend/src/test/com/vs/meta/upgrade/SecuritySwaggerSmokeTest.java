package com.vs.meta.upgrade;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * springdoc 2.8.6 + Spring Security 7 동작 smoke test.
 *
 * <ul>
 *   <li>/swagger-ui/index.html, /v3/api-docs, /actuator/health → 200</li>
 *   <li>보호 엔드포인트 무토큰 → 401 (OAuth2 RS 동작)</li>
 *   <li>public 엔드포인트 → 5xx 아님 (라우팅/필터 wiring 검증)</li>
 * </ul>
 *
 * <p>실 DB 환경변수 (META_API_DATASOURCE_MASTER_URL) 가 주입된 환경에서만 활성화.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@EnabledIfEnvironmentVariable(named = "META_API_DATASOURCE_MASTER_URL", matches = ".+")
class SecuritySwaggerSmokeTest {

    @Autowired TestRestTemplate rest;

    @Test
    void swaggerUiServes() {
        ResponseEntity<String> res = rest.getForEntity("/swagger-ui/index.html", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void openApiSpecServes() {
        ResponseEntity<String> res = rest.getForEntity("/v3/api-docs", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().length()).isGreaterThan(500);
    }

    @Test
    void actuatorHealth() {
        ResponseEntity<String> res = rest.getForEntity("/actuator/health", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void protectedEndpointReturns401WithoutToken() {
        // 임의의 보호 엔드포인트 (P0 인벤토리에서 1개 — /member/info 는 JWT 필요)
        ResponseEntity<String> res = rest.getForEntity("/member/info", String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void publicHealthIsNot5xx() {
        // permitAll 엔드포인트가 5xx 가 아니어야 함 (라우팅/필터 wiring 검증)
        ResponseEntity<String> res = rest.getForEntity("/actuator/health", String.class);
        assertThat(res.getStatusCode().is5xxServerError()).isFalse();
    }
}
