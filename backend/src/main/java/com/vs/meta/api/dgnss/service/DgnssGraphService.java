package com.vs.meta.api.dgnss.service;

import com.vs.meta.api.dgnss.mapper.DgnssMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.Values;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DgnssGraphService {

    /** 강점/보완점 선별 개수 (기술명세서 4.4: 각 3개). */
    private static final int SELECT_COUNT = 3;

    /** LPA 그래프 적재용 Cypher 리소스(초등+중등 통합, MERGE 멱등). */
    private static final String LPA_GRAPH_RESOURCE_PATH = "data/lpa/lpa_graph_all_merge_safe.cypher";

    /** LPA 그래프 유니크 제약조건 Cypher 리소스(데이터 적재 전 선실행, IF NOT EXISTS 멱등). */
    private static final String LPA_CONSTRAINTS_RESOURCE_PATH = "data/lpa/constraints.cypher";

    /**
     * 개인화 코칭 v2 패치 리소스(강점 v3 / 보완점 v5, 초·중).
     * 모두 MATCH 기반 in-place 업데이트라 멱등이며, base 그래프가 먼저 적재돼 있어야 한다.
     * 적용 순서: 보완점(moderation) → 강점(strength).
     */
    private static final List<String> COACHING_V2_RESOURCE_PATHS = List.of(
            "data/lpa/v2/elementary_moderation_path_update_v5.cypher",
            "data/lpa/v2/middle_moderation_path_update_v5.cypher",
            "data/lpa/v2/elementary_strength_groupTscore_update_v3.cypher",
            "data/lpa/v2/middle_strength_groupTscore_update_v3.cypher"
    );

    private final Driver neo4jDriver;
    private final DgnssMapper dgnssMapper;

    /**
     * LPA 그래프 Cypher({@value #LPA_GRAPH_RESOURCE_PATH})를 Neo4j에 적재한다.
     * 전부 MERGE 구문(멱등)이라 반복 실행해도 중복 생성되지 않으며, 단일 트랜잭션으로 원자 적용된다.
     *
     * @return 적재 결과(구문 수, 상태)
     */
    public Map<String, Object> loadLpaGraph() {
        List<String> constraints = readCypherStatements(LPA_CONSTRAINTS_RESOURCE_PATH);
        List<String> statements = readCypherStatements(LPA_GRAPH_RESOURCE_PATH);
        if (statements.isEmpty()) {
            throw new IllegalStateException("적재할 Cypher 구문이 없습니다: " + LPA_GRAPH_RESOURCE_PATH);
        }

        try (Session session = neo4jDriver.session()) {
            // 1) 제약조건/인덱스: 스키마 구문은 데이터 트랜잭션과 분리해야 하므로 각각 autocommit 실행 (IF NOT EXISTS 멱등)
            for (String constraint : constraints) {
                session.run(constraint).consume();
            }
            // 2) 노드/관계 데이터: 단일 쓰기 트랜잭션으로 원자 적용 (MERGE 멱등)
            session.executeWriteWithoutResult(tx -> {
                for (String statement : statements) {
                    tx.run(statement);
                }
            });
        } catch (Exception e) {
            log.error("LPA 그래프 적재 실패. resource={}", LPA_GRAPH_RESOURCE_PATH, e);
            throw new IllegalStateException("LPA 그래프 적재 중 오류가 발생했습니다: " + e.getMessage(), e);
        }

        log.info("LPA 그래프 적재 완료. constraints={}, statements={}", constraints.size(), statements.size());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("resource", LPA_GRAPH_RESOURCE_PATH);
        result.put("constraintCount", constraints.size());
        result.put("statementCount", statements.size());
        result.put("status", "LOADED");
        return result;
    }

    /**
     * 개인화 코칭 v2 패치({@link #COACHING_V2_RESOURCE_PATHS})를 Neo4j에 적재한다.
     * 각 파일은 단일 {@code UNWIND ... MATCH ... SET ... RETURN count} 구문이며, MATCH 기반 in-place
     * 업데이트라 멱등이다(중복 노드/관계 생성 없음). 파일별 {@code updated_count}(기대 114)를 반환한다.
     * <p><b>전제</b>: base 그래프({@value #LPA_GRAPH_RESOURCE_PATH})가 먼저 적재돼 있어야 한다. truncate 금지.
     *
     * @return 파일별 적재 결과(구문 수·업데이트 건수)와 총합
     */
    public Map<String, Object> loadCoachingV2() {
        List<Map<String, Object>> fileResults = new ArrayList<>();
        long totalUpdated = 0L;

        try (Session session = neo4jDriver.session()) {
            for (String resourcePath : COACHING_V2_RESOURCE_PATHS) {
                List<String> statements = readCypherStatements(resourcePath);
                if (statements.isEmpty()) {
                    throw new IllegalStateException("적재할 Cypher 구문이 없습니다: " + resourcePath);
                }
                long updated = 0L;
                for (String statement : statements) {
                    final String stmt = statement;
                    Integer count = session.executeWrite(tx -> {
                        Result result = tx.run(stmt);
                        return result.hasNext() ? result.next().get("updated_count").asInt(0) : 0;
                    });
                    updated += (count != null ? count : 0);
                }
                Map<String, Object> fileResult = new LinkedHashMap<>();
                fileResult.put("resource", resourcePath);
                fileResult.put("statementCount", statements.size());
                fileResult.put("updatedCount", updated);
                fileResults.add(fileResult);
                totalUpdated += updated;
                log.info("코칭 v2 적재. resource={}, statements={}, updated={}", resourcePath, statements.size(), updated);
            }
        } catch (Exception e) {
            log.error("코칭 v2 그래프 적재 실패.", e);
            throw new IllegalStateException("코칭 v2 그래프 적재 중 오류가 발생했습니다: " + e.getMessage(), e);
        }

        log.info("코칭 v2 적재 완료. totalUpdated={}", totalUpdated);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("files", fileResults);
        result.put("totalUpdated", totalUpdated);
        result.put("status", "LOADED");
        return result;
    }

    /** Cypher 파일(classpath)을 구문 단위로 파싱한다. 한 줄당 한 구문, '//' 주석·빈 줄 제외, 끝 ';' 제거. */
    private List<String> readCypherStatements(String resourcePath) {
        List<String> statements = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ClassPathResource(resourcePath).getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder buffer = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("//")) {
                    continue;
                }
                buffer.append(line).append('\n');
                if (trimmed.endsWith(";")) {
                    String statement = buffer.toString().trim();
                    statement = statement.substring(0, statement.length() - 1).trim(); // 끝 ';' 제거
                    if (!statement.isEmpty()) {
                        statements.add(statement);
                    }
                    buffer.setLength(0);
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Cypher 파일을 읽을 수 없습니다: " + resourcePath, e);
        }
        return statements;
    }

    public Map<String, Object> selectModerationPathsByClass(String className, String schoolLevel, int limit) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> moderationPaths = queryModerationPaths(className, schoolLevel, limit);
        result.put("className", className);
        result.put("schoolLevel", schoolLevel);
        result.put("count", moderationPaths.size());
        result.put("moderationPaths", moderationPaths);
        return result;
    }

    public Map<String, Object> selectRecommendationByType(String schoolLevel, String typeName, int limit) {
        if (StringUtils.isBlank(typeName)) {
            throw new IllegalArgumentException("typeName은 필수입니다.");
        }

        Map<String, Object> classInfo = queryClassInfo(typeName, schoolLevel);
        if (MapUtils.isEmpty(classInfo)) {
            throw new IllegalArgumentException("해당 유형을 찾을 수 없습니다. typeName=" + typeName + ", schoolLevel=" + schoolLevel);
        }

        List<Map<String, Object>> moderationPaths = queryModerationPaths(typeName, schoolLevel, limit);
        List<Map<String, Object>> mediationPaths = queryMediationPaths(typeName, schoolLevel, limit);
        List<Map<String, Object>> factorScores = queryGroupTScores(typeName, schoolLevel);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("classInfo", classInfo);
        result.put("moderationPathCount", moderationPaths.size());
        result.put("mediationPathCount", mediationPaths.size());
        result.put("factorScoreCount", factorScores.size());
        result.put("moderationPaths", moderationPaths);
        result.put("mediationPaths", mediationPaths);
        result.put("factorScores", factorScores);
        return result;
    }

    public Map<String, Object> selectRecommendationByAnswerIdx(int answerIdx, int limit) {
        Map<String, Object> lpaResult = dgnssMapper.selectLpaResultByAnswerIdx(answerIdx);
        String className = MapUtils.isEmpty(lpaResult) ? "" : MapUtils.getString(lpaResult, "typeName", "");
        // LPA 결과/유형이 없으면(자기조절·미분류 등) 예외 대신 빈 추천을 반환한다.
        if (MapUtils.isEmpty(lpaResult) || StringUtils.isBlank(className)) {
            return emptyRecommendation(answerIdx);
        }

        String schoolLevel = MapUtils.getString(lpaResult, "schoolLevel", "");

        // 개별화 코칭 (기술명세서 4.4): 개인 T점수 ↔ LPA 집단 평균(GROUP_TSCORE) 편차로 강점/보완점 각 3개 선별
        Map<String, Double> studentTScores = loadStudentTScores(answerIdx);
        List<Map<String, Object>> groupTScores = queryGroupTScores(className, schoolLevel);
        List<Map<String, Object>> deviations = computeFactorDeviations(studentTScores, groupTScores);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answerIdx", answerIdx);

        if (deviations.isEmpty()) {
            // 개인 점수 또는 집단 평균(GROUP_TSCORE) 미확보: 유형(class) 기본 경로로 폴백
            List<Map<String, Object>> fallback = queryModerationPaths(className, schoolLevel, limit);
            result.put("strengths", new ArrayList<>());
            result.put("weaknesses", new ArrayList<>());
            result.put("typeDeviations", new ArrayList<>());
            result.put("moderationPaths", fallback);
            // 집단T 미확보라도 개인 T 절대값 기준 강점/약점은 계산 가능
            result.put("absoluteStrengths", topFactorsByScore(studentTScores, SELECT_COUNT, true));
            result.put("absoluteWeaknesses", topFactorsByScore(studentTScores, SELECT_COUNT, false));
            return result;
        }

        // need 내림차순: 클수록 보완 필요(보완점), 작을수록 강점
        deviations.sort((a, b) -> Double.compare(
                MapUtils.getDoubleValue(b, "need", 0d), MapUtils.getDoubleValue(a, "need", 0d)));

        // 유형별 특이점(편차 기반): 보완점 3 = need 상위, 강점 3 = need 하위(강한 순). 요인 정보만 — 경로는 분리.
        List<Map<String, Object>> weaknesses = stripInternal(
                deviations.subList(0, Math.min(SELECT_COUNT, deviations.size())));
        int from = Math.max(0, deviations.size() - SELECT_COUNT);
        List<Map<String, Object>> strengthSource = new ArrayList<>(deviations.subList(from, deviations.size()));
        Collections.reverse(strengthSource);
        List<Map<String, Object>> strengths = stripInternal(strengthSource);

        // 코칭경로: 강점 최상위 1개 + 보완점 최상위 1개 = 총 2개 (각 요인이 Z인 대표 ModerationPath, category 표시)
        List<Map<String, Object>> moderationPaths = new ArrayList<>();
        if (!strengths.isEmpty()) {
            addTopModerationPath(moderationPaths, className, schoolLevel, strengths.get(0), "strength");
        }
        if (!weaknesses.isEmpty()) {
            addTopModerationPath(moderationPaths, className, schoolLevel, weaknesses.get(0), "weakness");
        }

        result.put("strengths", strengths);
        result.put("weaknesses", weaknesses);
        result.put("typeDeviations", buildTypeDeviations(deviations, SELECT_COUNT));
        result.put("moderationPaths", moderationPaths);
        // 집단T 비교와 별개 — 개인 T 절대값 기준 최고/최저 N개 (명칭 미확정: absoluteStrengths/Weaknesses)
        result.put("absoluteStrengths", topFactorsByScore(studentTScores, SELECT_COUNT, true));
        result.put("absoluteWeaknesses", topFactorsByScore(studentTScores, SELECT_COUNT, false));
        return result;
    }

    /**
     * 개인화 코칭 v2(B2)용 선별 키 추출 — 텍스트는 조회하지 않고 <b>키만</b> 반환한다(코칭 문구는 RDB에서 조회).
     * <ul>
     *   <li>강점: 편차(need) 기준 강한 순 상위 2개 요인명</li>
     *   <li>보완점: need 상위 1개 요인이 Z인 대표 ModerationPath (moderation_id + x/y/z/path_type)</li>
     * </ul>
     * 고등/미분류/개인·집단 점수 미확보 시 빈 선별을 반환한다.
     *
     * @return {answerIdx, lpaClass, schoolLevel, strengthFactors:[요인명], moderation:{moderationId,xFactor,yFactor,zFactor,pathType}}
     */
    public Map<String, Object> selectCoachingSelectionByAnswerIdx(int answerIdx) {
        Map<String, Object> lpaResult = dgnssMapper.selectLpaResultByAnswerIdx(answerIdx);
        String className = MapUtils.isEmpty(lpaResult) ? "" : MapUtils.getString(lpaResult, "typeName", "");
        String schoolLevel = MapUtils.isEmpty(lpaResult) ? "" : MapUtils.getString(lpaResult, "schoolLevel", "");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answerIdx", answerIdx);
        result.put("lpaClass", className);
        result.put("schoolLevel", schoolLevel);
        result.put("strengthFactors", new ArrayList<String>());
        result.put("moderation", null);

        if (StringUtils.isBlank(className)) {
            return result; // 고등/미분류 등
        }

        Map<String, Double> studentTScores = loadStudentTScores(answerIdx);
        List<Map<String, Object>> deviations =
                computeFactorDeviations(studentTScores, queryGroupTScores(className, schoolLevel));
        if (deviations.isEmpty()) {
            return result;
        }
        // need 내림차순: 상위=보완 필요, 하위=강점
        deviations.sort((a, b) -> Double.compare(
                MapUtils.getDoubleValue(b, "need", 0d), MapUtils.getDoubleValue(a, "need", 0d)));

        // 강점 top2 (need 하위 = 가장 강한 순)
        int from = Math.max(0, deviations.size() - 2);
        List<Map<String, Object>> strengthSrc = new ArrayList<>(deviations.subList(from, deviations.size()));
        Collections.reverse(strengthSrc);
        List<String> strengthFactors = new ArrayList<>();
        for (Map<String, Object> d : strengthSrc) {
            strengthFactors.add(MapUtils.getString(d, "factorName", ""));
        }
        result.put("strengthFactors", strengthFactors);

        // 보완점 top1 → 대표 ModerationPath
        List<Map<String, Object>> paths = queryModerationPathsByZFactor(
                className, schoolLevel, MapUtils.getString(deviations.get(0), "factorName", ""));
        if (!paths.isEmpty()) {
            Map<String, Object> p = paths.get(0);
            Map<String, Object> moderation = new LinkedHashMap<>();
            moderation.put("moderationId", p.get("id"));
            moderation.put("xFactor", p.get("x"));
            moderation.put("yFactor", p.get("y"));
            moderation.put("zFactor", p.get("z"));
            moderation.put("pathType", p.get("pathType"));
            result.put("moderation", moderation);
        }
        return result;
    }

    /** answerIdx의 요인(잎)별 개인 T점수 맵 (요인명 → T). */
    private Map<String, Double> loadStudentTScores(int answerIdx) {
        Map<String, Double> scores = new HashMap<>();
        List<Map<String, Object>> rows = dgnssMapper.selectFactorScoresByAnswerIdx(answerIdx);
        if (CollectionUtils.isEmpty(rows)) {
            return scores;
        }
        for (Map<String, Object> row : rows) {
            String name = MapUtils.getString(row, "sectionNm", "");
            if (StringUtils.isNotBlank(name)) {
                scores.putIfAbsent(name, MapUtils.getDoubleValue(row, "tScore", 50.0));
            }
        }
        return scores;
    }

    /**
     * 요인별 편차(개인T − 집단T)와 보완 필요도(need)를 계산한다 (기술명세서 4.4).
     * <ul>
     *   <li>정적요인: need = 집단T − 개인T (개인이 집단보다 낮을수록 보완 필요)</li>
     *   <li>부적요인: need = 개인T − 집단T (개인이 집단보다 높을수록 더 부정적 = 보완 필요)</li>
     * </ul>
     * GROUP_TSCORE(집단 평균)와 매칭되는 잎 요인만 대상 — 상위 분류명은 자동 제외된다.
     */
    private List<Map<String, Object>> computeFactorDeviations(Map<String, Double> studentTScores,
                                                              List<Map<String, Object>> groupTScores) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (studentTScores.isEmpty() || CollectionUtils.isEmpty(groupTScores)) {
            return result;
        }
        for (Map<String, Object> g : groupTScores) {
            String name = MapUtils.getString(g, "factorName", "");
            if (StringUtils.isBlank(name) || !studentTScores.containsKey(name)) {
                continue;
            }
            double groupT = MapUtils.getDoubleValue(g, "tScore", 50.0);
            double individualT = studentTScores.get(name);
            boolean negative = "negative".equalsIgnoreCase(MapUtils.getString(g, "factorType", ""));
            double deviation = individualT - groupT;          // 부호 보존(양수=강점, 음수=보완 — 정적요인 기준)
            double need = negative ? deviation : -deviation;  // 클수록 보완 필요

            // 방향(direction): 편차가 학생에게 긍정적이면 'positive', 부정적이면 'negative'
            //  - 정적요인: 편차 ≥ 0 → positive, < 0 → negative
            //  - 부적요인: 편차 ≤ 0 → positive, > 0 → negative
            String direction = negative
                    ? (deviation <= 0 ? "positive" : "negative")
                    : (deviation >= 0 ? "positive" : "negative");

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("factorName", name);
            row.put("factorType", MapUtils.getString(g, "factorType", ""));
            row.put("individualT", individualT);
            row.put("groupT", groupT);
            row.put("deviation", deviation);
            row.put("direction", direction);
            row.put("need", need);
            result.add(row);
        }
        return result;
    }

    /**
     * 개인 T점수 절대값 기준 상위/하위 N개 요인 (집단 비교 없음 — 개인 T 원점수만 사용).
     * highest=true → T 높은 순(강점), false → T 낮은 순(약점). {factorName, individualT} 반환.
     * 주의: 부적요인(스트레스·소진 등)도 그대로 섞이므로, 'T가 높다=좋다'가 아닐 수 있음(요인 성격 미보정).
     */
    private List<Map<String, Object>> topFactorsByScore(Map<String, Double> studentTScores, int n, boolean highest) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (studentTScores == null || studentTScores.isEmpty()) {
            return out;
        }
        List<Map.Entry<String, Double>> entries = new ArrayList<>(studentTScores.entrySet());
        entries.sort((a, b) -> highest
                ? Double.compare(b.getValue(), a.getValue())
                : Double.compare(a.getValue(), b.getValue()));
        for (int i = 0; i < Math.min(n, entries.size()); i++) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("factorName", entries.get(i).getKey());
            row.put("individualT", entries.get(i).getValue());
            out.add(row);
        }
        return out;
    }

    /**
     * FE '유형별 특이점'(getTypeDeviations) 동일 방식 — GROUP_TSCORE 편차의 절댓값이 큰 상위 N개(강점·약점 혼합).
     * FE 렌더 필드명(factor/studentScore/typeMean/diff/direction)에 맞춰 반환한다.
     */
    private List<Map<String, Object>> buildTypeDeviations(List<Map<String, Object>> deviations, int topN) {
        List<Map<String, Object>> sorted = new ArrayList<>(deviations);
        sorted.sort((a, b) -> Double.compare(
                Math.abs(MapUtils.getDoubleValue(b, "deviation", 0d)),
                Math.abs(MapUtils.getDoubleValue(a, "deviation", 0d))));

        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = 0; i < sorted.size() && i < topN; i++) {
            Map<String, Object> f = sorted.get(i);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("factor", f.get("factorName"));
            item.put("studentScore", f.get("individualT"));
            item.put("typeMean", round1(MapUtils.getDoubleValue(f, "groupT", 0d)));
            item.put("diff", round1(MapUtils.getDoubleValue(f, "deviation", 0d)));
            item.put("direction", f.get("direction"));
            out.add(item);
        }
        return out;
    }

    /** 소수점 첫째자리 반올림 (FE 표시값과 동일하게). */
    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    /** LPA 결과/유형이 없을 때(자기조절·미분류 등) 내려줄 빈 추천 응답.
     *  집단T 기반 항목은 비우되, 개인 T 절대값 기준 강점/약점은 LPA 없이도 계산해 제공한다. */
    private Map<String, Object> emptyRecommendation(int answerIdx) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answerIdx", answerIdx);
        result.put("strengths", new ArrayList<>());
        result.put("weaknesses", new ArrayList<>());
        result.put("typeDeviations", new ArrayList<>());
        result.put("moderationPaths", new ArrayList<>());
        Map<String, Double> studentTScores = loadStudentTScores(answerIdx);
        result.put("absoluteStrengths", topFactorsByScore(studentTScores, SELECT_COUNT, true));
        result.put("absoluteWeaknesses", topFactorsByScore(studentTScores, SELECT_COUNT, false));
        return result;
    }

    /** 편차 계산 내부값(need)을 제거한 요인 정보 복사본 리스트 (유형별 특이점 응답용). */
    private List<Map<String, Object>> stripInternal(List<Map<String, Object>> factors) {
        // 강점/보완점은 FE에서 factorName·individualT만 사용. 나머지는 미사용(groupT·deviation·direction은
        // typeDeviations의 typeMean·diff·direction과 중복)이라 응답에서 제외한다.
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> f : factors) {
            Map<String, Object> m = new LinkedHashMap<>(f);
            m.remove("need");
            m.remove("factorType");
            m.remove("groupT");
            m.remove("deviation");
            m.remove("direction");
            out.add(m);
        }
        return out;
    }

    /** 선별 요인(강점/보완점)의 대표 ModerationPath 1개를 category('strength'/'weakness')와 함께 목록에 추가. */
    private void addTopModerationPath(List<Map<String, Object>> out, String className, String schoolLevel,
                                      Map<String, Object> factor, String category) {
        List<Map<String, Object>> paths =
                queryModerationPathsByZFactor(className, schoolLevel, MapUtils.getString(factor, "factorName", ""));
        if (!paths.isEmpty()) {
            Map<String, Object> path = paths.get(0); // 요인별 대표 1개
            path.put("category", category);
            out.add(path);
        }
    }

    /** 특정 요인이 Z(조절변수, Z_INDIVIDUAL)인 ModerationPath를 조회한다 (기술명세서 7.4). */
    private List<Map<String, Object>> queryModerationPathsByZFactor(String className, String schoolLevel, String factorName) {
        String query = ""
                + "MATCH (c:LPAClass {name: $className})-[:HAS_MODERATION_PATH]->(m:ModerationPath)"
                + "<-[:Z_INDIVIDUAL]-(f:Factor {name: $factorName}) "
                + "WHERE ($schoolLevel = '' OR c.school_level = $schoolLevel) "
                + "RETURN m.id AS id, m.path_type AS pathType, "
                + "       m.x AS x, m.z AS z, m.y AS y, m.z_factor_type AS zFactorType, "
                + "       m.interpretation AS interpretation, m.strategy AS strategy "
                + "ORDER BY m.id";

        List<Map<String, Object>> rows = new ArrayList<>();
        try (Session session = neo4jDriver.session()) {
            Result result = session.run(
                    query,
                    Values.parameters(
                            "className", className,
                            "schoolLevel", StringUtils.defaultString(schoolLevel),
                            "factorName", factorName
                    )
            );
            while (result.hasNext()) {
                rows.add(mapModerationPathRow(result.next()));
            }
        } catch (Exception e) {
            log.error("Failed to query Neo4j moderation paths by Z factor. className={}, factor={}", className, factorName, e);
            throw new IllegalStateException("Neo4j 조회 중 오류가 발생했습니다.");
        }
        return rows;
    }

    private Map<String, Object> queryClassInfo(String className, String schoolLevel) {
        String query = ""
                + "MATCH (c:LPAClass {name: $className}) "
                + "WHERE $schoolLevel = '' OR c.school_level = $schoolLevel "
                + "RETURN c.name AS className, c.school_level AS schoolLevel, c.class_num AS classNum, "
                + "       c.color AS color, c.description AS description "
                + "LIMIT 1";

        try (Session session = neo4jDriver.session()) {
            Result result = session.run(
                    query,
                    Values.parameters(
                            "className", className,
                            "schoolLevel", StringUtils.defaultString(schoolLevel)
                    )
            );
            if (!result.hasNext()) {
                return new LinkedHashMap<>();
            }
            Record record = result.next();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("className", record.get("className").asString(""));
            row.put("schoolLevel", record.get("schoolLevel").asString(""));
            row.put("classNum", record.get("classNum").asInt(0));
            row.put("color", record.get("color").asString(""));
            row.put("description", record.get("description").asString(""));
            return row;
        } catch (Exception e) {
            log.error("Failed to query class info. className={}, schoolLevel={}", className, schoolLevel, e);
            throw new IllegalStateException("Neo4j 조회 중 오류가 발생했습니다.");
        }
    }

    private List<Map<String, Object>> queryModerationPaths(String className, String schoolLevel, int limit) {
        String query = ""
                + "MATCH (c:LPAClass {name: $className})-[:HAS_MODERATION_PATH]->(m:ModerationPath) "
                + "WHERE $schoolLevel = '' OR c.school_level = $schoolLevel "
                + "RETURN m.id AS id, m.path_type AS pathType, "
                + "       m.x AS x, m.z AS z, m.y AS y, m.z_factor_type AS zFactorType, "
                + "       m.interpretation AS interpretation, m.strategy AS strategy "
                + "ORDER BY m.id "
                + "LIMIT $limit";

        List<Map<String, Object>> rows = new ArrayList<>();
        try (Session session = neo4jDriver.session()) {
            Result result = session.run(
                    query,
                    Values.parameters(
                            "className", className,
                            "schoolLevel", StringUtils.defaultString(schoolLevel),
                            "limit", limit
                    )
            );
            while (result.hasNext()) {
                rows.add(mapModerationPathRow(result.next()));
            }
        } catch (Exception e) {
            log.error("Failed to query Neo4j moderation paths. className={}, schoolLevel={}", className, schoolLevel, e);
            throw new IllegalStateException("Neo4j 조회 중 오류가 발생했습니다.");
        }
        return rows;
    }

    /** ModerationPath 레코드 → 응답 row 매핑 (queryModerationPaths / queryModerationPathsByFactors 공통). */
    private Map<String, Object> mapModerationPathRow(Record record) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", record.get("id").asString(""));
        row.put("pathType", record.get("pathType").asString(""));
        row.put("x", record.get("x").asString(""));
        row.put("z", record.get("z").asString(""));
        row.put("y", record.get("y").asString(""));
        row.put("zFactorType", record.get("zFactorType").asString("")); // Z(조절=선별 요인)의 정적(positive)/부적(negative)
        row.put("interpretation", record.get("interpretation").asString(""));
        row.put("strategy", record.get("strategy").asString(""));
        return row;
    }

    private List<Map<String, Object>> queryMediationPaths(String className, String schoolLevel, int limit) {
        String query = ""
                + "MATCH (c:LPAClass {name: $className})-[:HAS_MEDIATION_PATH]->(m:MediationPath) "
                + "WHERE $schoolLevel = '' OR c.school_level = $schoolLevel "
                + "RETURN c.name AS className, c.school_level AS schoolLevel, c.description AS classDescription, "
                + "       m.id AS id, m.x AS x, m.m AS mediator, m.y AS y, "
                + "       m.interpretation AS interpretation, m.strategy AS strategy "
                + "ORDER BY m.id "
                + "LIMIT $limit";

        List<Map<String, Object>> rows = new ArrayList<>();
        try (Session session = neo4jDriver.session()) {
            Result result = session.run(
                    query,
                    Values.parameters(
                            "className", className,
                            "schoolLevel", StringUtils.defaultString(schoolLevel),
                            "limit", limit
                    )
            );
            while (result.hasNext()) {
                Record record = result.next();
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("className", record.get("className").asString(""));
                row.put("schoolLevel", record.get("schoolLevel").asString(""));
                row.put("classDescription", record.get("classDescription").asString(""));
                row.put("id", record.get("id").asString(""));
                row.put("x", record.get("x").asString(""));
                row.put("mediator", record.get("mediator").asString(""));
                row.put("y", record.get("y").asString(""));
                row.put("interpretation", record.get("interpretation").asString(""));
                row.put("strategy", record.get("strategy").asString(""));
                rows.add(row);
            }
        } catch (Exception e) {
            log.error("Failed to query Neo4j mediation paths. className={}, schoolLevel={}", className, schoolLevel, e);
            throw new IllegalStateException("Neo4j 조회 중 오류가 발생했습니다.");
        }
        return rows;
    }

    private List<Map<String, Object>> queryGroupTScores(String className, String schoolLevel) {
        String query = ""
                + "MATCH (c:LPAClass {name: $className})-[r:GROUP_TSCORE]->(f:Factor) "
                + "WHERE $schoolLevel = '' OR c.school_level = $schoolLevel "
                + "RETURN f.id AS factorId, f.name AS factorName, f.factor_type AS factorType, "
                + "       f.need_score_direction AS needScoreDirection, "
                + "       r.t_score AS tScore, r.raw_mean AS rawMean, r.school_level AS schoolLevel "
                + "ORDER BY factorName";

        List<Map<String, Object>> rows = new ArrayList<>();
        try (Session session = neo4jDriver.session()) {
            Result result = session.run(
                    query,
                    Values.parameters(
                            "className", className,
                            "schoolLevel", StringUtils.defaultString(schoolLevel)
                    )
            );
            while (result.hasNext()) {
                Record record = result.next();
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("factorId", record.get("factorId").asString(""));
                row.put("factorName", record.get("factorName").asString(""));
                row.put("factorType", record.get("factorType").asString(""));
                row.put("needScoreDirection", record.get("needScoreDirection").asString(""));
                row.put("tScore", record.get("tScore").asDouble(0D));
                row.put("rawMean", record.get("rawMean").asDouble(0D));
                row.put("schoolLevel", record.get("schoolLevel").asString(""));
                rows.add(row);
            }
        } catch (Exception e) {
            log.error("Failed to query Neo4j GROUP_TSCORE. className={}, schoolLevel={}", className, schoolLevel, e);
            throw new IllegalStateException("Neo4j 조회 중 오류가 발생했습니다.");
        }
        return rows;
    }
}
