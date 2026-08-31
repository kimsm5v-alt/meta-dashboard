package com.vs.meta.api.dgnss.dto;

import java.util.List;

/**
 * (변화추적) 학생 회차별 학습현황 응답. GET /api/dgnss/students/{studentId}/learning-status
 * 값은 고정 코드값(예: high/interest/2-3h), 미응답 필드는 null.
 */
public record StudentLearningStatusResponse(String studentId, List<Round> rounds) {

    public record Round(
            Integer round,               // ord_no
            Integer answerIdx,
            String academicAchievement,  // very-low/low/mid/high/very-high
            String gradeSatisfaction,    // very-low/low/mid/high/very-high
            String learningMotivation,   // interest/future/college/expectations/unknown
            String selfStudyTime,        // none/under1h/1-2h/2-3h/over3h
            String learningCounselor     // friend/teacher/family/counselor/etc
    ) {}
}
