package com.vs.meta.api.coaching.service;

import com.vs.meta.api.coaching.dto.CoachingResponse;
import com.vs.meta.api.coaching.mapper.CoachingMapper;
import com.vs.meta.api.dgnss.service.DgnssGraphService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 개인화 코칭 v2(B2) 조회 서비스.
 * Neo4j로 선별(강점 top2 요인 · 보완점 top1 moderation_id) → RDB에서 코칭 텍스트 조회 → 화면 DTO 조립.
 * {@code [학생명]} placeholder는 치환하지 않고 그대로 내려보낸다(프론트 치환).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SchoolCoachingService {

    private final DgnssGraphService dgnssGraphService;
    private final CoachingMapper coachingMapper;

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public CoachingResponse getCoachingByAnswerIdx(int answerIdx) {
        Map<String, Object> selection = dgnssGraphService.selectCoachingSelectionByAnswerIdx(answerIdx);
        String schoolLevel = MapUtils.getString(selection, "schoolLevel", "");
        String lpaClass = MapUtils.getString(selection, "lpaClass", "");
        List<String> strengthFactors = (List<String>) selection.getOrDefault("strengthFactors", new ArrayList<String>());
        Map<String, Object> moderation = (Map<String, Object>) selection.get("moderation");

        return new CoachingResponse(
                answerIdx,
                lpaClass,
                schoolLevel,
                buildStrengthCards(schoolLevel, lpaClass, strengthFactors),
                buildCoachingCard(moderation));
    }

    /** 강점 카드 2개: 선별 요인 순서를 유지해 RDB 텍스트를 매핑. */
    private List<CoachingResponse.StrengthCard> buildStrengthCards(String schoolLevel, String lpaClass, List<String> factors) {
        List<CoachingResponse.StrengthCard> cards = new ArrayList<>();
        if (CollectionUtils.isEmpty(factors) || StringUtils.isBlank(lpaClass)) {
            return cards;
        }
        List<Map<String, Object>> texts = coachingMapper.selectStrengthTexts(schoolLevel, lpaClass, factors);
        Map<String, Map<String, Object>> byFactor = new HashMap<>();
        for (Map<String, Object> t : texts) {
            byFactor.put(MapUtils.getString(t, "factor", ""), t);
        }
        for (String factor : factors) {
            Map<String, Object> t = byFactor.get(factor);
            if (t == null) {
                log.warn("코칭 강점 텍스트 누락. schoolLevel={}, lpaClass={}, factor={}", schoolLevel, lpaClass, factor);
                continue;
            }
            cards.add(new CoachingResponse.StrengthCard(
                    factor,
                    MapUtils.getString(t, "observation"),
                    MapUtils.getString(t, "line"),
                    MapUtils.getString(t, "question")));
        }
        return cards;
    }

    /** 코칭 카드 1개: moderation_id로 RDB 텍스트 조회. */
    private CoachingResponse.CoachingCard buildCoachingCard(Map<String, Object> moderation) {
        if (moderation == null) {
            return null;
        }
        String moderationId = MapUtils.getString(moderation, "moderationId", "");
        if (StringUtils.isBlank(moderationId)) {
            return null;
        }
        Map<String, Object> t = coachingMapper.selectModerationText(moderationId);
        if (MapUtils.isEmpty(t)) {
            log.warn("코칭 보완점 텍스트 누락. moderationId={}", moderationId);
            return null;
        }
        return new CoachingResponse.CoachingCard(
                MapUtils.getString(t, "zFactor"),
                MapUtils.getString(t, "xFactor"),
                MapUtils.getString(t, "yFactor"),
                MapUtils.getString(t, "pathType"),
                MapUtils.getString(t, "interpretation"),
                new CoachingResponse.Coaching1(MapUtils.getString(t, "coaching1Method"), MapUtils.getString(t, "coaching1Line")),
                new CoachingResponse.Coaching2(MapUtils.getString(t, "coaching2Action"), MapUtils.getString(t, "coaching2Line")));
    }
}
