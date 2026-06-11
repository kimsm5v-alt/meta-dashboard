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
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DgnssGraphService {

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

        String className = MapUtils.getString(lpaResult, "typeName", "");
        String schoolLevel = MapUtils.getString(lpaResult, "schoolLevel", "");
        if (StringUtils.isBlank(className)) {
            throw new IllegalArgumentException("LPA 유형(typeName)이 비어 있습니다. answerIdx=" + answerIdx);
        }

        // 개인화: 학생 요인 T점수 + 요인 방향(need_score_direction)으로 '도움 필요' 상위 N 요인 산출
        List<Map<String, Object>> factorScores = dgnssMapper.selectFactorScoresByAnswerIdx(answerIdx);
        Map<String, String> factorDirections = queryFactorNeedDirections();
        List<String> weakFactors = resolveWeakFactors(factorScores, factorDirections, limit);

        // 약점 요인이 포함된(x 또는 z) 경로를 심각도 순으로 우선 추천. 산출 실패 시 유형(class) 기본 경로로 폴백.
        List<Map<String, Object>> moderationPaths =
                queryModerationPathsByFactors(className, schoolLevel, weakFactors, limit);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answerIdx", answerIdx);
        result.put("lpa", lpaResult);
        result.put("weakFactors", weakFactors);
        result.put("recommendationCount", moderationPaths.size());
        result.put("moderationPaths", moderationPaths);
        return result;
    }

    /**
     * 학생 요인 T점수와 요인 방향을 이용해 '도움이 필요한' 요인을 심각도 내림차순 상위 N개로 산출한다.
     * <ul>
     *   <li>정적요인(lower_T_worse): T점수가 낮을수록 심각</li>
     *   <li>부적요인(higher_T_worse): T점수가 높을수록 심각</li>
     * </ul>
     * 방향 정보가 없는(=잎 요인이 아닌 상위 분류) 항목은 제외한다.
     * 점수/방향이 비어 있으면 빈 목록을 반환해 호출부가 유형(class) 기본 동작으로 폴백하도록 한다.
     */
    private List<String> resolveWeakFactors(List<Map<String, Object>> factorScores,
                                            Map<String, String> factorDirections,
                                            int topN) {
        if (CollectionUtils.isEmpty(factorScores) || MapUtils.isEmpty(factorDirections)) {
            return new ArrayList<>();
        }

        List<Map.Entry<String, Double>> ranked = new ArrayList<>();
        java.util.Set<String> seen = new java.util.HashSet<>();
        for (Map<String, Object> row : factorScores) {
            String factorName = MapUtils.getString(row, "sectionNm", "");
            String direction = factorDirections.get(factorName);
            if (StringUtils.isBlank(factorName) || direction == null || !seen.add(factorName)) {
                continue; // 방향 정보 없는 상위 분류명 또는 중복 제외
            }
            double tScore = MapUtils.getDoubleValue(row, "tScore", 50.0);
            double severity = "higher_T_worse".equalsIgnoreCase(direction)
                    ? (tScore - 50.0)   // 부적요인: 높을수록 심각
                    : (50.0 - tScore);  // 정적요인: 낮을수록 심각
            ranked.add(Map.entry(factorName, severity));
        }

        ranked.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
        List<String> result = new ArrayList<>();
        for (int i = 0; i < ranked.size() && i < topN; i++) {
            result.add(ranked.get(i).getKey());
        }
        return result;
    }

    /** Factor 노드의 요인별 점수 방향(need_score_direction) 맵. 조회 실패 시 빈 맵(→ 개인화 폴백). */
    private Map<String, String> queryFactorNeedDirections() {
        Map<String, String> directions = new LinkedHashMap<>();
        String query = "MATCH (f:Factor) RETURN f.name AS name, f.need_score_direction AS direction";
        try (Session session = neo4jDriver.session()) {
            Result result = session.run(query);
            while (result.hasNext()) {
                Record record = result.next();
                String name = record.get("name").asString("");
                if (StringUtils.isNotBlank(name)) {
                    directions.put(name, record.get("direction").asString(""));
                }
            }
        } catch (Exception e) {
            log.error("Failed to query Neo4j factor directions.", e);
            return new LinkedHashMap<>();
        }
        return directions;
    }

    /**
     * 약점 요인(weakFactors)이 x 또는 z에 포함된 ModerationPath를 조회해, 약점 심각도 순서로 정렬 후 상위 limit개 반환.
     * weakFactors 가 비어 있으면 기존 동작(유형 단위, id 순)으로 폴백한다.
     */
    private List<Map<String, Object>> queryModerationPathsByFactors(String className, String schoolLevel,
                                                                    List<String> weakFactors, int limit) {
        if (CollectionUtils.isEmpty(weakFactors)) {
            return queryModerationPaths(className, schoolLevel, limit);
        }

        String query = ""
                + "MATCH (c:LPAClass {name: $className})-[:HAS_MODERATION_PATH]->(m:ModerationPath) "
                + "WHERE ($schoolLevel = '' OR c.school_level = $schoolLevel) "
                + "  AND (m.x IN $weakFactors OR m.z IN $weakFactors) "
                + "RETURN c.name AS className, c.school_level AS schoolLevel, c.description AS classDescription, "
                + "       m.id AS id, m.path_type AS pathType, m.path_color AS pathColor, "
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
                            "weakFactors", weakFactors
                    )
            );
            while (result.hasNext()) {
                rows.add(mapModerationPathRow(result.next()));
            }
        } catch (Exception e) {
            log.error("Failed to query Neo4j moderation paths by factors. className={}, schoolLevel={}", className, schoolLevel, e);
            throw new IllegalStateException("Neo4j 조회 중 오류가 발생했습니다.");
        }

        // 약점 심각도 순서(weakFactors의 인덱스가 앞일수록 심각)로 정렬 — 안정 정렬로 동률은 id 순 유지
        rows.sort(Comparator.comparingInt(row -> bestWeakFactorRank(row, weakFactors)));
        return rows.size() > limit ? new ArrayList<>(rows.subList(0, limit)) : rows;
    }

    /** 경로의 x/z 중 weakFactors에서 더 앞선(=더 심각한) 순위. 매칭 없으면 최하위. */
    private int bestWeakFactorRank(Map<String, Object> row, List<String> weakFactors) {
        int xi = weakFactors.indexOf(MapUtils.getString(row, "x", ""));
        int zi = weakFactors.indexOf(MapUtils.getString(row, "z", ""));
        int rankX = (xi < 0) ? Integer.MAX_VALUE : xi;
        int rankZ = (zi < 0) ? Integer.MAX_VALUE : zi;
        return Math.min(rankX, rankZ);
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
                + "RETURN c.name AS className, c.school_level AS schoolLevel, c.description AS classDescription, "
                + "       m.id AS id, m.path_type AS pathType, m.path_color AS pathColor, "
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
        row.put("className", record.get("className").asString(""));
        row.put("schoolLevel", record.get("schoolLevel").asString(""));
        row.put("classDescription", record.get("classDescription").asString(""));
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
