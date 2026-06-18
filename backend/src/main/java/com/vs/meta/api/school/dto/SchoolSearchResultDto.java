package com.vs.meta.api.school.dto;

/**
 * 학교 검색 결과 한 행 (NEIS 응답 정제).
 *
 * <p>NEIS({@code SD_SCHUL_CODE}, {@code SCHUL_NM}, {@code SCHUL_KND_SC_NM}, {@code LCTN_SC_NM})
 * 을 정제. grade 는 학교급 ENUM 명(ELEMENTARY/MIDDLE/HIGH/...)으로 매핑하고 한글 라벨은 프론트 책임.
 */
public record SchoolSearchResultDto(
        String code,           // NEIS 표준학교코드 — 선택 시 검사 schoolCode 로 저장(나이스 연동)
        String name,           // 학교명
        String grade,          // 학교급 ENUM 명 (KINDERGARTEN/ELEMENTARY/MIDDLE/HIGH/SPECIAL/UNIVERSITY/ETC)
        String niceKindName,   // NEIS 원본 학교종류명 (예: "고등학교")
        String region          // 소재지 시도 (동명이학 구분 표시)
) {}
