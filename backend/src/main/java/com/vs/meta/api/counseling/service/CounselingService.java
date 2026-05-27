package com.vs.meta.api.counseling.service;

import com.vs.meta.api.counseling.mapper.CounselingInfoMapper;
import com.vs.meta.api.counseling.mapper.CounselingStudentMapper;
import com.vs.meta.domain.CounselingInfo;
import com.vs.meta.domain.CounselingStudent;
import com.vs.meta.domain.enums.CounselingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CounselingService {

    private final CounselingInfoMapper counselingMapper;
    private final CounselingStudentMapper studentMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final DateTimeFormatter SCHEDULED_AT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Transactional(readOnly = true)
    public Object getAll(Map<String, Object> paramData) throws Exception {
        String tcId = requireTcId(paramData);
        List<CounselingInfo> list = counselingMapper.findByTcIdOrderByScheduledAtDesc(tcId);
        loadStudents(list);
        return list.stream().map(this::toResponseMap).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Object getByStudentId(String studentId, Map<String, Object> paramData) throws Exception {
        String tcId = requireTcId(paramData);
        List<Long> counselingIds = studentMapper.findCounselingIdsByStdtId(studentId);
        if (counselingIds.isEmpty()) return List.of();

        List<CounselingInfo> list = counselingMapper.findCounselingsByIds(counselingIds, tcId);
        list.sort((a, b) -> b.getScheduledAt().compareTo(a.getScheduledAt()));
        loadStudents(list);
        return list.stream().map(this::toResponseMap).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Object getByClassId(String classId, Map<String, Object> paramData) throws Exception {
        String tcId = requireTcId(paramData);
        List<CounselingInfo> list = counselingMapper.findByClaIdOrderByScheduledAtDesc(classId, tcId);
        loadStudents(list);
        return list.stream().map(this::toResponseMap).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Object getByStatus(String statusStr, Map<String, Object> paramData) throws Exception {
        String tcId = requireTcId(paramData);
        CounselingStatus status = parseStatus(statusStr);
        List<CounselingInfo> list = counselingMapper.findByStatusOrderByScheduledAtDesc(status.name(), tcId);
        loadStudents(list);
        return list.stream().map(this::toResponseMap).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Object getById(Long id, Map<String, Object> paramData) throws Exception {
        String tcId = requireTcId(paramData);
        CounselingInfo info = counselingMapper.findCounselingById(id);
        if (info == null) {
            throw new IllegalArgumentException("상담 기록을 찾을 수 없습니다: id=" + id);
        }
        // 본인이 작성한 상담만 조회 가능 (다른 교사의 상담 노출 차단)
        if (!tcId.equals(info.getTcId())) {
            throw new IllegalStateException("상담 조회 권한이 없습니다.");
        }
        List<CounselingStudent> students = studentMapper.findByCounselingId(id);
        info.setStudents(students);
        return toResponseMap(info);
    }

    @Transactional
    public Object create(Map<String, Object> paramData) throws Exception {
        String classId = requireString(paramData, "classId");
        String tcId = requireString(paramData, "tcId");
        String scheduledAtStr = requireString(paramData, "scheduledAt");
        String types = toJsonArray(paramData.get("types"));
        String areas = toJsonArray(paramData.get("areas"));
        String methods = toJsonArray(paramData.get("methods"));

        if (types == null || types.equals("[]")) throw new IllegalArgumentException("types는 필수입니다.");
        if (areas == null || areas.equals("[]")) throw new IllegalArgumentException("areas는 필수입니다.");
        if (methods == null || methods.equals("[]")) throw new IllegalArgumentException("methods는 필수입니다.");

        String statusStr = (String) paramData.get("status");
        CounselingStatus status = (statusStr != null && !statusStr.isBlank())
                ? parseStatus(statusStr) : CounselingStatus.scheduled;

        Integer duration = paramData.get("duration") != null
                ? Integer.valueOf(paramData.get("duration").toString()) : null;

        Long userNo = toLong(paramData.get("userNo"));
        Long actor = (userNo != null) ? userNo : 0L;

        CounselingInfo info = CounselingInfo.builder()
                .claId(classId)
                .tcId(tcId)
                .scheduledAt(LocalDateTime.parse(scheduledAtStr, SCHEDULED_AT_FMT))
                .duration(duration)
                .types(types)
                .areas(areas)
                .methods(methods)
                .status(status)
                .reason((String) paramData.get("reason"))
                .summary((String) paramData.get("summary"))
                .nextSteps((String) paramData.get("nextSteps"))
                .createdBy(actor)
                .updatedBy(actor)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        counselingMapper.insertCounseling(info);

        List<CounselingStudent> students = parseStudents(paramData);
        if (students.isEmpty()) {
            throw new IllegalArgumentException("students는 필수입니다. 최소 1명의 학생을 포함해야 합니다.");
        }
        students.forEach(s -> s.setCounselingId(info.getId()));
        studentMapper.insertCounselingStudents(students);
        info.setStudents(students);

        log.info("상담 생성: id={}, classId={}, tcId={}", info.getId(), classId, tcId);

        return toResponseMap(info);
    }

    @Transactional
    public Object update(Long id, Map<String, Object> paramData) throws Exception {
        CounselingInfo info = counselingMapper.findCounselingById(id);
        if (info == null) {
            throw new IllegalArgumentException("상담 기록을 찾을 수 없습니다: id=" + id);
        }

        String authTcId = (String) paramData.get("tcId");
        if (authTcId == null || !authTcId.equals(info.getTcId())) {
            throw new IllegalStateException("상담 수정 권한이 없습니다. 본인이 작성한 상담만 수정할 수 있습니다.");
        }

        String scheduledAtStr = (String) paramData.get("scheduledAt");
        LocalDateTime scheduledAt = (scheduledAtStr != null && !scheduledAtStr.isBlank())
                ? LocalDateTime.parse(scheduledAtStr, SCHEDULED_AT_FMT) : null;

        Integer duration = paramData.get("duration") != null
                ? Integer.valueOf(paramData.get("duration").toString()) : null;

        String types = paramData.containsKey("types") ? toJsonArray(paramData.get("types")) : null;
        String areas = paramData.containsKey("areas") ? toJsonArray(paramData.get("areas")) : null;
        String methods = paramData.containsKey("methods") ? toJsonArray(paramData.get("methods")) : null;

        String statusStr = (String) paramData.get("status");
        CounselingStatus status = (statusStr != null && !statusStr.isBlank()) ? parseStatus(statusStr) : null;

        Long userNo = toLong(paramData.get("userNo"));
        info.setUpdatedBy(userNo != null ? userNo : 0L);
        info.updateCounseling(scheduledAt, duration, types, areas, methods, status,
                (String) paramData.get("reason"), (String) paramData.get("summary"),
                (String) paramData.get("nextSteps"));
        counselingMapper.updateCounseling(info);

        if (paramData.containsKey("students")) {
            studentMapper.deactivateByCounselingId(id);
            List<CounselingStudent> newStudents = parseStudents(paramData);
            if (!newStudents.isEmpty()) {
                newStudents.forEach(s -> s.setCounselingId(id));
                studentMapper.insertCounselingStudents(newStudents);
            }
            info.setStudents(newStudents);
        } else {
            info.setStudents(studentMapper.findByCounselingId(id));
        }

        log.info("상담 수정: id={}", id);
        return toResponseMap(info);
    }

    @Transactional
    public Object complete(Long id, Map<String, Object> paramData) throws Exception {
        CounselingInfo info = counselingMapper.findCounselingById(id);
        if (info == null) {
            throw new IllegalArgumentException("상담 기록을 찾을 수 없습니다: id=" + id);
        }

        String authTcId = (String) paramData.get("tcId");
        if (authTcId == null || !authTcId.equals(info.getTcId())) {
            throw new IllegalStateException("상담 완료 권한이 없습니다. 본인이 작성한 상담만 완료할 수 있습니다.");
        }

        Integer duration = paramData.get("duration") != null
                ? Integer.valueOf(paramData.get("duration").toString()) : null;
        String summary = (String) paramData.get("summary");
        String nextSteps = (String) paramData.get("nextSteps");

        if (duration == null) throw new IllegalArgumentException("duration은 필수입니다.");
        if (summary == null || summary.isBlank()) throw new IllegalArgumentException("summary는 필수입니다.");

        Long userNo = toLong(paramData.get("userNo"));
        info.setUpdatedBy(userNo != null ? userNo : 0L);
        info.complete(duration, summary, nextSteps);
        counselingMapper.updateCounseling(info);
        info.setStudents(studentMapper.findByCounselingId(id));
        log.info("상담 완료: id={}", id);

        return toResponseMap(info);
    }

    @Transactional
    public Object cancel(Long id, String authTcId, Long userNo) throws Exception {
        CounselingInfo info = counselingMapper.findCounselingById(id);
        if (info == null) {
            throw new IllegalArgumentException("상담 기록을 찾을 수 없습니다: id=" + id);
        }

        if (authTcId == null || !authTcId.equals(info.getTcId())) {
            throw new IllegalStateException("상담 취소 권한이 없습니다. 본인이 작성한 상담만 취소할 수 있습니다.");
        }

        info.setUpdatedBy(userNo != null ? userNo : 0L);
        info.cancel();
        counselingMapper.updateCounseling(info);
        info.setStudents(studentMapper.findByCounselingId(id));
        log.info("상담 취소: id={}", id);

        return toResponseMap(info);
    }

    @Transactional
    public Object delete(Long id, String authTcId, Long userNo) throws Exception {
        CounselingInfo info = counselingMapper.findCounselingById(id);
        if (info == null) {
            throw new IllegalArgumentException("상담 기록을 찾을 수 없습니다: id=" + id);
        }

        if (authTcId == null || !authTcId.equals(info.getTcId())) {
            throw new IllegalStateException("상담 삭제 권한이 없습니다. 본인이 작성한 상담만 삭제할 수 있습니다.");
        }

        Long actor = (userNo != null) ? userNo : 0L;
        studentMapper.deactivateByCounselingId(id);
        counselingMapper.deactivateCounselingById(id, actor);
        log.info("상담 삭제(비활성화): id={}", id);

        return Map.of("deleted", true, "id", id);
    }

    // ========== Private Helpers ==========

    private void loadStudents(List<CounselingInfo> list) {
        if (list.isEmpty()) return;
        List<Long> ids = list.stream().map(CounselingInfo::getId).collect(Collectors.toList());
        List<CounselingStudent> allStudents = studentMapper.findByCounselingIds(ids);
        Map<Long, List<CounselingStudent>> grouped = allStudents.stream()
                .collect(Collectors.groupingBy(CounselingStudent::getCounselingId));
        list.forEach(info -> info.setStudents(grouped.getOrDefault(info.getId(), List.of())));
    }

    private String requireString(Map<String, Object> paramData, String key) {
        String val = (String) paramData.get(key);
        if (val == null || val.isBlank()) {
            throw new IllegalArgumentException(key + "는 필수입니다.");
        }
        return val;
    }

    private String toJsonArray(Object value) {
        if (value == null) return "[]";
        if (value instanceof List) {
            try {
                return objectMapper.writeValueAsString(value);
            } catch (JacksonException e) {
                throw new IllegalArgumentException("JSON 변환 실패: " + value, e);
            }
        }
        String str = value.toString().trim();
        if (str.startsWith("[")) return str;
        return "[\"" + str + "\"]";
    }

    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JacksonException e) {
            return Arrays.asList(json.replace("[", "").replace("]", "").replace("\"", "").split(","));
        }
    }

    private CounselingStatus parseStatus(String statusStr) {
        try {
            return CounselingStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 status입니다: " + statusStr
                    + " (허용값: scheduled, completed, cancelled)");
        }
    }

    @SuppressWarnings("unchecked")
    private List<CounselingStudent> parseStudents(Map<String, Object> paramData) {
        Object studentsObj = paramData.get("students");
        if (studentsObj == null) return List.of();

        List<Map<String, Object>> studentList = (List<Map<String, Object>>) studentsObj;
        return studentList.stream().map(s -> {
            String stdtId = s.get("id") != null ? String.valueOf(s.get("id")) : null;
            if (stdtId == null || stdtId.isBlank() || "null".equals(stdtId)) {
                throw new IllegalArgumentException("students[].id (studentId)는 필수입니다.");
            }
            String stdtName = s.get("name") != null ? String.valueOf(s.get("name")) : null;
            if (stdtName == null || stdtName.isBlank() || "null".equals(stdtName)) {
                throw new IllegalArgumentException("students[].name (studentName)은 필수입니다.");
            }
            return CounselingStudent.builder()
                    .stdtId(stdtId)
                    .stdtName(stdtName)
                    .stdtNumber(s.get("number") != null ? Integer.valueOf(s.get("number").toString()) : 0)
                    .claId(String.valueOf(s.get("classId")))
                    .build();
        }).collect(Collectors.toList());
    }

    private Map<String, Object> toResponseMap(CounselingInfo info) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", info.getId().toString());
        map.put("classId", info.getClaId());
        map.put("scheduledAt", info.getScheduledAt().format(SCHEDULED_AT_FMT));
        map.put("duration", info.getDuration());
        map.put("types", parseJsonArray(info.getTypes()));
        map.put("areas", parseJsonArray(info.getAreas()));
        map.put("methods", parseJsonArray(info.getMethods()));
        map.put("status", info.getStatus().name());
        map.put("reason", info.getReason());
        map.put("summary", info.getSummary());
        map.put("nextSteps", info.getNextSteps());
        map.put("createdAt", info.getCreatedAt().toString());
        map.put("updatedAt", info.getUpdatedAt().toString());

        List<Map<String, Object>> students = info.getStudents().stream().map(s -> {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("id", s.getStdtId());
            sm.put("name", s.getStdtName());
            sm.put("number", s.getStdtNumber());
            sm.put("classId", s.getClaId());
            return sm;
        }).collect(Collectors.toList());
        map.put("students", students);

        return map;
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Long) return (Long) value;
        if (value instanceof Number) return ((Number) value).longValue();
        try {
            return Long.valueOf(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * paramData 에서 인증된 사용자의 tcId 를 꺼낸다.
     * Controller 가 {@code authTcIdResolver.enforceAuthTcId(paramData)} 를 선행 호출한 상태여야 함.
     */
    private String requireTcId(Map<String, Object> paramData) {
        String tcId = (String) paramData.get("tcId");
        if (tcId == null || tcId.isBlank()) {
            throw new IllegalStateException("인증된 교사 ID 를 확인할 수 없습니다.");
        }
        return tcId;
    }
}
