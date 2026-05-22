package com.vs.meta.common.utils;

import java.util.ArrayList;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 개인정보(PII) 로그 마스킹 유틸.
 * ISMS/개인정보보호법 대응 — 로그에 개인정보 평문 기록 금지.
 */
public final class PiiMasker {
    private PiiMasker() {}

    /** doc-1444 §6 — 외부 적재 전 반드시 redact 해야 하는 인증/세션 헤더. 소문자 비교. */
    private static final Set<String> SENSITIVE_HEADERS = Set.of(
            "authorization",
            "proxy-authorization",
            "cookie",
            "set-cookie",
            "x-api-key",
            "x-auth-token"
    );

    /** doc-1444 §6 — 외부 적재 전 반드시 redact 해야 하는 body 내부 필드. 소문자 비교. */
    private static final Set<String> SENSITIVE_BODY_FIELDS = Set.of(
            "password", "passwd", "pwd",
            "accesstoken", "refreshtoken", "idtoken", "sessiontoken",
            "secret", "clientsecret", "apikey", "api_key",
            "ssn", "rrn", "residentregistrationnumber",
            "cardnumber", "cardno", "cvv", "cvc"
    );

    private static final String REDACTED = "***redacted***";

    /**
     * 이메일 마스킹: "hong@example.com" → "h***@example.com"
     * 로컬 파트가 1자면 "*@example.com", 2자면 "h*@example.com"
     */
    public static String email(String email) {
        if (email == null || email.isBlank()) return "";
        int at = email.indexOf('@');
        if (at <= 0) return "***";
        String local = email.substring(0, at);
        String domain = email.substring(at);
        if (local.length() == 1) return "*" + domain;
        if (local.length() == 2) return local.charAt(0) + "*" + domain;
        return local.charAt(0) + "***" + domain;
    }

    /**
     * 이름 마스킹: "홍길동" → "홍*동", "김철" → "김*"
     */
    public static String name(String name) {
        if (name == null || name.isBlank()) return "";
        if (name.length() == 1) return name;
        if (name.length() == 2) return name.charAt(0) + "*";
        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
    }

    /**
     * 헤더 맵 redact — 인증/세션 헤더 값을 마스킹 처리. 외부 로그 적재 직전에 호출.
     * 입력이 null 이면 빈 맵 반환.
     */
    public static Map<String, String> redactHeaders(Map<String, String> headers) {
        Map<String, String> result = new LinkedHashMap<>();
        if (headers == null || headers.isEmpty()) return result;
        for (Map.Entry<String, String> entry : headers.entrySet()) {
            result.put(entry.getKey(), maskHeader(entry.getKey(), entry.getValue()));
        }
        return result;
    }

    /**
     * HttpServletRequest 의 헤더를 redact 된 Map 으로 변환. 외부 로그 적재 직전에 호출.
     */
    public static Map<String, String> redactHeaders(HttpServletRequest request) {
        Map<String, String> result = new LinkedHashMap<>();
        if (request == null) return result;
        Enumeration<String> names = request.getHeaderNames();
        if (names == null) return result;
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            String value = request.getHeader(name);
            result.put(name, maskHeader(name, value));
        }
        return result;
    }

    private static String maskHeader(String name, String value) {
        if (name == null) return value;
        if (SENSITIVE_HEADERS.contains(name.toLowerCase())) return REDACTED;
        return value;
    }

    /**
     * JSON 본문(Map / List / 원시값 트리)에서 민감 필드를 재귀적으로 마스킹.
     * 키 이름은 소문자/언더스코어 제거 후 비교 — {@code accessToken}, {@code access_token},
     * {@code ACCESSTOKEN} 모두 동일하게 매칭. 외부 로그 적재 직전에 호출.
     */
    public static Object redactSensitiveFields(Object node) {
        if (node instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                String key = String.valueOf(entry.getKey());
                if (isSensitiveField(key)) {
                    result.put(key, REDACTED);
                } else {
                    result.put(key, redactSensitiveFields(entry.getValue()));
                }
            }
            return result;
        }
        if (node instanceof List<?> list) {
            List<Object> result = new ArrayList<>(list.size());
            for (Object item : list) {
                result.add(redactSensitiveFields(item));
            }
            return result;
        }
        return node;
    }

    private static boolean isSensitiveField(String key) {
        if (key == null) return false;
        // 소문자 + 언더스코어/하이픈 제거 후 비교
        String normalized = key.toLowerCase().replace("_", "").replace("-", "");
        return SENSITIVE_BODY_FIELDS.contains(normalized);
    }
}
