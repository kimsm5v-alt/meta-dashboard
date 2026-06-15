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
import org.springframework.stereotype.Service;

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

    private final Driver neo4jDriver;
    private final DgnssMapper dgnssMapper;

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
        if (MapUtils.isEmpty(lpaResult)) {
            throw new IllegalArgumentException("answerIdx에 대한 LPA 결과가 없습니다. answerIdx=" + answerIdx);
        }
        lpaResult.remove("probabilitiesJson"); // 거대 raw 확률 문자열 제거 (lpaTop 확률로 대체)

        String className = MapUtils.getString(lpaResult, "typeName", "");
        String schoolLevel = MapUtils.getString(lpaResult, "schoolLevel", "");
        if (StringUtils.isBlank(className)) {
            throw new IllegalArgumentException("LPA 유형(typeName)이 비어 있습니다. answerIdx=" + answerIdx);
        }

        // 개별화 코칭 (기술명세서 4.4): 개인 T점수 ↔ LPA 집단 평균(GROUP_TSCORE) 편차로 강점/보완점 각 3개 선별
        Map<String, Double> studentTScores = loadStudentTScores(answerIdx);
        List<Map<String, Object>> groupTScores = queryGroupTScores(className, schoolLevel);
        List<Map<String, Object>> deviations = computeFactorDeviations(studentTScores, groupTScores);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answerIdx", answerIdx);
        result.put("lpa", lpaResult);

        if (deviations.isEmpty()) {
            // 개인 점수 또는 집단 평균(GROUP_TSCORE) 미확보: 유형(class) 기본 경로로 폴백
            List<Map<String, Object>> fallback = queryModerationPaths(className, schoolLevel, limit);
            result.put("strengths", new ArrayList<>());
            result.put("weaknesses", new ArrayList<>());
            result.put("typeDeviations", new ArrayList<>());
            result.put("moderationPaths", fallback);
            result.put("recommendationCount", fallback.size());
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

        // 코칭경로: 보완점 요인이 Z(조절변수)인 ModerationPath(Z_INDIVIDUAL) — FE 코칭 전략용 평면 배열
        List<Map<String, Object>> moderationPaths = new ArrayList<>();
        for (Map<String, Object> w : weaknesses) {
            moderationPaths.addAll(
                    queryModerationPathsByZFactor(className, schoolLevel, MapUtils.getString(w, "factorName", "")));
        }

        result.put("strengths", strengths);
        result.put("weaknesses", weaknesses);
        result.put("typeDeviations", buildTypeDeviations(deviations, SELECT_COUNT));
        result.put("moderationPaths", moderationPaths);
        result.put("recommendationCount", moderationPaths.size());
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

    /** 편차 계산 내부값(need)을 제거한 요인 정보 복사본 리스트 (유형별 특이점 응답용). */
    private List<Map<String, Object>> stripInternal(List<Map<String, Object>> factors) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> f : factors) {
            Map<String, Object> m = new LinkedHashMap<>(f);
            m.remove("need");
            out.add(m);
        }
        return out;
    }

    /** 특정 요인이 Z(조절변수, Z_INDIVIDUAL)인 ModerationPath를 조회한다 (기술명세서 7.4). */
    private List<Map<String, Object>> queryModerationPathsByZFactor(String className, String schoolLevel, String factorName) {
        String query = ""
                + "MATCH (c:LPAClass {name: $className})-[:HAS_MODERATION_PATH]->(m:ModerationPath)"
                + "<-[:Z_INDIVIDUAL]-(f:Factor {name: $factorName}) "
                + "WHERE ($schoolLevel = '' OR c.school_level = $schoolLevel) "
                + "RETURN m.id AS id, m.path_type AS pathType, m.path_color AS pathColor, "
                + "       m.x AS x, m.z AS z, m.y AS y, "
                + "       m.keyword_interp AS keywordInterp, m.keyword_strat AS keywordStrat, "
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
                + "RETURN m.id AS id, m.path_type AS pathType, m.path_color AS pathColor, "
                + "       m.x AS x, m.z AS z, m.y AS y, "
                + "       m.keyword_interp AS keywordInterp, m.keyword_strat AS keywordStrat, "
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
        row.put("pathColor", record.get("pathColor").asString(""));
        row.put("x", record.get("x").asString(""));
        row.put("z", record.get("z").asString(""));
        row.put("y", record.get("y").asString(""));
        row.put("keywordInterp", record.get("keywordInterp").asString(""));
        row.put("keywordStrat", record.get("keywordStrat").asString(""));
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
