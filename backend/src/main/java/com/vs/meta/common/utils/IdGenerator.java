package com.vs.meta.common.utils;

import java.util.Set;
import java.util.UUID;

/**
 * 시스템 ID 채번 유틸리티
 */
public final class IdGenerator {

    private static final Set<String> TEACHER_ROLES = Set.of("TEACHER", "PRINCIPAL", "SUPERINTENDENT", "ADMIN");

    private IdGenerator() {}

    /** 교사 ID: UUID 32자리 (하이픈 제거) */
    public static String generateTcId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /** 학생 ID: UUID 32자리 (하이픈 제거) */
    public static String generateStdtId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /** 학급 ID: UUID 32자리 (하이픈 제거) */
    public static String generateClaId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /** 초대코드: 6자리 대문자 */
    public static String generateInviteCode() {
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    /** roleCode 기반으로 교사 계열 역할인지 판별 */
    public static boolean isTeacherRole(String roleCode) {
        return TEACHER_ROLES.contains(roleCode);
    }
}
