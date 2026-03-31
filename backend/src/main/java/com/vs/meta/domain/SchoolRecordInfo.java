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
