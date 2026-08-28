package com.vs.meta.api.coaching.dto;

import java.util.List;

/**
 * 개인화 코칭 v2 응답. GET /api/dgnss/st/coaching/{answerIdx}
 * observation/interpretation 의 [학생명] placeholder 는 그대로 — FE 치환. 고등/미분류는 빈 카드.
 */
public record CoachingResponse(
        int answerIdx,
        String lpaClass,
        String schoolLevel,
        List<StrengthCard> strengthCards,   // 최대 2개
        CoachingCard coachingCard           // 없으면 null
) {
    public record StrengthCard(String factor, String observation, String line, String question) {}

    public record CoachingCard(
            String zFactor, String xFactor, String yFactor, String pathType,
            String interpretation,
            Coaching1 coaching1,
            Coaching2 coaching2
    ) {}

    public record Coaching1(String method, String line) {}

    public record Coaching2(String action, String line) {}
}
