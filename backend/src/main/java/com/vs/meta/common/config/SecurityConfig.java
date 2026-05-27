package com.vs.meta.common.config;

import tools.jackson.databind.ObjectMapper;
import com.vs.meta.common.security.SpAuthenticatedUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * API 영역 보안 — SuperPlatform SSO JWT (RS256, JWKS 공개키 검증).
 *
 * <p>Spring Security 7 (Boot 4+) 호환 — {@code WebSecurityConfigurerAdapter} 제거,
 * {@link SecurityFilterChain} Bean + 람다 DSL 패턴.
 *
 * <p>CORS 는 {@link CorsConfig#corsConfigurationSource()} Bean 을 자동 인식.
 */
@Slf4j
@EnableWebSecurity
@Configuration
public class SecurityConfig {

    private final Environment env;
    private final SpUserMappingFilter spUserMappingFilter;
    private final MdcLoggingFilter mdcLoggingFilter;

    public SecurityConfig(Environment env,
                          SpUserMappingFilter spUserMappingFilter,
                          MdcLoggingFilter mdcLoggingFilter) {
        this.env = env;
        this.spUserMappingFilter = spUserMappingFilter;
        this.mdcLoggingFilter = mdcLoggingFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * MdcLoggingFilter 의 servlet chain 자동 등록 비활성화.
     *
     * <p>Spring Boot 는 @Component 로 등록된 Filter 빈을 자동으로 servlet chain 에 추가하는데,
     * 그렇게 되면 MdcLoggingFilter 가 SpUserMappingFilter 보다 먼저 실행되어 USER_NO request attribute
     * 가 아직 안 박힌 상태로 MDC.put 이 호출됨 → MDC 에 userNo 가 누락.
     *
     * <p>이 빈으로 자동 등록을 차단하고, {@link #apiSecurityFilterChain(HttpSecurity)} 에서
     * {@code addFilterBefore(mdcLoggingFilter, BearerTokenAuthenticationFilter.class)} 로만 등록되도록 한다.
     */
    @Bean
    public org.springframework.boot.web.servlet.FilterRegistrationBean<MdcLoggingFilter> mdcLoggingFilterRegistration(
            MdcLoggingFilter filter) {
        var reg = new org.springframework.boot.web.servlet.FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }

    /**
     * SpUserMappingFilter 도 동일 사유로 자동 등록 차단.
     * security chain 에서 BearerTokenAuthenticationFilter 다음에 명시적으로 등록되어야 SecurityContext 의
     * SpAuthenticatedUser 를 읽어 매핑할 수 있다 (servlet chain 에서 먼저 실행되면 SecurityContext 비어있음).
     */
    @Bean
    public org.springframework.boot.web.servlet.FilterRegistrationBean<SpUserMappingFilter> spUserMappingFilterRegistration(
            SpUserMappingFilter filter) {
        var reg = new org.springframework.boot.web.servlet.FilterRegistrationBean<>(filter);
        reg.setEnabled(false);
        return reg;
    }

    /**
     * Admin Thymeleaf UI 영역 — session 기반 form login (email + bcrypt).
     * c9b5afe(2026-05-21)에서 폐기됐다가 버그리포트 운영 기능을 위해 일부 부활.
     * {@code /admin/**} 경로만 매칭하므로 API JWT chain 과 분리.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain adminSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/admin/**")
            // Admin 은 same-origin Thymeleaf UI 라 CORS 불필요. 켜두면 브라우저가 자동으로 붙이는
            // Origin 헤더가 app.cors.allowed-origins 화이트리스트에 없을 때 "Invalid CORS request" 발생.
            .cors(cors -> cors.disable())
            // form login 에 필요한 _csrf 토큰은 Thymeleaf 폼에서 hidden input 으로 자동 전송
            .csrf(Customizer.withDefaults())
            .headers(headers -> headers
                .frameOptions(frame -> frame.disable())
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/admin/login").permitAll()
                .requestMatchers("/admin/css/**", "/admin/js/**", "/admin/images/**").permitAll()
                .anyRequest().hasRole("ADMIN")
            )
            .formLogin(form -> form
                .loginPage("/admin/login")
                .loginProcessingUrl("/admin/login")
                .usernameParameter("email")
                .passwordParameter("password")
                .defaultSuccessUrl("/admin/bug-reports", true)
                .failureUrl("/admin/login?error")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/admin/logout")
                .logoutSuccessUrl("/admin/login?logout")
                .deleteCookies("JSESSIONID")
                .permitAll()
            );
        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers
                .frameOptions(frame -> frame.disable())
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                auth
                    // SSO Auth 프록시 (public — SDK가 호출)
                    .requestMatchers("/api/v1/auth/**").permitAll()
                    // Neo4j 그래프 테스트 API (로컬 테스트 용도)
                    .requestMatchers("/api/dgnss/graph/**").permitAll()
                    // 게스트 관련 (public)
                    .requestMatchers("/guest/exists", "/guest/auth").permitAll()
                    // 그룹 초대/참가 (public)
                    .requestMatchers("/group/invite", "/group/join-guest").permitAll()
                    // 게스트 이메일 인증 (학심정 자체 유지)
                    .requestMatchers("/member/send-code", "/member/verify-code").permitAll()
                    // Swagger, health, static
                    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/viva/metric/prometheus").permitAll()
                    .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                    .requestMatchers("/", "/robots.txt", "/favicon.ico").permitAll()
                    .requestMatchers("/static/**").permitAll()
                    // 알림 기능 디버그 페이지 (HTML 자체는 정적 콘텐츠, 내부 API 호출은 JWT 필요)
                    // 컨트롤러 자체가 @Profile({"local","vs-dev"}) 라 vs-prod 에서는 자동으로 404
                    .requestMatchers("/dev/**").permitAll();

                if (isLocalProfileActive()) {
                    auth.anyRequest().permitAll();
                } else {
                    auth
                        // 추가 정보 입력 API (JWT 필요하지만 user 미생성 상태에서 호출)
                        .requestMatchers("/api/v1/user/complete-profile").authenticated()
                        .anyRequest().authenticated();
                }
            })
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    // JWT 검증 실패 사유를 운영 로그에 노출 — 만료/aud 불일치/issuer 불일치/JWKS 등
                    // 식별을 위해 WARN 로 사유 + cause 까지 남긴다. 사용자 식별자는 MDC 의 sp_user_id 로 추적.
                    String reason = authException.getMessage();
                    String causeMsg = authException.getCause() != null
                            ? authException.getCause().getMessage() : null;
                    log.warn("[AUTH] 401: path={}, reason={}, cause={}",
                            request.getRequestURI(), reason, causeMsg);

                    // RFC 6750 — 클라이언트 측에서도 사유 식별 가능하도록 WWW-Authenticate 헤더 보강
                    String safeReason = reason != null ? reason.replace("\"", "'") : "authentication required";
                    response.setHeader(HttpHeaders.WWW_AUTHENTICATE,
                            "Bearer error=\"invalid_token\", error_description=\"" + safeReason + "\"");

                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("UTF-8");
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("success", false);
                    body.put("resultCode", 401);
                    body.put("resultMessage", "Authentication is required.");
                    body.put("errorCode", "AUTH_REQUIRED");
                    new ObjectMapper().writeValue(response.getOutputStream(), body);
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding("UTF-8");
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("success", false);
                    body.put("resultCode", 403);
                    body.put("resultMessage", "Access is denied.");
                    body.put("errorCode", "ACCESS_DENIED");
                    new ObjectMapper().writeValue(response.getOutputStream(), body);
                })
            )
            // RS256 JWT 검증 (JWKS 공개키 자동 페칭)
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );

        // 가장 앞에 — 진입 즉시 requestId/clientIp 를 MDC 에 push
        // (userNo 는 SpUserMappingFilter 매핑 시점에 직접 박음)
        http.addFilterBefore(mdcLoggingFilter, BearerTokenAuthenticationFilter.class);

        // JWT 검증 후 spUserId → userNo 매핑 필터 (매핑 시 MDC.userNo 도 함께 push)
        http.addFilterAfter(spUserMappingFilter, BearerTokenAuthenticationFilter.class);

        if (isRealProfileActive()) {
            http.headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
            );
        }

        return http.build();
    }

    /**
     * SP JWT Claims → SpAuthenticatedUser 변환.
     * SecurityContext의 principal로 SpAuthenticatedUser가 설정된다.
     */
    private Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        return jwt -> {
            String spUserId = jwt.getSubject();
            String email = jwt.getClaimAsString("email");
            String name = jwt.getClaimAsString("name");
            String userType = jwt.getClaimAsString("userType");

            var user = new SpAuthenticatedUser(spUserId, email, name, userType);

            String role = (userType != null) ? userType : "USER";
            var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

            return new UsernamePasswordAuthenticationToken(user, null, authorities);
        };
    }

    private boolean isRealProfileActive() {
        return Arrays.asList(env.getActiveProfiles()).contains("real");
    }

    private boolean isLocalProfileActive() {
        return Arrays.asList(env.getActiveProfiles()).contains("local");
    }
}
