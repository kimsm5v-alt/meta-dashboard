package com.vs.meta.api.dgnss.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vs.meta.common.exception.IllegalStateException;
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
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toCollection;

@Service
@RequiredArgsConstructor
@Slf4j
public class DgnssService {
    private static final String LPA_TYPES_RESOURCE_PATH = "data/lpa-types.json";

    private final ObjectMapper mapper;
    private final DgnssMapper dgnssMapper;
    private final DgnssLpaService dgnssLpaService;
    private final PdfService pdfService;
    private final FileService fileService;
    private final NcpMailSender ncpMailSender;
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

    public Map<String, Object> insertTcDgnssStart(Map<String, Object> paramMap) {
        int result = 0;
        int paperIdx = MapUtils.getInteger(paramMap, "paperIdx", 0);
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

        List<String> targetStList = dgnssMapper.selectTargetStList(paramMap);
        Map<String, Object> targetMap = new HashMap<>();
        targetMap.put("dgnssId", MapUtils.getInteger(paramMap, "id", 0));
        targetMap.put("claId", claId);
        targetMap.put("ordNo", MapUtils.getInteger(paramMap, "ordNo", 0));
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

        return dgnssInfoMap;
    }

    public Map<String, Object> updateTcDgnssEnd(Map<String, Object> paramMap, HttpServletRequest request) throws Exception {
        dgnssMapper.updateDgnssInfo(paramMap);
        Map<String, Object> dgnssInfoMap = dgnssMapper.selectTcDgnssInfoOneWithDgnssId(paramMap);
        if (dgnssInfoMap == null) {
            throw new IllegalStateException("진단 정보를 찾을 수 없습니다.");
        }
        String paperIdx = MapUtils.getString(dgnssInfoMap, "paperIdx", "");
        paramMap.put("paperIdx", paperIdx);
        // 강사가 강제로 종료한 경우 학생들 응시 이력 탐색을 해서 모든 문제를 푼 학생은 제출이 되어야 한다
        List<LinkedHashMap<String, Object>> stOmrList = dgnssMapper.selectStOmrInfo(paramMap);
        List<Integer> dgnssResultIdList = new ArrayList<>();
        Map<Integer, Boolean> sameAnswerMap = new HashMap<>();
        for (LinkedHashMap<String, Object> map : stOmrList) {
            if (map.values().stream().noneMatch(Objects::isNull)) {
                int dgnssResultId = MapUtils.getInteger(map, "dgnssResultId", 0);
                // 동일 응답한 문항이 10개 이상인지 체크하는 로직
                LinkedHashMap<String, Object> answersOnly = new LinkedHashMap<>(map);
                answersOnly.remove("dgnssResultId");
                boolean sameAnswerCheck = answerCheck(answersOnly.values(), 10);

                dgnssResultIdList.add(dgnssResultId);
                sameAnswerMap.put(dgnssResultId, sameAnswerCheck);
            }
        }
        // 제출 처리(프로시저 실행)
        if (CollectionUtils.isNotEmpty(dgnssResultIdList)) {
            for (int dgnssResultId : dgnssResultIdList) {
                stSubmit(dgnssResultId, paperIdx, MapUtils.getBoolean(sameAnswerMap, dgnssResultId, false), request);
            }
        }
        List<String> submStdtIdList = dgnssMapper.selectSubmitStList(paramMap);
        dgnssInfoMap.put("submStdtList", submStdtIdList);
        dgnssInfoMap.put("stSubmCnt", dgnssResultIdList.size());
        return dgnssInfoMap;
    }

    public void deleteTcDgnssCancel(Map<String, Object> param) {
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
            if (StringUtils.equals(grade, "el")) {
                targetMap.put("schGrade", "CMM13001");
            } else if (StringUtils.equals(grade, "mi")) {
                targetMap.put("schGrade", "CMM13002");
            } else if (StringUtils.equals(grade, "hi")) {
                targetMap.put("schGrade", "CMM13003");
            }


            for (String stdtId : targetStList) {
                targetMap.put("stdtId", stdtId);
                dgnssMapper.insertDgnssOmr(targetMap);
                dgnssMapper.insertDgnssResult(targetMap);
                dgnssMapper.insertDgnssAnswer(targetMap);
            }
        }
        // 상태값 및 PDF 초기화
        dgnssMapper.updateDgnssStatus(param);
        resultMap.put("result", "ok");
        return resultMap;
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

    public void stSubmit(int dgnssResultId, String paperType, boolean sameAnswerCheck, HttpServletRequest request) {
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
    }

    public Map<String, Object> pdfDownload(Map<String, Object> paramData, HttpServletRequest request) throws Exception {
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
            Map<String, Object> tcUserInfo = dgnssMapper.selectTcUserInfo(paramData);
            if (StringUtils.isNotEmpty(MapUtils.getString(tcUserInfo, "fileUrl", ""))) {
                result.put("url", MapUtils.getString(tcUserInfo, "fileUrl", ""));
                return result;
            }

            url = makeTcPdf(paramData, tcUserInfo, fileName, request);
        } else if (StringUtils.equals(userType, "S")) {
            // 학생용 PDF 생성 및 존재하는 데이터일 경우 주소 리턴
            Map<String, Object> stUserInfo = dgnssMapper.selectStUserInfo(paramData);
            String fileUrl = MapUtils.getString(stUserInfo, "fileURL", "");

            if (StringUtils.isNotEmpty(fileUrl)) {
                result.put("url", fileUrl);
                return result;
            }

            url = makeStPdf(paramData, stUserInfo, fileName, request);

            log.info("------file complete : {}", url);
        }
        if (StringUtils.isNotEmpty(url)) {
            result.put("url", url);
        } else {
            result.put("url", "");
            result.put("error", "fail");
        }

        return result;
    }

    public String makeTcPdf(Map<String, Object> paramData,
                            Map<String, Object> tcUserInfo,
                            String fileName,
                            HttpServletRequest request) throws Exception {

        Map<String, Object> dgnssData = new HashMap<String, Object>();
        Map<String, Object> param  = new HashMap<String, Object>();

        // dgnssId로 써야하지만 변경해야하는 요소가 많아 dgnssId = TEST_IDX로 진행
        int nowOrd = MapUtils.getInteger(tcUserInfo, "TEST_ORD", 0);

        param.put("TEST_IDX", MapUtils.getString(tcUserInfo, "TEST_IDX"));
        param.put("TEST_ORD", nowOrd);
        param.put("DGNSS_ID", MapUtils.getString(tcUserInfo, "DGNSS_ID"));
        param.put("claId", MapUtils.getString(tcUserInfo, "claId"));

        // 학습환경
        List<Map<String, Object>> dgnssReportLS = dgnssMapper.getDgnssReportLS(param);
        List<Map<String, Object>> dgnssReportSection = dgnssMapper.getDgnssReportSection(param);
        List<Map<String, Object>> dgnssReportValidity = dgnssMapper.getDgnssReportValidity(param);

        List<Map<String, Object>> dgnssReportMem = dgnssMapper.getDgnssReportMem(param);
        // 첫번째 검사를 본 id 추출
        param.put("FIRST_IDX", dgnssMapper.getDgnssFirstTest(param));

        // 종합분석 집계
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

        String url = pdfService.createDgnssReportCoch(new File(fileName), dgnssData, request);
        Map<String, Object> updateMap = new HashMap<>();
        updateMap.put("fileUrl", url);
        updateMap.put("dgnssId", MapUtils.getString(param, "TEST_IDX", ""));
        dgnssMapper.updateFileUrlTch(updateMap);

        return url;
    }


    public String makeStPdf(Map<String, Object> paramData,
                            Map<String, Object> stUserInfo,
                            String fileName,
                            HttpServletRequest request) throws Exception {
        Map<String, Object> param = new HashMap<>();
        Map<String, Object> dgnssData = new HashMap<>();
        param.put("ANSWER_IDX", MapUtils.getInteger(paramData, "answerIdx", 0));

        param.put("DEPTH", 3);
        dgnssData.put("dgnssReport3", dgnssMapper.getDgnssReport(param));

        param.put("DEPTH", 4);
        dgnssData.put("dgnssReport4", dgnssMapper.getDgnssReport(param));

        param.put("DEPTH", 5);
        dgnssData.put("dgnssReport5", dgnssMapper.getDgnssReport(param));
        dgnssData.put("dgnssReportStudy", dgnssMapper.getDgnssReportStudy(param));
        dgnssData.put("userInfo", stUserInfo);

        String url = pdfService.createDgnssAnalysisByTemplate(new File(fileName), dgnssData, request);

        Map<String, Object> updateMap = new HashMap<>();
        updateMap.put("fileUrl", url);
        updateMap.put("dgnssResultId", MapUtils.getString(stUserInfo, "dgnssResultId", ""));
        dgnssMapper.updateFileUrl(updateMap);

        return url;
    }

    public Map<String, Object> selectNewOmr(Map<String, Object> param, Pageable pageable) {
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

             stSubmit(MapUtils.getInteger(param, "dgnssResultId", 0), paperType, sameAnswerCheck, request);
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
            resultMap.put("stInfoList", stInfoList);
            resultMap.put("type", type);
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
            resultMap.put("stInfoList", stInfoList);
            resultMap.put("type", type);
        }

        enrichLpaTop3(stInfoList);
        moveSectionScoresToScoresMap(stInfoList);
        return resultMap;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> selectTcDgnssDetailInfo(Map<String, Object> param) {
        Map<String, Object> result = dgnssMapper.selectTcDgnssDetailInfo(param);
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
    public Map<String, Object> selectStAnalysis(Map<String, Object> param) throws JsonProcessingException {
        return selectUnifiedStAnalysis(param);
    }

    private Map<String, List<Map<String, Object>>> splitStudentAnalysisByOrd(List<Map<String, Object>> stInfoList, String ordNo) {
        List<Map<String, Object>> ord1List = new ArrayList<>();
        List<Map<String, Object>> ord2List = new ArrayList<>();

        for (Map<String, Object> map : stInfoList) {
            int ordNoInt = MapUtils.getInteger(map, "ord_no", 0);
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
        boolean hasDgnssResultId = StringUtils.isNotEmpty(dgnssResultId);

        if (hasDgnssResultId) {
            stInfoParam.put("dgnssResultId", dgnssResultId);
        } else {
            String claId = MapUtils.getString(param, "claId", "");
            if (StringUtils.isBlank(claId)) {
                return new HashMap<>();
            }
            stInfoParam.put("stdtId", MapUtils.getString(param, "stdtId", ""));
            stInfoParam.put("paperIdx", MapUtils.getString(param, "paperIdx", "2"));
            stInfoParam.put("ordNo", MapUtils.getString(param, "ordNo", "1"));
            stInfoParam.put("claId", claId);
        }

        Map<String, Object> stUserInfo = dgnssMapper.selectStInfo(stInfoParam);
        if (stUserInfo == null) {
            return new HashMap<>();
        }

        String resolvedPaperIdx = MapUtils.getString(stUserInfo, "paperIdx",
                MapUtils.getString(param, "paperIdx", "2"));
        String stdtId = MapUtils.getString(stUserInfo, "stdtId", "");
        String resolvedOrdNo = MapUtils.getString(stUserInfo, "ordNo",
                MapUtils.getString(param, "ordNo", ""));

        if (StringUtils.isAnyEmpty(resolvedPaperIdx, stdtId)) {
            return new HashMap<>();
        }

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
        }
        enrichLpaTop3(stAnalysisList);
        Map<String, Map<String, Object>> lpaTopByOrd = extractLpaTopByOrd(stAnalysisList);
        removeLpaTopFromRows(stAnalysisList);

        Map<String, Object> resultMap = new LinkedHashMap<>();
        resultMap.put("stUserInfo", stUserInfo);
        resultMap.put("lpaTop", lpaTopByOrd);
        resultMap.putAll(splitStudentAnalysisByOrd(
                stAnalysisList,
                hasDgnssResultId ? resolvedOrdNo : MapUtils.getString(param, "ordNo", "")
        ));
        return resultMap;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> selectTcDgnssNotSubmStList(Map<String, Object> param) {
        List<Map<String, Object>> resultList = dgnssMapper.selectTcDgnssNotSubmStList(param);
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
    public Map<String, Object> selectTcAnalysis(Map<String, Object> param) throws JsonProcessingException {
        Map<String, Object> resultMap = new HashMap<>();
        if (StringUtils.isEmpty(MapUtils.getString(param, "paperIdx", ""))) {
            param.put("paperIdx", "2");
        }
        String paperIdx = MapUtils.getString(param, "paperIdx", "2");

        // 조회하고자 하는 회차
        String ordNo = MapUtils.getString(param, "ordNo", "");

        // META자기조절학습검사
        if (StringUtils.equals(paperIdx, "2")) {
            List<Integer> allDgnssIdList = dgnssMapper.selectDgnssIdxList(param);
            List<Integer> targetDgnssIdList = new ArrayList<>();
            List<String> sessionList = putSession(0);
            Map<String, String> sessionCodeMap = putSessionMap(0);
            if (StringUtils.isEmpty(ordNo)) {
                if (allDgnssIdList.size() < 3 ) {
                    targetDgnssIdList = allDgnssIdList;
                } else if (allDgnssIdList.size() == 3) {
                    targetDgnssIdList.add(allDgnssIdList.get(0));
                    targetDgnssIdList.add(allDgnssIdList.get(2));
                }
            } else {
                if (StringUtils.equals(ordNo, "1")) {
                    targetDgnssIdList.add(allDgnssIdList.get(0));
                } else {
                    targetDgnssIdList.add(allDgnssIdList.get(0));
                    targetDgnssIdList.add(allDgnssIdList.get(1));
                }
            }

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
                    resultMap.put(Integer.toString(nowOrd), resultAvgMap);
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

        return resultMap;
    }



    public ResponseEntity<StreamingResponseBody> dgnssDownloadAll(String jwtToken, HttpServletRequest request, boolean isAuth, Map<String, Object> param) throws Exception {
        return fileService.dgnssDownloadAll(jwtToken, request, isAuth, param);
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

    public Map<String, Object> summaryPdfUpload(Map<String, Object> paramData, HttpServletRequest request) throws Exception {
        Map<String, Object> result = new HashMap<>();

        LocalDateTime currentTime = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String formattedTime = currentTime.format(formatter);

        Map<String, Object> dgnssAnswer = dgnssMapper.selectStUserInfo(paramData);
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
            lpaTop.put("lpaClassId", row.get("lpaClassId"));
            lpaTop.put("lpaTypeName", row.get("lpaTypeName"));
            lpaTop.put("lpaConfidence", row.get("lpaConfidence"));
            lpaTop.put("lpaStatus", row.get("lpaStatus"));
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




}
