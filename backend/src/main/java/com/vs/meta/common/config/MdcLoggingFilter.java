package com.vs.meta.common.config;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

/**
 * 모든 HTTP 요청 진입 시 MDC (Mapped Diagnostic Context) 에 요청 컨텍스트를 push.
 *
 * <p>이로써 SLF4J 로 찍히는 모든 로그에 requestId, clientIp 가 자동으로 따라붙어
 * 운영/개발 환경에서 같은 요청의 로그를 한 키로 묶어 추적 가능.
 *
 * <p>등록 순서: 가장 앞 ({@code BearerTokenAuthenticationFilter} 앞) — 인증 단계 시점부터
 * 모든 로그에 requestId/clientIp 가 박히도록.
 *
 * <p>userNo 는 별도로 {@link SpUserMappingFilter} 가 매핑 시점에 직접 MDC.put.
 * 이렇게 분리한 이유: SpUserMappingFilter 의 매핑 SQL (sp_user_id → userNo) 자체가
 * MDC 의 userNo 를 결정하므로 그 SQL 로그는 본질적으로 userNo 가 없는 상태에서 찍힘.
 * requestId/clientIp 만이라도 박혀있으면 추적 가능.
 *
 * <p>finally 에서 {@link MDC#clear()} 필수 — Tomcat 의 스레드 풀이 다음 요청을 같은 스레드로
 * 재사용 시 이전 사용자의 MDC 가 잔재로 남는 것을 방지. SpUserMappingFilter 가 박은 userNo 도
 * 여기서 함께 정리.
 */
@Slf4j
@Component
public class MdcLoggingFilter extends OncePerRequestFilter {

    public static final String MDC_REQUEST_ID = "requestId";
    public static final String MDC_SP_USER_ID = "spUserId";
    public static final String MDC_USER_NO = "userNo";
    public static final String MDC_CLIENT_IP = "clientIp";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        try {
            // 1. requestId — 짧은 UUID(8자) 로 추적 식별자 부여 (grep 편의)
            MDC.put(MDC_REQUEST_ID, UUID.randomUUID().toString().substring(0, 8));

            // 2. clientIp — X-Forwarded-For 우선 (LB/proxy 환경), 없으면 RemoteAddr
            String clientIp = resolveClientIp(request);
            MDC.put(MDC_CLIENT_IP, clientIp != null && !clientIp.isBlank() ? clientIp : "-");

            // userNo 는 SpUserMappingFilter 가 매핑 시점에 직접 박음 (여기선 박지 않음)
            chain.doFilter(request, response);
        } finally {
            // 스레드 풀 재사용 시 잔재 방지 — 모든 키 일괄 제거 (userNo 포함)
            MDC.clear();
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            // X-Forwarded-For 는 chain 형태 (client, proxy1, proxy2). 첫 번째가 실 클라이언트
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
