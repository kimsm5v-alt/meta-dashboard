package com.vs.meta.common.aop;

import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
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

    @Around("execution(* com.vs.meta..api..controller..*.*(..))")
    public Object enrichResponse(ProceedingJoinPoint joinPoint) throws Throwable {
        logDgnssParamData(joinPoint);

        String sTime = LocalDateTime.now().format(DATE_FORMATTER);

        Object result = joinPoint.proceed();

        String eTime = LocalDateTime.now().format(DATE_FORMATTER);

        if (result instanceof ResponseDTO<?> responseDTO
                && responseDTO.getBody() instanceof CustomBody oldBody) {

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
                response.setHeader("Access-Control-Expose-Headers", "X-Response-Hash, X-Response-Time");
            }
        }

        return result;
    }

    private void logDgnssParamData(ProceedingJoinPoint joinPoint) {
        String declaringTypeName = joinPoint.getSignature().getDeclaringTypeName();
        if (!"com.vs.meta.api.dgnss.controller.DgnssController".equals(declaringTypeName)) {
            return;
        }

        List<Map<?, ?>> mapArgs = new ArrayList<>();
        for (Object arg : joinPoint.getArgs()) {
            if (arg instanceof Map<?, ?> map) {
                mapArgs.add(map);
            }
        }

        if (mapArgs.isEmpty()) {
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

        log.info("DgnssController call: httpMethod={}, apiPath={}, paramData={}",
                httpMethod, apiPath, mapArgs);
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
