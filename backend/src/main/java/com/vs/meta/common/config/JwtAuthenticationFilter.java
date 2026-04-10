package com.vs.meta.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vs.meta.common.exception.AuthFailedException;
import com.vs.meta.common.exception.JwtExpiredException;
import com.vs.meta.common.security.JwtUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
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
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTH_HEADER = "Authorization";
    private static final String DEV_USER_NO_HEADER = "X-DEV-USER-NO";

    private final JwtUtil jwtUtil;
    private final Environment env;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        boolean isLocalProfile = isLocalProfileActive();
        String authHeader = request.getHeader(AUTH_HEADER);

        // Authorization header missing: pass through. In local profile, inject dev auth.
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            if (isLocalProfile) {
                applyLocalBypassAuthentication(request);
            }
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
            if (isLocalProfile) {
                log.warn("local profile: expired JWT ignored, using dev auth context");
                applyLocalBypassAuthentication(request);
                filterChain.doFilter(request, response);
                return;
            }
            log.warn("JWT 만료: {}", e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "TOKEN_EXPIRED", "토큰이 만료되었습니다. 다시 로그인해 주세요.");
        } catch (AuthFailedException e) {
            if (isLocalProfile) {
                log.warn("local profile: invalid JWT ignored, using dev auth context");
                applyLocalBypassAuthentication(request);
                filterChain.doFilter(request, response);
                return;
            }
            log.warn("JWT 인증 실패: {}", e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "AUTH_FAILED", "유효하지 않은 토큰입니다.");
        } catch (Exception e) {
            if (isLocalProfile) {
                log.warn("local profile: JWT processing error ignored, using dev auth context");
                applyLocalBypassAuthentication(request);
                filterChain.doFilter(request, response);
                return;
            }
            log.error("JWT 처리 중 오류: {}", e.getMessage());
            sendErrorResponse(response, HttpStatus.UNAUTHORIZED, "AUTH_ERROR", "인증 처리 중 오류가 발생했습니다.");
        }
    }

    private boolean isLocalProfileActive() {
        return Arrays.asList(env.getActiveProfiles()).contains("local");
    }

    private void applyLocalBypassAuthentication(HttpServletRequest request) {
        String userNoStr = request.getHeader(DEV_USER_NO_HEADER);
        if (userNoStr == null || userNoStr.isBlank()) {
            userNoStr = "1";
        }

        try {
            Long.parseLong(userNoStr);
        } catch (NumberFormatException e) {
            userNoStr = "1";
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userNoStr, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        request.setAttribute("auth.userNo", Long.valueOf(userNoStr));
        request.setAttribute("auth.tokenType", "MEMBER");
        request.setAttribute("auth.localBypass", true);
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
