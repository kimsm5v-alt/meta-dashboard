package com.vs.meta.common.config;

import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * QCH 적재용 request body 캐싱 필터.
 *
 * <p>{@link ContentCachingRequestWrapper} 로 요청을 감싸 controller 가 body 를 읽은 뒤에도
 * {@link QchTraceAspect} 가 cached bytes 를 다시 읽을 수 있게 한다.
 *
 * <p>다음 조건일 때만 래핑 (메모리 폭증 / 파일 업로드 차단):
 * <ul>
 *   <li>{@code qch.enabled = true}</li>
 *   <li>method 가 POST/PUT/PATCH (body 가 있는 메서드만)</li>
 *   <li>content-type 이 JSON 변종 (application/json 또는 application/*+json)</li>
 *   <li>content-length 가 {@link #MAX_CACHE_BYTES} 이하 — 큰 페이로드는 적재 안 함 (doc-1444 §9 jsonb 256KB 한도)</li>
 *   <li>multipart/* 아님</li>
 * </ul>
 *
 * <p>controller 가 body 를 읽기 전에 wrap 되어야 하므로 일찍 등록.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 100)
@RequiredArgsConstructor
public class QchRequestBodyCachingFilter extends OncePerRequestFilter {

    /** 64KB — 메모리 안전 + QCH 256KB 한도보다 보수적. 초과 시 적재 자체를 skip. */
    static final int MAX_CACHE_BYTES = 64 * 1024;

    private final QchProperties qch;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (shouldWrap(request)) {
            ContentCachingRequestWrapper wrapped = new ContentCachingRequestWrapper(request, MAX_CACHE_BYTES);
            chain.doFilter(wrapped, response);
        } else {
            chain.doFilter(request, response);
        }
    }

    private boolean shouldWrap(HttpServletRequest request) {
        if (!qch.isEnabled()) return false;

        String method = request.getMethod();
        if (!"POST".equalsIgnoreCase(method)
                && !"PUT".equalsIgnoreCase(method)
                && !"PATCH".equalsIgnoreCase(method)) {
            return false;
        }

        String contentType = request.getContentType();
        if (contentType == null) return false;
        String lower = contentType.toLowerCase();
        if (lower.startsWith("multipart/")) return false;
        if (!lower.contains("json")) return false;

        int len = request.getContentLength();
        // length 미상(-1) 인 경우는 wrap (chunked transfer 등). 임계 초과는 skip.
        if (len > MAX_CACHE_BYTES) return false;

        return true;
    }
}
