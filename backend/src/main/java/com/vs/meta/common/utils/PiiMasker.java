package com.vs.meta.common.utils;

/**
 * 개인정보(PII) 로그 마스킹 유틸.
 * ISMS/개인정보보호법 대응 — 로그에 개인정보 평문 기록 금지.
 */
public final class PiiMasker {
    private PiiMasker() {}

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
}
