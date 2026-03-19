package com.vs.meta.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Arrays;
import java.util.LinkedHashMap;
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

        public AdminSecurityConfig(
                com.vs.meta.admin.service.AdminUserDetailsService adminUserDetailsService,
                PasswordEncoder passwordEncoder) {
            this.adminUserDetailsService = adminUserDetailsService;
            this.passwordEncoder = passwordEncoder;
        }

        @Override
        protected void configure(org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder auth) throws Exception {
            auth.userDetailsService(adminUserDetailsService).passwordEncoder(passwordEncoder);
        }

        @Override
        protected void configure(HttpSecurity http) throws Exception {
            http
                .antMatcher("/admin/**")
                .csrf().disable()
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
                    .defaultSuccessUrl("/admin/dashboard", true)
                    .failureUrl("/admin/login?error=true")
                    .usernameParameter("email")
                    .passwordParameter("password")
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
     * API 영역: JWT 기반 Stateless (기존)
     */
    @Configuration
    @Order(2)
    public static class ApiSecurityConfig extends WebSecurityConfigurerAdapter {

        private final Environment env;
        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        public ApiSecurityConfig(Environment env, JwtAuthenticationFilter jwtAuthenticationFilter) {
            this.env = env;
            this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        }

        @Override
        protected void configure(HttpSecurity http) throws Exception {
            http
                .csrf().disable()
                .headers().frameOptions().disable()
                .and()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authorizeRequests()
                    .antMatchers("/member/login", "/member/signup", "/member/token/refresh",
                            "/member/logout", "/member/send-code", "/member/verify-code",
                            "/group/join-guest").permitAll()
                    .antMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .antMatchers("/viva/metric/prometheus").permitAll()
                    .antMatchers("/", "/robots.txt", "/favicon.ico").permitAll()
                    .antMatchers("/static/**").permitAll()
                    .antMatchers("/school/**").permitAll()
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
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

            if (isRealProfileActive()) {
                configureHsts(http);
            }
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
