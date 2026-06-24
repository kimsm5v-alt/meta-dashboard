package com.vs.meta.api.dgnss.service;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.vs.meta.api.notification.event.ExamSubmittedEvent;
import com.vs.meta.api.notification.event.StudentExamNotificationEvent;
import com.vs.meta.api.notification.event.TeacherExamNotificationEvent;
import com.vs.meta.common.auth.UserInfoEnricher;
import com.vs.meta.common.auth.UserSlot;
import com.vs.meta.common.exception.IllegalStateException;
import com.vs.meta.common.exception.ValidationException;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.service.FileService;
import com.vs.meta.common.utils.NcpMailSender;
import com.vs.meta.common.utils.PagingInfo;
import com.vs.meta.common.utils.PagingParam;
import com.vs.meta.api.dgnss.mapper.DgnssMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.ClassPathResource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.http.HttpServletRequest;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toCollection;

@Service
@RequiredArgsConstructor
@Slf4j
public class DgnssService {
    private static final String LPA_TYPES_RESOURCE_PATH = "data/lpa-types.json";

    // PDF 쿼리 병렬 실행용 스레드 풀 (최대 20개 동시 쿼리)
    private final ExecutorService pdfQueryPool = Executors.newFixedThreadPool(20);

    private final ObjectMapper mapper;
    private final DgnssMapper dgnssMapper;
    private final DgnssLpaService dgnssLpaService;
    private final DgnssGraphService dgnssGraphService;
    private final PdfService pdfService;
    private final FileService fileService;
    private final NcpMailSender ncpMailSender;
    private final ApplicationEventPublisher eventPublisher;
    private final UserInfoEnricher userInfoEnricher;
    private Map<String, String> lpaTypeNameByClassId = Collections.emptyMap();

    @Value("${spring.profiles.active}")
    private String serverEnv;

    @PostConstruct
    void loadLpaTypes() {
        try {
            ClassPathResource resource = new ClassPathResource(LPA_TYPES_RESOURCE_PATH);
            Map<String, Map<String, Object>> raw = mapper.readValue(
                    resource.getInputStream(),
                    new TypeReference<Map<String, Map<String, Object>>>() { }
            );

            Map<String, String> typeNameMap = new LinkedHashMap<>();
            for (Map.Entry<String, Map<String, Object>> entry : raw.entrySet()) {
                typeNameMap.put(entry.getKey(), MapUtils.getString(entry.getValue(), "typeName", entry.getKey()));
            }
            lpaTypeNameByClassId = typeNameMap;
        } catch (IOException e) {
            log.warn("Failed to load LPA type metadata. top3 type names will fallback to classId.", e);
            lpaTypeNameByClassId = Collections.emptyMap();
        }
    }

    @PreDestroy
    void shutdownPdfQueryPool() {
        pdfQueryPool.shutdown();
        try {
            if (!pdfQueryPool.awaitTermination(5, TimeUnit.SECONDS)) {
                pdfQueryPool.shutdownNow();
            }
        } catch (InterruptedException e) {
            pdfQueryPool.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    public Map<String, Object> selectTcDgnssInfo(Map<String, Object> paramMap) {
        Map<String, Object> resultMap = new HashMap<>();
        int paperIdx = MapUtils.getInteger(paramMap, "paperIdx", 0);
        // 이미 심리검사를 수행한 학생이 전학을 가는 경우 전학간 학생의 이력 제거

        if (paperIdx > 0) {
            List<String> allStList = dgnssMapper.selectAllStdtList(paramMap);
            List<String> dgnssStList = dgnssMapper.selectDgnssStdtList(paramMap);
            List<String> deleteTarget = dgnssStList.stream()
                    .filter(item -> !allStList.contains(item))
                    .distinct()
                    .collect(Collectors.toList());
            if (CollectionUtils.isNotEmpty(deleteTarget)) {
                dgnssMapper.deleteTargetStListResultInfo(deleteTarget);
                dgnssMapper.deleteTargetStListAnswer(deleteTarget);
            }
        }

        List<Map<String, Object>> selectTcDgnssInfo = dgnssMapper.selectTcDgnssInfo(paramMap);
        if (paperIdx > 0) {
            // 학습종합검사가 적용된 경우
            if (CollectionUtils.isNotEmpty(selectTcDgnssInfo)) {
                selectTcDgnssInfo.removeIf(map -> map.get("ordNo") != null && (int) map.get("ordNo") == 3);
                for (Map<String, Object> map : selectTcDgnssInfo) {
                    String notDgnssStartListStr = MapUtils.getString(map, "notDgnssStartList", "");
                    if (StringUtils.isNotEmpty(notDgnssStartListStr)) {
                        String[] notDgnssStartListArr = notDgnssStartListStr.split(",");

                        if (notDgnssStartListArr.length > 1) {
                            String resultStr = "";
                            for (int i = 0; i < notDgnssStartListArr.length; i++) {
                                String stdtId = notDgnssStartListArr[i];

                                if (i > 0) {
                                    resultStr += ",";
                                }
                                resultStr += stdtId;
                            }

                            map.put("notDgnssStartList", resultStr);
                        }
                    }
                }
                resultMap.put("dgnssInfo", selectTcDgnssInfo);
            } else {
                resultMap.put("dgnssInfo", "");
            }
        } else {
            // 구버전일 경우
            if (CollectionUtils.isNotEmpty(selectTcDgnssInfo)) {
                Map<String, Object> lastDgnssInfoMap = selectTcDgnssInfo.get(selectTcDgnssInfo.size()-1);
                if (StringUtils.equals(MapUtils.getString(lastDgnssInfoMap, "dgnssAt", ""), "N") && MapUtils.getInteger(lastDgnssInfoMap, "ordNo", 0) < 3) {
                    resultMap.put("next", "Y");
                } else {
                    resultMap.put("next", "N");
                }
                resultMap.put("dgnssInfo", selectTcDgnssInfo);
            } else {
                resultMap.put("next", "Y");
                resultMap.put("dgnssInfo", "");
            }
        }

        return resultMap;
    }

    /**
     * /tc/start 호출 전 사전 검증.
     * <p>현재 학급 group_member 전체를 분류:
     * <p><b>1회차(ordNo=1):</b>
     * <ul>
     *   <li>{@code ELIGIBLE} — 타학급에서 1회차 이력 없음 → 출제 가능</li>
     *   <li>{@code BLOCKED_OTHER_CLASS} — 타학급에서 1회차 이력 존재 → 출제 불가</li>
     * </ul>
     * <p><b>2회차(ordNo=2):</b>
     * <ul>
     *   <li>{@code ELIGIBLE} — 현재 학급에서 1회차 응시 + 타학급 1회차 이력 없음 → 출제 가능</li>
     *   <li>{@code BLOCKED_OTHER_CLASS} — 타학급에서 1회차 이력 존재 → 출제 불가</li>
     *   <li>{@code NO_HISTORY} — 1회차 이력 없음 → 출제 불가</li>
     * </ul>
     * <p>응답: canStart(eligibleCount &gt; 0), totalCount, eligibleCount, blockedOtherClassCount,
     * noHistoryCount, blockedStudents(stdtId/nickname/memberNo).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> selectTcDgnssStartPreview(Map<String, Object> param) {
        List<Map<String, Object>> rows = dgnssMapper.selectTcDgnssStartPreview(param);
        // Phase 3: memberSpUserId → nickname 복원 (FE 호환)
        enrichMaps(rows, "memberSpUserId", "nickname", null);

        int eligibleCount = 0;
        int blockedCount = 0;
        int noHistoryCount = 0;
        List<Map<String, Object>> blockedStudents = new ArrayList<>();

        if (rows != null) {
            for (Map<String, Object> row : rows) {
                String status = MapUtils.getString(row, "status", "");
                if ("ELIGIBLE".equals(status)) {
                    eligibleCount++;
                } else if ("BLOCKED_OTHER_CLASS".equals(status)) {
                    blockedCount++;
                    Map<String, Object> blocked = new LinkedHashMap<>();
                    blocked.put("stdtId", MapUtils.getString(row, "stdtId", ""));
                    blocked.put("nickname", MapUtils.getString(row, "nickname", ""));
                    blocked.put("memberNo", row.get("memberNo"));
                    blockedStudents.add(blocked);
                } else {
                    noHistoryCount++;
                }
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("canStart", eligibleCount > 0);
        result.put("totalCount", rows == null ? 0 : rows.size());
        result.put("eligibleCount", eligibleCount);
        result.put("blockedOtherClassCount", blockedCount);
        result.put("noHistoryCount", noHistoryCount);
        result.put("blockedStudents", blockedStudents);
        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> insertTcDgnssStart(Map<String, Object> paramMap) {
        int result = 0;
        int paperIdx = MapUtils.getInteger(paramMap, "paperIdx", 0);
        int ordNo = MapUtils.getInteger(paramMap, "ordNo", 0);
        String tcId = MapUtils.getString(paramMap, "tcId", "");
        String claId = MapUtils.getString(paramMap, "claId", "");
        int actvStdtCnt = dgnssMapper.selectActvStdtCnt(paramMap);
        if (actvStdtCnt == 0) {
            Map<String, Object> resultMap = new HashMap<>();
            resultMap.put("result", "fail");
            resultMap.put("message", "검사를 진행할 수 있는 학생이 없습니다.");
            return resultMap;
        }
        // 회차별 시작시
        // 진단검사 마스터테이블 중복 체크
        int existsDgnssInfo = dgnssMapper.selectExistsDgnssInfo(paramMap);
        if (existsDgnssInfo > 0) {
            throw new IllegalStateException("이미 진행 중인 진단검사가 존재합니다.");
        }
        // 진단검사 마스터테이블 Insert
        dgnssMapper.insertDgnssInfo(paramMap);

        List<String> targetStList;
        if (ordNo == 1) {
            targetStList = dgnssMapper.selectEligibleTargetStListForOrd1(paramMap);
            if (CollectionUtils.isEmpty(targetStList)) {
                Map<String, Object> resultMap = new HashMap<>();
                resultMap.put("result", "fail");
                resultMap.put("message", "모든 학생이 다른 학급에서 검사가 진행 중입니다.");
                return resultMap;
            }
        } else if (ordNo == 2) {
            targetStList = dgnssMapper.selectEligibleTargetStListForOrd2(paramMap);
            if (CollectionUtils.isEmpty(targetStList)) {
                Map<String, Object> resultMap = new HashMap<>();
                resultMap.put("result", "fail");
                resultMap.put("message", "2회차는 동일 학급 1회차 응시 이력이 있는 학생만 출제할 수 있습니다.");
                return resultMap;
            }
        } else {
            targetStList = dgnssMapper.selectTargetStList(paramMap);
        }
        Map<String, Object> targetMap = new HashMap<>();
        targetMap.put("dgnssId", MapUtils.getInteger(paramMap, "id", 0));
        targetMap.put("claId", claId);
        targetMap.put("ordNo", ordNo);
        targetMap.put("paperIdx", paperIdx);

        String grade = MapUtils.getString(paramMap, "grade", "");
        if (StringUtils.equals(grade, "el")) {
            targetMap.put("schGrade", "CMM13001");
        } else if (StringUtils.equals(grade, "mi")) {
            targetMap.put("schGrade", "CMM13002");
        } else if (StringUtils.equals(grade, "hi")) {
            targetMap.put("schGrade", "CMM13003");
        }

        // 학생 세팅
        for (String stdtId : targetStList) {
            targetMap.put("stdtId", stdtId);
            dgnssMapper.insertDgnssOmr(targetMap);
            dgnssMapper.insertDgnssResult(targetMap);
            dgnssMapper.insertDgnssAnswer(targetMap);
            result++;
        }
        Map<String, Object> dgnssInfoMap = dgnssMapper.selectTcDgnssInfoOne(paramMap);

        dgnssInfoMap.put("stTotalCnt", result);
        publishExamAssignedEvent(paramMap);

        return dgnssInfoMap;
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> updateTcDgnssEnd(Map<String, Object> paramMap, HttpServletRequest request) throws Exception {
        dgnssMapper.updateDgnssInfo(paramMap);
        Map<String, Object> dgnssInfoMap = dgnssMapper.selectTcDgnssInfoOneWithDgnssId(paramMap);
        if (dgnssInfoMap == null) {
            throw new IllegalStateException("진단 정보를 찾을 수 없습니다.");
        }
        String paperIdx = MapUtils.getString(dgnssInfoMap, "paperIdx", "");
        paramMap.put("paperIdx", paperIdx);
        int expectedQuestionCount = resolveExpectedQuestionCount(paperIdx);
        // 강사가 강제로 종료한 경우 학생들 응시 이력 탐색을 해서 모든 문제를 푼 학생은 제출이 되어야 한다
        List<LinkedHashMap<String, Object>> stOmrList = dgnssMapper.selectStOmrInfo(paramMap);
        List<Integer> dgnssResultIdList = new ArrayList<>();
        Map<Integer, Boolean> sameAnswerMap = new HashMap<>();
        for (LinkedHashMap<String, Object> map : stOmrList) {
            int dgnssResultId = MapUtils.getInteger(map, "dgnssResultId", 0);
            LinkedHashMap<String, Object> answersOnly = new LinkedHashMap<>(map);
            answersOnly.remove("dgnssResultId");
            // 모든 문항이 실제 응답값(빈값/0 제외)일 때만 자동 제출 대상에 포함
            if (!hasAllAnsweredValues(answersOnly, expectedQuestionCount)) {
                continue;
            }
            // 동일 응답한 문항이 10개 이상인지 체크하는 로직
            boolean sameAnswerCheck = answerCheck(answersOnly.values(), 10);

            dgnssResultIdList.add(dgnssResultId);
            sameAnswerMap.put(dgnssResultId, sameAnswerCheck);
        }
        // 제출 처리(프로시저 실행)
        if (CollectionUtils.isNotEmpty(dgnssResultIdList)) {
            for (int dgnssResultId : dgnssResultIdList) {
                stSubmit(dgnssResultId, paperIdx, MapUtils.getBoolean(sameAnswerMap, dgnssResultId, false), request, false);
            }
        }
        List<String> submStdtIdList = dgnssMapper.selectSubmitStList(paramMap);
        dgnssInfoMap.put("submStdtList", submStdtIdList);
        dgnssInfoMap.put("stSubmCnt", dgnssResultIdList.size());
        publishExamEndedReportEvent(dgnssInfoMap);
        publishExamResultPublishedEvent(dgnssInfoMap);
        return dgnssInfoMap;
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteTcDgnssCancel(Map<String, Object> param) {
        // FK 자식 테이블(LPA 분석결과) 먼저 삭제 — info/result_info/answer 의 부모이므로 가장 먼저 정리해야 함
        dgnssMapper.deleteTcDgnssLpaResult(param);

        List<Integer> omrList = dgnssMapper.selectOmrIdxList(param);
        if (CollectionUtils.isNotEmpty(omrList)) {
            for (int omrIdx : omrList) {
                dgnssMapper.deleteDgnssOmrIdx(omrIdx);
            }
        }
        dgnssMapper.deleteTcDgnssResultInfo(param);
        dgnssMapper.deleteTcDgnssAnswer(param);
        dgnssMapper.deleteTcDgnssInfo(param);
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> tcDgnssRestart(Map<String, Object> param) throws Exception {
        Map<String, Object> resultMap = new HashMap<>();

        List<String> allStList = dgnssMapper.selectAllStdtList(param);
        List<String> dgnssStList = dgnssMapper.selectDgnssStdtListFromDgnssId(param);
        List<String> targetStList = allStList.stream()
                .filter(item -> !dgnssStList.contains(item))
                .distinct()
                .collect(Collectors.toList());

        if (CollectionUtils.isNotEmpty(targetStList)) {
            Map<String, Object> targetMap = new HashMap<>();
            Map<String, Object> dgnssInfoMap = dgnssMapper.selectTcDgnssInfoOneWithDgnssId(param);

            targetMap.put("dgnssId", MapUtils.getInteger(dgnssInfoMap, "dgnssId", 0));
            targetMap.put("claId", MapUtils.getString(dgnssInfoMap, "claId", ""));
            targetMap.put("ordNo", MapUtils.getInteger(dgnssInfoMap, "ordNo", 0));
            targetMap.put("paperIdx", MapUtils.getInteger(dgnssInfoMap, "paperIdx", 0));

            String grade = MapUtils.getString(param, "grade", "");
            String schGrade = resolveSchGrade(grade);
            if (schGrade != null) {
                targetMap.put("schGrade", schGrade);
            }

            for (String stdtId : targetStList) {
                targetMap.put("stdtId", stdtId);
                dgnssMapper.insertDgnssOmr(targetMap);
                dgnssMapper.insertDgnssResult(targetMap);
                dgnssMapper.insertDgnssAnswer(targetMap);
            }

            publishExamReexamRequestedEvent(dgnssInfoMap, targetStList);
        }
        // 상태값 및 PDF 초기화
        dgnssMapper.updateDgnssStatus(param);
        resultMap.put("result", "ok");
        return resultMap;
    }

    /**
     * 그룹 가입 시 해당 학생에게 진행 중인 학심정(학습심리정서검사) 시험지를 배부한다.
     * <ul>
     *   <li>학급에 진행 중(dgnss_at='Y')인 검사 전체 — 종합(paperIdx=1)/자기조절(paperIdx=2) — 를 대상으로 한다.</li>
     *   <li>이미 해당 검사에 등록된 경우, 또는 다른 학급 응시 이력으로 차단 대상인 경우 건너뛴다.</li>
     *   <li>{@link #tcDgnssRestart(Map)} 와 달리 학급 전체가 아니라 가입한 단일 학생만 등록한다.</li>
     * </ul>
     *
     * @param claId  학급 ID
     * @param grade  레거시 학교급 코드(el/mi/hi)
     * @param stdtId 가입 학생 ID
     * @return 실제로 배부(등록)된 검사들의 dgnssId 목록
     */
    @Transactional(rollbackFor = Exception.class)
    public List<Integer> assignActiveDgnssToStudent(String claId, String grade, String stdtId) {
        List<Integer> assignedDgnssIds = new ArrayList<>();
        if (StringUtils.isBlank(claId) || StringUtils.isBlank(stdtId)) {
            return assignedDgnssIds;
        }

        List<Map<String, Object>> activeDgnssList = dgnssMapper.findActiveDgnssListByClaId(claId);
        if (CollectionUtils.isEmpty(activeDgnssList)) {
            return assignedDgnssIds;
        }

        String schGrade = resolveSchGrade(grade);

        for (Map<String, Object> activeDgnss : activeDgnssList) {
            int dgnssId = MapUtils.getIntValue(activeDgnss, "dgnssId", 0);
            int paperIdx = MapUtils.getIntValue(activeDgnss, "paperIdx", 0);
            int ordNo = MapUtils.getIntValue(activeDgnss, "ordNo", 0);
            if (dgnssId <= 0) {
                continue;
            }

            // 1) 이미 이 검사에 등록되어 있으면 건너뜀(중복 방지)
            if (existsDgnssResult(dgnssId, stdtId)) {
                log.info("가입 검사 배부 - 이미 등록됨 건너뜀: dgnssId={}, stdtId={}", dgnssId, stdtId);
                continue;
            }

            // 2) 다른 학급에서 이미 응시(진행/완료)한 이력이 있으면 배부 제외
            if (!isStudentEligibleForJoin(claId, stdtId, paperIdx, ordNo)) {
                log.info("가입 검사 배부 - 타학급 이력으로 제외: dgnssId={}, stdtId={}, paperIdx={}, ordNo={}",
                        dgnssId, stdtId, paperIdx, ordNo);
                continue;
            }

            // 3) 시험지 INSERT (OMR / 결과 / 답안) — paperIdx 별 컬럼 분기는 매퍼 XML에서 처리
            Map<String, Object> targetMap = new HashMap<>();
            targetMap.put("dgnssId", dgnssId);
            targetMap.put("claId", claId);
            targetMap.put("ordNo", ordNo);
            targetMap.put("paperIdx", paperIdx);
            if (schGrade != null) {
                targetMap.put("schGrade", schGrade);
            }
            targetMap.put("stdtId", stdtId);

            dgnssMapper.insertDgnssOmr(targetMap);
            dgnssMapper.insertDgnssResult(targetMap);
            dgnssMapper.insertDgnssAnswer(targetMap);

            assignedDgnssIds.add(dgnssId);
            log.info("가입 검사 배부 완료: dgnssId={}, stdtId={}, paperIdx={}, ordNo={}",
                    dgnssId, stdtId, paperIdx, ordNo);
        }

        return assignedDgnssIds;
    }

    /**
     * 가입 학생 1명이 특정 검사(회차/시험지)에 응시 가능한지 — 다른 학급 응시 이력 기준.
     * 교사 검사 시작과 동일한 적격성 규칙(selectEligibleTargetStListForOrd1/2)을 stdtId 로 한정해 재사용한다.
     */
    private boolean isStudentEligibleForJoin(String claId, String stdtId, int paperIdx, int ordNo) {
        Map<String, Object> param = new HashMap<>();
        param.put("claId", claId);
        param.put("paperIdx", paperIdx);
        param.put("stdtId", stdtId);

        List<String> eligibleStdtIds = (ordNo == 2)
                ? dgnssMapper.selectEligibleTargetStListForOrd2(param)
                : dgnssMapper.selectEligibleTargetStListForOrd1(param);

        return eligibleStdtIds != null && eligibleStdtIds.contains(stdtId);
    }

    /** 레거시 학교급 코드(el/mi/hi) → 검사 응시용 SCH_GRADE 코드 매핑. 매칭 없으면 null. */
    private String resolveSchGrade(String grade) {
        if (StringUtils.equals(grade, "el")) {
            return "CMM13001";
        } else if (StringUtils.equals(grade, "mi")) {
            return "CMM13002";
        } else if (StringUtils.equals(grade, "hi")) {
            return "CMM13003";
        }
        return null;
    }

    private int resolveExpectedQuestionCount(String paperIdx) {
        int paperIdxValue = NumberUtils.toInt(StringUtils.trimToEmpty(paperIdx), 0);
        if (paperIdxValue == 1) {
            return 124;
        }
        if (paperIdxValue == 2) {
            return 77;
        }
        return 0;
    }

    private boolean hasAllAnsweredValues(Map<String, Object> answersByNo, int expectedQuestionCount) {
        if (MapUtils.isEmpty(answersByNo) || expectedQuestionCount <= 0) {
            return false;
        }
        for (int no = 1; no <= expectedQuestionCount; no++) {
            Object answer = getAnswerValue(answersByNo, no);
            if (answer == null) {
                return false;
            }
            if (answer instanceof String && StringUtils.isBlank((String) answer)) {
                return false;
            }
            Integer value = convertToInteger(answer);
            if (value == null || value <= 0) {
                return false;
            }
        }
        return true;
    }

    private Object getAnswerValue(Map<String, Object> answersByNo, int no) {
        String key = Integer.toString(no);
        if (answersByNo.containsKey(key)) {
            return answersByNo.get(key);
        }
        return answersByNo.get(no);
    }

    @Transactional(readOnly = true)
    public boolean existsDgnssResult(int dgnssId, String stdtId) {
        if (dgnssId <= 0 || StringUtils.isBlank(stdtId)) {
            return false;
        }
        return dgnssMapper.countDgnssResultByDgnssIdAndStdtId(dgnssId, stdtId) > 0;
    }

    public boolean answerCheck(Collection<Object> answers, int checkCount) {
        int count = 0;
        Integer prev = null;

        for (Object answer : answers) {
            Integer current = convertToInteger(answer);
            if (current == null) {
                continue;
            }

            if (prev != null && prev.equals(current)) {
                count++;
                if (count >= checkCount -1) {
                    return true;
                }
            } else {
                count = 0;
            }

            // 이전에 응답한 값 저장
            prev = current;
        }

        return false;
    }

    public Integer convertToInteger(Object obj) {
        if (obj instanceof Number) {
            return ((Number) obj).intValue();
        } else if (obj instanceof String) {
            try {
                return Integer.parseInt((String) obj);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    public void stSubmit(int dgnssResultId, String paperType, boolean sameAnswerCheck, HttpServletRequest request, boolean publishSubmittedEvent) {
        String beforeSubmitYn = dgnssMapper.selectSubmitYnByDgnssResultId(dgnssResultId);
        boolean wasAlreadySubmitted = StringUtils.equalsIgnoreCase(beforeSubmitYn, "Y");

        // tb_dgnss_result_info에서 subm_at = Y 처리
        dgnssMapper.updateStSubmit(dgnssResultId);
        if (StringUtils.equals(paperType, "1")) {
            dgnssMapper.updateDgnssAnswerJsonLearn(dgnssResultId, sameAnswerCheck);
        } else {
            dgnssMapper.updateDgnssAnswerJson(dgnssResultId, sameAnswerCheck);
        }
        int answerIdx = dgnssMapper.selectAnswerIdx(dgnssResultId);
        dgnssMapper.callProcMark(answerIdx);
        dgnssLpaService.processAndSave(answerIdx);

        try {
            sendStudentResultMail(dgnssResultId, answerIdx, null, request);
        } catch (Exception e) {
            log.error("학생 결과 메일 발송 실패: dgnssResultId={}, answerIdx={}", dgnssResultId, answerIdx, e);
        }

        if (publishSubmittedEvent && !wasAlreadySubmitted) {
            publishExamSubmittedEvent(dgnssResultId);
            publishExamAllSubmittedEventIfCompleted(dgnssResultId);
        }
    }

    public Map<String, Object> pdfDownload(Map<String, Object> paramData, HttpServletRequest request) throws Exception {
        long totalStart = System.currentTimeMillis();
        Map<String, Object> result = new HashMap<>();

        String userId = MapUtils.getString(paramData, "userId", "");
        String userType = MapUtils.getString(paramData, "userType", "");
        String apiDomain = MapUtils.getString(paramData, "apiDomain", "");
        String apiVersion = MapUtils.getString(paramData, "apiVersion", "");

        LocalDateTime currentTime = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String formattedTime = currentTime.format(formatter);

        String fileName = userId + "_" + formattedTime + ".pdf";
        String url = "";

        if (StringUtils.equals(userType, "T")) {
            // 교사용 PDF 생성 및 존재하는 데이터일 경우 주소 리턴
            String dgnssId = MapUtils.getString(paramData, "dgnssId", "");
            if (StringUtils.isEmpty(dgnssId)) {
                result.put("error", "error");
                result.put("message", "dgnssId 필수값 누락");
            }
            long dbStart = System.currentTimeMillis();
            Map<String, Object> tcUserInfo = dgnssMapper.selectTcUserInfo(paramData);
            log.info("[PDF 성능] 교사 정보 조회: {}ms", System.currentTimeMillis() - dbStart);

            if (StringUtils.isNotEmpty(MapUtils.getString(tcUserInfo, "fileUrl", ""))) {
                result.put("url", MapUtils.getString(tcUserInfo, "fileUrl", ""));
                return result;
            }

            url = makeTcPdf(paramData, tcUserInfo, fileName, request);
        } else if (StringUtils.equals(userType, "S")) {
            // 학생용 PDF 생성 및 존재하는 데이터일 경우 주소 리턴
            long dbStart = System.currentTimeMillis();
            Map<String, Object> stUserInfo = dgnssMapper.selectStUserInfo(paramData);
            // Phase 3: memberSpUserId → MEM_NM/email, teacherSpUserId → tcNm 복원
            enrichStUserInfo(stUserInfo);
            applyNicknameOverride(stUserInfo); // 학생 입력 닉네임이 있으면 표시 이름으로 사용
            log.info("[PDF 성능] 학생 정보 조회: {}ms", System.currentTimeMillis() - dbStart);

            String fileUrl = MapUtils.getString(stUserInfo, "fileURL", "");

            if (StringUtils.isNotEmpty(fileUrl)) {
                result.put("url", fileUrl);
                return result;
            }

            url = makeStPdf(paramData, stUserInfo, fileName, request);
        }
        if (StringUtils.isNotEmpty(url)) {
            result.put("url", url);
        } else {
            result.put("url", "");
            result.put("error", "fail");
        }

        log.info("[PDF 성능] 전체 소요시간: {}ms (userId: {}, userType: {})",
                System.currentTimeMillis() - totalStart, userId, userType);
        return result;
    }

    public String makeTcPdf(Map<String, Object> paramData,
                            Map<String, Object> tcUserInfo,
                            String fileName,
                            HttpServletRequest request) throws Exception {
        long methodStart = System.currentTimeMillis();

        Map<String, Object> dgnssData = new HashMap<String, Object>();
        Map<String, Object> param  = new HashMap<String, Object>();

        // dgnssId로 써야하지만 변경해야하는 요소가 많아 dgnssId = TEST_IDX로 진행
        int nowOrd = MapUtils.getInteger(tcUserInfo, "TEST_ORD", 0);

        param.put("TEST_IDX", MapUtils.getString(tcUserInfo, "TEST_IDX"));
        param.put("TEST_ORD", nowOrd);
        param.put("DGNSS_ID", MapUtils.getString(tcUserInfo, "DGNSS_ID"));
        param.put("claId", MapUtils.getString(tcUserInfo, "claId"));

        long dbStart = System.currentTimeMillis();
        // 1단계: 독립적인 쿼리 6개 병렬 실행 (Phase 4: selectMembersByTScoreThreshold 추가)
        int testIdx = MapUtils.getInteger(param, "TEST_IDX", 0);
        String dgnssId = MapUtils.getString(param, "DGNSS_ID");

        CompletableFuture<List<Map<String, Object>>> reportLSFuture =
                CompletableFuture.supplyAsync(() -> dgnssMapper.getDgnssReportLS(param), pdfQueryPool);
        CompletableFuture<List<Map<String, Object>>> reportSectionFuture =
                CompletableFuture.supplyAsync(() -> dgnssMapper.getDgnssReportSection(param), pdfQueryPool);
        CompletableFuture<List<Map<String, Object>>> reportValidityFuture =
                CompletableFuture.supplyAsync(() -> dgnssMapper.getDgnssReportValidity(param), pdfQueryPool);
        CompletableFuture<List<Map<String, Object>>> reportMemFuture =
                CompletableFuture.supplyAsync(() -> dgnssMapper.getDgnssReportMem(param), pdfQueryPool);
        // Phase 4: FN_GET_MEM_UNDER_TSCORE 대체 - 한 번의 쿼리로 모든 SECTION_MEM 데이터 조회
        CompletableFuture<List<Map<String, Object>>> sectionMemRawFuture =
                CompletableFuture.supplyAsync(() -> dgnssMapper.selectMembersByTScoreThreshold(testIdx), pdfQueryPool);
        CompletableFuture<Object> firstTestFuture =
                CompletableFuture.supplyAsync(() -> dgnssMapper.getDgnssFirstTest(param), pdfQueryPool);

        // 모든 병렬 쿼리 완료 대기
        CompletableFuture.allOf(reportLSFuture, reportSectionFuture, reportValidityFuture, reportMemFuture, sectionMemRawFuture, firstTestFuture).join();

        // 병렬 쿼리 결과 추출
        List<Map<String, Object>> dgnssReportLS = reportLSFuture.get();
        List<Map<String, Object>> dgnssReportSection = reportSectionFuture.get();
        List<Map<String, Object>> dgnssReportValidity = reportValidityFuture.get();
        List<Map<String, Object>> dgnssReportMem = reportMemFuture.get();
        List<Map<String, Object>> sectionMemRaw = sectionMemRawFuture.get();

        // Phase 4: SECTION_MEM 필드 병합 (FN_GET_MEM_UNDER_TSCORE 대체)
        Map<String, String> sectionMemMap = buildSectionMemMap(sectionMemRaw, dgnssId);
        if (!dgnssReportMem.isEmpty()) {
            Map<String, Object> memRow = dgnssReportMem.get(0);
            enrichSectionMemFields(memRow, sectionMemMap);
        }

        // Phase 3: memberSpUserId → MEM_NM 복원 (FE 호환)
        enrichMaps(dgnssReportLS, "memberSpUserId", "MEM_NM", null);
        enrichMaps(dgnssReportValidity, "memberSpUserId", "MEM_NM", null);
        // Phase 4: GROUP_CONCAT raw(sp_user_id||member_no) → "이름(member_no)" 복원
        enrichReportMemFields(dgnssReportMem);

        // 첫번째 검사를 본 id 추출 (FIRST_IDX 설정)
        param.put("FIRST_IDX", firstTestFuture.get());

        // 2단계: 종합분석 집계 (조건부 재조회 로직으로 순차 처리)
        param.put("DEPTH", 3);
        param.put("notExists", "N");
        param.put("firstCancel", "N");
        List<Map<String, Object>> dgnssReportStat3 = dgnssMapper.getDgnssReportStatByTest(param);

        if (CollectionUtils.isEmpty(dgnssReportStat3)) {
            // 조회한 회차의 데이터가 신뢰도 지표 조건으로 인해 없는 경우 재조회
            param.put("notExists", "Y");
            dgnssReportStat3 = dgnssMapper.getDgnssReportStatByTest(param);

        }

        // 2회차까지의 데이터를 조회하는데 1회차가 신뢰도 조건으로 인해 0점인 경우 재조회
        if (nowOrd == 2) {
            boolean stat3First = dgnssReportStat3.stream()
                    .allMatch(map -> MapUtils.getInteger(map, "T_SCORE_FIRST", 0) == 0);

            if (stat3First) {
                param.put("firstCancel", "Y");
                dgnssReportStat3 = dgnssMapper.getDgnssReportStatByTest(param);
            }
        }

        param.put("notExists", "N");
        param.put("firstCancel", "N");
        param.put("DEPTH", 5);
        List<Map<String, Object>> dgnssReportStat5 = dgnssMapper.getDgnssReportStatByTest(param);

        if (CollectionUtils.isEmpty(dgnssReportStat5)) {
            param.put("notExists", "Y");
            dgnssReportStat5 = dgnssMapper.getDgnssReportStatByTest(param);
        }

        if (nowOrd == 2) {
            boolean stat5Mark = dgnssReportStat5.stream()
                    .allMatch(map -> MapUtils.getInteger(map, "T_SCORE_FIRST", 0) == 0);

            // 2회차까지의 데이터를 조회하는데 1회차가 신뢰도 조건으로 인해 0점인 경우 재조회
            if (stat5Mark) {
                param.put("firstCancel", "Y");
                dgnssReportStat5 = dgnssMapper.getDgnssReportStatByTest(param);
            }
        }

        // 선생님 기본 정보(표지 데이터)
        dgnssData.put("testInfo", tcUserInfo);

        dgnssData.put("dgnssReportLS", dgnssReportLS);

        // 대분류, 중분류, 소분류 별 표준점수
        dgnssData.put("dgnssReportSection", dgnssReportSection);

        // 교사용 신뢰도(바람직성, 반응일관성, 무응답 수) 부족 학생
        dgnssData.put("dgnssReportValidity", dgnssReportValidity);

        // 중분류 별 상담 필요 학생
        dgnssData.put("dgnssReportMem", dgnssReportMem);

        dgnssData.put("dgnssReportStat3", dgnssReportStat3);

        dgnssData.put("dgnssReportStat5", dgnssReportStat5);

        log.info("[PDF 성능] 교사용 DB 쿼리 완료: {}ms", System.currentTimeMillis() - dbStart);

        long pdfStart = System.currentTimeMillis();
        String url = pdfService.createDgnssReportCoch(new File(fileName), dgnssData, request);
        log.info("[PDF 성능] 교사용 PDF 렌더링+업로드: {}ms", System.currentTimeMillis() - pdfStart);

        long updateStart = System.currentTimeMillis();
        Map<String, Object> updateMap = new HashMap<>();
        updateMap.put("fileUrl", url);
        updateMap.put("dgnssId", MapUtils.getString(param, "TEST_IDX", ""));
        dgnssMapper.updateFileUrlTch(updateMap);
        log.info("[PDF 성능] 교사용 URL 저장: {}ms", System.currentTimeMillis() - updateStart);

        log.info("[PDF 성능] 교사용 makeTcPdf 총합: {}ms", System.currentTimeMillis() - methodStart);
        return url;
    }


    public String makeStPdf(Map<String, Object> paramData,
                            Map<String, Object> stUserInfo,
                            String fileName,
                            HttpServletRequest request) throws Exception {
        long methodStart = System.currentTimeMillis();
        Map<String, Object> dgnssData = new HashMap<>();
        int answerIdx = MapUtils.getInteger(paramData, "answerIdx", 0);

        // 각 DEPTH별로 별도 param 생성 (스레드 안전성 확보)
        Map<String, Object> param3 = new HashMap<>();
        param3.put("ANSWER_IDX", answerIdx);
        param3.put("DEPTH", 3);

        Map<String, Object> param4 = new HashMap<>();
        param4.put("ANSWER_IDX", answerIdx);
        param4.put("DEPTH", 4);

        Map<String, Object> param5 = new HashMap<>();
        param5.put("ANSWER_IDX", answerIdx);
        param5.put("DEPTH", 5);

        long dbStart = System.currentTimeMillis();
        // 4개 쿼리 병렬 실행
        CompletableFuture<List<Map<String, Object>>> report3Future =
                CompletableFuture.supplyAsync(() -> dgnssMapper.getDgnssReport(param3), pdfQueryPool);
        CompletableFuture<List<Map<String, Object>>> report4Future =
                CompletableFuture.supplyAsync(() -> dgnssMapper.getDgnssReport(param4), pdfQueryPool);
        CompletableFuture<List<Map<String, Object>>> report5Future =
                CompletableFuture.supplyAsync(() -> dgnssMapper.getDgnssReport(param5), pdfQueryPool);
        CompletableFuture<List<Map<String, Object>>> reportStudyFuture =
                CompletableFuture.supplyAsync(() -> dgnssMapper.getDgnssReportStudy(param5), pdfQueryPool);

        // 모든 병렬 쿼리 완료 대기
        CompletableFuture.allOf(report3Future, report4Future, report5Future, reportStudyFuture).join();

        // 결과 조합
        dgnssData.put("dgnssReport3", report3Future.get());
        dgnssData.put("dgnssReport4", report4Future.get());
        dgnssData.put("dgnssReport5", report5Future.get());
        dgnssData.put("dgnssReportStudy", reportStudyFuture.get());
        dgnssData.put("userInfo", stUserInfo);
        log.info("[PDF 성능] 학생용 DB 쿼리 완료: {}ms", System.currentTimeMillis() - dbStart);

        long pdfStart = System.currentTimeMillis();
        String url = pdfService.createDgnssAnalysisByTemplate(new File(fileName), dgnssData, request);
        log.info("[PDF 성능] 학생용 PDF 렌더링+업로드: {}ms", System.currentTimeMillis() - pdfStart);

        long updateStart = System.currentTimeMillis();
        Map<String, Object> updateMap = new HashMap<>();
        updateMap.put("fileUrl", url);
        updateMap.put("dgnssResultId", MapUtils.getString(stUserInfo, "dgnssResultId", ""));
        dgnssMapper.updateFileUrl(updateMap);
        log.info("[PDF 성능] 학생용 URL 저장: {}ms", System.currentTimeMillis() - updateStart);

        log.info("[PDF 성능] 학생용 makeStPdf 총합: {}ms", System.currentTimeMillis() - methodStart);
        return url;
    }

    public Map<String, Object> selectNewOmr(Map<String, Object> param, Pageable pageable) {
        // st/start와 동일: 학생 입력 식별정보 정규화 (gender M/F, grade·classNumber 숫자만) — 저장은 하단 updateStStart에서
        normalizeAndValidateGender(param);
        normalizeNumericInput(param, "grade");
        normalizeNumericInput(param, "classNumber");
        Map<String, Object> resultMap = new HashMap<>();
        Map<String, Object> targetMap = dgnssMapper.selectPastOmrInfo(param);
        int paperIdx = MapUtils.getInteger(param, "paperIdx", 0);
        targetMap.put("dgnssResultId", MapUtils.getInteger(param, "dgnssResultId", 0));
        targetMap.put("paperIdx", paperIdx);

        int result = dgnssMapper.insertDgnssOmr(targetMap);
        if (result > 0) {
            dgnssMapper.updateDgnssResult(targetMap);
            dgnssMapper.deleteDgnssOmr(targetMap);
        }

        resultMap.put("omrIdx", MapUtils.getInteger(targetMap, "omrIdx", 0));
        if (paperIdx == 1 || paperIdx == 2) {
            long total = 0;
            PagingParam<?> pagingParam = PagingParam.builder()
                    .param(param)
                    .pageable(pageable)
                    .build();
            List<Map> dgnssQuesList = dgnssMapper.selectStQuesList(pagingParam);
            if (CollectionUtils.isNotEmpty(dgnssQuesList)) {
                total = (long) dgnssQuesList.get(0).get("fullCount");
            }
            resultMap.put("dgnssQuesList", dgnssQuesList);
        } else {
            List<Map<String, Object>> dgnssQuesList = dgnssMapper.selectStQuesListOrigin(param);
            resultMap.put("dgnssQuesList", dgnssQuesList);
        }

        dgnssMapper.updateStStart(param);

        return resultMap;
    }

    public Map<String, Object> updateStSubmit(Map<String, Object> param, HttpServletRequest request) {
        Map<String, Object> resultMap = new HashMap<>();
        String paperType = dgnssMapper.selectPaperIdxFromResultId(param);
        param.put("paperIdx", paperType);
        LinkedHashMap<String, Object> omrInfo = dgnssMapper.selectStDgnssOmr(param);

        // 학생이 모든 문항을 응답했을때만 제출 진행(수동으로 제출하지 않아도)
        if (omrInfo.values().stream().noneMatch(Objects::isNull)) {
            // 동일 응답한 문항이 10개 이상인지 체크하는 로직
            LinkedHashMap<String, Object> answersOnly = new LinkedHashMap<>(omrInfo);
            answersOnly.remove("dgnssResultId");
            answersOnly.remove("omrIdx");
            boolean sameAnswerCheck = answerCheck(answersOnly.values(), 10);

             stSubmit(MapUtils.getInteger(param, "dgnssResultId", 0), paperType, sameAnswerCheck, request, true);
            resultMap.put("submit", true);
        } else {
            resultMap.put("submit", false);
        }

        return resultMap;
    }

    public Map<String, Object> sendStudentResultMailTest(Map<String, Object> param, HttpServletRequest request) throws Exception {
        int dgnssResultId = MapUtils.getInteger(param, "dgnssResultId", 0);
        if (dgnssResultId <= 0) {
            throw new IllegalArgumentException("dgnssResultId는 필수입니다.");
        }

        int answerIdx = dgnssMapper.selectAnswerIdx(dgnssResultId);
        String overrideEmail = StringUtils.trimToNull(MapUtils.getString(param, "toEmail", ""));
        sendStudentResultMail(dgnssResultId, answerIdx, overrideEmail, request);

        Map<String, Object> studentInfo = dgnssMapper.selectStUserInfo(Collections.singletonMap("answerIdx", answerIdx));
        // Phase 3: memberSpUserId → MEM_NM/email, teacherSpUserId → tcNm 복원
        enrichStUserInfo(studentInfo);
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("dgnssResultId", dgnssResultId);
        resultMap.put("answerIdx", answerIdx);
        resultMap.put("studentName", MapUtils.getString(studentInfo, "MEM_NM", ""));
        resultMap.put("toEmail", ObjectUtils.defaultIfNull(overrideEmail, MapUtils.getString(studentInfo, "email", "")));
        resultMap.put("fileUrl", ensureStudentPdfUrl(answerIdx, request));
        resultMap.put("sent", true);

        return resultMap;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> selectStInfoList(Map<String, Object> param) {
        Map<String, Object> resultMap = new HashMap<>();
        int paperIdx = MapUtils.getInteger(param, "paperIdx", 0);
        int type = MapUtils.getInteger(param, "type", 0);
        List<Map<String, Object>> stInfoList = new ArrayList<>();

        if (paperIdx == 1) {
            // 학습종합검사
            if (type == 1) {
                // 신뢰도 지표 및 학습 현황
                stInfoList = dgnssMapper.selectDgnssAnswerReliability(param);
            } if (type == 2) {
                // 긍정적 자아 & 대인관계 능력
                stInfoList = dgnssMapper.selectLernType2(param);
            } else if (type == 3) {
                // 메타인지 & 학습 기술
                stInfoList = dgnssMapper.selectLernType3(param);
            } else if (type == 4) {
                // 지지적 관계 & 학업열의, 성장력
                stInfoList = dgnssMapper.selectLernType4(param);
            } else if (type == 5) {
                // 학업스트레스 & 학습 방해물
                stInfoList = dgnssMapper.selectLernType5(param);
            } else if (type == 6) {
                // 학업관계 스트레스 & 학업소진
                stInfoList = dgnssMapper.selectLernType6(param);
            }
        } else {
            // META자기조절학습
            // 신뢰도
            if (type == 1) {
                stInfoList = dgnssMapper.selectDgnssAnswerReliability(param);
            }
            // 동기전략
            else if (type == 2) {
                stInfoList = dgnssMapper.selectDgnssAnswerReportMotivate(param);
            }
            // 인지전략
            else if (type == 3) {
                stInfoList = dgnssMapper.selectDgnssAnswerReportRecognition(param);
            }
            // 행동전략
            else if (type == 4) {
                stInfoList = dgnssMapper.selectDgnssAnswerReportBehavior(param);
            }
        }

        // 그룹에는 포함되어있지만 현재 학급의 심리검사 데이터가 없는 학생(다른 학급에서 응시) fallback 보강.
        // 각 row 에 source ('IN_CLASS' / 'OTHER_CLASS') 필드 부여.
        stInfoList = applyStInfoListFallback(stInfoList, param, paperIdx, type);
        // Phase 3: memberSpUserId → nickname 복원 (FE 호환, IN_CLASS + OTHER_CLASS 모두)
        enrichMaps(stInfoList, "memberSpUserId", "nickname", null);

        resultMap.put("stInfoList", stInfoList);
        resultMap.put("type", type);

        // type=1(신뢰도)은 FE가 LPA top3·섹션점수(scores)를 사용하지 않으므로 보강을 생략한다.
        // (신뢰도 쿼리에는 LPA 확률 JSON·섹션점수 컬럼 자체가 없어 빈 값만 추가될 뿐이다.)
        // type 2~6(전략)은 scores 맵이 필요하므로 기존대로 보강한다.
        if (type != 1) {
            enrichLpaTop3(stInfoList);
            moveSectionScoresToScoresMap(stInfoList);
        }
        return resultMap;
    }

    /**
     * /tc/stinfolist 응답에 다른 학급에서 응시한 학생을 보강.
     * 기존 row 에 source=IN_CLASS, 보강 row 에 source=OTHER_CLASS 부여 후 stdtId 기준 dedup.
     */
    private List<Map<String, Object>> applyStInfoListFallback(
            List<Map<String, Object>> stInfoList, Map<String, Object> param, int paperIdx, int type) {
        if (stInfoList == null) stInfoList = new ArrayList<>();
        int dgnssId = MapUtils.getInteger(param, "dgnssId", 0);
        if (dgnssId <= 0) {
            return stInfoList;
        }
        String claId = dgnssMapper.selectClaIdByDgnssId(dgnssId);
        if (StringUtils.isBlank(claId)) {
            return stInfoList;
        }
        int ordNo = dgnssMapper.selectOrdNoByDgnssId(dgnssId);

        for (Map<String, Object> row : stInfoList) {
            row.put("source", "IN_CLASS");
        }

        Map<String, Object> missingParam = new HashMap<>();
        missingParam.put("claId", claId);
        missingParam.put("paperIdx", String.valueOf(paperIdx));
        missingParam.put("ordNo", ordNo);
        List<String> missingStudents = dgnssMapper.selectClassStudentsWithoutResultInClassForOrd(missingParam);
        if (CollectionUtils.isEmpty(missingStudents)) {
            return stInfoList;
        }

        Map<String, Object> fbParam = new HashMap<>();
        fbParam.put("claId", claId);
        fbParam.put("paperIdx", String.valueOf(paperIdx));
        fbParam.put("ordNo", ordNo);
        fbParam.put("stdtIds", missingStudents);

        List<Map<String, Object>> fbRows = dispatchStInfoFallback(paperIdx, type, fbParam);
        if (CollectionUtils.isEmpty(fbRows)) {
            return stInfoList;
        }
        for (Map<String, Object> row : fbRows) {
            row.put("source", "OTHER_CLASS");
        }
        stInfoList.addAll(fbRows);
        return deduplicateByStdtId(stInfoList);
    }

    /** paperIdx + type 조합으로 9개 fallback 매퍼 디스패치. 매핑 없으면 빈 리스트. */
    private List<Map<String, Object>> dispatchStInfoFallback(int paperIdx, int type, Map<String, Object> fbParam) {
        if (paperIdx == 1) {
            if (type == 1) return dgnssMapper.selectDgnssAnswerReliabilityFromOtherClasses(fbParam);
            if (type == 2) return dgnssMapper.selectLernType2FromOtherClasses(fbParam);
            if (type == 3) return dgnssMapper.selectLernType3FromOtherClasses(fbParam);
            if (type == 4) return dgnssMapper.selectLernType4FromOtherClasses(fbParam);
            if (type == 5) return dgnssMapper.selectLernType5FromOtherClasses(fbParam);
            if (type == 6) return dgnssMapper.selectLernType6FromOtherClasses(fbParam);
        } else {
            if (type == 1) return dgnssMapper.selectDgnssAnswerReliabilityFromOtherClasses(fbParam);
            if (type == 2) return dgnssMapper.selectDgnssAnswerReportMotivateFromOtherClasses(fbParam);
            if (type == 3) return dgnssMapper.selectDgnssAnswerReportRecognitionFromOtherClasses(fbParam);
            if (type == 4) return dgnssMapper.selectDgnssAnswerReportBehaviorFromOtherClasses(fbParam);
        }
        return Collections.emptyList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> selectTcDgnssDetailInfo(Map<String, Object> param) {
        Map<String, Object> result = dgnssMapper.selectTcDgnssDetailInfo(param);
        // Phase 4: notSubmStdtName raw(sp_user_id||member_no) → "이름(member_no)" 복원
        enrichGroupConcatField(result, "notSubmStdtName");
        String stdtList = MapUtils.getString(result, "notSubmStdtId", "");
        if (StringUtils.isNotEmpty(stdtList)) {
            String[] notDgnssStartListArr = stdtList.split(",");

            if (notDgnssStartListArr.length > 1) {
                String resultStr = "";
                for (int i = 0; i < notDgnssStartListArr.length; i++) {
                    String stdtId = notDgnssStartListArr[i];

                    if (i > 0) {
                        resultStr += ", ";
                    }
                    resultStr += stdtId;
                }
                result.put("notSubmStdtId", resultStr);
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> selectStAnalysis(Map<String, Object> param) {
        return selectUnifiedStAnalysis(param);
    }

    private Map<String, List<Map<String, Object>>> splitStudentAnalysisByOrd(List<Map<String, Object>> stInfoList, String ordNo) {
        List<Map<String, Object>> ord1List = new ArrayList<>();
        List<Map<String, Object>> ord2List = new ArrayList<>();

        for (Map<String, Object> map : stInfoList) {
            int ordNoInt = MapUtils.getInteger(map, "ord_no", 0);
            map.remove("ord_no"); // FE 미사용 — 회차는 응답 키("1"/"2")로 구분
            if (ordNoInt == 1) {
                ord1List.add(map);
            } else if (ordNoInt == 2) {
                ord2List.add(map);
            }
        }

        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
        if (CollectionUtils.isNotEmpty(ord1List)) {
            result.put("1", ord1List);
        }
        if (CollectionUtils.isNotEmpty(ord2List)) {
            result.put("2", ord2List);
        }
        return result;
    }

    public List<String> putSession(int type) {
        List<String> sessionList = new ArrayList<>();
        if (type == 0) {
            // 동기 전략
            sessionList.add("20-22-01-0-0-0");
            sessionList.add("20-22-01-01-0-0");
            sessionList.add("20-22-01-01-01-0");
            sessionList.add("20-22-01-01-02-0");
            sessionList.add("20-22-01-01-03-0");
            sessionList.add("20-22-01-02-0-0");
            sessionList.add("20-22-01-02-01-0");
            sessionList.add("20-22-01-02-02-0");
            sessionList.add("20-22-01-02-03-0");

            // 인지 전략
            sessionList.add("20-22-02-0-0-0");
            sessionList.add("20-22-02-01-0-0");
            sessionList.add("20-22-02-01-01-0");
            sessionList.add("20-22-02-01-02-0");
            sessionList.add("20-22-02-01-03-0");
            sessionList.add("20-22-02-02-0-0");
            sessionList.add("20-22-02-02-01-0");
            sessionList.add("20-22-02-02-02-0");
            sessionList.add("20-22-02-02-03-0");

            // 행동 전략
            sessionList.add("20-22-03-0-0-0");
            sessionList.add("20-22-03-01-0-0");
            sessionList.add("20-22-03-01-01-0");
            sessionList.add("20-22-03-01-02-0");
            sessionList.add("20-22-03-01-03-0");
            sessionList.add("20-22-03-02-0-0");
            sessionList.add("20-22-03-02-01-0");
            sessionList.add("20-22-03-02-02-0");
            sessionList.add("20-22-03-02-03-0");
            sessionList.add("20-22-03-02-04-0");
            sessionList.add("20-22-03-02-05-0");
        } else if (type == 1) {
            // 동기 전략
            sessionList.add("20-22-01-0-0-0");
            sessionList.add("20-22-01-01-0-0");
            sessionList.add("20-22-01-01-01-0");
            sessionList.add("20-22-01-01-02-0");
            sessionList.add("20-22-01-01-03-0");
            sessionList.add("20-22-01-02-0-0");
            sessionList.add("20-22-01-02-01-0");
            sessionList.add("20-22-01-02-02-0");
            sessionList.add("20-22-01-02-03-0");
        } else if (type == 2) {
            // 인지 전략
            sessionList.add("20-22-02-0-0-0");
            sessionList.add("20-22-02-01-0-0");
            sessionList.add("20-22-02-01-01-0");
            sessionList.add("20-22-02-01-02-0");
            sessionList.add("20-22-02-01-03-0");
            sessionList.add("20-22-02-02-0-0");
            sessionList.add("20-22-02-02-01-0");
            sessionList.add("20-22-02-02-02-0");
            sessionList.add("20-22-02-02-03-0");
        } else if (type == 3) {
            // 행동 전략
            sessionList.add("20-22-03-0-0-0");
            sessionList.add("20-22-03-01-0-0");
            sessionList.add("20-22-03-01-01-0");
            sessionList.add("20-22-03-01-02-0");
            sessionList.add("20-22-03-01-03-0");
            sessionList.add("20-22-03-02-0-0");
            sessionList.add("20-22-03-02-01-0");
            sessionList.add("20-22-03-02-02-0");
            sessionList.add("20-22-03-02-03-0");
            sessionList.add("20-22-03-02-04-0");
            sessionList.add("20-22-03-02-05-0");
        }
        return sessionList;
    }

    public Map<String, String> putSessionMap(int type) {
        Map<String, String> sessionMap = new HashMap<>();

        if (type == 0) {
            // 동기 전략
            sessionMap.put("20-22-01-0-0-0", "motivateTotal");
            sessionMap.put("20-22-01-01-0-0", "learningEg");
            sessionMap.put("20-22-01-01-01-0", "mindSet");
            sessionMap.put("20-22-01-01-02-0", "efficacy");
            sessionMap.put("20-22-01-01-03-0", "motivation");
            sessionMap.put("20-22-01-02-0-0", "emotionCtrl");
            sessionMap.put("20-22-01-02-01-0", "gradeLvl");
            sessionMap.put("20-22-01-02-02-0", "styLvl");
            sessionMap.put("20-22-01-02-03-0", "failLvl");

            // 인지 전략
            sessionMap.put("20-22-02-0-0-0", "recognitionTotal");
            sessionMap.put("20-22-02-01-0-0", "metaCog");
            sessionMap.put("20-22-02-01-01-0", "planAbil");
            sessionMap.put("20-22-02-01-02-0", "inspecAbil");
            sessionMap.put("20-22-02-01-03-0", "contrlAbil");
            sessionMap.put("20-22-02-02-0-0", "cogLrnSkil");
            sessionMap.put("20-22-02-02-01-0", "compreSkil");
            sessionMap.put("20-22-02-02-02-0", "memrySkil");
            sessionMap.put("20-22-02-02-03-0", "intenSkil");

            // 행동 전략
            sessionMap.put("20-22-03-0-0-0", "behaviorTotal");
            sessionMap.put("20-22-03-01-0-0", "behvCtrl");
            sessionMap.put("20-22-03-01-01-0", "selfPraise");
            sessionMap.put("20-22-03-01-02-0", "help");
            sessionMap.put("20-22-03-01-03-0", "lrnConti");
            sessionMap.put("20-22-03-02-0-0", "behvLrnSkil");
            sessionMap.put("20-22-03-02-01-0", "styEnvi");
            sessionMap.put("20-22-03-02-02-0", "timeCtrl");
            sessionMap.put("20-22-03-02-03-0", "styAtti");
            sessionMap.put("20-22-03-02-04-0", "note");
            sessionMap.put("20-22-03-02-05-0", "test");
        } else if (type == 1) {
            // 동기 전략
            sessionMap.put("20-22-01-0-0-0", "motivateTotal");
            sessionMap.put("20-22-01-01-0-0", "learningEg");
            sessionMap.put("20-22-01-01-01-0", "mindSet");
            sessionMap.put("20-22-01-01-02-0", "efficacy");
            sessionMap.put("20-22-01-01-03-0", "motivation");
            sessionMap.put("20-22-01-02-0-0", "emotionCtrl");
            sessionMap.put("20-22-01-02-01-0", "gradeLvl");
            sessionMap.put("20-22-01-02-02-0", "styLvl");
            sessionMap.put("20-22-01-02-03-0", "failLvl");
        } else if (type == 2) {
            // 인지 전략
            sessionMap.put("20-22-02-0-0-0", "recognitionTotal");
            sessionMap.put("20-22-02-01-0-0", "metaCog");
            sessionMap.put("20-22-02-01-01-0", "planAbil");
            sessionMap.put("20-22-02-01-02-0", "inspecAbil");
            sessionMap.put("20-22-02-01-03-0", "contrlAbil");
            sessionMap.put("20-22-02-02-0-0", "cogLrnSkil");
            sessionMap.put("20-22-02-02-01-0", "compreSkil");
            sessionMap.put("20-22-02-02-02-0", "memrySkil");
            sessionMap.put("20-22-02-02-03-0", "intenSkil");
        } else if (type == 3) {
            // 행동 전략
            sessionMap.put("20-22-03-0-0-0", "behaviorTotal");
            sessionMap.put("20-22-03-01-0-0", "behvCtrl");
            sessionMap.put("20-22-03-01-01-0", "selfPraise");
            sessionMap.put("20-22-03-01-02-0", "help");
            sessionMap.put("20-22-03-01-03-0", "lrnConti");
            sessionMap.put("20-22-03-02-0-0", "behvLrnSkil");
            sessionMap.put("20-22-03-02-01-0", "styEnvi");
            sessionMap.put("20-22-03-02-02-0", "timeCtrl");
            sessionMap.put("20-22-03-02-03-0", "styAtti");
            sessionMap.put("20-22-03-02-04-0", "note");
            sessionMap.put("20-22-03-02-05-0", "test");
        }
        return sessionMap;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> selectUnifiedStAnalysis(Map<String, Object> param) {
        Map<String, Object> stInfoParam = new HashMap<>();
        String dgnssResultId = MapUtils.getString(param, "dgnssResultId", "");
        boolean hasDgnssResultId = NumberUtils.toLong(StringUtils.trimToEmpty(dgnssResultId), 0L) > 0L;
        int requestedOrdNo = NumberUtils.toInt(MapUtils.getString(param, "ordNo", "1"), 1);

        if (hasDgnssResultId) {
            stInfoParam.put("dgnssResultId", dgnssResultId);
        } else {
            String stdtId = MapUtils.getString(param, "stdtId", "");
            if (StringUtils.isBlank(stdtId)) {
                return new HashMap<>();
            }
            stInfoParam.put("stdtId", stdtId);
            stInfoParam.put("paperIdx", MapUtils.getString(param, "paperIdx", "2"));
            stInfoParam.put("ordNo", MapUtils.getString(param, "ordNo", "1"));
            // claId는 WHERE 조건에서 제외 — 학생은 모든 그룹 이력 조회
        }

        Map<String, Object> stUserInfo = dgnssMapper.selectStInfo(stInfoParam);
        // ordNo=2 요청인데 2회차 기본정보가 아직 없으면 1회차 기준으로 fallback 조회
        // (분석 데이터는 이후 ord_no 조건으로 1/2회차를 다시 필터링)
        if (stUserInfo == null && !hasDgnssResultId && requestedOrdNo == 2) {
            stInfoParam.put("ordNo", "1");
            stUserInfo = dgnssMapper.selectStInfo(stInfoParam);
        }
        if (stUserInfo == null) {
            return new HashMap<>();
        }
        // Phase 3: memberSpUserId → nickname 복원 (FE 호환)
        enrichMap(stUserInfo, "memberSpUserId", "nickname", null);

        String resolvedPaperIdx = MapUtils.getString(stUserInfo, "paperIdx",
                MapUtils.getString(param, "paperIdx", "2"));
        String stdtId = MapUtils.getString(stUserInfo, "stdtId", "");
        String resolvedOrdNo = MapUtils.getString(stUserInfo, "ordNo",
                MapUtils.getString(param, "ordNo", ""));

        if (StringUtils.isAnyEmpty(resolvedPaperIdx, stdtId)) {
            return new HashMap<>();
        }

        // 학생 분석 조회: claId 조건 없이 해당 학생의 모든 그룹 이력 조회
        Map<String, Object> analysisParam = new HashMap<>();
        analysisParam.put("paperIdx", resolvedPaperIdx);
        analysisParam.put("stdtId", stdtId);

        List<Map<String, Object>> stAnalysisList = dgnssMapper.selectStLernAnalysis(analysisParam);
        if (CollectionUtils.isEmpty(stAnalysisList)) {
            return new HashMap<>();
        }

        if (hasDgnssResultId) {
            int targetOrdNo = NumberUtils.toInt(resolvedOrdNo, 0);
            if (targetOrdNo > 0) {
                stAnalysisList = stAnalysisList.stream()
                        .filter(map -> MapUtils.getInteger(map, "ord_no", 0) == targetOrdNo)
                        .collect(Collectors.toList());
            }
            if (CollectionUtils.isEmpty(stAnalysisList)) {
                return new HashMap<>();
            }
        } else {
            // dgnssResultId 미지정 시 ordNo 정책:
            // 1 -> 1회차만, 2 -> 1/2회차 모두
            if (requestedOrdNo == 1) {
                stAnalysisList = stAnalysisList.stream()
                        .filter(map -> MapUtils.getInteger(map, "ord_no", 0) == 1)
                        .collect(Collectors.toList());
            } else if (requestedOrdNo == 2) {
                stAnalysisList = stAnalysisList.stream()
                        .filter(map -> {
                            int ord = MapUtils.getInteger(map, "ord_no", 0);
                            return ord == 1 || ord == 2;
                        })
                        .collect(Collectors.toList());
            }
            if (CollectionUtils.isEmpty(stAnalysisList)) {
                return new HashMap<>();
            }
        }
        enrichLpaTop3(stAnalysisList);
        Map<String, Map<String, Object>> lpaTopByOrd = extractLpaTopByOrd(stAnalysisList);
        // 그래프 추천은 종합검사(paperIdx=1)에서만 — 자기조절(2) 등은 recommendationByOrd 자체를 응답에서 제외
        boolean includeGraphRecommendation = StringUtils.equalsIgnoreCase(
                MapUtils.getString(param, "graphYn", "N"),
                "Y"
        ) && StringUtils.equals(resolvedPaperIdx, "1");
        Map<String, Object> recommendationByOrd = includeGraphRecommendation
                ? fetchGraphRecommendationByOrd(stAnalysisList)
                : new LinkedHashMap<>();
        removeLpaTopFromRows(stAnalysisList);

        Map<String, Object> resultMap = new LinkedHashMap<>();
        resultMap.put("lpaTop", lpaTopByOrd);
        if (includeGraphRecommendation) {
            resultMap.put("recommendationByOrd", recommendationByOrd);
        }
        resultMap.putAll(splitStudentAnalysisByOrd(
                stAnalysisList,
                hasDgnssResultId ? resolvedOrdNo : MapUtils.getString(param, "ordNo", "")
        ));
        return resultMap;
    }

    private Map<String, Object> fetchGraphRecommendationByOrd(List<Map<String, Object>> stAnalysisList) {
        Map<String, Object> recommendationByOrd = new LinkedHashMap<>();
        if (CollectionUtils.isEmpty(stAnalysisList)) {
            return recommendationByOrd;
        }

        for (Map<String, Object> row : stAnalysisList) {
            int ordNo = MapUtils.getInteger(row, "ord_no", 0);
            if (ordNo <= 0) {
                continue;
            }
            String ordKey = Integer.toString(ordNo);
            if (recommendationByOrd.containsKey(ordKey)) {
                continue;
            }

            int answerIdx = MapUtils.getInteger(row, "answerIdx", 0);
            if (answerIdx <= 0) {
                continue;
            }

            try {
                recommendationByOrd.put(ordKey, dgnssGraphService.selectRecommendationByAnswerIdx(answerIdx, 5));
            } catch (Exception e) {
                log.warn("Failed to fetch graph recommendation. ordNo={}, answerIdx={}", ordNo, answerIdx, e);
                recommendationByOrd.put(ordKey, new LinkedHashMap<>());
            }
        }

        return recommendationByOrd;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> selectTcDgnssNotSubmStList(Map<String, Object> param) {
        List<Map<String, Object>> resultList = dgnssMapper.selectTcDgnssNotSubmStList(param);
        // Phase 3: memberSpUserId → nickname 복원 (FE 호환)
        enrichMaps(resultList, "memberSpUserId", "nickname", null);
        return resultList;
    }

    public Map<String, Object> tcDgnssTextSave(Map<String, Object> param) throws Exception {
        Map<String, Object> resultMap = new HashMap<>();

        dgnssMapper.saveDgnssTextSave(param);
        resultMap.put("result", "ok");

        return resultMap;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> selectTcNeedInfo(Map<String, Object> param) {
        Map<String, Object> resultMap = new HashMap<>();
        String paperIdx = MapUtils.getString(param, "paperIdx", "2");

        List<Map<String, Object>> trustInfoList = dgnssMapper.selectTcTrustInfoList(param);
        List<Map<String, Object>> desirable = new ArrayList<>();
        List<Map<String, Object>> reaction = new ArrayList<>();
        List<Map<String, Object>> repeatResponse = new ArrayList<>();

        for (Map<String, Object> trustInfo : trustInfoList) {
            String item = MapUtils.getString(trustInfo, "item", "");
            Map<String, Object> m = Map.of(
                "num",    trustInfo.get("num"),
                "stdtId", trustInfo.get("stdtId")
            );
            switch (item) {
                case "reaction":        reaction.add(m);        break;
                case "repeatResponse":  repeatResponse.add(m);  break;
                case "desirable":       desirable.add(m);       break;
            }
        }
        resultMap.put("desirable", desirable);
        resultMap.put("reaction", reaction);
        resultMap.put("repeatResponse", repeatResponse);

        if (StringUtils.equals(paperIdx, "1")) {
            // 학습종합검사
            resultMap.put("etcInfo", this.selectLernEtcInfo(param));
        } else {
            // META 자기조절학습검사
            resultMap.put("etcInfo", this.selectTcEtcInfoList(param));
        }

        return resultMap;
    }

    public Map<String, List<Map<String, Object>>> selectLernEtcInfo(Map<String, Object> param) {
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
        List<Map<String, Object>> selectLernEtcInfo = dgnssMapper.selectLernEtcInfoList(param);
        for (Map<String, Object> r : selectLernEtcInfo) {
            String section = (String) r.get("sectionId");
            result.computeIfAbsent(section, k -> new ArrayList<>())
                     .add(Map.of("num", r.get("num"), "stdtId", r.get("stdtId")));
        }
        return result;
    }

    public Map<String, List<Map<String, Object>>> selectTcEtcInfoList(Map<String, Object> param) {
        List<Map<String, Object>> etcInfoList = dgnssMapper.selectTcEtcInfoList(param);
        List<String> items = List.of("learningEg", "emotionCtrl", "metaCog", "cogLrnSkil", "behvCtrl", "behvLrnSkil");
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
            for (String item : items) {
                List<Map<String, Object>> list = etcInfoList.stream()
                    .filter(r -> "Y".equals(String.valueOf(r.get(item))))
                    .map(r -> Map.of("num", r.get("num"), "stdtId", r.get("stdtId")))
                    .collect(toCollection(ArrayList::new));
                result.put(item, list);
            }
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> selectTcClassFactorAvg(Map<String, Object> param) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> classStats = dgnssMapper.selectTcClassMetaStats(param);
        List<Map<String, Object>> factorAverages = dgnssMapper.selectTcClassFactorAverages(param);

        Map<String, Map<String, Object>> classMap = new LinkedHashMap<>();
        for (Map<String, Object> stat : classStats) {
            String claId = MapUtils.getString(stat, "claId", "");
            Map<String, Object> classRow = new LinkedHashMap<>();
            classRow.put("claId", claId);
            classRow.put("groupNm", MapUtils.getString(stat, "groupNm", "-"));
            classRow.put("totalStudentCount", MapUtils.getInteger(stat, "totalStudentCount", 0));
            classRow.put("submittedStudentCount", MapUtils.getInteger(stat, "submittedStudentCount", 0));
            classRow.put("reliabilityAlertCount", MapUtils.getInteger(stat, "reliabilityAlertCount", 0));
            classRow.put("factorScoresByDepth", createEmptyFactorScoresByDepth());
            classMap.put(claId, classRow);
        }

        for (Map<String, Object> avg : factorAverages) {
            String claId = MapUtils.getString(avg, "claId", "");
            int depth = MapUtils.getInteger(avg, "depth", 0);
            String sectionId = MapUtils.getString(avg, "sectionId", "");
            Object avgTScore = avg.get("avgTScore");

            Map<String, Object> classRow = classMap.get(claId);
            if (classRow == null) {
                classRow = new LinkedHashMap<>();
                classRow.put("claId", claId);
                classRow.put("groupNm", "-");
                classRow.put("totalStudentCount", 0);
                classRow.put("submittedStudentCount", 0);
                classRow.put("reliabilityAlertCount", 0);
                classRow.put("factorScoresByDepth", createEmptyFactorScoresByDepth());
                classMap.put(claId, classRow);
            }

            Map<String, Object> factorScoresByDepth = (Map<String, Object>) classRow.get("factorScoresByDepth");
            String depthKey = toDepthKey(depth);
            if (depthKey == null) {
                continue;
            }
            Map<String, Object> factorScores = (Map<String, Object>) factorScoresByDepth.get(depthKey);
            factorScores.put(sectionId, avgTScore);
        }

        result.put("classList", new ArrayList<>(classMap.values()));
        return result;
    }

    private Map<String, Object> createEmptyFactorScoresByDepth() {
        Map<String, Object> byDepth = new LinkedHashMap<>();
        byDepth.put("depth3", new LinkedHashMap<String, Object>());
        byDepth.put("depth4", new LinkedHashMap<String, Object>());
        byDepth.put("depth5", new LinkedHashMap<String, Object>());
        return byDepth;
    }

    private String toDepthKey(int depth) {
        if (depth == 3) {
            return "depth3";
        }
        if (depth == 4) {
            return "depth4";
        }
        if (depth == 5) {
            return "depth5";
        }
        return null;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> selectTcAnalysis(Map<String, Object> param) {
        Map<String, Object> resultMap = new HashMap<>();
        if (StringUtils.isEmpty(MapUtils.getString(param, "paperIdx", ""))) {
            param.put("paperIdx", "2");
        }
        String paperIdx = MapUtils.getString(param, "paperIdx", "2");

        // 조회하고자 하는 회차
        String ordNo = MapUtils.getString(param, "ordNo", "");

        List<Integer> allDgnssIdList = dgnssMapper.selectDgnssIdxList(param);
        List<Integer> targetDgnssIdList = resolveTargetDgnssIdListForAnalysis(paperIdx, ordNo, allDgnssIdList);

        // META자기조절학습검사
        if (StringUtils.equals(paperIdx, "2")) {
            List<String> sessionList = putSession(0);
            Map<String, String> sessionCodeMap = putSessionMap(0);
            ObjectMapper mapper = new ObjectMapper();

            for (int dgnssId : targetDgnssIdList) {
                Map<String, Object> paramMap = new HashMap<>();
                paramMap.put("dgnssId", dgnssId);
                paramMap.put("notExistsYn", "N");
                // 초기에는 신뢰도 지표 기준 '주의'가 없는 데이터만 조회
                // 데이터 조회를 했음에도 데이터가 없는 경우 신뢰도 '주의'제거 후 재 조회
                List<Map<String, Object>> claInfoList = dgnssMapper.selectClassTotalReport(paramMap);
                if (CollectionUtils.isEmpty(claInfoList)) {
                    paramMap.put("notExistsYn", "Y");
                    claInfoList = dgnssMapper.selectClassTotalReport(paramMap);
                }
                Map<String, Double> sessionTotalMap = new HashMap<>();
                Map<String, Integer> sessionSizeMap = new HashMap<>();
                if (CollectionUtils.isNotEmpty(claInfoList)) {
                    int nowOrd = 0;
                    int size = 0;
                    for (Map<String, Object> map : claInfoList) {
                        int sessionSize = 0;
                        Map<String, Object> score = mapper.readValue(MapUtils.getString(map, "json", ""), Map.class);
                        for (String sessionId : sessionList) {
                            Double totalSc = MapUtils.getDouble(sessionTotalMap, sessionId, 0D);
                            sessionSize = MapUtils.getInteger(sessionSizeMap, sessionId, 0);
                            Double sessionScore = MapUtils.getDouble(score, sessionId, 0D);
                            totalSc += sessionScore;

                            // 5뎁스만 계산, 3, 4뎁스는 아래 루프에서 계산
                            String[] sessionArr = sessionId.split("-");
                            if ((sessionScore != 0D && !StringUtils.equals(sessionArr[4], "0")) ||
                                    (sessionScore != 0D && StringUtils.equals(sessionArr[3], "0"))) {
                                sessionSize ++;
                            }

                            sessionSizeMap.put(sessionId, sessionSize);
                            sessionTotalMap.put(sessionId, totalSc);
                        }
                        for (String sessionId : sessionList) {
                            String[] sessionArr = sessionId.split("-");
                            if (StringUtils.equals(sessionArr[3], "0")) continue;

                            // 4뎁스의 경우 5뎁스 점수가 하나라도 있다면 평균에서 합산
                            String depth4 = sessionArr[4];
                            if (StringUtils.equals(depth4, "0")) {
                                if (MapUtils.getDouble(score, sessionArr[0] + "-" + sessionArr[1] + "-" + sessionArr[2] + "-" + sessionArr[3] + "-01-0", 0D) != 0D ||
                                        MapUtils.getDouble(score, sessionArr[0] + "-" + sessionArr[1] + "-" + sessionArr[2] + "-" + sessionArr[3] + "-02-0", 0D) != 0D ||
                                        MapUtils.getDouble(score, sessionArr[0] + "-" + sessionArr[1] + "-" + sessionArr[2] + "-" + sessionArr[3] + "-03-0", 0D) != 0D ||
                                        MapUtils.getDouble(score, sessionArr[0] + "-" + sessionArr[1] + "-" + sessionArr[2] + "-" + sessionArr[3] + "-04-0", 0D) != 0D ||
                                        MapUtils.getDouble(score, sessionArr[0] + "-" + sessionArr[1] + "-" + sessionArr[2] + "-" + sessionArr[3] + "-05-0", 0D) != 0D) {

                                    int depth4Size = MapUtils.getInteger(sessionSizeMap, sessionId, 0) + 1;

                                    sessionSizeMap.put(sessionId, depth4Size);
                                }
                            }
                        }
                        nowOrd = MapUtils.getInteger(map, "ord_no", 0);
                    }
                    Map<String, Integer> resultAvgMap = new HashMap<>();
                    for (String sessionId : sessionList) {
                        int avgScore = (int) Math.round(MapUtils.getDouble(sessionTotalMap, sessionId, 0D) / MapUtils.getInteger(sessionSizeMap, sessionId, 0));
                        resultAvgMap.put(MapUtils.getString(sessionCodeMap, sessionId, ""), avgScore);
                    }
                    String ordKey = Integer.toString(nowOrd);
                    resultMap.put(ordKey, resultAvgMap);
                }
            }
        } else if (StringUtils.equals(paperIdx, "1")) {
            Map<String, Object> paramMap = new HashMap<>();
            paramMap.put("notExistsYn", "N");
            paramMap.put("claId", MapUtils.getString(param, "claId", ""));
            paramMap.put("dgnssResultId", MapUtils.getString(param, "dgnssResultId", ""));
            paramMap.put("ordNo", 1);
            List<Map<String, Object>> ord1ClaInfoList = dgnssMapper.selectClassLernReport(paramMap);
            if (CollectionUtils.isEmpty(ord1ClaInfoList)) {
                paramMap.put("notExistsYn", "Y");
                ord1ClaInfoList = dgnssMapper.selectClassLernReport(paramMap);
            }
            resultMap.put("1", ord1ClaInfoList);

            // 2회차로 조건 거는경우 2회차 탐색
            if (StringUtils.equals(ordNo, "2")) {
                paramMap.put("notExistsYn", "N");
                paramMap.put("ordNo", 2);
                List<Map<String, Object>> ord2ClaInfoList = dgnssMapper.selectClassLernReport(paramMap);
                if (CollectionUtils.isEmpty(ord2ClaInfoList)) {
                    paramMap.put("notExistsYn", "Y");
                    ord2ClaInfoList = dgnssMapper.selectClassLernReport(paramMap);
                }

                resultMap.put("2", ord2ClaInfoList);
            }
        }

        Map<String, List<Map<String, Object>>> lpaByOrd = new LinkedHashMap<>();
        // paperIdx=1 LERN 학습영역: 학생별 fallback source 노출용. 같은 lpaRows 의 json 컬럼을 파싱.
        Map<String, List<Map<String, Object>>> lernReportByOrd = new LinkedHashMap<>();
        boolean exposeLernReport = StringUtils.equals(paperIdx, "1");
        ObjectMapper lernJsonParser = new ObjectMapper();
        for (int dgnssId : targetDgnssIdList) {
            Map<String, Object> lpaParam = new HashMap<>();
            lpaParam.put("dgnssId", dgnssId);
            lpaParam.put("notExistsYn", "N");
            List<Map<String, Object>> lpaRows = dgnssMapper.selectClassTotalReport(lpaParam);
            if (CollectionUtils.isEmpty(lpaRows)) {
                lpaParam.put("notExistsYn", "Y");
                lpaRows = dgnssMapper.selectClassTotalReport(lpaParam);
            }
            for (Map<String, Object> row : lpaRows) {
                row.put("source", "IN_CLASS");
            }

            int currentOrdNo = dgnssMapper.selectOrdNoByDgnssId(dgnssId);
            Map<String, Object> missingParam = new HashMap<>();
            missingParam.put("claId", MapUtils.getString(param, "claId", ""));
            missingParam.put("paperIdx", paperIdx);
            missingParam.put("ordNo", currentOrdNo);
            List<String> missingStudents = dgnssMapper.selectClassStudentsWithoutResultInClassForOrd(missingParam);

            if (CollectionUtils.isNotEmpty(missingStudents)) {
                Map<String, Object> fallbackParam = new HashMap<>();
                fallbackParam.put("claId", MapUtils.getString(param, "claId", ""));
                fallbackParam.put("paperIdx", paperIdx);
                fallbackParam.put("ordNo", currentOrdNo);
                fallbackParam.put("stdtIds", missingStudents);
                fallbackParam.put("notExistsYn", MapUtils.getString(lpaParam, "notExistsYn", "N"));
                List<Map<String, Object>> fallbackRows = dgnssMapper.selectClassTotalReportFromOtherClasses(fallbackParam);
                if (CollectionUtils.isNotEmpty(fallbackRows)) {
                    for (Map<String, Object> row : fallbackRows) {
                        row.put("source", "OTHER_CLASS");
                    }
                    lpaRows.addAll(fallbackRows);
                    lpaRows = deduplicateByStdtId(lpaRows);
                }
            }

            if (CollectionUtils.isNotEmpty(lpaRows)) {
                enrichLpaTop3(lpaRows);
                String ordKey = Integer.toString(currentOrdNo);
                List<Map<String, Object>> studentLpaList = new ArrayList<>();
                List<Map<String, Object>> studentLernList = exposeLernReport ? new ArrayList<>() : null;
                Set<String> lernIncludedStdtIds = exposeLernReport ? new HashSet<>() : null;
                for (Map<String, Object> row : lpaRows) {
                    Map<String, Object> lpaRow = new LinkedHashMap<>();
                    lpaRow.put("stdtId", MapUtils.getString(row, "stdtId", ""));
                    lpaRow.put("source", MapUtils.getString(row, "source", "IN_CLASS"));
                    lpaRow.put("lpaClassId", row.get("lpaClassId"));
                    lpaRow.put("lpaTypeName", row.get("lpaTypeName"));
                    lpaRow.put("lpaConfidence", row.get("lpaConfidence"));
                    lpaRow.put("lpaStatus", row.get("lpaStatus"));
                    lpaRow.put("lpaTop1TypeName", row.get("lpaTop1TypeName"));
                    lpaRow.put("lpaTop1Probability", row.get("lpaTop1Probability"));
                    lpaRow.put("lpaTop2TypeName", row.get("lpaTop2TypeName"));
                    lpaRow.put("lpaTop2Probability", row.get("lpaTop2Probability"));
                    lpaRow.put("lpaTop3TypeName", row.get("lpaTop3TypeName"));
                    lpaRow.put("lpaTop3Probability", row.get("lpaTop3Probability"));
                    studentLpaList.add(lpaRow);

                    if (studentLernList != null) {
                        Map<String, Object> sectionScores = new LinkedHashMap<>();
                        String jsonStr = MapUtils.getString(row, "json", "");
                        if (StringUtils.isNotBlank(jsonStr)) {
                            try {
                                Map<String, Object> parsed = lernJsonParser.readValue(jsonStr, Map.class);
                                sectionScores.putAll(parsed);
                            } catch (Exception ex) {
                                // json 파싱 실패 — 빈 sectionScores 로 응답. 데이터 없는 학생도 fallback 여부는 표기.
                            }
                        }
                        String stdtIdValue = MapUtils.getString(row, "stdtId", "");
                        Map<String, Object> lernRow = new LinkedHashMap<>();
                        lernRow.put("stdtId", stdtIdValue);
                        lernRow.put("source", MapUtils.getString(row, "source", "IN_CLASS"));
                        lernRow.put("ord_no", currentOrdNo);
                        // selectClassTotalReport / FromOtherClasses 양쪽 모두 b1.subm_at = 'Y' 필터링이라
                        // lpaRows 에 들어온 학생은 모두 제출 완료 상태.
                        lernRow.put("subm_at", "Y");
                        lernRow.put("sectionScores", sectionScores);
                        studentLernList.add(lernRow);
                        if (StringUtils.isNotBlank(stdtIdValue)) {
                            lernIncludedStdtIds.add(stdtIdValue);
                        }
                    }
                }

                // 타학급에서 응시 중(subm_at='N')이라 위 fallback 에 안 잡힌 학생도 lernReportByOrd 에 노출.
                // FE 가 "다른 학급에서 응시 중(미제출)" 상태로 표시할 수 있도록.
                if (studentLernList != null && CollectionUtils.isNotEmpty(missingStudents)) {
                    Map<String, Object> statusParam = new HashMap<>();
                    statusParam.put("claId", MapUtils.getString(param, "claId", ""));
                    statusParam.put("paperIdx", paperIdx);
                    statusParam.put("ordNo", currentOrdNo);
                    statusParam.put("stdtIds", missingStudents);
                    List<Map<String, Object>> statusRows =
                            dgnssMapper.selectClassStudentsSubmStatusFromOtherClasses(statusParam);
                    if (CollectionUtils.isNotEmpty(statusRows)) {
                        for (Map<String, Object> sRow : statusRows) {
                            String sId = MapUtils.getString(sRow, "stdtId", "");
                            String sAt = MapUtils.getString(sRow, "submAt", "");
                            if (StringUtils.isBlank(sId) || lernIncludedStdtIds.contains(sId)) continue;
                            Map<String, Object> lernRow = new LinkedHashMap<>();
                            lernRow.put("stdtId", sId);
                            lernRow.put("source", "OTHER_CLASS");
                            lernRow.put("ord_no", currentOrdNo);
                            lernRow.put("subm_at", sAt);
                            lernRow.put("sectionScores", new LinkedHashMap<>());
                            studentLernList.add(lernRow);
                            lernIncludedStdtIds.add(sId);
                        }
                    }
                }

                lpaByOrd.put(ordKey, studentLpaList);
                if (studentLernList != null) {
                    lernReportByOrd.put(ordKey, studentLernList);
                }
            }
        }
        resultMap.put("lpaByOrd", lpaByOrd);
        if (exposeLernReport) {
            resultMap.put("lernReportByOrd", lernReportByOrd);
        }

        return resultMap;
    }

    private List<Integer> resolveTargetDgnssIdListForAnalysis(String paperIdx, String ordNo, List<Integer> allDgnssIdList) {
        List<Integer> targetDgnssIdList = new ArrayList<>();
        if (CollectionUtils.isEmpty(allDgnssIdList)) {
            return targetDgnssIdList;
        }

        if (StringUtils.equals(paperIdx, "2")) {
            if (StringUtils.isEmpty(ordNo)) {
                if (allDgnssIdList.size() < 3) {
                    targetDgnssIdList.addAll(allDgnssIdList);
                } else if (allDgnssIdList.size() == 3) {
                    targetDgnssIdList.add(allDgnssIdList.get(0));
                    targetDgnssIdList.add(allDgnssIdList.get(2));
                }
            } else if (StringUtils.equals(ordNo, "1")) {
                targetDgnssIdList.add(allDgnssIdList.get(0));
            } else {
                targetDgnssIdList.add(allDgnssIdList.get(0));
                if (allDgnssIdList.size() > 1) {
                    targetDgnssIdList.add(allDgnssIdList.get(1));
                }
            }
            return targetDgnssIdList;
        }

        if (StringUtils.equals(ordNo, "2") && allDgnssIdList.size() > 1) {
            targetDgnssIdList.add(allDgnssIdList.get(0));
            targetDgnssIdList.add(allDgnssIdList.get(1));
        } else {
            targetDgnssIdList.add(allDgnssIdList.get(0));
        }
        return targetDgnssIdList;
    }

    private List<Map<String, Object>> deduplicateByStdtId(List<Map<String, Object>> rows) {
        if (CollectionUtils.isEmpty(rows)) {
            return rows;
        }
        Map<String, Map<String, Object>> merged = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String stdtId = MapUtils.getString(row, "stdtId", "");
            if (StringUtils.isBlank(stdtId) || merged.containsKey(stdtId)) {
                continue;
            }
            merged.put(stdtId, row);
        }
        return new ArrayList<>(merged.values());
    }



    public String createDgnssDownloadAllZip(HttpServletRequest request, boolean isAuth, Map<String, Object> param) throws Exception {
        return fileService.createDgnssDownloadAllZip(request, isAuth, param);
    }

    public Map<String, Object> selectMakePdfTargetList(Map<String, Object> param) {
        Map<String, Object> result = new HashMap<>();

        List<Map<String, Object>> resultList = dgnssMapper.selectMakePdfTargetList(param);
        result.put("cnt", resultList.size());
        result.put("data", resultList);

        return result;
    }

    public int updateStntAnswer(Map<String, Object> param) {
        return dgnssMapper.updateStntAnswer(param);
    }

    private void publishExamSubmittedEvent(int dgnssResultId) {
        try {
            Map<String, Object> info = dgnssMapper.selectSubmitNotificationInfo(dgnssResultId);
            if (MapUtils.isEmpty(info)) {
                return;
            }
            Long teacherUserNo = MapUtils.getLong(info, "teacherUserNo");
            if (teacherUserNo == null || teacherUserNo <= 0) {
                return;
            }
            int round = MapUtils.getInteger(info, "ordNo", 0);
            String paperIdx = MapUtils.getString(info, "paperIdx", "");
            String examName = resolveExamNameByPaperIdx(paperIdx);
            // Phase 3: memberSpUserId → studentNickname 복원, fallback → stdtId
            enrichMap(info, "memberSpUserId", "studentNickname", null);
            String studentNickname = MapUtils.getString(info, "studentNickname", "");
            if (StringUtils.isBlank(studentNickname)) {
                studentNickname = MapUtils.getString(info, "stdtId", "학생");
            }
            if (StringUtils.isBlank(studentNickname)) {
                studentNickname = "학생";
            }
            eventPublisher.publishEvent(new ExamSubmittedEvent(
                    teacherUserNo,
                    studentNickname,
                    round,
                    examName
            ));
        } catch (Exception e) {
            log.warn("ExamSubmittedEvent 발행 실패: dgnssResultId={}", dgnssResultId, e);
        }
    }

    private void publishExamEndedReportEvent(Map<String, Object> dgnssInfoMap) {
        try {
            Long teacherUserNo = MapUtils.getLong(dgnssInfoMap, "teacherUserNo");
            if (teacherUserNo == null || teacherUserNo <= 0) {
                return;
            }
            int round = MapUtils.getInteger(dgnssInfoMap, "ordNo", 0);
            String paperIdx = MapUtils.getString(dgnssInfoMap, "paperIdx", "");
            String examName = resolveExamNameByPaperIdx(paperIdx);
            String groupName = MapUtils.getString(dgnssInfoMap, "groupNm", "");
            if (StringUtils.isBlank(groupName)) {
                groupName = "그룹";
            }
            eventPublisher.publishEvent(new TeacherExamNotificationEvent(
                    TeacherExamNotificationEvent.Kind.T6_REPORT_READY,
                    teacherUserNo,
                    groupName,
                    round,
                    examName
            ));
        } catch (Exception e) {
            log.warn("ExamEndedReportEvent 발행 실패: dgnssId={}", MapUtils.getString(dgnssInfoMap, "dgnssId", ""), e);
        }
    }

    private void publishExamAllSubmittedEventIfCompleted(int dgnssResultId) {
        try {
            Map<String, Object> info = dgnssMapper.selectSubmitCompletionInfo(dgnssResultId);
            if (MapUtils.isEmpty(info)) {
                return;
            }

            int totalCount = MapUtils.getInteger(info, "totalCount", 0);
            int submittedCount = MapUtils.getInteger(info, "submittedCount", 0);
            if (totalCount <= 0 || submittedCount != totalCount) {
                return;
            }

            Long teacherUserNo = MapUtils.getLong(info, "teacherUserNo");
            if (teacherUserNo == null || teacherUserNo <= 0) {
                return;
            }

            int round = MapUtils.getInteger(info, "ordNo", 0);
            String paperIdx = MapUtils.getString(info, "paperIdx", "");
            String examName = resolveExamNameByPaperIdx(paperIdx);
            String groupName = MapUtils.getString(info, "groupNm", "그룹");

            eventPublisher.publishEvent(new TeacherExamNotificationEvent(
                    TeacherExamNotificationEvent.Kind.T4_ALL_SUBMITTED,
                    teacherUserNo,
                    groupName,
                    round,
                    examName
            ));
        } catch (Exception e) {
            log.warn("ExamAllSubmittedEvent 발행 실패: dgnssResultId={}", dgnssResultId, e);
        }
    }

    private String resolveExamNameByPaperIdx(String paperIdx) {
        return StringUtils.equals(StringUtils.trimToEmpty(paperIdx), "1")
                ? "학습종합검사"
                : "자기조절학습검사";
    }

    private void publishExamReexamRequestedEvent(Map<String, Object> dgnssInfoMap, List<String> targetStdtIds) {
        try {
            if (MapUtils.isEmpty(dgnssInfoMap) || CollectionUtils.isEmpty(targetStdtIds)) {
                return;
            }
            String claId = MapUtils.getString(dgnssInfoMap, "claId", "");
            if (StringUtils.isBlank(claId)) {
                return;
            }
            List<Long> studentUserNos = dgnssMapper.selectStudentUserNosByStdtIdsInClass(claId, targetStdtIds);
            if (CollectionUtils.isEmpty(studentUserNos)) {
                return;
            }
            List<Long> uniqueTargets = studentUserNos.stream()
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            if (CollectionUtils.isEmpty(uniqueTargets)) {
                return;
            }

            int round = MapUtils.getInteger(dgnssInfoMap, "ordNo", 0);
            String paperIdx = MapUtils.getString(dgnssInfoMap, "paperIdx", "");
            String examName = resolveExamNameByPaperIdx(paperIdx);
            String groupName = MapUtils.getString(dgnssInfoMap, "groupNm", "그룹");

            eventPublisher.publishEvent(new StudentExamNotificationEvent(
                    StudentExamNotificationEvent.Kind.S6_REEXAM_REQUESTED,
                    uniqueTargets,
                    groupName,
                    round,
                    examName
            ));
        } catch (Exception e) {
            log.warn("S6 이벤트 발행 실패: dgnssId={}", MapUtils.getString(dgnssInfoMap, "dgnssId", ""), e);
        }
    }

    private void publishExamResultPublishedEvent(Map<String, Object> dgnssInfoMap) {
        try {
            int dgnssId = MapUtils.getInteger(dgnssInfoMap, "dgnssId", 0);
            if (dgnssId <= 0) {
                return;
            }
            List<Long> studentUserNos = dgnssMapper.selectSubmittedStudentUserNoListByDgnssId(dgnssId);
            if (CollectionUtils.isEmpty(studentUserNos)) {
                return;
            }
            List<Long> uniqueTargets = studentUserNos.stream()
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            if (CollectionUtils.isEmpty(uniqueTargets)) {
                return;
            }

            int round = MapUtils.getInteger(dgnssInfoMap, "ordNo", 0);
            String paperIdx = MapUtils.getString(dgnssInfoMap, "paperIdx", "");
            String examName = resolveExamNameByPaperIdx(paperIdx);
            String groupName = MapUtils.getString(dgnssInfoMap, "groupNm", "그룹");

            eventPublisher.publishEvent(new StudentExamNotificationEvent(
                    StudentExamNotificationEvent.Kind.S3_RESULT_PUBLISHED,
                    uniqueTargets,
                    groupName,
                    round,
                    examName
            ));
        } catch (Exception e) {
            log.warn("ExamResultPublishedEvent 발행 실패: dgnssId={}", MapUtils.getString(dgnssInfoMap, "dgnssId", ""), e);
        }
    }

    private void publishExamAssignedEvent(Map<String, Object> paramMap) {
        try {
            List<Long> studentUserNos = dgnssMapper.selectTargetStudentUserNoList(paramMap);
            if (CollectionUtils.isEmpty(studentUserNos)) {
                return;
            }
            List<Long> uniqueTargets = studentUserNos.stream()
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            if (CollectionUtils.isEmpty(uniqueTargets)) {
                return;
            }

            int round = MapUtils.getInteger(paramMap, "ordNo", 0);
            String paperIdx = MapUtils.getString(paramMap, "paperIdx", "");
            String examName = resolveExamNameByPaperIdx(paperIdx);
            String groupName = "";
            int dgnssId = MapUtils.getInteger(paramMap, "id", 0);
            if (dgnssId > 0) {
                Map<String, Object> q = new HashMap<>();
                q.put("dgnssId", dgnssId);
                Map<String, Object> dgnssInfoMap = dgnssMapper.selectTcDgnssInfoOneWithDgnssId(q);
                if (MapUtils.isNotEmpty(dgnssInfoMap)) {
                    groupName = MapUtils.getString(dgnssInfoMap, "groupNm", "");
                }
            }
            if (StringUtils.isBlank(groupName)) {
                groupName = "그룹";
            }

            eventPublisher.publishEvent(new StudentExamNotificationEvent(
                    StudentExamNotificationEvent.Kind.S1_ASSIGNED,
                    uniqueTargets,
                    groupName,
                    round,
                    examName
            ));
        } catch (Exception e) {
            log.warn("ExamAssignedEvent 발행 실패: claId={}", MapUtils.getString(paramMap, "claId", ""), e);
        }
    }

    @Transactional
    public Map<String, Object> fillRandomAnswers(Map<String, Object> param) {
        int omrIdx = MapUtils.getInteger(param, "omrIdx", 0);
        int paperIdx = MapUtils.getInteger(param, "paperIdx", 0);

        if (omrIdx <= 0) {
            throw new IllegalArgumentException("omrIdx가 올바르지 않습니다.");
        }
        if (paperIdx != 1 && paperIdx != 2) {
            throw new IllegalArgumentException("paperIdx는 1 또는 2만 가능합니다.");
        }

        int maxQuestionNo = paperIdx == 1 ? 124 : 77;
        int updatedCount = 0;

        for (int no = 1; no <= maxQuestionNo; no++) {
            Map<String, Object> answerParam = new HashMap<>();
            answerParam.put("omrIdx", omrIdx);
            answerParam.put("no", no);
            answerParam.put("answer", ThreadLocalRandom.current().nextInt(1, 6));
            updatedCount += dgnssMapper.updateStntAnswer(answerParam);
        }

        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("omrIdx", omrIdx);
        resultMap.put("paperIdx", paperIdx);
        resultMap.put("questionCount", maxQuestionNo);
        resultMap.put("updatedCount", updatedCount);
        resultMap.put("success", updatedCount == maxQuestionNo ? "success" : "partial");
        return resultMap;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> selectStntDgnssList(Map<String, Object> param) {
        return dgnssMapper.selectStntDgnssList(param);
    }

    public Map<String, Object> selectStDgnssStart(Map<String, Object> param, Pageable pageable) {
        pageable = resolvePageable(param, pageable);
        normalizeAndValidateGender(param);
        normalizeNumericInput(param, "grade");
        normalizeNumericInput(param, "classNumber");
        Map<String, Object> resultMap = new HashMap<>();
        int paperIdx = MapUtils.getInteger(param, "paperIdx", 0);
        String eakAt = "";
        // 자기조절학습에서 제공되는 문제는 72번까지이지만 실제로는 77번까지(프론트에서 하드코딩)여서 학생이 입력한 답 전달은 따로 세팅
        if (paperIdx == 1 || paperIdx == 2) {
            long total = 0;
            PagingParam<?> pagingParam = PagingParam.builder()
                    .param(param)
                    .pageable(pageable)
                    .build();
            List<Map> dgnssQuesList = dgnssMapper.selectStQuesList(pagingParam);
            if (CollectionUtils.isNotEmpty(dgnssQuesList)) {
                total = (long) dgnssQuesList.get(0).get("fullCount");
            }

            PagingInfo page = AidtCommonUtil.ofPageInfo(dgnssQuesList, pageable, total);

            Map<String, Object> omrInfo = dgnssMapper.selectStDgnssOmr(param);
            if (MapUtils.isEmpty(omrInfo)) {
                resultMap.put("success", "error");
                return resultMap;
            }

            // 학생이 답안 입력한 개수 반환
            long stAnsCnt = omrInfo.values().stream()
                    .filter(ObjectUtils::isNotEmpty)
                    .count();

            // omrInfo에서 id, omrIdx 제외
            resultMap.put("stAnsCnt", stAnsCnt - 2);

            for (Map<String, Object> map : dgnssQuesList) {
                String no = MapUtils.getString(map, "NO", "");
                map.put("answer", MapUtils.getString(omrInfo, no, ""));
            }
            eakAt = MapUtils.getString(omrInfo, "eakAt", "N");
            if (paperIdx == 1) {
                if (page.getNumber() == 6) {
                    for (int i = 120; i < 125; i++) {
                        Map<String, Object> answerMap = new HashMap<>();
                        answerMap.put("NO", i);
                        answerMap.put("QESITM_NM", "");
                        answerMap.put("answer", MapUtils.getString(omrInfo, String.valueOf(i), ""));
                        dgnssQuesList.add(answerMap);
                    }
                }
            } else if (paperIdx == 2) {
                if (page.getNumber() == 4) {
                    for (int i = 73; i < 78; i++) {
                        Map<String, Object> answerMap = new HashMap<>();
                        answerMap.put("NO", i);
                        answerMap.put("QESITM_NM", "");
                        answerMap.put("answer", MapUtils.getString(omrInfo, String.valueOf(i), ""));
                        dgnssQuesList.add(answerMap);
                    }
                }
            }

            resultMap.put("page", page);
            resultMap.put("omrIdx", MapUtils.getInteger(omrInfo, "omrIdx", 0));
            resultMap.put("dgnssQuesList", dgnssQuesList);

        } else {
            List<Map<String, Object>> dgnssQuesList = dgnssMapper.selectStQuesListOrigin(param);
            Map<String, Object> omrInfo = dgnssMapper.selectStDgnssOmr(param);
            if (MapUtils.isEmpty(omrInfo)) {
                resultMap.put("success", "error");
                return resultMap;
            }
            eakAt = MapUtils.getString(omrInfo, "eakAt", "N");

            for (Map<String, Object> map : dgnssQuesList) {
                String no = MapUtils.getString(map, "NO", "");
                map.put("answer", MapUtils.getString(omrInfo, no, ""));
            }

            for (int i = 73; i < 78; i++) {
                Map<String, Object> answerMap = new HashMap<>();
                answerMap.put("NO", i);
                answerMap.put("QESITM_NM", "");
                answerMap.put("answer", MapUtils.getString(omrInfo, String.valueOf(i), ""));
                dgnssQuesList.add(answerMap);
            }
            resultMap.put("omrIdx", MapUtils.getInteger(omrInfo, "omrIdx", 0));
            resultMap.put("dgnssQuesList", dgnssQuesList);
        }

        dgnssMapper.updateStStart(param);


        return resultMap;
    }

    /** 학생 입력 성별(gender)이 있으면 대문자 정규화 후 M/F만 허용. 미입력 시 무시(미저장). */
    private void normalizeAndValidateGender(Map<String, Object> param) {
        String gender = MapUtils.getString(param, "gender", null);
        if (StringUtils.isBlank(gender)) {
            return;
        }
        String normalized = gender.trim().toUpperCase();
        if (!"M".equals(normalized) && !"F".equals(normalized)) {
            throw new IllegalArgumentException("gender는 'M' 또는 'F'만 허용됩니다: " + gender);
        }
        param.put("gender", normalized);
    }

    /**
     * 학생 입력 숫자 필드(grade/classNumber)에서 선행 숫자만 남기고 뒤 문자열("학년"/"반" 등)을 제거.
     * 예) "2학년" → "2", "3반" → "3", "2" → "2". 숫자가 없으면 빈 값(→ 저장 시 미반영).
     */
    private void normalizeNumericInput(Map<String, Object> param, String key) {
        String value = MapUtils.getString(param, key, null);
        if (StringUtils.isBlank(value)) {
            return;
        }
        param.put(key, value.trim().replaceAll("[^0-9].*$", ""));
    }

    private Pageable resolvePageable(Map<String, Object> param, Pageable pageable) {
        int defaultPage = pageable != null ? pageable.getPageNumber() : 0;
        int defaultSize = pageable != null ? pageable.getPageSize() : 20;

        int page = Math.max(MapUtils.getInteger(param, "page", defaultPage), 0);
        int size = MapUtils.getInteger(param, "size", defaultSize);
        if (size <= 0) {
            size = defaultSize > 0 ? defaultSize : 20;
        }

        return PageRequest.of(page, size);
    }

    /**
     * (학생)META 자기조절학습 이어하기 진입 정보.
     * 중간에 종료한 학생이 이어하기 시 마지막으로 응답한 문항번호와, 진입해야 할 페이지(0-base, 첫 페이지=0)를 계산해 반환한다.
     * "마지막으로 푼 문제" 기준은 OMR 에서 응답이 채워진 최대 문항번호(NO)이다.
     *
     * 페이지 레이아웃은 stMetaStart(selectStDgnssStart) 와 동일하다(페이지당 20문항, 0-base).
     *  - 학습종합(paperIdx=1)  : 정규 119문항 + 추가 문항 120~124 (page 6)
     *  - META자기조절(그 외)   : 정규 ~72문항 + 추가 문항 73~77  (page 4)
     * 추가 문항은 마지막 페이지에 하드코딩으로 붙으므로, 정규 문항 범위를 벗어나면 해당 페이지로 고정한다.
     *
     * 반환된 page 는 /api/dgnss/st/start 의 page(0-base) 에 그대로 전달할 수 있다.
     */
    public Map<String, Object> selectStDgnssResume(Map<String, Object> param) {
        final int PAGE_SIZE = 20;
        Map<String, Object> resultMap = new HashMap<>();
        int paperIdx = MapUtils.getInteger(param, "paperIdx", 0);

        Map<String, Object> omrInfo = dgnssMapper.selectStDgnssOmr(param);

        // 잘못된 id 값으로 보내는 케이스(교사가 취소한 시험지로 응시하려는 케이스)
        if (MapUtils.isEmpty(omrInfo)) {
            resultMap.put("success", "error");
            return resultMap;
        }

        // 응답이 채워진 문항번호(NO) 중 최댓값과 응답 개수 산출 (응답이 아닌 dgnssResultId/omrIdx 컬럼은 제외)
        int lastAnsweredNo = 0;
        int stAnsCnt = 0;
        for (Map.Entry<String, Object> entry : omrInfo.entrySet()) {
            if (!StringUtils.isNumeric(entry.getKey())) {
                continue;
            }
            if (ObjectUtils.isEmpty(entry.getValue())) {
                continue;
            }
            stAnsCnt++;
            int no = Integer.parseInt(entry.getKey());
            if (no > lastAnsweredNo) {
                lastAnsweredNo = no;
            }
        }

        // paperIdx 별 추가(extras) 문항 시작 번호와, start 기준 extras 페이지(0-base)
        boolean isComprehensive = (paperIdx == 1); // 1:학습종합, 그 외:META자기조절
        int extrasStartNo = isComprehensive ? 120 : 73;
        int extrasPageZeroBase = isComprehensive ? 6 : 4;

        int pageZeroBase;
        if (lastAnsweredNo <= 0) {
            pageZeroBase = 0;
        } else if (lastAnsweredNo >= extrasStartNo) {
            pageZeroBase = extrasPageZeroBase;
        } else {
            pageZeroBase = (lastAnsweredNo - 1) / PAGE_SIZE;
        }

        resultMap.put("lastAnsweredNo", lastAnsweredNo);
        resultMap.put("stAnsCnt", stAnsCnt);
        resultMap.put("page", pageZeroBase); // 0-base (첫 페이지 = 0), start 의 page 에 그대로 전달 가능
        resultMap.put("size", PAGE_SIZE);
        resultMap.put("omrIdx", MapUtils.getInteger(omrInfo, "omrIdx", 0));

        return resultMap;
    }

    public Map<String, Object> summaryPdfUpload(Map<String, Object> paramData, HttpServletRequest request) throws Exception {
        Map<String, Object> result = new HashMap<>();

        LocalDateTime currentTime = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String formattedTime = currentTime.format(formatter);

        Map<String, Object> dgnssAnswer = dgnssMapper.selectStUserInfo(paramData);
        // Phase 3: memberSpUserId → MEM_NM/email, teacherSpUserId → tcNm 복원
        enrichStUserInfo(dgnssAnswer);
        applyNicknameOverride(dgnssAnswer); // 학생 입력 닉네임이 있으면 표시 이름으로 사용
        if (StringUtils.isNotEmpty(MapUtils.getString(dgnssAnswer, "summaryFileURL", ""))) {
            result.put("summaryUrl", MapUtils.getString(dgnssAnswer, "summaryFileURL", ""));
        }
        Map<String, Object> dgnssData = new HashMap<>();
        Map<String, Object> param = new HashMap<>();
        param.put("ANSWER_IDX", MapUtils.getInteger(paramData, "answerIdx", 0));
        param.put("DEPTH", 3);
        dgnssData.put("dgnssReport3", dgnssMapper.getDgnssReport(param));
        param.put("DEPTH", 4);
        dgnssData.put("dgnssReport4", dgnssMapper.getDgnssReport(param));
        param.put("DEPTH", 5);
        dgnssData.put("dgnssReport5", dgnssMapper.getDgnssReport(param));
        dgnssData.put("dgnssReportStudy", dgnssMapper.getDgnssReportStudy(param));

        dgnssAnswer.put("schName", MapUtils.getString(dgnssAnswer, "SCH_NM", ""));

        dgnssData.put("userInfo", dgnssAnswer);

        String fileName = MapUtils.getString(dgnssAnswer, "MEM_ID", "") + "_summary_" + formattedTime + ".pdf";

        String url = pdfService.createDgnssSummaryByTemplate(new File(fileName), dgnssData, request);

        Map<String, Object> updateMap = new HashMap<>();
        updateMap.put("fileUrl", url);
        updateMap.put("dgnssResultId", MapUtils.getString(dgnssAnswer, "dgnssResultId", ""));
        dgnssMapper.updateSummaryFileUrl(updateMap);

        result.put("summaryUrl", url);
        return result;
    }

    private void sendStudentResultMail(int dgnssResultId, int answerIdx, String overrideEmail, HttpServletRequest request) throws Exception {
        Map<String, Object> studentInfo = dgnssMapper.selectStUserInfo(Collections.singletonMap("answerIdx", answerIdx));
        if (MapUtils.isEmpty(studentInfo)) {
            throw new IllegalStateException("학생 결과 메일 발송 대상 정보를 찾을 수 없습니다.");
        }
        // Phase 3: memberSpUserId → MEM_NM/email, teacherSpUserId → tcNm 복원
        enrichStUserInfo(studentInfo);

        String memberType = MapUtils.getString(studentInfo, "memberType", "");
        if (!StringUtils.equals(memberType, "GUEST")) {
            log.info("게스트 회원이 아니므로 메일 발송 생략: dgnssResultId={}, answerIdx={}, memberType={}", dgnssResultId, answerIdx, memberType);
            return;
        }

        String toEmail = StringUtils.defaultIfBlank(overrideEmail, MapUtils.getString(studentInfo, "email", ""));
        if (StringUtils.isBlank(toEmail)) {
            log.warn("게스트 회원이지만 이메일 정보가 없어 발송 생략: dgnssResultId={}, answerIdx={}", dgnssResultId, answerIdx);
            return;
        }

        String fileUrl = ensureStudentPdfUrl(answerIdx, request);
        byte[] pdfData = fileService.loadFileBytesForMail(fileUrl);
        String studentName = MapUtils.getString(studentInfo, "MEM_NM", "");

        ncpMailSender.sendExamResultPdf(toEmail, studentName, pdfData);
        log.info("학생 결과 메일 발송 완료: dgnssResultId={}, answerIdx={}, toEmail={}", dgnssResultId, answerIdx, toEmail);
    }

    private String ensureStudentPdfUrl(int answerIdx, HttpServletRequest request) throws Exception {
        Map<String, Object> stUserInfo = dgnssMapper.selectStUserInfo(Collections.singletonMap("answerIdx", answerIdx));
        if (MapUtils.isEmpty(stUserInfo)) {
            throw new IllegalStateException("학생 PDF 생성 대상 정보를 찾을 수 없습니다.");
        }
        // Phase 3: memberSpUserId → MEM_NM/email, teacherSpUserId → tcNm 복원
        enrichStUserInfo(stUserInfo);

        String fileUrl = MapUtils.getString(stUserInfo, "fileURL", "");
        if (StringUtils.isNotBlank(fileUrl)) {
            return fileUrl;
        }

        Map<String, Object> paramData = new HashMap<>();
        paramData.put("answerIdx", answerIdx);
        return makeStPdf(paramData, stUserInfo, buildStudentPdfFileName(stUserInfo), request);
    }

    private String buildStudentPdfFileName(Map<String, Object> stUserInfo) {
        LocalDateTime currentTime = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String formattedTime = currentTime.format(formatter);
        return MapUtils.getString(stUserInfo, "MEM_ID", "student") + "_" + formattedTime + ".pdf";
    }

    private String resolveExamTypeName(String dgnssId) {
        if (StringUtils.equals(dgnssId, "DGNSS_10")) {
            return "학습종합검사";
        }
        if (StringUtils.equals(dgnssId, "DGNSS_20")) {
            return "자기조절학습검사";
        }
        return "학습심리검사";
    }

    private void enrichLpaTop3(List<Map<String, Object>> rows) {
        if (CollectionUtils.isEmpty(rows)) {
            return;
        }
        for (Map<String, Object> row : rows) {
            enrichLpaTop3(row);
        }
    }

    private void enrichLpaTop3(Map<String, Object> row) {
        String probabilitiesJson = MapUtils.getString(row, "lpaProbabilitiesJson", "");
        if (StringUtils.isBlank(probabilitiesJson) || StringUtils.equals(probabilitiesJson, "{}")) {
            putEmptyLpaTop3(row);
            return;
        }

        try {
            Map<String, Double> probabilities = mapper.readValue(
                    probabilitiesJson,
                    new TypeReference<Map<String, Double>>() { }
            );
            if (MapUtils.isEmpty(probabilities)) {
                putEmptyLpaTop3(row);
                return;
            }

            List<Map.Entry<String, Double>> sorted = probabilities.entrySet().stream()
                    .sorted((a, b) -> Double.compare(
                            ObjectUtils.defaultIfNull(b.getValue(), 0D),
                            ObjectUtils.defaultIfNull(a.getValue(), 0D)
                    ))
                    .limit(3)
                    .collect(Collectors.toList());

            List<Double> top3Probabilities = normalizeTop3ProbabilitiesOneDecimal(sorted);

            for (int i = 0; i < 3; i++) {
                String rankPrefix = "lpaTop" + (i + 1);
                if (i < sorted.size()) {
                    Map.Entry<String, Double> entry = sorted.get(i);
                    String classId = entry.getKey();
                    row.put(rankPrefix + "ClassId", classId);
                    row.put(rankPrefix + "TypeName", resolveLpaTypeName(classId));
                    row.put(rankPrefix + "Probability", top3Probabilities.get(i));
                } else {
                    row.put(rankPrefix + "ClassId", null);
                    row.put(rankPrefix + "TypeName", null);
                    row.put(rankPrefix + "Probability", null);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse lpaProbabilitiesJson. value={}", probabilitiesJson, e);
            putEmptyLpaTop3(row);
        }
    }

    private void putEmptyLpaTop3(Map<String, Object> row) {
        for (int i = 1; i <= 3; i++) {
            row.put("lpaTop" + i + "ClassId", null);
            row.put("lpaTop" + i + "TypeName", null);
            row.put("lpaTop" + i + "Probability", null);
        }
    }

    private String resolveLpaTypeName(String classId) {
        if (StringUtils.isBlank(classId)) {
            return null;
        }
        return MapUtils.getString(lpaTypeNameByClassId, classId, classId);
    }

    private void moveSectionScoresToScoresMap(List<Map<String, Object>> rows) {
        if (CollectionUtils.isEmpty(rows)) {
            return;
        }

        for (Map<String, Object> row : rows) {
            Map<String, Object> scores = new LinkedHashMap<>();
            List<String> keysToRemove = new ArrayList<>();

            for (Map.Entry<String, Object> entry : row.entrySet()) {
                String key = entry.getKey();
                Object value = entry.getValue();
                if (isSectionIdKey(key) && value instanceof Number) {
                    scores.put(key, value);
                    keysToRemove.add(key);
                }
            }

            for (String keyToRemove : keysToRemove) {
                row.remove(keyToRemove);
            }
            row.put("scores", scores);
        }
    }

    private boolean isSectionIdKey(String key) {
        return key != null && key.matches("^\\d{2}-\\d{2}-\\d{2}-\\d{2}-\\d{2}-\\d$");
    }

    private Map<String, Map<String, Object>> extractLpaTopByOrd(List<Map<String, Object>> rows) {
        Map<String, Map<String, Object>> result = new LinkedHashMap<>();
        for (Map<String, Object> row : rows) {
            String ordKey = Integer.toString(MapUtils.getInteger(row, "ord_no", 0));
            if (!"1".equals(ordKey) && !"2".equals(ordKey)) {
                continue;
            }
            if (result.containsKey(ordKey)) {
                continue;
            }

            Map<String, Object> lpaTop = new LinkedHashMap<>();
            lpaTop.put("lpaTypeName", row.get("lpaTypeName"));
            lpaTop.put("lpaTop1TypeName", row.get("lpaTop1TypeName"));
            lpaTop.put("lpaTop1Probability", row.get("lpaTop1Probability"));
            lpaTop.put("lpaTop2TypeName", row.get("lpaTop2TypeName"));
            lpaTop.put("lpaTop2Probability", row.get("lpaTop2Probability"));
            lpaTop.put("lpaTop3TypeName", row.get("lpaTop3TypeName"));
            lpaTop.put("lpaTop3Probability", row.get("lpaTop3Probability"));
            result.put(ordKey, lpaTop);
        }
        return result;
    }

    private void removeLpaTopFromRows(List<Map<String, Object>> rows) {
        for (Map<String, Object> row : rows) {
            row.remove("lpaClassId");
            row.remove("lpaTypeName");
            row.remove("lpaConfidence");
            row.remove("lpaStatus");
            row.remove("lpaProbabilitiesJson");
            row.remove("lpaTop1ClassId");
            row.remove("lpaTop1TypeName");
            row.remove("lpaTop1Probability");
            row.remove("lpaTop2ClassId");
            row.remove("lpaTop2TypeName");
            row.remove("lpaTop2Probability");
            row.remove("lpaTop3ClassId");
            row.remove("lpaTop3TypeName");
            row.remove("lpaTop3Probability");
            row.remove("answerIdx");
        }
    }

    private List<Double> normalizeTop3ProbabilitiesOneDecimal(List<Map.Entry<String, Double>> sortedTop3) {
        if (CollectionUtils.isEmpty(sortedTop3)) {
            return Collections.emptyList();
        }

        List<Double> raw = sortedTop3.stream()
                .map(entry -> Math.max(0D, ObjectUtils.defaultIfNull(entry.getValue(), 0D)))
                .collect(Collectors.toList());

        double sumRaw = raw.stream().mapToDouble(Double::doubleValue).sum();
        if (sumRaw <= 0D) {
            List<Double> zeros = new ArrayList<>();
            for (int i = 0; i < raw.size(); i++) {
                zeros.add(0D);
            }
            return zeros;
        }

        List<Double> normalized = raw.stream()
                .map(value -> (value * 100D) / sumRaw)
                .collect(Collectors.toList());

        List<Integer> baseTenths = new ArrayList<>();
        List<Double> remainders = new ArrayList<>();
        int sumBaseTenths = 0;
        for (double value : normalized) {
            double scaled = value * 10D;
            int base = (int) Math.floor(scaled + 1e-9);
            baseTenths.add(base);
            remainders.add(scaled - base);
            sumBaseTenths += base;
        }

        int targetTenths = 1000; // 100.0%
        int diff = targetTenths - sumBaseTenths;

        if (diff > 0) {
            List<Integer> order = orderIndexesByRemainder(remainders, true);
            for (int i = 0; i < diff; i++) {
                int idx = order.get(i % order.size());
                baseTenths.set(idx, baseTenths.get(idx) + 1);
            }
        } else if (diff < 0) {
            List<Integer> order = orderIndexesByRemainder(remainders, false);
            int needReduce = -diff;
            int pointer = 0;
            while (needReduce > 0 && !order.isEmpty()) {
                int idx = order.get(pointer % order.size());
                if (baseTenths.get(idx) > 0) {
                    baseTenths.set(idx, baseTenths.get(idx) - 1);
                    needReduce--;
                }
                pointer++;
            }
        }

        List<Double> result = new ArrayList<>();
        for (Integer tenths : baseTenths) {
            result.add(tenths / 10D);
        }
        return result;
    }

    private List<Integer> orderIndexesByRemainder(List<Double> remainders, boolean desc) {
        List<Integer> indexes = new ArrayList<>();
        for (int i = 0; i < remainders.size(); i++) {
            indexes.add(i);
        }
        indexes.sort((a, b) -> {
            int compared = Double.compare(remainders.get(a), remainders.get(b));
            return desc ? -compared : compared;
        });
        return indexes;
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100D) / 100D;
    }

    /**
     * 검사 응답 입력용 샘플 엑셀 생성
     * @param dgnssId 검사 ID
     * @return 엑셀 파일 바이트 배열
     */
    @Transactional(readOnly = true)
    public byte[] generateSampleExcel(int dgnssId) throws IOException {
        // 1. OMR 목록 조회
        List<Map<String, Object>> omrList = dgnssMapper.selectOmrListForSampleExcel(dgnssId);
        // Phase 3: memberSpUserId → nickname 복원 (FE 호환)
        enrichMaps(omrList, "memberSpUserId", "nickname", null);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("응답입력");

            // 2. 스타일 정의
            // 수정금지 영역 스타일 (연한 빨간색 배경)
            CellStyle lockedHeaderStyle = workbook.createCellStyle();
            lockedHeaderStyle.setFillForegroundColor(IndexedColors.ROSE.getIndex());
            lockedHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            lockedHeaderStyle.setLocked(true);
            lockedHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            lockedHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            lockedHeaderStyle.setFont(headerFont);
            setBorder(lockedHeaderStyle);

            CellStyle lockedDataStyle = workbook.createCellStyle();
            lockedDataStyle.setFillForegroundColor(IndexedColors.ROSE.getIndex());
            lockedDataStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            lockedDataStyle.setLocked(true);
            lockedDataStyle.setAlignment(HorizontalAlignment.CENTER);
            lockedDataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorder(lockedDataStyle);

            // 입력 영역 헤더 스타일
            CellStyle unlockedHeaderStyle = workbook.createCellStyle();
            unlockedHeaderStyle.setLocked(false);
            unlockedHeaderStyle.setAlignment(HorizontalAlignment.CENTER);
            unlockedHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            unlockedHeaderStyle.setFont(headerFont);
            setBorder(unlockedHeaderStyle);

            // 입력 영역 데이터 스타일
            CellStyle unlockedDataStyle = workbook.createCellStyle();
            unlockedDataStyle.setLocked(false);
            unlockedDataStyle.setAlignment(HorizontalAlignment.CENTER);
            unlockedDataStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorder(unlockedDataStyle);

            // 3. 헤더 행 생성
            Row headerRow = sheet.createRow(0);

            // A~C열: 수정금지 헤더
            String[] lockedHeaders = {"번호 (수정금지)", "OMR_IDX (수정금지)", "닉네임 (수정금지)"};
            for (int i = 0; i < lockedHeaders.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(lockedHeaders[i]);
                cell.setCellStyle(lockedHeaderStyle);
            }

            // D~DU열: 1~124 응답란 헤더
            for (int i = 1; i <= 124; i++) {
                Cell cell = headerRow.createCell(i + 2); // D열부터 시작 (인덱스 3)
                cell.setCellValue(String.valueOf(i));
                cell.setCellStyle(unlockedHeaderStyle);
            }

            // 4. 데이터 행 생성
            int rowNum = 1;
            for (Map<String, Object> omr : omrList) {
                Row row = sheet.createRow(rowNum++);

                // A열: 출석번호
                Cell memberNoCell = row.createCell(0);
                Object memberNo = omr.get("memberNo");
                if (memberNo != null) {
                    memberNoCell.setCellValue(NumberUtils.toInt(memberNo.toString(), 0));
                }
                memberNoCell.setCellStyle(lockedDataStyle);

                // B열: OMR_IDX
                Cell omrIdxCell = row.createCell(1);
                Object omrIdx = omr.get("omrIdx");
                if (omrIdx != null) {
                    omrIdxCell.setCellValue(NumberUtils.toInt(omrIdx.toString(), 0));
                }
                omrIdxCell.setCellStyle(lockedDataStyle);

                // C열: 닉네임
                Cell nicknameCell = row.createCell(2);
                nicknameCell.setCellValue(MapUtils.getString(omr, "nickname", ""));
                nicknameCell.setCellStyle(lockedDataStyle);

                // D~DU열: 빈 응답란
                for (int i = 3; i < 127; i++) {
                    Cell cell = row.createCell(i);
                    cell.setCellStyle(unlockedDataStyle);
                }
            }

            // 5. 열 너비 조정
            sheet.setColumnWidth(0, 18 * 256);  // 번호 (수정금지) 텍스트 보이도록
            sheet.setColumnWidth(1, 22 * 256);  // OMR_IDX (수정금지) 텍스트 보이도록
            sheet.setColumnWidth(2, 22 * 256);  // 닉네임 (수정금지) 텍스트 보이도록
            for (int i = 3; i < 127; i++) {
                sheet.setColumnWidth(i, 4 * 256); // 응답란
            }

            // 6. 시트 보호 활성화 (비밀번호 없이)
            sheet.protectSheet("");

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private void setBorder(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

    /**
     * 엑셀 파일에서 응답값을 읽어 tb_dgnss_omr 테이블 업데이트
     * @param dgnssId 검사 ID
     * @param file 엑셀 파일
     * @return 업데이트 결과
     */
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> uploadAnswersFromExcel(int dgnssId, org.springframework.web.multipart.MultipartFile file, HttpServletRequest request) throws Exception {
        List<Map<String, Object>> errors = new ArrayList<>();

        // 1. 파일 형식 검증
        validateFileFormat(file, errors);
        if (!errors.isEmpty()) {
            throw new ValidationException(buildErrorMessage(errors), errors);
        }

        // 2. 해당 dgnssId에 속한 유효 OMR_IDX 집합 조회
        List<Integer> validOmrIdxList = dgnssMapper.selectValidOmrIdxSetByDgnssId(dgnssId);
        Set<Integer> validOmrIdxSet = new HashSet<>(validOmrIdxList);

        if (validOmrIdxSet.isEmpty()) {
            errors.add(createError(0, "dgnssId", "해당 검사에 등록된 학생이 없습니다 (dgnssId: " + dgnssId + ")"));
            throw new ValidationException(buildErrorMessage(errors), errors);
        }

        // 3. 엑셀 파일 파싱 및 검증
        List<Map<String, Object>> updateDataList = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                errors.add(createError(0, "sheet", "엑셀 시트를 읽을 수 없습니다"));
                throw new ValidationException(buildErrorMessage(errors), errors);
            }

            // 헤더 행 검증
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                errors.add(createError(1, "header", "헤더 행이 없습니다"));
                throw new ValidationException(buildErrorMessage(errors), errors);
            }

            validateHeaderRow(headerRow, errors);
            if (!errors.isEmpty()) {
                throw new ValidationException(buildErrorMessage(errors), errors);
            }

            // 데이터 행 처리
            int lastRowNum = sheet.getLastRowNum();
            for (int rowNum = 1; rowNum <= lastRowNum; rowNum++) {
                Row row = sheet.getRow(rowNum);
                if (row == null || isEmptyRow(row)) {
                    continue;
                }

                // OMR_IDX 읽기 (B열, 인덱스 1)
                Cell omrIdxCell = row.getCell(1);
                Integer omrIdx = getCellValueAsInteger(omrIdxCell);

                if (omrIdx == null) {
                    errors.add(createError(rowNum + 1, "OMR_IDX", "OMR_IDX가 비어있거나 유효하지 않습니다"));
                    continue;
                }

                // OMR_IDX 존재 여부 확인
                if (dgnssMapper.existsOmrIdx(omrIdx) == 0) {
                    errors.add(createError(rowNum + 1, "OMR_IDX", "존재하지 않는 OMR_IDX입니다 (" + omrIdx + ")"));
                    continue;
                }

                // dgnssId에 속하는지 확인
                if (!validOmrIdxSet.contains(omrIdx)) {
                    errors.add(createError(rowNum + 1, "OMR_IDX", "해당 검사에 속하지 않는 학생입니다 (" + omrIdx + ")"));
                    continue;
                }

                // 응답값 읽기 (D~DU열, 인덱스 3~126)
                Map<String, Object> updateData = new HashMap<>();
                updateData.put("omrIdx", omrIdx);

                for (int colIdx = 3; colIdx < 127; colIdx++) {
                    int questionNo = colIdx - 2; // 1~124
                    Cell cell = row.getCell(colIdx);
                    String answer = getCellValueAsString(cell);

                    // 빈 값은 null로 처리
                    if (StringUtils.isBlank(answer)) {
                        updateData.put("a" + questionNo, null);
                        continue;
                    }

                    // 응답값 범위 검증 (1~5)
                    try {
                        int answerValue = Integer.parseInt(answer.trim());
                        if (answerValue < 1 || answerValue > 5) {
                            errors.add(createError(rowNum + 1, String.valueOf(questionNo), "응답값은 1~5만 가능합니다 (입력값: " + answerValue + ")"));
                        } else {
                            updateData.put("a" + questionNo, String.valueOf(answerValue));
                        }
                    } catch (NumberFormatException e) {
                        errors.add(createError(rowNum + 1, String.valueOf(questionNo), "응답값은 숫자여야 합니다 (입력값: " + answer + ")"));
                    }
                }

                updateDataList.add(updateData);
            }
        }

        // 4. 검증 오류가 있으면 롤백 (예외 발생)
        if (!errors.isEmpty()) {
            throw new ValidationException(buildErrorMessage(errors), errors);
        }

        if (updateDataList.isEmpty()) {
            errors.add(createError(0, "data", "업데이트할 데이터가 없습니다"));
            throw new ValidationException(buildErrorMessage(errors), errors);
        }

        // 5. 업데이트 실행
        int updatedCount = 0;
        for (Map<String, Object> updateData : updateDataList) {
            int result = dgnssMapper.updateOmrAnswers(updateData);
            updatedCount += result;
        }

        // 6. 검사 자동 종료 — updateTcDgnssEnd 가 다음을 수행:
        //   - tb_dgnss_info.dgnss_at='N', dgnss_ed_dt=NOW() 갱신
        //   - 모든 문항 답안 작성한 학생을 자동 제출 처리 (callProcMark 로 분석점수 계산 포함)
        //   - 검사 종료/결과 공개 이벤트 발행
        // 동일 트랜잭션이므로 한 단계라도 실패하면 엑셀 업데이트까지 통째로 롤백됨.
        Map<String, Object> endParam = new HashMap<>();
        endParam.put("dgnssId", dgnssId);
        Map<String, Object> endResult = updateTcDgnssEnd(endParam, request);

        // 7. 결과 반환
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("totalRows", updateDataList.size());
        resultMap.put("updatedRows", updatedCount);
        resultMap.put("skippedRows", 0);
        resultMap.put("stSubmCnt", endResult.get("stSubmCnt"));
        resultMap.put("submStdtList", endResult.get("submStdtList"));
        resultMap.put("dgnssAt", endResult.get("dgnssAt"));
        resultMap.put("dgnssEdDt", endResult.get("dgnssEdDt"));

        return resultMap;
    }

    private void validateFileFormat(org.springframework.web.multipart.MultipartFile file, List<Map<String, Object>> errors) throws IOException {
        // 파일 존재 여부
        if (file == null || file.isEmpty()) {
            errors.add(createError(0, "file", "파일이 없습니다"));
            return;
        }

        // 파일 크기 검증 (최대 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            errors.add(createError(0, "file", "파일 크기가 너무 큽니다 (최대 10MB)"));
            return;
        }

        // 파일 확장자 검증
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".xlsx")) {
            errors.add(createError(0, "file", "엑셀 파일(.xlsx)만 업로드 가능합니다"));
            return;
        }

        // Content-Type 검증
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
            // Content-Type이 다르더라도 매직 바이트로 추가 검증
            byte[] header = new byte[4];
            try (var is = file.getInputStream()) {
                if (is.read(header) < 4) {
                    errors.add(createError(0, "file", "올바른 엑셀 파일이 아닙니다"));
                    return;
                }
            }
            // ZIP 파일 매직 바이트: PK (0x50, 0x4B)
            if (header[0] != 0x50 || header[1] != 0x4B) {
                errors.add(createError(0, "file", "올바른 엑셀 파일이 아닙니다"));
            }
        }
    }

    private void validateHeaderRow(Row headerRow, List<Map<String, Object>> errors) {
        // B열: OMR_IDX 확인
        Cell omrIdxHeader = headerRow.getCell(1);
        String omrIdxHeaderValue = getCellValueAsString(omrIdxHeader);
        if (omrIdxHeaderValue == null || !omrIdxHeaderValue.contains("OMR_IDX")) {
            errors.add(createError(1, "B1", "B1 셀이 'OMR_IDX'를 포함해야 합니다 (현재: " + omrIdxHeaderValue + ")"));
        }

        // D열~: 1~124 숫자 확인 (선택적 - 첫 몇 개만 확인)
        for (int i = 3; i < 7 && i < 127; i++) {
            Cell cell = headerRow.getCell(i);
            String value = getCellValueAsString(cell);
            int expectedNum = i - 2;
            if (value == null || !value.trim().equals(String.valueOf(expectedNum))) {
                errors.add(createError(1, getColumnLetter(i), "응답 컬럼 헤더가 올바르지 않습니다 (기대값: " + expectedNum + ", 실제값: " + value + ")"));
                break;
            }
        }
    }

    private boolean isEmptyRow(Row row) {
        for (int i = 0; i < 3; i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String value = getCellValueAsString(cell);
                if (StringUtils.isNotBlank(value)) {
                    return false;
                }
            }
        }
        return true;
    }

    private Integer getCellValueAsInteger(Cell cell) {
        if (cell == null) return null;
        try {
            switch (cell.getCellType()) {
                case NUMERIC:
                    return (int) cell.getNumericCellValue();
                case STRING:
                    String value = cell.getStringCellValue().trim();
                    return StringUtils.isBlank(value) ? null : Integer.parseInt(value);
                default:
                    return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        try {
            switch (cell.getCellType()) {
                case NUMERIC:
                    double numValue = cell.getNumericCellValue();
                    if (numValue == Math.floor(numValue)) {
                        return String.valueOf((int) numValue);
                    }
                    return String.valueOf(numValue);
                case STRING:
                    return cell.getStringCellValue();
                case BOOLEAN:
                    return String.valueOf(cell.getBooleanCellValue());
                case FORMULA:
                    try {
                        return String.valueOf((int) cell.getNumericCellValue());
                    } catch (Exception e) {
                        return cell.getStringCellValue();
                    }
                default:
                    return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    private String getColumnLetter(int columnIndex) {
        StringBuilder sb = new StringBuilder();
        while (columnIndex >= 0) {
            sb.insert(0, (char) ('A' + (columnIndex % 26)));
            columnIndex = columnIndex / 26 - 1;
        }
        return sb.toString();
    }

    private Map<String, Object> createError(int row, String column, String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("row", row);
        error.put("column", column);
        error.put("message", message);
        return error;
    }

    private String buildErrorMessage(List<Map<String, Object>> errors) {
        return "유효성 검증 실패: " + errors.size() + "건의 오류가 발견되었습니다";
    }

    // -----------------------------------------------------------------------
    // Phase 3 Map-enrich 헬퍼 — FE 호환 키(nickname/email 등) 복원
    // HasUserInfo 타입이 아닌 List<Map> 응답에서 memberSpUserId / teacherSpUserId 기준으로
    // IDP 회원정보를 채운다. (Task 15: DgnssMapper SELECT PII 정리 대응)
    // -----------------------------------------------------------------------

    /**
     * spUserId 필드로 식별되는 Map 목록을 Auth 회원정보로 enrich.
     *
     * @param items       enrich 대상 Map 목록
     * @param spUserIdKey Map 안의 sp_user_id 필드 키 이름 (예: "memberSpUserId", "teacherSpUserId")
     * @param nicknameKey Map에 채워 넣을 닉네임 응답 키 이름 (예: "nickname", "MEM_NM", "tcNm")
     * @param emailKey    Map에 채워 넣을 이메일 응답 키 이름 (null 이면 email 을 채우지 않음)
     */
    private void enrichMaps(
            List<Map<String, Object>> items,
            String spUserIdKey,
            String nicknameKey,
            String emailKey
    ) {
        if (items == null || items.isEmpty()) return;

        List<UserSlot> slots = items.stream()
                .map(m -> (String) m.get(spUserIdKey))
                .filter(Objects::nonNull)
                .distinct()
                .map(UserSlot::new)
                .toList();
        if (slots.isEmpty()) return;

        userInfoEnricher.enrich(slots);

        Map<String, UserSlot> bySpUserId = slots.stream()
                .collect(Collectors.toMap(UserSlot::getSpUserId, s -> s));
        items.forEach(m -> {
            String spUserId = (String) m.get(spUserIdKey);
            if (spUserId == null) return;
            UserSlot slot = bySpUserId.get(spUserId);
            if (slot != null) {
                m.put(nicknameKey, slot.getName());
                if (emailKey != null) m.put(emailKey, slot.getEmail());
            } else {
                m.put(nicknameKey, "(탈퇴 회원)");
                if (emailKey != null) m.put(emailKey, null);
            }
        });
    }

    /**
     * 단건 Map enrich.
     *
     * @see #enrichMaps(List, String, String, String)
     */
    private void enrichMap(
            Map<String, Object> item,
            String spUserIdKey,
            String nicknameKey,
            String emailKey
    ) {
        if (item == null) return;
        enrichMaps(List.of(item), spUserIdKey, nicknameKey, emailKey);
    }

    /**
     * selectStUserInfo 결과 Map을 enrich.
     * 학생: memberSpUserId → MEM_NM / email
     * 교사: teacherSpUserId → tcNm
     */
    private void enrichStUserInfo(Map<String, Object> stUserInfo) {
        if (stUserInfo == null) return;
        enrichMap(stUserInfo, "memberSpUserId", "MEM_NM", "email");
        enrichMap(stUserInfo, "teacherSpUserId", "tcNm", null);
    }

    /** PDF 표시 이름(MEM_NM)을 학생 입력 닉네임(tb_dgnss_result_info.nickname)으로 우선 대체. 없으면 기존 값 유지. */
    private void applyNicknameOverride(Map<String, Object> stUserInfo) {
        if (stUserInfo == null) return;
        String nickname = MapUtils.getString(stUserInfo, "nickname", "");
        if (StringUtils.isNotBlank(nickname)) {
            stUserInfo.put("MEM_NM", nickname);
        }
    }

    // -----------------------------------------------------------------------
    // Phase 4 GROUP_CONCAT enrich 헬퍼
    // getDgnssReportMem / selectTcDgnssDetailInfo 가 raw 포맷으로 반환하는
    // "sp_user_id||member_no" 엔트리를 이름(member_no) 형식으로 복원.
    // 구분자: ";;" (sp_user_id/member_no 어디에도 등장 불가한 안전 ASCII 시퀀스 — XML 1.0 호환)
    // -----------------------------------------------------------------------

    /** GROUP_CONCAT raw record separator — DgnssMapper.xml SEPARATOR ';;' 와 동일. */
    static final String GROUP_CONCAT_RS = ";;";

    /**
     * Map 안의 키에 저장된 GROUP_CONCAT raw 문자열을 "이름(member_no), ..." 형식으로 복원.
     *
     * <p>raw 포맷: "sp_user_id||member_no{RS}sp_user_id||member_no{RS}..."
     * <p>출력 포맷: "이름(member_no), 이름(member_no), ..." (FE 기존 형식 보존)
     *
     * @param row  대상 Map (in-place 수정)
     * @param key  raw 값이 저장된 Map 키 (예: "QESITM02_MEM", "notSubmStdtName")
     */
    private void enrichGroupConcatField(Map<String, Object> row, String key) {
        if (row == null) return;
        String raw = (String) row.get(key);
        if (raw == null || raw.isEmpty()) return;

        String[] entries = raw.split(java.util.regex.Pattern.quote(GROUP_CONCAT_RS), -1);

        // distinct sp_user_id 수집
        List<String> spUserIds = Arrays.stream(entries)
                .map(e -> e.split("\\|\\|", 2)[0])
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());

        Map<String, String> nameBySpUserId = new HashMap<>();
        if (!spUserIds.isEmpty()) {
            List<UserSlot> slots = spUserIds.stream().map(UserSlot::new).collect(Collectors.toList());
            userInfoEnricher.enrich(slots);
            slots.forEach(s -> nameBySpUserId.put(s.getSpUserId(),
                    s.getName() != null ? s.getName() : "(탈퇴 회원)"));
        }

        // 재조합: "이름(member_no)" 형식으로 변환
        String enriched = Arrays.stream(entries)
                .map(e -> {
                    String[] parts = e.split("\\|\\|", 2);
                    String spUserId = parts[0];
                    String memberNo = parts.length > 1 ? parts[1] : "?";
                    String name = spUserId.isEmpty()
                            ? "(탈퇴 회원)"
                            : nameBySpUserId.getOrDefault(spUserId, "(탈퇴 회원)");
                    return name + "(" + memberNo + ")";
                })
                .collect(Collectors.joining(", "));

        row.put(key, enriched);
    }

    /**
     * getDgnssReportMem 결과 목록의 GROUP_CONCAT 필드들을 enrich.
     *
     * @param rows getDgnssReportMem 결과 목록
     */
    private void enrichReportMemFields(List<Map<String, Object>> rows) {
        if (rows == null || rows.isEmpty()) return;
        for (Map<String, Object> row : rows) {
            enrichGroupConcatField(row, "QESITM02_MEM");
            enrichGroupConcatField(row, "QESITM01_MEM");
            enrichGroupConcatField(row, "REPEATED_RESPONSE_YN");
        }
    }

    // -----------------------------------------------------------------------
    // Phase 4: FN_GET_MEM_UNDER_TSCORE 함수 → Java 이동
    // 44번 함수 호출 → 1번 쿼리로 성능 개선
    // -----------------------------------------------------------------------

    /** SECTION_ID → SECTION_MEM alias 매핑 (DGNSS_10) */
    private static final Map<String, String> SECTION_MEM_ALIAS_MAP_10 = Map.ofEntries(
            Map.entry("10-22-01-01-01-0", "SECTION_MEM_01_01_01"),
            Map.entry("10-22-01-01-02-0", "SECTION_MEM_01_01_02"),
            Map.entry("10-22-01-01-03-0", "SECTION_MEM_01_01_03"),
            Map.entry("10-22-01-02-01-0", "SECTION_MEM_01_02_01"),
            Map.entry("10-22-01-02-02-0", "SECTION_MEM_01_02_02"),
            Map.entry("10-22-01-02-03-0", "SECTION_MEM_01_02_03"),
            Map.entry("10-22-01-02-04-0", "SECTION_MEM_01_02_04"),
            Map.entry("10-22-02-01-01-0", "SECTION_MEM_02_01_01"),
            Map.entry("10-22-02-01-02-0", "SECTION_MEM_02_01_02"),
            Map.entry("10-22-02-01-03-0", "SECTION_MEM_02_01_03"),
            Map.entry("10-22-02-02-01-0", "SECTION_MEM_02_02_01"),
            Map.entry("10-22-02-02-02-0", "SECTION_MEM_02_02_02"),
            Map.entry("10-22-02-02-03-0", "SECTION_MEM_02_02_03"),
            Map.entry("10-22-02-02-04-0", "SECTION_MEM_02_02_04"),
            Map.entry("10-22-02-02-05-0", "SECTION_MEM_02_02_05"),
            Map.entry("10-22-02-03-01-0", "SECTION_MEM_02_03_01"),
            Map.entry("10-22-02-03-02-0", "SECTION_MEM_02_03_02"),
            Map.entry("10-22-02-03-03-0", "SECTION_MEM_02_03_03"),
            Map.entry("10-22-02-03-04-0", "SECTION_MEM_02_03_04"),
            Map.entry("10-22-03-01-01-0", "SECTION_MEM_03_01_01"),
            Map.entry("10-22-03-01-02-0", "SECTION_MEM_03_01_02"),
            Map.entry("10-22-03-01-03-0", "SECTION_MEM_03_01_03"),
            Map.entry("10-22-03-02-01-0", "SECTION_MEM_03_02_01"),
            Map.entry("10-22-03-02-02-0", "SECTION_MEM_03_02_02"),
            Map.entry("10-22-03-02-03-0", "SECTION_MEM_03_02_03"),
            Map.entry("10-22-03-02-04-0", "SECTION_MEM_03_02_04"),
            Map.entry("10-22-03-02-05-0", "SECTION_MEM_03_02_05"),
            Map.entry("10-22-03-03-01-0", "SECTION_MEM_03_03_01"),
            Map.entry("10-22-03-03-02-0", "SECTION_MEM_03_03_02"),
            Map.entry("10-22-04-01-01-0", "SECTION_MEM_04_01_01"),
            Map.entry("10-22-04-01-02-0", "SECTION_MEM_04_01_02"),
            Map.entry("10-22-04-01-03-0", "SECTION_MEM_04_01_03"),
            Map.entry("10-22-04-02-01-0", "SECTION_MEM_04_02_01"),
            Map.entry("10-22-04-02-02-0", "SECTION_MEM_04_02_02"),
            Map.entry("10-22-04-02-03-0", "SECTION_MEM_04_02_03"),
            Map.entry("10-22-05-01-01-0", "SECTION_MEM_05_01_01"),
            Map.entry("10-22-05-01-02-0", "SECTION_MEM_05_01_02"),
            Map.entry("10-22-05-01-03-0", "SECTION_MEM_05_01_03")
    );

    /** SECTION_ID → SECTION_MEM alias 매핑 (DGNSS_20) */
    private static final Map<String, String> SECTION_MEM_ALIAS_MAP_20 = Map.of(
            "20-22-01-01-0-0", "SECTION_MEM_01_01",
            "20-22-01-02-0-0", "SECTION_MEM_01_02",
            "20-22-02-01-0-0", "SECTION_MEM_02_01",
            "20-22-02-02-0-0", "SECTION_MEM_02_02",
            "20-22-03-01-0-0", "SECTION_MEM_03_01",
            "20-22-03-02-0-0", "SECTION_MEM_03_02"
    );

    /**
     * selectMembersByTScoreThreshold 결과를 SECTION_MEM 필드 Map으로 변환.
     * FN_GET_MEM_UNDER_TSCORE 함수 대체.
     *
     * @param rawList 쿼리 결과 (sectionId, memberKey, memberNo)
     * @param dgnssId DGNSS_10 또는 DGNSS_20
     * @return SECTION_MEM_* 필드를 담은 Map (sp_user_id||member_no;; 형식)
     */
    private Map<String, String> buildSectionMemMap(List<Map<String, Object>> rawList, String dgnssId) {
        Map<String, String> aliasMap = "DGNSS_10".equals(dgnssId)
                ? SECTION_MEM_ALIAS_MAP_10
                : SECTION_MEM_ALIAS_MAP_20;

        // SECTION_ID 별로 memberKey 그룹핑
        Map<String, List<String>> grouped = new LinkedHashMap<>();
        for (Map<String, Object> row : rawList) {
            String sectionId = (String) row.get("sectionId");
            String memberKey = (String) row.get("memberKey");

            String alias = aliasMap.get(sectionId);
            if (alias != null && memberKey != null) {
                grouped.computeIfAbsent(alias, k -> new ArrayList<>()).add(memberKey);
            }
        }

        // GROUP_CONCAT 형식으로 변환
        Map<String, String> result = new HashMap<>();
        for (String alias : aliasMap.values()) {
            List<String> members = grouped.get(alias);
            String value = (members == null || members.isEmpty())
                    ? ""
                    : String.join(GROUP_CONCAT_RS, members);
            result.put(alias, value);
        }

        return result;
    }

    /**
     * SECTION_MEM 필드들을 enrich하여 "이름(번호)" 형식으로 변환.
     *
     * @param targetRow    결과를 넣을 Map
     * @param sectionMemMap buildSectionMemMap 결과
     */
    private void enrichSectionMemFields(Map<String, Object> targetRow, Map<String, String> sectionMemMap) {
        if (sectionMemMap == null || sectionMemMap.isEmpty()) return;

        // 먼저 raw 값을 targetRow에 넣고
        for (Map.Entry<String, String> entry : sectionMemMap.entrySet()) {
            targetRow.put(entry.getKey(), entry.getValue());
        }

        // enrichGroupConcatField로 이름 복원
        for (String alias : sectionMemMap.keySet()) {
            enrichGroupConcatField(targetRow, alias);
        }
    }
}
