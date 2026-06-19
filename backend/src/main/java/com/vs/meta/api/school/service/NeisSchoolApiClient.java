package com.vs.meta.api.school.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vs.meta.common.config.NeisProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

/**
 * NEIS Open API 학교기본정보 호출. 응답 형태가 변칙적(성공/0건/에러 구조 상이)이라 JsonNode 로 직접 파싱.
 *
 * <p>성공: {@code { "schoolInfo": [ { "head": [...] }, { "row": [ {...} ] } ] }}
 * <p>0건: {@code { "RESULT": { "CODE": "INFO-200", ... } }} → 빈 리스트로 정상 처리. 그 외 4xx/5xx 는 전파.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NeisSchoolApiClient {

    @Qualifier("neisRestClient")
    private final RestClient neisRestClient;
    private final NeisProperties neisProperties;
    private final ObjectMapper objectMapper;

    public static final int DEFAULT_PAGE_SIZE = 20;

    /**
     * 학교명 부분일치 검색.
     *
     * @param keyword 검색어 (NEIS LIKE 매칭). @param page 1-based (NEIS pIndex).
     * @return 행 목록 + 전체 매칭 수. NEIS 0건/오류면 빈 리스트 + totalCount=0.
     */
    public NeisPage search(String keyword, int page) {
        var json = neisRestClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/hub/schoolInfo")
                        .queryParam("KEY", neisProperties.getApiKey())
                        .queryParam("Type", "json")
                        .queryParam("pIndex", page)
                        .queryParam("pSize", DEFAULT_PAGE_SIZE)
                        .queryParam("SCHUL_NM", keyword)
                        .build())
                .retrieve()
                .body(String.class);

        return parsePage(json);
    }

    private NeisPage parsePage(String json) {
        if (json == null || json.isBlank()) return NeisPage.empty();
        try {
            var root = objectMapper.readTree(json);
            // 0건 케이스 — 최상위에 RESULT 만 들어있음
            if (root.has("RESULT") && !root.has("schoolInfo")) {
                return NeisPage.empty();
            }
            var schoolInfo = root.path("schoolInfo");
            if (!schoolInfo.isArray()) return NeisPage.empty();

            int totalCount = extractTotalCount(schoolInfo);
            var rows = extractRows(schoolInfo);
            return new NeisPage(rows, totalCount);
        } catch (Exception e) {
            log.warn("NEIS 응답 파싱 실패: {}", e.getMessage());
            return NeisPage.empty();
        }
    }

    /** schoolInfo[0].head 배열 안에 {@code {"list_total_count": N}} 형태. */
    private static int extractTotalCount(JsonNode schoolInfo) {
        for (JsonNode block : schoolInfo) {
            JsonNode head = block.path("head");
            if (head.isArray()) {
                for (JsonNode item : head) {
                    JsonNode total = item.path("list_total_count");
                    if (total.isInt() || total.isLong()) {
                        return total.asInt();
                    }
                }
            }
        }
        return 0;
    }

    private List<NeisSchoolRow> extractRows(JsonNode schoolInfo) throws Exception {
        for (JsonNode block : schoolInfo) {
            JsonNode rows = block.path("row");
            if (rows.isArray()) {
                var result = new ArrayList<NeisSchoolRow>(rows.size());
                for (JsonNode row : rows) {
                    result.add(objectMapper.treeToValue(row, NeisSchoolRow.class));
                }
                return result;
            }
        }
        return List.of();
    }

    /** NEIS 한 페이지 응답. */
    public record NeisPage(List<NeisSchoolRow> rows, int totalCount) {
        public static NeisPage empty() {
            return new NeisPage(List.of(), 0);
        }
    }

    /** NEIS 응답 row — 사용하는 4 필드만 매핑, 나머지 무시. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NeisSchoolRow(
            @JsonProperty("SD_SCHUL_CODE") String code,
            @JsonProperty("SCHUL_NM") String name,
            @JsonProperty("SCHUL_KND_SC_NM") String kindName,
            @JsonProperty("LCTN_SC_NM") String region
    ) {}
}
