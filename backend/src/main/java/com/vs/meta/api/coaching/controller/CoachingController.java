package com.vs.meta.api.coaching.controller;

import com.vs.meta.api.coaching.service.SchoolCoachingService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 개인화 코칭 v2 API — 강점 카드(top2) + 맞춤 코칭 카드(top1).
 * Neo4j 선별 → RDB 텍스트. 응답의 {@code [학생명]} placeholder는 프론트에서 실제 이름으로 치환한다.
 */
@Slf4j
@RestController
@Tag(name = "개인화 코칭 v2 API", description = "강점·보완점 개인화 코칭 (Neo4j 선별 + RDB 텍스트)")
@RequiredArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class CoachingController {

    private final SchoolCoachingService schoolCoachingService;

    @GetMapping(value = "/api/dgnss/st/coaching/{answerIdx}")
    @Operation(summary = "(학생) 개인화 코칭 v2 조회",
            description = "answerIdx 기준으로 강점 top2 요인 카드와 보완점 top1 코칭 카드를 반환한다. "
                    + "선별은 Neo4j(편차·ModerationPath), 문구는 RDB(coaching_strength/coaching_moderation). "
                    + "observation/interpretation의 [학생명] placeholder는 프론트에서 치환. 고등/미분류는 빈 카드로 응답.")
    @Parameter(name = "answerIdx", description = "답안 인덱스(tb_dgnss_answer.ANSWER_IDX)", required = true)
    public ResponseDTO<CustomBody> getCoaching(
            @PathVariable int answerIdx
    ) throws Exception {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("answerIdx", answerIdx);
        Object resultData = schoolCoachingService.getCoachingByAnswerIdx(answerIdx);
        return AidtCommonUtil.makeResultSuccess(paramData, resultData, "개인화 코칭 v2 조회");
    }
}
