package com.vs.meta.admin.interceptor;

import com.vs.meta.admin.mapper.AdminAccountMapper;
import com.vs.meta.domain.AdminAccount;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 최초/초기화 후 비밀번호 변경 강제.
 * 로그인한 관리자의 must_change_password='Y' 이면 비밀번호 변경 페이지로 리다이렉트한다.
 * (변경 페이지·로그인·로그아웃·정적 경로는 WebMvcConfig 에서 제외)
 */
@Component
@RequiredArgsConstructor
public class MustChangePasswordInterceptor implements HandlerInterceptor {

    private static final String CHANGE_PATH = "/admin/account/password";

    private final AdminAccountMapper adminAccountMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return true; // 미인증은 Security 필터가 처리
        }
        AdminAccount admin = adminAccountMapper.findByEmail(auth.getName());
        if (admin != null && "Y".equalsIgnoreCase(admin.getMustChangePassword())) {
            response.sendRedirect(CHANGE_PATH);
            return false;
        }
        return true;
    }
}
