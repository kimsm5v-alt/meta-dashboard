package com.vs.meta.common.config;

import com.vs.meta.admin.interceptor.MustChangePasswordInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Admin(Thymeleaf) 전용 인터셉터 등록.
 * 비밀번호 변경 강제 인터셉터를 /admin/** 에 적용하되, 로그인/로그아웃/변경 페이지/정적은 제외.
 */
@Configuration
@RequiredArgsConstructor
public class AdminWebMvcConfig implements WebMvcConfigurer {

    private final MustChangePasswordInterceptor mustChangePasswordInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(mustChangePasswordInterceptor)
                .addPathPatterns("/admin/**")
                .excludePathPatterns(
                        "/admin/login",
                        "/admin/logout",
                        "/admin/account/password",
                        "/admin/css/**",
                        "/admin/js/**",
                        "/admin/images/**"
                );
    }
}
