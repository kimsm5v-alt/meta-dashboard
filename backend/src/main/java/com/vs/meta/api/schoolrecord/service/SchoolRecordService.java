package com.vs.meta.api.schoolrecord.service;

import com.vs.meta.api.schoolrecord.mapper.SchoolRecordInfoMapper;
import com.vs.meta.domain.SchoolRecordInfo;
import com.vs.meta.domain.enums.SchoolRecordCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchoolRecordService {

    private final SchoolRecordInfoMapper schoolRecordMapper;

    @Transactional(readOnly = true)
    public Object getSchoolRecordsByStudent(Map<String, Object> paramData) throws Exception {
        String studentId = (String) paramData.get("studentId");
        if (studentId == null || studentId.isBlank()) {
            throw new IllegalArgumentException("studentId는 필수입니다.");
        }

        List<SchoolRecordInfo> records = schoolRecordMapper.findByStdtIdOrderByCreatedAtDesc(studentId);
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
