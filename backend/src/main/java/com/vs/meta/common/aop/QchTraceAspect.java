package com.vs.meta.common.aop;

import tools.jackson.databind.ObjectMapper;
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
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.util.ContentCachingRequestWrapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
                .responseBody(sanitizeResponseBody(result))
                .build();

        SpAuthenticatedUser spUser = SecurityUtil.getCurrentSpUser();
        Long userNo = SecurityUtil.getCurrentUserNo();

        // JWT 토큰 정보 기반 사용자 식별자 결정
        // 1순위: JWT sub claim의 spUserId (SP Auth 서버 공개 ID)
        // 2순위: DB 매핑된 userNo (학심정 내부 PK)
        String resolvedUserId = null;
        if (spUser != null && spUser.spUserId() != null) {
            resolvedUserId = spUser.spUserId();
        } else if (userNo != null) {
            resolvedUserId = String.valueOf(userNo);
        }

        // userType은 JWT claim에서 직접 추출 (TEACHER/STUDENT/GUEST/UNSET)
        String resolvedUserType = (spUser != null) ? spUser.userType() : null;

        // FE 가 X-QCH-* 헤더로 추가 추적 정보를 보내면 그대로 forward.
        //   X-QCH-Trace-Id      → event.traceId       (FE 세션 추적 ID — 있으면 MDC requestId 대체)
        //   X-QCH-User-Id       → event.userId        (FE 가 별도 사용자 식별자 보내면 사용 — JWT 기반 값 대체)
        //   X-QCH-Is-User-Action→ extra.isUserAction  (boolean — 사용자 의도 액션 여부)
        //   X-QCH-Intent        → extra.intent        (URL-encoded 가능, 받은 값 그대로 보존)
        //   X-QCH-Action-Id     → extra.actionId
        //   X-QCH-Client-Call-Id→ extra.clientCallId
        String headerTraceId = request.getHeader("X-QCH-Trace-Id");
        String headerUserId = request.getHeader("X-QCH-User-Id");
        String headerIsUserAction = request.getHeader("X-QCH-Is-User-Action");
        String headerIntent = request.getHeader("X-QCH-Intent");
        String headerActionId = request.getHeader("X-QCH-Action-Id");
        String headerClientCallId = request.getHeader("X-QCH-Client-Call-Id");

        if (headerUserId != null && !headerUserId.isBlank()) {
            resolvedUserId = headerUserId;
        }
        String resolvedTraceId = (headerTraceId != null && !headerTraceId.isBlank())
                ? headerTraceId
                : MDC.get("requestId");

        Map<String, Object> extra = new LinkedHashMap<>();
        if (headerIsUserAction != null) extra.put("isUserAction", Boolean.parseBoolean(headerIsUserAction));
        if (headerIntent != null) extra.put("intent", headerIntent);
        if (headerActionId != null) extra.put("actionId", headerActionId);
        if (headerClientCallId != null) extra.put("clientCallId", headerClientCallId);

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
                .traceId(resolvedTraceId)
                .userId(resolvedUserId)
                .userType(resolvedUserType)
                .payload(payload)
                .extra(extra.isEmpty() ? null : extra)
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
            return entity.getStatusCode().value();
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

    /**
     * 응답 본문에서 직렬화 불가능한 타입(Resource, InputStream 등)을 안전하게 처리.
     * PDF/파일 다운로드 등 바이너리 응답은 placeholder로 대체.
     */
    private Object sanitizeResponseBody(Object result) {
        if (result == null) {
            return new LinkedHashMap<>();
        }

        // ResponseEntity<Resource> 처리 (파일 다운로드)
        if (result instanceof ResponseEntity<?> entity) {
            Object body = entity.getBody();
            if (body instanceof Resource) {
                Map<String, Object> placeholder = new LinkedHashMap<>();
                placeholder.put("_type", "binary");
                placeholder.put("_description", "File download response (not serializable)");
                if (body instanceof Resource resource) {
                    placeholder.put("filename", resource.getFilename());
                }
                return placeholder;
            }
        }

        // Resource 직접 반환 처리
        if (result instanceof Resource resource) {
            Map<String, Object> placeholder = new LinkedHashMap<>();
            placeholder.put("_type", "binary");
            placeholder.put("_description", "File download response (not serializable)");
            placeholder.put("filename", resource.getFilename());
            return placeholder;
        }

        return result;
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
