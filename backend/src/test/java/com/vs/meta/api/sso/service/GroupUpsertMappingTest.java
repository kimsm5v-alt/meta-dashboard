package com.vs.meta.api.sso.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Auth → 학심정 필드 매핑/파싱 단위 테스트 (group-from-idp 02 §3).
 * 자유텍스트(grade/classNo)와 enum(schoolLevel) 변환 규칙 고정.
 */
class GroupUpsertMappingTest {

    // ---- schoolLevel ----

    @Test
    @DisplayName("schoolLevel — Auth 대문자 enum 을 학심정 소문자 코드로 매핑")
    void mapSchoolLevel_standard() {
        assertEquals("elementary", GroupUpsertService.mapSchoolLevel("ELEMENTARY"));
        assertEquals("middle", GroupUpsertService.mapSchoolLevel("MIDDLE"));
        assertEquals("high", GroupUpsertService.mapSchoolLevel("HIGH"));
    }

    @Test
    @DisplayName("schoolLevel — ETC/미지정은 검사 매핑이 없는 비표준 값으로")
    void mapSchoolLevel_nonStandard() {
        assertEquals("etc", GroupUpsertService.mapSchoolLevel("ETC"));
        assertEquals("etc", GroupUpsertService.mapSchoolLevel(null));
        assertEquals("etc", GroupUpsertService.mapSchoolLevel(""));
        assertFalse(GroupUpsertService.isStandardSchoolLevel("etc"));
        assertTrue(GroupUpsertService.isStandardSchoolLevel("middle"));
    }

    // ---- grade ----

    @Test
    @DisplayName("grade — '3학년' 자유텍스트에서 숫자 추출")
    void parseGrade_digits() {
        assertEquals("3", GroupUpsertService.parseGrade("3학년"));
        assertEquals("1", GroupUpsertService.parseGrade("1"));
        assertEquals("6", GroupUpsertService.parseGrade("초등 6학년"));
    }

    @Test
    @DisplayName("grade — 숫자 없으면 원문(표시 호환), null/blank 는 '0'")
    void parseGrade_fallback() {
        assertEquals("무학년", GroupUpsertService.parseGrade("무학년"));
        assertEquals("0", GroupUpsertService.parseGrade(null));
        assertEquals("0", GroupUpsertService.parseGrade("  "));
    }

    // ---- classNo ----

    @Test
    @DisplayName("classNo — '5반' 자유텍스트에서 숫자 추출, 실패 시 0")
    void parseClassNo() {
        assertEquals(5, GroupUpsertService.parseClassNo("5반"));
        assertEquals(12, GroupUpsertService.parseClassNo("12"));
        assertEquals(0, GroupUpsertService.parseClassNo("사랑반"));
        assertEquals(0, GroupUpsertService.parseClassNo(null));
        assertEquals(0, GroupUpsertService.parseClassNo(""));
        // INT 자릿수 초과 방어
        assertEquals(0, GroupUpsertService.parseClassNo("99999999999999999999반"));
    }
}
