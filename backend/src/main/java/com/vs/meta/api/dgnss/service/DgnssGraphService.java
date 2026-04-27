package com.vs.meta.api.dgnss.service;

import com.vs.meta.api.dgnss.mapper.DgnssMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.Values;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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

        List<Map<String, Object>> moderationPaths = queryModerationPaths(className, schoolLevel, limit);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("answerIdx", answerIdx);
        result.put("lpa", lpaResult);
        result.put("recommendationCount", moderationPaths.size());
        result.put("moderationPaths", moderationPaths);
        return result;
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
                Record record = result.next();
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
                rows.add(row);
            }
        } catch (Exception e) {
            log.error("Failed to query Neo4j moderation paths. className={}, schoolLevel={}", className, schoolLevel, e);
            throw new IllegalStateException("Neo4j 조회 중 오류가 발생했습니다.");
        }
        return rows;
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
