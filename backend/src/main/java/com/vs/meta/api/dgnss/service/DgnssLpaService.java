package com.vs.meta.api.dgnss.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vs.meta.api.dgnss.mapper.DgnssMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class DgnssLpaService {
    private static final String PROFILE_RESOURCE_PATH = "data/lpa-profile-data.json";
    private static final String TYPES_RESOURCE_PATH = "data/lpa-types.json";
    private static final String MODEL_VERSION = "lpa-bayes-v1";
    private static final String PROFILE_VERSION = "2026-03-20";
    private static final double VARIANCE = 100D;

    private static final List<String> ELEMENTARY_CLASS_IDS = Arrays.asList("Class1", "Class2", "Class3");
    private static final List<String> MIDDLE_CLASS_IDS = Arrays.asList("Class4", "Class5", "Class6");

    private static final String[] FACTOR_SECTION_ORDER = {
            "10-22-01-01-01-0", "10-22-01-01-02-0", "10-22-01-01-03-0",
            "10-22-01-02-01-0", "10-22-01-02-02-0", "10-22-01-02-03-0", "10-22-01-02-04-0",
            "10-22-02-01-01-0", "10-22-02-01-02-0", "10-22-02-01-03-0",
            "10-22-02-02-01-0", "10-22-02-02-02-0", "10-22-02-02-03-0", "10-22-02-02-04-0", "10-22-02-02-05-0",
            "10-22-02-03-01-0", "10-22-02-03-02-0", "10-22-02-03-03-0", "10-22-02-03-04-0",
            "10-22-03-01-01-0", "10-22-03-01-02-0", "10-22-03-01-03-0",
            "10-22-03-02-01-0", "10-22-03-02-02-0", "10-22-03-02-03-0", "10-22-03-02-04-0", "10-22-03-02-05-0",
            "10-22-03-03-01-0", "10-22-03-03-02-0",
            "10-22-04-01-01-0", "10-22-04-01-02-0", "10-22-04-01-03-0",
            "10-22-04-02-01-0", "10-22-04-02-02-0", "10-22-04-02-03-0",
            "10-22-05-01-01-0", "10-22-05-01-02-0", "10-22-05-01-03-0"
    };

    private static final Set<String> FACTOR_SECTION_IDS = new LinkedHashSet<>(Arrays.asList(FACTOR_SECTION_ORDER));

    private final ObjectMapper objectMapper;
    private final DgnssMapper dgnssMapper;

    private Map<String, List<Double>> profileMeansByClassId = Collections.emptyMap();
    private Map<String, LpaTypeMeta> typeMetaByClassId = Collections.emptyMap();

    @PostConstruct
    void loadLpaResources() {
        try {
            profileMeansByClassId = loadProfileMeans();
            typeMetaByClassId = loadTypeMetadata();
        } catch (IOException e) {
            throw new java.lang.IllegalStateException("Failed to load LPA resource files.", e);
        }
    }

    public void processAndSave(int answerIdx) {
        Map<String, Object> studentInfo = dgnssMapper.selectStUserInfo(Collections.singletonMap("answerIdx", answerIdx));
        if (MapUtils.isEmpty(studentInfo)) {
            log.warn("Skipping LPA classification because student info was not found. answerIdx={}", answerIdx);
            return;
        }

        String storedSchoolLevel = resolveStoredSchoolLevel(MapUtils.getString(studentInfo, "SCH_GRADE", ""));
        List<String> targetClassIds = resolveTargetClassIds(storedSchoolLevel);
        if (targetClassIds.isEmpty()) {
            upsertUnsupportedResult(studentInfo, storedSchoolLevel, "UNSUPPORTED");
            return;
        }

        List<Map<String, Object>> rawScores = dgnssMapper.selectLpaFactorScores(answerIdx);
        Map<String, Integer> scoreBySectionId = new LinkedHashMap<>();
        for (Map<String, Object> rawScore : rawScores) {
            scoreBySectionId.put(
                    MapUtils.getString(rawScore, "SECTION_ID", ""),
                    MapUtils.getInteger(rawScore, "T_SCORE", 0)
            );
        }

        if (!scoreBySectionId.keySet().containsAll(FACTOR_SECTION_IDS)) {
            log.warn(
                    "Skipping LPA classification because required 38 factor scores are incomplete. answerIdx={}, found={}",
                    answerIdx,
                    scoreBySectionId.size()
            );
            return;
        }

        List<Integer> orderedScores = new ArrayList<>(FACTOR_SECTION_ORDER.length);
        for (String sectionId : FACTOR_SECTION_ORDER) {
            orderedScores.add(scoreBySectionId.get(sectionId));
        }

        ClassificationResult classificationResult = classify(orderedScores, targetClassIds);
        LpaTypeMeta typeMeta = typeMetaByClassId.get(classificationResult.classId);
        if (typeMeta == null) {
            log.warn("Skipping LPA classification because type metadata was not found. classId={}", classificationResult.classId);
            return;
        }

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("answerIdx", MapUtils.getInteger(studentInfo, "ANSWER_IDX"));
        params.put("dgnssResultId", MapUtils.getInteger(studentInfo, "dgnssResultId"));
        params.put("testIdx", MapUtils.getInteger(studentInfo, "TEST_IDX"));
        params.put("memId", MapUtils.getString(studentInfo, "MEM_ID", ""));
        params.put("schoolLevel", storedSchoolLevel);
        params.put("classId", classificationResult.classId);
        params.put("typeName", typeMeta.typeName);
        params.put("confidence", roundToTwoDecimals(classificationResult.confidence));
        params.put("modelVersion", MODEL_VERSION);
        params.put("profileVersion", PROFILE_VERSION);
        params.put("inputScoresJson", writeJson(orderedScores));
        params.put("probabilitiesJson", writeJson(classificationResult.probabilities));
        params.put("status", "COMPLETED");
        dgnssMapper.upsertDgnssLpaResult(params);
    }

    private void upsertUnsupportedResult(Map<String, Object> studentInfo, String schoolLevel, String status) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("answerIdx", MapUtils.getInteger(studentInfo, "ANSWER_IDX"));
        params.put("dgnssResultId", MapUtils.getInteger(studentInfo, "dgnssResultId"));
        params.put("testIdx", MapUtils.getInteger(studentInfo, "TEST_IDX"));
        params.put("memId", MapUtils.getString(studentInfo, "MEM_ID", ""));
        params.put("schoolLevel", schoolLevel);
        params.put("classId", "UNSUPPORTED");
        params.put("typeName", "미지원");
        params.put("confidence", 0D);
        params.put("modelVersion", MODEL_VERSION);
        params.put("profileVersion", PROFILE_VERSION);
        params.put("inputScoresJson", "[]");
        params.put("probabilitiesJson", "{}");
        params.put("status", status);
        dgnssMapper.upsertDgnssLpaResult(params);
    }

    private ClassificationResult classify(List<Integer> orderedScores, List<String> targetClassIds) {
        Map<String, Double> logPosteriors = new LinkedHashMap<>();
        for (String classId : targetClassIds) {
            List<Double> means = profileMeansByClassId.get(classId);
            LpaTypeMeta meta = typeMetaByClassId.get(classId);
            if (means == null || meta == null) {
                continue;
            }

            double logLikelihood = calculateLogLikelihood(orderedScores, means);
            double prior = meta.proportion / 100D;
            logPosteriors.put(classId, logLikelihood + Math.log(prior));
        }

        if (logPosteriors.isEmpty()) {
            throw new java.lang.IllegalStateException("No LPA classes were available for classification.");
        }

        double maxLogPosterior = logPosteriors.values().stream().mapToDouble(Double::doubleValue).max().orElseThrow();
        double sumExp = 0D;
        Map<String, Double> probabilities = new LinkedHashMap<>();

        for (Map.Entry<String, Double> entry : logPosteriors.entrySet()) {
            sumExp += Math.exp(entry.getValue() - maxLogPosterior);
        }

        for (Map.Entry<String, Double> entry : logPosteriors.entrySet()) {
            probabilities.put(entry.getKey(), (Math.exp(entry.getValue() - maxLogPosterior) / sumExp) * 100D);
        }

        Map.Entry<String, Double> topEntry = probabilities.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElseThrow();

        return new ClassificationResult(topEntry.getKey(), topEntry.getValue(), probabilities);
    }

    private double calculateLogLikelihood(List<Integer> orderedScores, List<Double> means) {
        double logLikelihood = 0D;
        double logConstant = Math.log(2D * Math.PI * VARIANCE);
        for (int i = 0; i < FACTOR_SECTION_ORDER.length; i++) {
            double diff = orderedScores.get(i) - means.get(i);
            logLikelihood += -0.5D * (((diff * diff) / VARIANCE) + logConstant);
        }
        return logLikelihood;
    }

    private List<String> resolveTargetClassIds(String storedSchoolLevel) {
        if (StringUtils.equals(storedSchoolLevel, "elementary")) {
            return ELEMENTARY_CLASS_IDS;
        }
        if (StringUtils.equals(storedSchoolLevel, "middle") || StringUtils.equals(storedSchoolLevel, "high")) {
            return MIDDLE_CLASS_IDS;
        }
        return Collections.emptyList();
    }

    private String resolveStoredSchoolLevel(String schGrade) {
        if (StringUtils.equals(schGrade, "CMM13001")) {
            return "elementary";
        }
        if (StringUtils.equals(schGrade, "CMM13002")) {
            return "middle";
        }
        if (StringUtils.equals(schGrade, "CMM13003")) {
            return "high";
        }
        return "";
    }

    private Map<String, List<Double>> loadProfileMeans() throws IOException {
        try (InputStream inputStream = new ClassPathResource(PROFILE_RESOURCE_PATH).getInputStream()) {
            Map<String, LinkedHashMap<String, Double>> raw = objectMapper.readValue(
                    inputStream,
                    new TypeReference<Map<String, LinkedHashMap<String, Double>>>() { }
            );

            Map<String, List<Double>> result = new LinkedHashMap<>();
            for (Map.Entry<String, LinkedHashMap<String, Double>> entry : raw.entrySet()) {
                result.put(entry.getKey(), new ArrayList<>(entry.getValue().values()));
            }
            return result;
        }
    }

    private Map<String, LpaTypeMeta> loadTypeMetadata() throws IOException {
        try (InputStream inputStream = new ClassPathResource(TYPES_RESOURCE_PATH).getInputStream()) {
            Map<String, Map<String, Object>> raw = objectMapper.readValue(
                    inputStream,
                    new TypeReference<Map<String, Map<String, Object>>>() { }
            );

            Map<String, LpaTypeMeta> result = new LinkedHashMap<>();
            for (Map.Entry<String, Map<String, Object>> entry : raw.entrySet()) {
                result.put(
                        entry.getKey(),
                        new LpaTypeMeta(
                                MapUtils.getString(entry.getValue(), "typeName", ""),
                                MapUtils.getDoubleValue(entry.getValue(), "proportion", 0D)
                        )
                );
            }
            return result;
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException e) {
            throw new java.lang.IllegalStateException("Failed to serialize LPA result.", e);
        }
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100D) / 100D;
    }

    private static final class LpaTypeMeta {
        private final String typeName;
        private final double proportion;

        private LpaTypeMeta(String typeName, double proportion) {
            this.typeName = typeName;
            this.proportion = proportion;
        }
    }

    private static final class ClassificationResult {
        private final String classId;
        private final double confidence;
        private final Map<String, Double> probabilities;

        private ClassificationResult(String classId, double confidence, Map<String, Double> probabilities) {
            this.classId = classId;
            this.confidence = confidence;
            this.probabilities = probabilities;
        }
    }
}
