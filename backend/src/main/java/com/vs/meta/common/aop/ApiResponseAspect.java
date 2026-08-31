package com.vs.meta.common.aop;

import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Adds timing and hash metadata to controller responses.
 */
@Aspect
@Component
@Slf4j
public class ApiResponseAspect {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    /** api 컨트롤러 + common 컨트롤러를 모두 포함. 응답 enrich/access log/error log 공용 포인트컷. */
    @Pointcut("execution(* com.vs.meta..api..controller..*.*(..)) "
            + "|| execution(* com.vs.meta.common.controller..*.*(..))")
    public void controllerMethods() {}

    @Around("execution(* com.vs.meta..api..controller..*.*(..))")
    public Object enrichResponse(ProceedingJoinPoint joinPoint) throws Throwable {
        logTargetedParamData(joinPoint);

        long sMillis = System.currentTimeMillis();
        String sTime = LocalDateTime.now().format(DATE_FORMATTER);

        Object result = joinPoint.proceed();

        String eTime = LocalDateTime.now().format(DATE_FORMATTER);
        long elapsedMs = System.currentTimeMillis() - sMillis;

        int statusCode = 0;
        if (result instanceof ResponseDTO<?> responseDTO
                && responseDTO.getBody() instanceof CustomBody oldBody) {

            statusCode = oldBody.resultCode();

            String hash = sha256(String.valueOf(result));

            var headerBuilder = ResponseDTO.of().header(responseDTO.getHeaders());
            var bodyBuilder = oldBody.success() ? headerBuilder.success() : headerBuilder.fail();

            result = bodyBuilder
                    .resultCode(HttpStatus.valueOf(oldBody.resultCode()))
                    .paramData(oldBody.paramData())
                    .resultData(oldBody.resultData())
                    .resultMessage(oldBody.resultMessage())
                    .sTime(sTime)
                    .eTime(eTime)
                    .currentTime(sTime)
                    .hash(hash)
                    .build();
        }

        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            HttpServletResponse response = attrs.getResponse();
            if (response != null) {
                response.setHeader("X-Response-Time", eTime);
                // Content-Disposition 포함 — 파일 다운로드(예: sample-excel) 응답에서 FE가 파일명을 읽을 수 있도록.
                // (이 setHeader 는 CORS 필터가 설정한 값을 덮어쓰므로 여기서도 함께 명시한다.)
                response.setHeader("Access-Control-Expose-Headers", "X-Response-Hash, X-Response-Time, Content-Disposition");
            }
        }

        // 모든 컨트롤러 호출당 한 줄 access log — MDC 컨텍스트(reqId/userNo/clientIp)는 패턴이 자동 첨부.
        // 운영/개발 환경에서 어떤 API 가 어느 정도 빈도로 호출되는지 한눈에 파악.
        logAccess(joinPoint, statusCode, elapsedMs);

        return result;
    }

    /** 로그 제외 대상 API 경로 (빈번한 호출로 로그 노이즈 유발) */
    private static final List<String> ACCESS_LOG_SKIP_PATHS = List.of(
            "/api/v1/auth/refresh"
    );

    private void logAccess(ProceedingJoinPoint joinPoint, int statusCode, long elapsedMs) {
        String httpMethod = "";
        String apiPath = "";
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            HttpServletRequest request = attrs.getRequest();
            if (request != null) {
                httpMethod = request.getMethod();
                apiPath = request.getRequestURI();
            }
        }
        if (ACCESS_LOG_SKIP_PATHS.contains(apiPath)) {
            return;
        }
        log.info("API {} {} {} ({}ms)", httpMethod, apiPath, statusCode, elapsedMs);
    }

    /** 디버깅 가치가 큰 컨트롤러(파라미터 맵을 받거나 파일 처리 등)에 한해 진입 시 파라미터 로깅. */
    private static final List<String> PARAM_LOG_TARGETS = Arrays.asList(
            "com.vs.meta.api.dgnss.controller.DgnssTeacherController",
            "com.vs.meta.api.dgnss.controller.DgnssStudentController",
            "com.vs.meta.api.dgnss.controller.DgnssGraphController",
            "com.vs.meta.api.dgnss.controller.DgnssPdfController",
            "com.vs.meta.common.controller.FileController"
    );

    private void logTargetedParamData(ProceedingJoinPoint joinPoint) {
        String declaringTypeName = joinPoint.getSignature().getDeclaringTypeName();
        if (!PARAM_LOG_TARGETS.contains(declaringTypeName)) {
            return;
        }

        List<Object> loggableArgs = new ArrayList<>();
        for (Object arg : joinPoint.getArgs()) {
            if (arg instanceof Map<?, ?> map) {
                loggableArgs.add(map);
            } else if (arg instanceof String || arg instanceof Number || arg instanceof Boolean) {
                loggableArgs.add(arg);
            }
        }

        if (loggableArgs.isEmpty()) {
            return;
        }

        String httpMethod = "";
        String apiPath = "";
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            HttpServletRequest request = attrs.getRequest();
            if (request != null) {
                httpMethod = request.getMethod();
                apiPath = request.getRequestURI();
            }
        }

        String simpleClassName = declaringTypeName.substring(declaringTypeName.lastIndexOf('.') + 1);
        log.info("{} call: httpMethod={}, apiPath={}, method={}, paramData={}",
                simpleClassName, httpMethod, apiPath, joinPoint.getSignature().getName(), loggableArgs);
    }

    /**
     * 컨트롤러에서 던진 예외를 한 줄+스택트레이스로 기록. {@code @AfterThrowing} 은 예외를 삼키지 않으므로
     * Spring 의 기본 예외 처리는 그대로 이어진다.
     *
     * <p>클라이언트 에러(비즈니스 룰 위반, 잘못된 파라미터 등) 는 {@link com.vs.meta.common.config.GlobalExceptionHandler}
     * 가 이미 WARN 한 줄로 처리하므로 여기선 스킵 — 중복 로그 + 운영 알람 노이즈 방지.
     * 진짜 서버 측 버그(NPE/DB 에러 등) 만 ERROR + 스택트레이스 유지.
     */
    @AfterThrowing(pointcut = "controllerMethods()", throwing = "ex")
    public void logControllerException(JoinPoint joinPoint, Throwable ex) {
        if (isClientError(ex)) {
            return;
        }

        String httpMethod = "";
        String apiPath = "";
        String queryString = "";
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            HttpServletRequest request = attrs.getRequest();
            if (request != null) {
                httpMethod = request.getMethod();
                apiPath = request.getRequestURI();
                queryString = request.getQueryString() != null ? request.getQueryString() : "";
            }
        }

        String declaringType = joinPoint.getSignature().getDeclaringTypeName();
        String simpleClassName = declaringType.substring(declaringType.lastIndexOf('.') + 1);
        String methodName = joinPoint.getSignature().getName();

        log.error("Controller exception: {}.{} {} {}{} - {}: {}",
                simpleClassName,
                methodName,
                httpMethod,
                apiPath,
                queryString.isEmpty() ? "" : "?" + queryString,
                ex.getClass().getSimpleName(),
                ex.getMessage(),
                ex);
    }

    /**
     * GlobalExceptionHandler 의 4xx 매핑 대상 = 클라이언트 에러 = ApiResponseAspect 에서 스킵.
     * 서버 책임의 진짜 버그가 아니라 호출자의 잘못된 입력/비즈니스 룰 위반이므로 스택트레이스 불필요.
     */
    private boolean isClientError(Throwable ex) {
        return ex instanceof IllegalArgumentException
                || ex instanceof IllegalStateException
                || ex instanceof com.vs.meta.common.exception.AuthFailedException
                || ex instanceof org.springframework.web.bind.MissingServletRequestParameterException
                || ex instanceof org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
                || ex instanceof org.springframework.http.converter.HttpMessageNotReadableException
                || ex instanceof org.springframework.web.HttpRequestMethodNotSupportedException
                || ex instanceof org.springframework.web.HttpMediaTypeNotSupportedException
                || ex instanceof org.springframework.web.servlet.resource.NoResourceFoundException;
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] salt = new byte[16];
            new SecureRandom().nextBytes(salt);
            digest.update(salt);
            byte[] hashBytes = digest.digest(value.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
