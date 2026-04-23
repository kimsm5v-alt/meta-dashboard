package com.vs.meta.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vs.meta.common.security.SpAuthenticatedUser;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Admin 영역: 세션 기반 Form Login (/admin/**)
     */
    @Configuration
    @Order(1)
    public static class AdminSecurityConfig extends WebSecurityConfigurerAdapter {

        private final com.vs.meta.admin.service.AdminUserDetailsService adminUserDetailsService;
        private final PasswordEncoder passwordEncoder;
        private final com.vs.meta.common.utils.LoginRateLimiter loginRateLimiter;

        public AdminSecurityConfig(
                com.vs.meta.admin.service.AdminUserDetailsService adminUserDetailsService,
                PasswordEncoder passwordEncoder,
                com.vs.meta.common.utils.LoginRateLimiter loginRateLimiter) {
            this.adminUserDetailsService = adminUserDetailsService;
            this.passwordEncoder = passwordEncoder;
            this.loginRateLimiter = loginRateLimiter;
        }

        @Override
        protected void configure(org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder auth) throws Exception {
            auth.userDetailsService(adminUserDetailsService).passwordEncoder(passwordEncoder);
        }

        @Override
        protected void configure(HttpSecurity http) throws Exception {
            http
                .antMatcher("/admin/**")
                .csrf().ignoringAntMatchers("/admin/login")
                .and()
                .headers().frameOptions().disable()
                .and()
                .authorizeRequests()
                    .antMatchers("/admin/login").permitAll()
                    .antMatchers("/admin/css/**", "/admin/js/**").permitAll()
                    .antMatchers("/admin/**").authenticated()
                .and()
                .formLogin()
                    .loginPage("/admin/login")
                    .loginProcessingUrl("/admin/login")
                    .usernameParameter("email")
                    .passwordParameter("password")
                    .successHandler((request, response, authentication) -> {
                        String ip = request.getRemoteAddr();
                        String email = request.getParameter("email");
                        loginRateLimiter.clearAttempts(ip, email);
                        response.sendRedirect("/admin/dashboard");
                    })
                    .failureHandler((request, response, exception) -> {
                        String ip = request.getRemoteAddr();
                        String email = request.getParameter("email");
                        loginRateLimiter.recordFailure(ip, email);
                        if (loginRateLimiter.isBlocked(ip, email)) {
                            response.sendRedirect("/admin/login?error=blocked");
                        } else {
                            response.sendRedirect("/admin/login?error=true");
                        }
                    })
                .and()
                .logout()
                    .logoutUrl("/admin/logout")
                    .logoutSuccessUrl("/admin/login?logout=true")
                    .invalidateHttpSession(true)
                    .deleteCookies("JSESSIONID")
                .and()
                .sessionManagement()
                    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED);
        }
    }

    /**
     * API 영역: SuperPlatform SSO JWT (RS256, JWKS 공개키 검증)
     */
    @Configuration
    @Order(2)
    public static class ApiSecurityConfig extends WebSecurityConfigurerAdapter {

        private final Environment env;
        private final SpUserMappingFilter spUserMappingFilter;

        public ApiSecurityConfig(Environment env, SpUserMappingFilter spUserMappingFilter) {
            this.env = env;
            this.spUserMappingFilter = spUserMappingFilter;
        }

        @Override
        protected void configure(HttpSecurity http) throws Exception {
            http
                .cors()
                .and()
                .csrf().disable()
                .headers().frameOptions().disable()
                .and()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeRequests()
                    // SSO Auth 프록시 (public — SDK가 호출)
                    .antMatchers("/api/v1/auth/**").permitAll()
                    // Neo4j 그래프 테스트 API (로컬 테스트 용도)
                    .antMatchers("/api/dgnss/graph/**").permitAll()
                    // 게스트 관련 (public)
                    .antMatchers("/guest/exists", "/guest/auth").permitAll()
                    // 그룹 초대/참가 (public)
                    .antMatchers("/group/invite", "/group/join-guest").permitAll()
                    // 게스트 이메일 인증 (학심정 자체 유지)
                    .antMatchers("/member/send-code", "/member/verify-code").permitAll()
                    // Swagger, health, static
                    .antMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .antMatchers("/viva/metric/prometheus").permitAll()
                    .antMatchers("/actuator/health").permitAll()
                    .antMatchers("/", "/robots.txt", "/favicon.ico").permitAll()
                    .antMatchers("/static/**").permitAll()
                    // 추가 정보 입력 API (JWT 필요하지만 user 미생성 상태에서 호출)
                    .antMatchers("/api/v1/user/complete-profile").authenticated()
                    .anyRequest().authenticated()
                .and()
                .exceptionHandling()
                    .authenticationEntryPoint((request, response, authException) -> {
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
                .and()
                // RS256 JWT 검증 (JWKS 공개키 자동 페칭)
                .oauth2ResourceServer()
                    .jwt()
                        .jwtAuthenticationConverter(jwtAuthenticationConverter());

            // JWT 검증 후 spUserId → userNo 매핑 필터
            http.addFilterAfter(spUserMappingFilter,
                    org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationFilter.class);

            if (isRealProfileActive()) {
                configureHsts(http);
            }
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

        private void configureHsts(HttpSecurity http) throws Exception {
            http.headers()
                    .httpStrictTransportSecurity()
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000);
        }

        private boolean isRealProfileActive() {
            return Arrays.asList(env.getActiveProfiles()).contains("real");
        }
    }
}
