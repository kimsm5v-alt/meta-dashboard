package com.vs.meta.admin.service;

import com.vs.meta.admin.mapper.CoachingAdminMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * 개인화 코칭 편집 서비스 — 수정 시 "수정 직전 현재값"을 이력에 스냅샷(pre-image)한 뒤 본문을 갱신한다.
 * 롤백은 대상 이력 스냅샷 값으로 되돌리며, 되돌리기 직전 값도 이력에 남긴다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CoachingAdminService {

    private final CoachingAdminMapper mapper;

    // ---------- 강점 ----------
    @Transactional
    public void updateStrength(long id, String observation, String line, String question, long adminId) {
        mapper.insertStrengthHistoryFromCurrent(id, "UPDATE", adminId);
        mapper.updateStrength(id, observation, line, question, adminId);
        log.info("코칭 강점 수정. id={}, adminId={}", id, adminId);
    }

    /** 이력 스냅샷으로 롤백. @return 되돌린 강점 id */
    @Transactional
    public long rollbackStrength(long historyId, long adminId) {
        Map<String, Object> snap = mapper.selectStrengthHistoryById(historyId);
        if (MapUtils.isEmpty(snap)) {
            throw new IllegalArgumentException("이력을 찾을 수 없습니다: historyId=" + historyId);
        }
        long strengthId = MapUtils.getLongValue(snap, "strengthId");
        mapper.insertStrengthHistoryFromCurrent(strengthId, "ROLLBACK", adminId);
        mapper.updateStrength(strengthId,
                MapUtils.getString(snap, "observation"),
                MapUtils.getString(snap, "line"),
                MapUtils.getString(snap, "question"),
                adminId);
        log.info("코칭 강점 롤백. strengthId={}, historyId={}, adminId={}", strengthId, historyId, adminId);
        return strengthId;
    }

    // ---------- 보완점 ----------
    @Transactional
    public void updateModeration(long id, String interpretation, String coaching1Method, String coaching1Line,
                                 String coaching2Action, String coaching2Line, long adminId) {
        mapper.insertModerationHistoryFromCurrent(id, "UPDATE", adminId);
        mapper.updateModeration(id, interpretation, coaching1Method, coaching1Line, coaching2Action, coaching2Line, adminId);
        log.info("코칭 보완점 수정. id={}, adminId={}", id, adminId);
    }

    /** 이력 스냅샷으로 롤백. @return 되돌린 보완점 id */
    @Transactional
    public long rollbackModeration(long historyId, long adminId) {
        Map<String, Object> snap = mapper.selectModerationHistoryById(historyId);
        if (MapUtils.isEmpty(snap)) {
            throw new IllegalArgumentException("이력을 찾을 수 없습니다: historyId=" + historyId);
        }
        long moderationRowId = MapUtils.getLongValue(snap, "moderationRowId");
        mapper.insertModerationHistoryFromCurrent(moderationRowId, "ROLLBACK", adminId);
        mapper.updateModeration(moderationRowId,
                MapUtils.getString(snap, "interpretation"),
                MapUtils.getString(snap, "coaching1Method"),
                MapUtils.getString(snap, "coaching1Line"),
                MapUtils.getString(snap, "coaching2Action"),
                MapUtils.getString(snap, "coaching2Line"),
                adminId);
        log.info("코칭 보완점 롤백. moderationRowId={}, historyId={}, adminId={}", moderationRowId, historyId, adminId);
        return moderationRowId;
    }
}
