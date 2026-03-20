package com.vs.meta.domain.enums;

/**
 * 학교급
 * - 프론트엔드 SchoolLevelCode: 'elementary' | 'middle' | 'high'
 * - 기존 API gradeCd: 3(초등) / 7(중등) / 10(고등)
 * - 기존 API grade 코드: el / mi / hi
 */
public enum SchoolLevel {

    /** 초등학교 (1~6학년) */
    ELEMENTARY("elementary", "el", "3", 1, 6),
    /** 중학교 (1~3학년) */
    MIDDLE("middle", "mi", "7", 1, 3),
    /** 고등학교 (1~3학년) */
    HIGH("high", "hi", "10", 1, 3);

    private final String code;
    private final String legacyGrade;
    private final String legacyGradeCd;
    private final int minGrade;
    private final int maxGrade;

    SchoolLevel(String code, String legacyGrade, String legacyGradeCd, int minGrade, int maxGrade) {
        this.code = code;
        this.legacyGrade = legacyGrade;
        this.legacyGradeCd = legacyGradeCd;
        this.minGrade = minGrade;
        this.maxGrade = maxGrade;
    }

    /** 프론트엔드 코드값 ("elementary" / "middle" / "high") */
    public String getCode() {
        return code;
    }

    /** 기존 diagnosis API grade 코드 ("el" / "mi" / "hi") */
    public String getLegacyGrade() {
        return legacyGrade;
    }

    /** 기존 sync API gradeCd ("3" / "7" / "10") */
    public String getLegacyGradeCd() {
        return legacyGradeCd;
    }

    public int getMinGrade() {
        return minGrade;
    }

    public int getMaxGrade() {
        return maxGrade;
    }

    /**
     * 프론트엔드 코드값으로 SchoolLevel 조회
     * @throws IllegalArgumentException 유효하지 않은 코드값
     */
    public static SchoolLevel fromCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("schoolLevel은 필수입니다.");
        }
        for (SchoolLevel level : values()) {
            if (level.code.equals(code)) {
                return level;
            }
        }
        throw new IllegalArgumentException("유효하지 않은 schoolLevel입니다: " + code
                + " (허용값: elementary, middle, high)");
    }

    /**
     * 학년 숫자가 이 학교급에 유효한지 검증
     * @throws IllegalArgumentException 범위 초과
     */
    public void validateGrade(int grade) {
        if (grade < minGrade || grade > maxGrade) {
            throw new IllegalArgumentException(
                    code + " 학년 범위는 " + minGrade + "~" + maxGrade + "입니다: " + grade);
        }
    }
}
