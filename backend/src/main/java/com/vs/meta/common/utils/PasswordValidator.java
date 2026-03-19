package com.vs.meta.common.utils;

import java.util.Set;
import java.util.regex.Pattern;

public class PasswordValidator {

    private static final int MIN_LENGTH = 10;
    private static final int MAX_LENGTH = 64;
    private static final int MAX_REPEAT = 4;

    private static final Pattern UPPER = Pattern.compile("[A-Z]");
    private static final Pattern LOWER = Pattern.compile("[a-z]");
    private static final Pattern DIGIT = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};:'\",.<>/?\\\\|]");
    private static final Pattern ALLOWED_CHARS = Pattern.compile("^[A-Za-z0-9!@#$%^&*()_+\\-=\\[\\]{};:'\",.<>/?\\\\|]+$");
    private static final Pattern REPEAT_CHAR = Pattern.compile("(.)\\1{" + (MAX_REPEAT - 1) + ",}");

    private static final Set<String> COMMON_PASSWORDS = Set.of(
            "123456", "1234567", "12345678", "123456789", "1234567890",
            "password", "password1", "qwerty", "qwerty123",
            "admin", "admin123", "administrator",
            "111111", "000000", "abc123", "letmein",
            "welcome", "monkey", "dragon", "master",
            "login", "passw0rd", "iloveyou"
    );

    public static void validate(String password, String email) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("비밀번호는 필수입니다.");
        }

        // 길이 검증
        if (password.length() < MIN_LENGTH) {
            throw new IllegalArgumentException("비밀번호는 최소 " + MIN_LENGTH + "자 이상이어야 합니다.");
        }
        if (password.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("비밀번호는 최대 " + MAX_LENGTH + "자 이하여야 합니다.");
        }

        // 허용 문자 검증
        if (!ALLOWED_CHARS.matcher(password).matches()) {
            throw new IllegalArgumentException("비밀번호에 허용되지 않은 문자가 포함되어 있습니다.");
        }

        // 문자 조합 검증 (2가지 이상)
        int typeCount = 0;
        if (UPPER.matcher(password).find()) typeCount++;
        if (LOWER.matcher(password).find()) typeCount++;
        if (DIGIT.matcher(password).find()) typeCount++;
        if (SPECIAL.matcher(password).find()) typeCount++;

        if (typeCount < 2) {
            throw new IllegalArgumentException("비밀번호는 영문 대문자, 소문자, 숫자, 특수문자 중 2가지 이상을 포함해야 합니다.");
        }

        // 동일 문자 반복 검증
        if (REPEAT_CHAR.matcher(password).find()) {
            throw new IllegalArgumentException("동일 문자를 " + MAX_REPEAT + "회 이상 연속 사용할 수 없습니다.");
        }

        // 이메일 포함 검증
        if (email != null && !email.isBlank()) {
            String emailLocal = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
            if (emailLocal.length() >= 3 && password.toLowerCase().contains(emailLocal.toLowerCase())) {
                throw new IllegalArgumentException("비밀번호에 이메일을 포함할 수 없습니다.");
            }
        }

        // 흔한 비밀번호 검증
        if (COMMON_PASSWORDS.contains(password.toLowerCase())) {
            throw new IllegalArgumentException("너무 흔한 비밀번호입니다. 다른 비밀번호를 사용해주세요.");
        }
    }
}
