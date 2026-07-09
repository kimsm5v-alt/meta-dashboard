package com.vs.meta.admin.controller;

import com.vs.meta.admin.mapper.TrialMonitorMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 체험단(교사 18명) 모니터링 — 임시 admin 페이지.
 * 이름 기준으로 집계한다(한 교사가 계정을 여러 개 만든 케이스가 있어, 이름으로 묶어 모든 계정/그룹/검사를 통합).
 */
@Slf4j
@Controller
@RequestMapping("/admin/trial")
@RequiredArgsConstructor
public class TrialMonitorController {

    /** 체험단 교사 18명 (이름 기준). 임시 기능이라 상수로 둠 — 상시화되면 config/DB로 이관. */
    private static final List<String> TEACHER_NAMES = List.of(
            "이상희", "김소현", "유상은", "이화수", "류은수", "장소정", "정혜윤", "김재희", "김민지",
            "이소현", "이선경", "유지선", "이정현", "신동선", "이소연", "강서영", "이선화", "전서영"
    );
    /** 가입일 하한 (platform_user.created_at 기준). */
    private static final String SIGNUP_FROM = "2026-07-01 00:00:00";

    private final TrialMonitorMapper trialMonitorMapper;

    @GetMapping
    public String dashboard(Model model) {
        List<Map<String, Object>> accounts =
                trialMonitorMapper.selectTrialTeacherAccounts(TEACHER_NAMES, SIGNUP_FROM);

        // 이름 기준 집계 — 명단 순서 유지, 미매칭 이름도 '미가입'으로 노출
        Map<String, Map<String, Object>> byName = new LinkedHashMap<>();
        for (String name : TEACHER_NAMES) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", name);
            row.put("accountCount", 0);
            row.put("registeredCount", 0);
            row.put("registered", false);
            row.put("userNos", new ArrayList<Long>());
            byName.put(name, row);
        }
        for (Map<String, Object> acc : accounts) {
            Map<String, Object> row = byName.get((String) acc.get("name"));
            if (row == null) {
                continue; // 명단 밖(동명이인 등) 방어
            }
            row.put("accountCount", (int) row.get("accountCount") + 1);
            Object userNoObj = acc.get("userNo");
            if (userNoObj != null) {
                row.put("registeredCount", (int) row.get("registeredCount") + 1);
                row.put("registered", true);
                @SuppressWarnings("unchecked")
                List<Long> userNos = (List<Long>) row.get("userNos");
                userNos.add(((Number) userNoObj).longValue());
            }
        }

        List<Map<String, Object>> summary = new ArrayList<>(byName.values());
        long registeredTeachers = summary.stream().filter(r -> (boolean) r.get("registered")).count();

        // 코호트 교사들의 user_no 전체 + user_no → 이름 역매핑 (②③④ 결과를 이름으로 라벨링)
        List<Long> allUserNos = new ArrayList<>();
        Map<Long, String> userNoToName = new HashMap<>();
        for (Map<String, Object> row : summary) {
            @SuppressWarnings("unchecked")
            List<Long> userNos = (List<Long>) row.get("userNos");
            for (Long uno : userNos) {
                allUserNos.add(uno);
                userNoToName.put(uno, (String) row.get("name"));
            }
        }

        List<Map<String, Object>> groups = new ArrayList<>();
        List<Map<String, Object>> examProgress = new ArrayList<>();
        List<Map<String, Object>> integrity = new ArrayList<>();
        List<Map<String, Object>> lpaTypeDist = new ArrayList<>();
        if (!allUserNos.isEmpty()) {
            groups = trialMonitorMapper.selectGroupsByHostUserNos(allUserNos);
            examProgress = trialMonitorMapper.selectExamProgressByHostUserNos(allUserNos);
            integrity = trialMonitorMapper.selectIntegrityByHostUserNos(allUserNos);
            lpaTypeDist = trialMonitorMapper.selectLpaTypeDistribution(allUserNos);
            labelTeacher(groups, userNoToName);
            labelTeacher(examProgress, userNoToName);
            labelTeacher(integrity, userNoToName);
        }

        // 검사 진행 행별 제출률·PDF 생성 수 계산.
        // (PDF/요약PDF 는 다운로드 클릭 시 lazy 생성 → "미생성"은 정상이며 오류가 아님. 정보성으로만 표시)
        for (Map<String, Object> e : examProgress) {
            long total = num(e.get("totalCount"));
            long submitted = num(e.get("submittedCount"));
            e.put("submitRate", total > 0 ? Math.round(submitted * 100.0 / total) : 0);
            e.put("pdfGenerated", submitted - num(e.get("pdfMissingCount")));       // 실제 생성(다운로드)된 수
            e.put("summaryGenerated", submitted - num(e.get("summaryMissingCount")));
        }
        // 정합성 이상 = 요인 미달 또는 LPA 누락 (PDF 미생성은 정상이라 제외)
        for (Map<String, Object> i : integrity) {
            i.put("hasAnomaly", num(i.get("factorIncompleteCount")) > 0 || num(i.get("lpaMissingCount")) > 0);
        }

        // 상단 KPI 요약
        long totalStudents = sumLong(groups, "studentCount");
        long examTotal = sumLong(examProgress, "totalCount");
        long examSubmitted = sumLong(examProgress, "submittedCount");
        long submitRatePct = examTotal > 0 ? Math.round(examSubmitted * 100.0 / examTotal) : 0;
        long anomalyLpaMissing = sumLong(integrity, "lpaMissingCount");
        long anomalyFactor = sumLong(integrity, "factorIncompleteCount");
        long reliabilityWarn = sumLong(integrity, "reliabilityWarnCount");

        model.addAttribute("summary", summary);
        model.addAttribute("totalTeachers", TEACHER_NAMES.size());
        model.addAttribute("registeredTeachers", registeredTeachers);
        model.addAttribute("signupFrom", SIGNUP_FROM);
        model.addAttribute("groups", groups);
        model.addAttribute("examProgress", examProgress);
        model.addAttribute("integrity", integrity);
        model.addAttribute("lpaTypeDist", lpaTypeDist);
        // KPI
        model.addAttribute("totalGroups", groups.size());
        model.addAttribute("totalStudents", totalStudents);
        model.addAttribute("examTotal", examTotal);
        model.addAttribute("examSubmitted", examSubmitted);
        model.addAttribute("submitRatePct", submitRatePct);
        model.addAttribute("anomalyLpaMissing", anomalyLpaMissing);
        model.addAttribute("anomalyFactor", anomalyFactor);
        model.addAttribute("anomalyTotal", anomalyLpaMissing + anomalyFactor);
        model.addAttribute("reliabilityWarn", reliabilityWarn);
        return "admin/trial-monitor";
    }

    /** Map 값(SUM/COUNT 결과 Number)을 long 으로 안전 변환. */
    private long num(Object v) {
        return v instanceof Number n ? n.longValue() : 0L;
    }

    /** rows 전체에서 key 필드 합계. */
    private long sumLong(List<Map<String, Object>> rows, String key) {
        long sum = 0L;
        for (Map<String, Object> r : rows) {
            sum += num(r.get(key));
        }
        return sum;
    }

    /** 각 행의 hostUserNo 를 교사 이름(teacherName)으로 라벨링. */
    private void labelTeacher(List<Map<String, Object>> rows, Map<Long, String> userNoToName) {
        for (Map<String, Object> row : rows) {
            Object hostObj = row.get("hostUserNo");
            Long hostUserNo = hostObj == null ? null : ((Number) hostObj).longValue();
            row.put("teacherName", userNoToName.getOrDefault(hostUserNo, "(알수없음)"));
        }
    }
}
