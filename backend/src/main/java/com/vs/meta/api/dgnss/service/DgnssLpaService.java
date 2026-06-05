package com.vs.meta.api.dgnss.service;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.vs.meta.api.dgnss.mapper.DgnssMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
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
    private static final String MODEL_PARAMS_RESOURCE_PATH = "data/lpa-model-params.json";
    private static final String MODEL_VERSION = "lpa-bayes-v2";
    private static final String PROFILE_VERSION = "2026-03-23";

    private static final List<LpaClassInfo> ELEMENTARY_CLASSES = Arrays.asList(
            new LpaClassInfo("Class1", "자원소진형"),
            new LpaClassInfo("Class2", "안전 균형형"),
            new LpaClassInfo("Class3", "몰입자원 풍부형")
    );

    private static final List<LpaClassInfo> MIDDLE_CLASSES = Arrays.asList(
            new LpaClassInfo("Class4", "냉소적 무기력형"),
            new LpaClassInfo("Class5", "정서조절 취약형"),
            new LpaClassInfo("Class6", "자기주도 몰입형")
    );

    private static final Map<String, String> FEATURE_TO_SECTION_ID = createFeatureSectionMap();
    private static final Set<String> FACTOR_SECTION_IDS = new LinkedHashSet<>(FEATURE_TO_SECTION_ID.values());

    private final ObjectMapper objectMapper;
    private final DgnssMapper dgnssMapper;

    private List<String> featureOrder = Collections.emptyList();
    private Map<String, SchoolModel> schoolModelByKey = Collections.emptyMap();
    private Map<String, LpaClassInfo> classInfoById = Collections.emptyMap();

    @PostConstruct
    void loadLpaResources() {
        try {
            loadModelParams();
            loadClassInfos();
        } catch (IOException e) {
            throw new java.lang.IllegalStateException("Failed to load LPA model resource file.", e);
        }
    }

    public void processAndSave(int answerIdx) {
        Map<String, Object> studentInfo = dgnssMapper.selectStUserInfo(Collections.singletonMap("answerIdx", answerIdx));
        if (MapUtils.isEmpty(studentInfo)) {
            log.warn("Skipping LPA classification because student info was not found. answerIdx={}", answerIdx);
            return;
        }

        String storedSchoolLevel = resolveStoredSchoolLevel(MapUtils.getString(studentInfo, "SCH_GRADE", ""));
        String modelSchoolLevel = resolveModelSchoolLevel(storedSchoolLevel);
        List<LpaClassInfo> targetClasses = resolveTargetClasses(modelSchoolLevel);
        SchoolModel schoolModel = schoolModelByKey.get(modelSchoolLevel);

        if (targetClasses.isEmpty() || schoolModel == null) {
            upsertUnsupportedResult(studentInfo, storedSchoolLevel, "UNSUPPORTED");
            return;
        }

        List<Map<String, Object>> rawScores = dgnssMapper.selectLpaFactorScores(answerIdx);
        Map<String, Double> scoreBySectionId = new LinkedHashMap<>();
        for (Map<String, Object> rawScore : rawScores) {
            scoreBySectionId.put(
                    MapUtils.getString(rawScore, "SECTION_ID", ""),
                    MapUtils.getDouble(rawScore, "T_SCORE", 0D)
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

        List<Double> orderedScores = buildOrderedScores(scoreBySectionId);
        ClassificationResult classificationResult = classify(orderedScores, schoolModel, targetClasses);

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("answerIdx", MapUtils.getInteger(studentInfo, "ANSWER_IDX"));
        params.put("dgnssResultId", MapUtils.getInteger(studentInfo, "dgnssResultId"));
        params.put("testIdx", MapUtils.getInteger(studentInfo, "TEST_IDX"));
        params.put("memId", MapUtils.getString(studentInfo, "MEM_ID", ""));
        params.put("schoolLevel", storedSchoolLevel);
        params.put("classId", classificationResult.classId);
        params.put("typeName", classificationResult.typeName);
        params.put("confidence", roundToTwoDecimals(classificationResult.confidence));
        params.put("modelVersion", MODEL_VERSION);
        params.put("profileVersion", PROFILE_VERSION);
        params.put("inputScoresJson", writeJson(orderedScores));
        params.put("probabilitiesJson", writeJson(classificationResult.probabilities));
        params.put("status", "COMPLETED");
        dgnssMapper.upsertDgnssLpaResult(params);
    }

    /**
     * 검사(dgnssId) 단위로 제출 완료한 학생들의 LPA 유형을 일괄 재분류하여 upsert 한다.
     * T점수 재계산(PC_DGNSS_MARK) 없이 이미 저장된 점수를 다시 분류만 하며, 건별로 격리되어
     * 한 학생의 실패가 나머지 처리를 막지 않는다.
     */
    public Map<String, Object> reprocessByDgnssId(int dgnssId) {
        List<Integer> answerIdxList = dgnssMapper.selectLpaTargetAnswerIdxByDgnssId(dgnssId);

        int success = 0;
        List<Integer> failedAnswerIdx = new ArrayList<>();
        for (Integer answerIdx : answerIdxList) {
            try {
                processAndSave(answerIdx);
                success++;
            } catch (Exception e) {
                failedAnswerIdx.add(answerIdx);
                log.error("LPA 재분류 실패. dgnssId={}, answerIdx={}", dgnssId, answerIdx, e);
            }
        }

        log.info("LPA 재분류 완료. dgnssId={}, total={}, success={}, failed={}",
                dgnssId, answerIdxList.size(), success, failedAnswerIdx.size());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dgnssId", dgnssId);
        result.put("total", answerIdxList.size());
        result.put("success", success);
        result.put("failed", failedAnswerIdx.size());
        result.put("failedAnswerIdx", failedAnswerIdx);
        return result;
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

    private List<Double> buildOrderedScores(Map<String, Double> scoreBySectionId) {
        List<Double> orderedScores = new ArrayList<>(featureOrder.size());
        for (String featureName : featureOrder) {
            String sectionId = FEATURE_TO_SECTION_ID.get(featureName);
            if (StringUtils.isBlank(sectionId)) {
                throw new java.lang.IllegalStateException("Unknown feature in feature_order: " + featureName);
            }
            Double score = scoreBySectionId.get(sectionId);
            if (score == null) {
                throw new java.lang.IllegalStateException("Missing score for sectionId=" + sectionId + ", feature=" + featureName);
            }
            orderedScores.add(score);
        }
        return orderedScores;
    }

    private ClassificationResult classify(List<Double> orderedScores, SchoolModel schoolModel, List<LpaClassInfo> targetClasses) {
        Map<String, Double> logPosteriors = new LinkedHashMap<>();

        for (LpaClassInfo classInfo : targetClasses) {
            List<Double> means = schoolModel.meansByTypeName.get(classInfo.typeName);
            Double prior = schoolModel.priorsByTypeName.get(classInfo.typeName);
            if (means == null || prior == null || prior <= 0D) {
                continue;
            }

            double logLikelihood = calculateLogLikelihood(orderedScores, means, schoolModel.variances);
            logPosteriors.put(classInfo.classId, logLikelihood + Math.log(prior));
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

        LpaClassInfo selectedClass = classInfoById.getOrDefault(topEntry.getKey(), new LpaClassInfo(topEntry.getKey(), topEntry.getKey()));

        return new ClassificationResult(
                selectedClass.classId,
                selectedClass.typeName,
                topEntry.getValue(),
                probabilities
        );
    }

    private double calculateLogLikelihood(List<Double> orderedScores, List<Double> means, List<Double> variances) {
        if (orderedScores.size() != means.size() || orderedScores.size() != variances.size()) {
            throw new java.lang.IllegalStateException("LPA score/mean/variance vector size mismatch.");
        }

        double logLikelihood = 0D;
        for (int i = 0; i < orderedScores.size(); i++) {
            double variance = variances.get(i);
            if (variance <= 0D) {
                throw new java.lang.IllegalStateException("Invalid variance value at index=" + i + ": " + variance);
            }

            double diff = orderedScores.get(i) - means.get(i);
            logLikelihood += -0.5D * (((diff * diff) / variance) + Math.log(2D * Math.PI * variance));
        }
        return logLikelihood;
    }

    private void loadModelParams() throws IOException {
        try (InputStream inputStream = new ClassPathResource(MODEL_PARAMS_RESOURCE_PATH).getInputStream()) {
            JsonNode root = objectMapper.readTree(inputStream);

            List<String> loadedFeatureOrder = readTextArray(root.path("feature_order"));
            if (loadedFeatureOrder.size() != FEATURE_TO_SECTION_ID.size()) {
                throw new java.lang.IllegalStateException("feature_order count is invalid: " + loadedFeatureOrder.size());
            }

            SchoolModel elementaryModel = parseSchoolModel(root.path("elementary"));
            SchoolModel middleModel = parseSchoolModel(root.path("middle"));

            Map<String, SchoolModel> schoolMap = new LinkedHashMap<>();
            schoolMap.put("elementary", elementaryModel);
            schoolMap.put("middle", middleModel);

            this.featureOrder = Collections.unmodifiableList(loadedFeatureOrder);
            this.schoolModelByKey = Collections.unmodifiableMap(schoolMap);
        }
    }

    private SchoolModel parseSchoolModel(JsonNode schoolNode) {
        if (schoolNode.isMissingNode() || schoolNode.isNull()) {
            throw new java.lang.IllegalStateException("LPA school model node is missing.");
        }

        Map<String, List<Double>> meansByTypeName = new LinkedHashMap<>();
        JsonNode meansNode = schoolNode.path("means");
        meansNode.properties().forEach(entry -> meansByTypeName.put(entry.getKey(), readDoubleArray(entry.getValue())));

        List<Double> variances = readDoubleArray(schoolNode.path("variances"));
        Map<String, Double> priorsByTypeName = readDoubleMap(schoolNode.path("priors"));

        return new SchoolModel(meansByTypeName, variances, priorsByTypeName);
    }

    private void loadClassInfos() {
        Map<String, LpaClassInfo> result = new LinkedHashMap<>();
        for (LpaClassInfo info : ELEMENTARY_CLASSES) {
            result.put(info.classId, info);
        }
        for (LpaClassInfo info : MIDDLE_CLASSES) {
            result.put(info.classId, info);
        }
        this.classInfoById = Collections.unmodifiableMap(result);
    }

    private List<LpaClassInfo> resolveTargetClasses(String modelSchoolLevel) {
        if (StringUtils.equals(modelSchoolLevel, "elementary")) {
            return ELEMENTARY_CLASSES;
        }
        if (StringUtils.equals(modelSchoolLevel, "middle")) {
            return MIDDLE_CLASSES;
        }
        return Collections.emptyList();
    }

    private String resolveModelSchoolLevel(String storedSchoolLevel) {
        if (StringUtils.equals(storedSchoolLevel, "elementary")) {
            return "elementary";
        }
        if (StringUtils.equals(storedSchoolLevel, "middle") || StringUtils.equals(storedSchoolLevel, "high")) {
            return "middle";
        }
        return "";
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

    private List<String> readTextArray(JsonNode arrayNode) {
        List<String> result = new ArrayList<>();
        if (arrayNode == null || !arrayNode.isArray()) {
            return result;
        }

        for (JsonNode node : arrayNode) {
            result.add(node.asText(""));
        }
        return result;
    }

    private List<Double> readDoubleArray(JsonNode arrayNode) {
        List<Double> result = new ArrayList<>();
        if (arrayNode == null || !arrayNode.isArray()) {
            return result;
        }

        for (JsonNode node : arrayNode) {
            result.add(node.asDouble(0D));
        }
        return result;
    }

    private Map<String, Double> readDoubleMap(JsonNode objectNode) {
        Map<String, Double> result = new LinkedHashMap<>();
        if (objectNode == null || !objectNode.isObject()) {
            return result;
        }

        objectNode.properties().forEach(entry -> result.put(entry.getKey(), entry.getValue().asDouble(0D)));
        return result;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException e) {
            throw new java.lang.IllegalStateException("Failed to serialize LPA result.", e);
        }
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100D) / 100D;
    }

    private static Map<String, String> createFeatureSectionMap() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("자아존중감", "10-22-01-01-01-0");
        map.put("자기효능감", "10-22-01-01-02-0");
        map.put("성장마인드셋", "10-22-01-01-03-0");
        map.put("자기정서인식", "10-22-01-02-01-0");
        map.put("자기정서조절", "10-22-01-02-02-0");
        map.put("타인정서인식", "10-22-01-02-03-0");
        map.put("타인공감능력", "10-22-01-02-04-0");
        map.put("계획능력", "10-22-02-01-01-0");
        map.put("점검능력", "10-22-02-01-02-0");
        map.put("조절능력", "10-22-02-01-03-0");
        map.put("공부환경", "10-22-02-02-01-0");
        map.put("시간관리", "10-22-02-02-02-0");
        map.put("수업태도", "10-22-02-02-03-0");
        map.put("노트하기", "10-22-02-02-04-0");
        map.put("시험준비", "10-22-02-02-05-0");
        map.put("부모 의사소통", "10-22-02-03-01-0");
        map.put("부모 학업지지", "10-22-02-03-02-0");
        map.put("친구 정서지지", "10-22-02-03-03-0");
        map.put("교사 정서지지", "10-22-02-03-04-0");
        map.put("활기", "10-22-04-01-01-0");
        map.put("몰두", "10-22-04-01-02-0");
        map.put("의미감", "10-22-04-01-03-0");
        map.put("자율성", "10-22-04-02-01-0");
        map.put("유능성", "10-22-04-02-02-0");
        map.put("관계성", "10-22-04-02-03-0");
        map.put("성적부담", "10-22-03-01-01-0");
        map.put("공부부담", "10-22-03-01-02-0");
        map.put("수업부담", "10-22-03-01-03-0");
        map.put("부모 성적압력", "10-22-03-02-01-0");
        map.put("부모 공부부담", "10-22-03-02-02-0");
        map.put("친구 공부비교", "10-22-03-02-03-0");
        map.put("교사 성적압력", "10-22-03-02-04-0");
        map.put("교사 수업부담", "10-22-03-02-05-0");
        map.put("스마트폰 의존", "10-22-03-03-01-0");
        map.put("게임 과몰입", "10-22-03-03-02-0");
        map.put("고갈", "10-22-05-01-01-0");
        map.put("무능감", "10-22-05-01-02-0");
        map.put("반감-냉소", "10-22-05-01-03-0");
        return Collections.unmodifiableMap(map);
    }

    private static final class SchoolModel {
        private final Map<String, List<Double>> meansByTypeName;
        private final List<Double> variances;
        private final Map<String, Double> priorsByTypeName;

        private SchoolModel(Map<String, List<Double>> meansByTypeName, List<Double> variances, Map<String, Double> priorsByTypeName) {
            this.meansByTypeName = meansByTypeName;
            this.variances = variances;
            this.priorsByTypeName = priorsByTypeName;
        }
    }

    private static final class LpaClassInfo {
        private final String classId;
        private final String typeName;

        private LpaClassInfo(String classId, String typeName) {
            this.classId = classId;
            this.typeName = typeName;
        }
    }

    private static final class ClassificationResult {
        private final String classId;
        private final String typeName;
        private final double confidence;
        private final Map<String, Double> probabilities;

        private ClassificationResult(String classId, String typeName, double confidence, Map<String, Double> probabilities) {
            this.classId = classId;
            this.typeName = typeName;
            this.confidence = confidence;
            this.probabilities = probabilities;
        }
    }
}
