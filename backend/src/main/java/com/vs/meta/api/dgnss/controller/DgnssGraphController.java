package com.vs.meta.api.dgnss.controller;

import com.vs.meta.api.dgnss.service.DgnssGraphService;
import com.vs.meta.api.dgnss.service.DgnssLpaService;
import com.vs.meta.common.response.AidtCommonUtil;
import com.vs.meta.common.response.CustomBody;
import com.vs.meta.common.response.ResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 학습심리검사 그래프/운영 API — Neo4j 그래프·코칭 적재, LPA 재분류.
 * FE 미호출(운영/관리용). 교사 API 는 DgnssTeacherController, 학생 API 는 DgnssStudentController.
 */
@Slf4j
@RestController
@Tag(name = "학습심리검사 그래프/운영 API", description = "Neo4j 적재 · LPA 재분류")
@RequiredArgsConstructor
@RequestMapping(produces = MediaType.APPLICATION_JSON_VALUE)
public class DgnssGraphController {

    private final DgnssGraphService dgnssGraphService;
    private final DgnssLpaService dgnssLpaService;

    @RequestMapping(value = "/api/dgnss/lpa/reprocess", method = {RequestMethod.POST})
    @Operation(summary = "(관리) LPA 유형 검사 단위 재분류",
            description = "지정한 검사(dgnssId)에서 제출 완료한 학생 전원의 LPA 유형을 이미 저장된 T점수로 다시 분류하여 tb_dgnss_lpa_result 에 upsert 합니다. "
                    + "T점수 재계산이나 제출 재처리(메일 발송 등)는 수행하지 않습니다.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            content = @Content(examples = {
                    @ExampleObject(name = "파라미터", value = """
                            {
                                "dgnssId": 1088
                            }
                            """)
            }))
    public ResponseDTO<CustomBody> reprocessLpaByDgnssId(
            @RequestBody Map<String, Object> paramData
    ) throws Exception {
        int dgnssId = MapUtils.getIntValue(paramData, "dgnssId", 0);
        if (dgnssId <= 0) {
            return AidtCommonUtil.makeResultFail(paramData, null, "필수 파라미터 누락: dgnssId");
        }
        Map<String, Object> result = dgnssLpaService.reprocessByDgnssId(dgnssId);
        String resultMessage = "(관리) LPA 유형 검사 단위 재분류";
        return AidtCommonUtil.makeResultSuccess(paramData, result, resultMessage);
    }

    @RequestMapping(value = "/api/dgnss/graph/load", method = {RequestMethod.POST})
    @Operation(summary = "(그래프) LPA 그래프 Cypher 적재",
            description = "lpa_graph_all_merge_safe.cypher(초등+중등 통합)를 Neo4j에 MERGE 적재한다. 멱등이라 반복 실행 가능. 운영 시드/갱신용")
    public ResponseDTO<CustomBody> loadLpaGraph(
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssGraphService.loadLpaGraph();
        return AidtCommonUtil.makeResultSuccess(paramData, result, "LPA 그래프 적재 완료");
    }

    @RequestMapping(value = "/api/dgnss/graph/lpa/coaching-v2", method = {RequestMethod.POST})
    @Operation(summary = "(그래프) 개인화 코칭 v2 Cypher 적재",
            description = "강점(GROUP_TSCORE strength_observation/line/question) · 보완점(ModerationPath interpretation/coaching1·2, strategy 제거) 패치(초·중)를 Neo4j에 적재한다. "
                    + "MATCH 기반 in-place 업데이트라 멱등이며, 파일별 updated_count(기대 114)를 반환한다. base 그래프가 먼저 적재돼 있어야 하며 truncate 하지 않는다.")
    public ResponseDTO<CustomBody> loadCoachingV2(
            @Parameter(hidden = true) @RequestParam Map<String, Object> paramData
    ) throws Exception {
        Map<String, Object> result = dgnssGraphService.loadCoachingV2();
        return AidtCommonUtil.makeResultSuccess(paramData, result, "개인화 코칭 v2 적재 완료");
    }
}
