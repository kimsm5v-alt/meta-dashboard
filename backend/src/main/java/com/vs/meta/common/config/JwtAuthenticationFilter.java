package com.vs.meta.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vs.meta.common.exception.AuthFailedException;
import com.vs.meta.common.exception.JwtExpiredException;
import com.vs.meta.common.security.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTH_HEADER = "Authorization";

    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader(AUTH_HEADER);

        // Authorization 헤더 없으면 그냥 통과 (SecurityConfig에서 permitAll/authenticated 판단)
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            Claims claims = jwtUtil.getAllClaimsFromToken(token);
            String tokenType = claims.get("tokenType", String.class);

            if ("GUEST".equals(tokenType)) {
                String stdtId = claims.get("stdtId", String.class);
                String claId = claims.get("claId", String.class);
                if (stdtId != null) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken("GUEST:" + stdtId, null, Collections.emptyList());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    request.setAttribute("auth.stdtId", stdtId);
                    request.setAttribute("auth.claId", claId);
                    request.setAttribute("auth.tokenType", "GUEST");
                    request.setAttribute("auth.email", claims.get("email", String.class));
                }
            } else {
                Object userNoObj = claims.get("userNo");
                if (userNoObj != null) {
                    String userNoStr = String.valueOf(userNoObj);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userNoStr, null, Collections.emptyList());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    request.setAttribute("auth.userNo", Long.valueOf(userNoStr));
                    request.setAttribute("auth.tokenType", "MEMBER");
                }
            }

            filterChain.doFilter(request, response);

        } catch (JwtExpiredException e) {
            log.warn("JWT 만료: {}", e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "TOKEN_EXPIRED", "토큰이 만료되었습니다. 다시 로그인해주세요.");
        } catch (AuthFailedException e) {
            log.warn("JWT 인증 실패: {}", e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "AUTH_FAILED", "유효하지 않은 토큰입니다.");
        } catch (Exception e) {
            log.error("JWT 처리 중 오류: {}", e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "AUTH_ERROR", "인증 처리 중 오류가 발생했습니다.");
        }
    }

    private void sendErrorResponse(HttpServletResponse response, HttpStatus status,
                                   String code, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorBody = new LinkedHashMap<>();
        errorBody.put("success", false);
        errorBody.put("resultCode", status.value());
        errorBody.put("resultMessage", message);
        errorBody.put("errorCode", code);

        objectMapper.writeValue(response.getOutputStream(), errorBody);
    }
}
