package com.vs.meta.api.school.service;

import com.vs.meta.api.school.dto.SchoolSearchResponseDto;
import com.vs.meta.api.school.dto.SchoolSearchResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * 학교 검색 비즈니스 로직 (검사 기본정보 입력의 학교 검색 모달용).
 *
 * <ul>
 *   <li>입력 검증: keyword 최소 1자.
 *   <li>NEIS 한글 학교종류명("고등학교") → 학교급 ENUM 명("HIGH") 변환.
 *   <li>NEIS 호출 실패 시 빈 리스트 — 외부 의존성 그레이스풀 다운.
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SchoolSearchService {

    private static final int MIN_KEYWORD_LENGTH = 1;

    private final NeisSchoolApiClient neisClient;

    public SchoolSearchResponseDto search(String keyword, int page) {
        if (keyword == null || keyword.trim().length() < MIN_KEYWORD_LENGTH) {
            return new SchoolSearchResponseDto(List.of(), 0, page, NeisSchoolApiClient.DEFAULT_PAGE_SIZE);
        }
        try {
            var neisPage = neisClient.search(keyword.trim(), page);
            var items = neisPage.rows().stream()
                    .map(row -> new SchoolSearchResultDto(
                            row.code(),
                            row.name(),
                            mapGrade(row.kindName()),
                            row.kindName(),
                            row.region()))
                    .toList();
            return new SchoolSearchResponseDto(
                    items, neisPage.totalCount(), page, NeisSchoolApiClient.DEFAULT_PAGE_SIZE);
        } catch (RestClientException e) {
            log.warn("NEIS 검색 실패 — 빈 결과 반환: keyword={}, page={}, error={}", keyword, page, e.getMessage());
            return new SchoolSearchResponseDto(List.of(), 0, page, NeisSchoolApiClient.DEFAULT_PAGE_SIZE);
        }
    }

    /** NEIS 학교종류명(한글) → 학교급 ENUM 명(영문). */
    static String mapGrade(String niceKindName) {
        if (niceKindName == null) return "ETC";
        return switch (niceKindName) {
            case "유치원" -> "KINDERGARTEN";
            case "초등학교" -> "ELEMENTARY";
            case "중학교" -> "MIDDLE";
            case "고등학교" -> "HIGH";
            case "특수학교" -> "SPECIAL";
            default -> "ETC";
        };
    }
}
