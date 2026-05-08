package com.vs.meta.common.aop;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vs.meta.common.config.QchProperties;
import com.vs.meta.common.security.SpAuthenticatedUser;
import com.vs.meta.common.service.QchTraceClient;
import com.vs.meta.common.service.QchTraceEvent;
import com.vs.meta.common.utils.PiiMasker;
import com.vs.meta.common.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.context.request.async.DeferredResult;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.util.ContentCachingRequestWrapper;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.lang.reflect.Method;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * QCH(Quality Coverage Hub) trace 적재 Aspect.
 *
 * <p>{@code com.vs.meta..api..controller} 와 {@code com.vs.meta.common.controller} 패키지의
 * 모든 컨트롤러 메서드를 자동으로 감싸 doc-1444 §2 trace 로 발행한다.
 *
 * <p>제외 규칙:
 * <ul>
 *   <li>(A) {@link QchSkip} 어노테이션이 메서드 또는 클래스에 부착된 경우</li>
 *   <li>(B) 리턴 타입이 SSE/스트리밍/비동기 emitter 인 경우 ({@link SseEmitter},
 *       {@link ResponseBodyEmitter}, {@link StreamingResponseBody}, {@link DeferredResult})</li>
 * </ul>
 *
 * <p>{@code @Order(1)} 로 {@link ApiResponseAspect}(@Order 미지정 = LOWEST_PRECEDENCE) 보다 outer 에
 * 위치하도록 하여, sTime/eTime/hash 까지 enrich 된 최종 응답을 적재한다.
 *
 * <p>모든 QCH 관련 처리는 try/catch 로 감싸 본 컨트롤러 호출에 영향 주지 않는다.
 */
@Slf4j
@Aspect
@Component
@Order(1)
@RequiredArgsConstructor
public class QchTraceAspect {

    private final QchTraceClient qchTraceClient;
    private final QchProperties qch;
    private final ObjectMapper objectMapper;

    @Around("execution(* com.vs.meta..api..controller..*.*(..)) "
            + "|| execution(* com.vs.meta.common.controller..*.*(..))")
    public Object traceController(ProceedingJoinPoint joinPoint) throws Throwable {
        if (!qch.isEnabled()) {
            return joinPoint.proceed();
        }

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        if (shouldSkip(method)) {
            return joinPoint.proceed();
        }

        long sMillis = System.currentTimeMillis();
        Throwable thrown = null;
        Object result = null;
        try {
            result = joinPoint.proceed();
            return result;
        } catch (Throwable ex) {
            thrown = ex;
            throw ex;
        } finally {
            try {
                long elapsedMs = System.currentTimeMillis() - sMillis;
                QchTraceEvent event = buildEvent(result, thrown, elapsedMs);
                if (event != null) {
                    qchTraceClient.sendTrace(event);
                }
            } catch (Exception buildEx) {
                log.warn("[QCH] event build failed: {}", buildEx.getMessage());
            }
        }
    }

    /** (A) @QchSkip + (B) 리턴 타입 감지. */
    private boolean shouldSkip(Method method) {
        if (method.isAnnotationPresent(QchSkip.class)) return true;
        if (method.getDeclaringClass().isAnnotationPresent(QchSkip.class)) return true;
        Class<?> returnType = method.getReturnType();
        return SseEmitter.class.isAssignableFrom(returnType)
                || ResponseBodyEmitter.class.isAssignableFrom(returnType)
                || StreamingResponseBody.class.isAssignableFrom(returnType)
                || DeferredResult.class.isAssignableFrom(returnType);
    }

    private QchTraceEvent buildEvent(Object result, Throwable thrown, long elapsedMs) {
        HttpServletRequest request = currentRequest();
        if (request == null) return null;

        Map<String, Object> queryParams = new LinkedHashMap<>();
        if (request.getParameterMap() != null) {
            request.getParameterMap().forEach((k, v) -> queryParams.put(k, v != null && v.length == 1 ? v[0] : v));
        }

        Map<String, String> redactedHeaders = PiiMasker.redactHeaders(request);
        // String → Object 캐스팅을 위한 conversion (Jackson 직렬화에 영향 없음)
        Map<String, Object> headersAsObj = new LinkedHashMap<>(redactedHeaders);

        int statusCode = resolveStatusCode(result, thrown);
        Object requestBody = readRequestBody(request);

        QchTraceEvent.Payload payload = QchTraceEvent.Payload.builder()
                .queryParams(queryParams)
                .requestHeaders(headersAsObj)
                .requestBody(requestBody == null ? new LinkedHashMap<>() : requestBody)
                .responseBody(result == null ? new LinkedHashMap<>() : result)
                .build();

        SpAuthenticatedUser spUser = SecurityUtil.getCurrentSpUser();
        Long userNo = SecurityUtil.getCurrentUserNo();

        return QchTraceEvent.builder()
                .serviceKey(qch.getServiceKey())
                .env(qch.getEnv())
                .appName("meta-api")
                .createdAt(Instant.now().toString())
                .method(request.getMethod())
                .endpoint(request.getRequestURI())
                .statusCode(statusCode)
                .responseTimeMs(elapsedMs)
                .testcoverage("Y")
                .traceId(MDC.get("requestId"))
                .userId(userNo != null ? String.valueOf(userNo) : null)
                .userType(spUser != null ? spUser.userType() : null)
                .payload(payload)
                .build();
    }

    private int resolveStatusCode(Object result, Throwable thrown) {
        if (thrown != null) {
            HttpServletResponse response = currentResponse();
            if (response != null && response.getStatus() > 0) {
                return response.getStatus();
            }
            return 500;
        }
        // ResponseDTO<CustomBody> 의 resultCode 우선 — ApiResponseAspect 가 enrich 한 값
        if (result instanceof org.springframework.http.ResponseEntity<?> entity) {
            return entity.getStatusCodeValue();
        }
        if (result instanceof com.vs.meta.common.response.ResponseDTO<?> dto
                && dto.getBody() instanceof com.vs.meta.common.response.CustomBody body) {
            return body.resultCode();
        }
        HttpServletResponse response = currentResponse();
        return response != null && response.getStatus() > 0 ? response.getStatus() : 200;
    }

    /**
     * {@link QchRequestBodyCachingFilter} 가 wrap 한 경우에만 cached body 반환.
     * JSON 으로 파싱되면 민감 필드 redact 후 객체 트리, 파싱 실패면 raw 문자열, 비어있으면 null.
     */
    private Object readRequestBody(HttpServletRequest request) {
        if (!(request instanceof ContentCachingRequestWrapper wrapper)) return null;
        byte[] bytes = wrapper.getContentAsByteArray();
        if (bytes == null || bytes.length == 0) return null;

        Charset charset;
        try {
            String enc = wrapper.getCharacterEncoding();
            charset = (enc != null && !enc.isBlank()) ? Charset.forName(enc) : StandardCharsets.UTF_8;
        } catch (Exception ex) {
            charset = StandardCharsets.UTF_8;
        }
        String raw = new String(bytes, charset);

        try {
            Object parsed = objectMapper.readValue(raw, Object.class);
            return PiiMasker.redactSensitiveFields(parsed);
        } catch (Exception parseEx) {
            // JSON 아닌 본문(text/plain 등) 또는 파싱 실패 — raw 문자열 그대로 (적재 가치는 낮지만 디버깅 가능)
            return raw;
        }
    }

    private HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            return attrs.getRequest();
        }
        return null;
    }

    private HttpServletResponse currentResponse() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            return attrs.getResponse();
        }
        return null;
    }
}
