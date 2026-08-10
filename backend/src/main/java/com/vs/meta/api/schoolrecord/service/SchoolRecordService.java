package com.vs.meta.api.schoolrecord.service;

import com.vs.meta.api.schoolrecord.mapper.SchoolRecordInfoMapper;
import com.vs.meta.domain.SchoolRecordInfo;
import com.vs.meta.domain.enums.SchoolRecordCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchoolRecordService {

    private final SchoolRecordInfoMapper schoolRecordMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public Object getSchoolRecordsByStudent(Map<String, Object> paramData) throws Exception {
        String studentId = (String) paramData.get("studentId");
        if (studentId == null || studentId.isBlank()) {
            throw new IllegalArgumentException("studentId는 필수입니다.");
        }
        String tcId = (String) paramData.get("tcId");
        if (tcId == null || tcId.isBlank()) {
            throw new IllegalStateException("인증된 교사 ID 를 확인할 수 없습니다.");
        }

        List<SchoolRecordInfo> records = schoolRecordMapper.findByStdtIdOrderByCreatedAtDesc(studentId, tcId);
        return records.stream().map(this::toResponseMap).collect(Collectors.toList());
    }

    @Transactional
    public Object createSchoolRecord(Map<String, Object> paramData) throws Exception {
        String studentId = (String) paramData.get("studentId");
        String classId = (String) paramData.get("classId");
        String tcId = (String) paramData.get("tcId");
        String categoryStr = (String) paramData.get("category");
        String content = (String) paramData.get("content");

        if (studentId == null || studentId.isBlank()) {
            throw new IllegalArgumentException("studentId는 필수입니다.");
        }
        if (classId == null || classId.isBlank()) {
            throw new IllegalArgumentException("classId는 필수입니다.");
        }
        if (tcId == null || tcId.isBlank()) {
            throw new IllegalArgumentException("tcId는 필수입니다.");
        }
        if (categoryStr == null || categoryStr.isBlank()) {
            throw new IllegalArgumentException("category는 필수입니다.");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("content는 필수입니다.");
        }

        SchoolRecordCategory category;
        try {
            category = SchoolRecordCategory.valueOf(categoryStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 category입니다: " + categoryStr
                    + " (허용값: comprehensive, learning, personality, socialSkills, selfManagement)");
        }

        Long userNo = toLong(paramData.get("userNo"));
        Long actor = (userNo != null) ? userNo : 0L;

        SchoolRecordInfo record = SchoolRecordInfo.builder()
                .stdtId(studentId)
                .claId(classId)
                .tcId(tcId)
                .category(category)
                .content(content)
                .createdBy(actor)
                .updatedBy(actor)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        schoolRecordMapper.insertSchoolRecord(record);
        log.info("생기부 생성: id={}, studentId={}, classId={}", record.getId(), studentId, classId);

        return toResponseMap(record);
    }

    /**
     * 생기부 작성 고도화 — 학생 1명 작업본 저장(UPSERT). 학생당 1건, 재저장 시 직전 문구는 previous_content 로 보존.
     * tcId/userNo 는 JWT 에서 도출된 값을 파라미터로 받는다(AuthTcIdResolver). category 는 종합의견 단일 고정.
     */
    @Transactional
    public Object saveDraft(Map<String, Object> paramData) throws Exception {
        String studentId = (String) paramData.get("studentId");
        String classId = (String) paramData.get("classId");
        String tcId = (String) paramData.get("tcId");
        if (studentId == null || studentId.isBlank()) {
            throw new IllegalArgumentException("studentId는 필수입니다.");
        }
        if (classId == null || classId.isBlank()) {
            throw new IllegalArgumentException("classId는 필수입니다.");
        }
        if (tcId == null || tcId.isBlank()) {
            throw new IllegalArgumentException("tcId는 필수입니다.");
        }

        String status = strOrDefault(paramData.get("status"), "1");   // 기본 INPUTTING(작성 중)
        String content = strOrDefault(paramData.get("content"), "");  // 임시저장 시 빈 문구 허용(content NOT NULL)
        String source = (String) paramData.get("source");
        String generatedText = (String) paramData.get("generatedText");

        Long userNo = toLong(paramData.get("userNo"));
        Long actor = (userNo != null) ? userNo : 0L;

        SchoolRecordInfo record = SchoolRecordInfo.builder()
                .stdtId(studentId)
                .claId(classId)
                .tcId(tcId)
                .category(SchoolRecordCategory.comprehensive)   // 고도화는 종합의견 단일
                .content(content)
                .strengths(toJson(paramData.get("strengths")))
                .improvements(toJson(paramData.get("improvements")))
                .status(status)
                .observationInput(toJson(paramData.get("observationInput")))
                .generatedText(generatedText)
                .source(source)
                .createdBy(actor)
                .updatedBy(actor)
                .build();

        schoolRecordMapper.upsertSchoolRecordDraft(record);
        log.info("생기부 작업본 저장(upsert): studentId={}, classId={}, status={}", studentId, classId, status);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("saved", true);
        result.put("studentId", studentId);
        result.put("status", status);
        return result;
    }

    /** 고도화 리스트 조회(학급 단위, 경량). strengths/improvements 는 JSON 배열로 파싱해 반환. */
    @Transactional(readOnly = true)
    public Object getDraftListByClass(String claId, String tcId) {
        List<Map<String, Object>> rows = schoolRecordMapper.selectDraftListByClass(claId, tcId);
        for (Map<String, Object> row : rows) {
            row.put("strengths", parseJsonOrNull(row.get("strengths")));
            row.put("improvements", parseJsonOrNull(row.get("improvements")));
        }
        return rows;
    }

    /** 고도화 상세 조회(학생 1명). 없으면 null. JSON 컬럼(strengths/improvements/observationInput)은 객체로 파싱. */
    @Transactional(readOnly = true)
    public Object getDraftByStudent(String stdtId, String tcId) {
        Map<String, Object> row = schoolRecordMapper.selectDraftByStudent(stdtId, tcId);
        if (row == null || row.isEmpty()) {
            return null;
        }
        row.put("strengths", parseJsonOrNull(row.get("strengths")));
        row.put("improvements", parseJsonOrNull(row.get("improvements")));
        row.put("observationInput", parseJsonOrNull(row.get("observationInput")));
        return row;
    }

    /** JSON 문자열을 객체(List/Map)로 파싱. null/빈문자/파싱실패 시 null. */
    private Object parseJsonOrNull(Object value) {
        if (value == null) {
            return null;
        }
        String s = value.toString();
        if (s.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(s, Object.class);
        } catch (Exception e) {
            log.warn("생기부 JSON 파싱 실패: {}", e.getMessage());
            return null;
        }
    }

    /** 값이 null/빈문자면 기본값 반환. */
    private String strOrDefault(Object value, String defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        String s = value.toString();
        return s.isBlank() ? defaultValue : s;
    }

    /** 객체를 JSON 문자열로 직렬화(JSON 컬럼 저장용). null 이면 null. */
    private String toJson(Object obj) {
        if (obj == null) {
            return null;
        }
        return objectMapper.writeValueAsString(obj);
    }

    @Transactional
    public Object deleteSchoolRecord(Long id, String authTcId, Long userNo) throws Exception {
        SchoolRecordInfo record = schoolRecordMapper.findSchoolRecordById(id);
        if (record == null) {
            throw new IllegalArgumentException("생기부를 찾을 수 없습니다: id=" + id);
        }

        if (authTcId == null || !authTcId.equals(record.getTcId())) {
            throw new IllegalStateException("생기부 삭제 권한이 없습니다. 본인이 작성한 생기부만 삭제할 수 있습니다.");
        }

        schoolRecordMapper.deactivateSchoolRecordById(id, userNo != null ? userNo : 0L);
        log.info("생기부 삭제(비활성화): id={}", id);

        return Map.of("deleted", true, "id", id);
    }

    private Map<String, Object> toResponseMap(SchoolRecordInfo record) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", record.getId().toString());
        map.put("studentId", record.getStdtId());
        map.put("classId", record.getClaId());
        map.put("category", record.getCategory().name());
        map.put("content", record.getContent());
        map.put("createdAt", record.getCreatedAt().toString());
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
}
