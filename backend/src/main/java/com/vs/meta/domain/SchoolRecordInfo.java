package com.vs.meta.domain;

import com.vs.meta.domain.enums.SchoolRecordCategory;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolRecordInfo {

    private Long id;
    private String stdtId;
    private String claId;
    private String tcId;
    private SchoolRecordCategory category;
    private String content;
    // ===== 생기부 작성 고도화 =====
    private String strengths;         // 강점 TOP3 키워드 JSON 배열(리스트용 스냅샷)
    private String improvements;      // 보완 TOP3 키워드 JSON 배열
    private String status;            // 작성상태 CHAR(1): 1 INPUTTING/2 GENERATING/3 DRAFT/4 EDITED/5 FAILED
    private String observationInput;  // 관찰입력 JSON(상세용): {observations[{factor,type,behaviorCodes[]}], freeText, counselingRefs[]}
    private String generatedText;     // AI 생성 원본(편집 전)
    private String previousContent;   // 직전 저장 문구(복원용)
    private String source;            // 생성방식 CHAR(1): 1 TEST_ONLY/2 COMMON_CONTEXT/3 INDIVIDUAL_OBSERVATION
    private String useYn;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void deactivate() {
        this.useYn = "N";
        this.updatedAt = LocalDateTime.now();
    }
}
