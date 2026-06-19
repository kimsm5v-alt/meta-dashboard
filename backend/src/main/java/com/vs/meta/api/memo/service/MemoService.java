package com.vs.meta.api.memo.service;

import com.vs.meta.api.memo.mapper.MemoInfoMapper;
import com.vs.meta.domain.MemoInfo;
import com.vs.meta.domain.enums.MemoCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemoService {

    private final MemoInfoMapper memoMapper;

    @Transactional(readOnly = true)
    public Object getMemosByStudent(Map<String, Object> paramData) throws Exception {
        String studentId = (String) paramData.get("studentId");
        if (studentId == null || studentId.isBlank()) {
            throw new IllegalArgumentException("studentId는 필수입니다.");
        }
        String tcId = (String) paramData.get("tcId");
        if (tcId == null || tcId.isBlank()) {
            throw new IllegalStateException("인증된 교사 ID 를 확인할 수 없습니다.");
        }

        List<MemoInfo> memos = memoMapper.findByStdtIdOrderByMemoDateDesc(studentId, tcId);
        return memos.stream().map(this::toResponseMap).collect(Collectors.toList());
    }

    @Transactional
    public Object createMemo(Map<String, Object> paramData) throws Exception {
        String studentId = (String) paramData.get("studentId");
        String classId = (String) paramData.get("classId");
        String tcId = (String) paramData.get("tcId");
        String dateStr = (String) paramData.get("date");
        String categoryStr = (String) paramData.get("category");
        String content = (String) paramData.get("content");
        Object isImportantObj = paramData.get("isImportant");

        if (studentId == null || studentId.isBlank()) {
            throw new IllegalArgumentException("studentId는 필수입니다.");
        }
        if (classId == null || classId.isBlank()) {
            throw new IllegalArgumentException("classId는 필수입니다.");
        }
        if (tcId == null || tcId.isBlank()) {
            throw new IllegalArgumentException("tcId는 필수입니다.");
        }
        if (dateStr == null || dateStr.isBlank()) {
            throw new IllegalArgumentException("date는 필수입니다.");
        }
        if (categoryStr == null || categoryStr.isBlank()) {
            throw new IllegalArgumentException("category는 필수입니다.");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("content는 필수입니다.");
        }

        MemoCategory category;
        try {
            category = MemoCategory.valueOf(categoryStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 category입니다: " + categoryStr
                    + " (허용값: behavior, academic, social, emotion, other)");
        }

        LocalDate memoDate = LocalDate.parse(dateStr);
        Boolean isImportant = isImportantObj != null ? Boolean.valueOf(isImportantObj.toString()) : false;

        Long userNo = toLong(paramData.get("userNo"));
        Long actor = (userNo != null) ? userNo : 0L;

        MemoInfo memo = MemoInfo.builder()
                .stdtId(studentId)
                .claId(classId)
                .tcId(tcId)
                .memoDate(memoDate)
                .category(category)
                .content(content)
                .isImportant(isImportant)
                .createdBy(actor)
                .updatedBy(actor)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        memoMapper.insertMemo(memo);
        log.info("관찰 메모 생성: id={}, studentId={}, classId={}", memo.getId(), studentId, classId);

        return toResponseMap(memo);
    }

    @Transactional
    public Object updateMemo(Long memoId, Map<String, Object> paramData) throws Exception {
        MemoInfo memo = memoMapper.findMemoById(memoId);
        if (memo == null) {
            throw new IllegalArgumentException("메모를 찾을 수 없습니다: id=" + memoId);
        }

        String authTcId = (String) paramData.get("tcId");
        if (authTcId == null || !authTcId.equals(memo.getTcId())) {
            throw new IllegalStateException("메모 수정 권한이 없습니다. 본인이 작성한 메모만 수정할 수 있습니다.");
        }

        String dateStr = (String) paramData.get("date");
        String categoryStr = (String) paramData.get("category");
        String content = (String) paramData.get("content");
        Object isImportantObj = paramData.get("isImportant");

        LocalDate memoDate = (dateStr != null && !dateStr.isBlank()) ? LocalDate.parse(dateStr) : null;
        MemoCategory category = null;
        if (categoryStr != null && !categoryStr.isBlank()) {
            try {
                category = MemoCategory.valueOf(categoryStr);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("유효하지 않은 category입니다: " + categoryStr);
            }
        }
        Boolean isImportant = isImportantObj != null ? Boolean.valueOf(isImportantObj.toString()) : null;

        Long userNo = toLong(paramData.get("userNo"));
        memo.setUpdatedBy(userNo != null ? userNo : 0L);
        memo.updateMemo(memoDate, category, content, isImportant);
        memoMapper.updateMemo(memo);
        log.info("관찰 메모 수정: id={}", memoId);

        return toResponseMap(memo);
    }

    @Transactional
    public Object deleteMemo(Long memoId, String authTcId, Long userNo) throws Exception {
        MemoInfo memo = memoMapper.findMemoById(memoId);
        if (memo == null) {
            throw new IllegalArgumentException("메모를 찾을 수 없습니다: id=" + memoId);
        }

        if (authTcId == null || !authTcId.equals(memo.getTcId())) {
            throw new IllegalStateException("메모 삭제 권한이 없습니다. 본인이 작성한 메모만 삭제할 수 있습니다.");
        }

        memoMapper.deactivateMemoById(memoId, userNo != null ? userNo : 0L);
        log.info("관찰 메모 삭제(비활성화): id={}", memoId);

        return Map.of("deleted", true, "id", memoId);
    }

    private Map<String, Object> toResponseMap(MemoInfo memo) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", memo.getId().toString());
        map.put("studentId", memo.getStdtId());
        map.put("classId", memo.getClaId());
        map.put("date", memo.getMemoDate().toString());
        map.put("category", memo.getCategory().name());
        map.put("content", memo.getContent());
        map.put("isImportant", memo.getIsImportant());
        map.put("createdAt", memo.getCreatedAt().toString());
        map.put("updatedAt", memo.getUpdatedAt().toString());
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
