package com.vs.meta.domain;

import com.vs.meta.domain.enums.MemoCategory;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemoInfo {

    private Long id;
    private String stdtId;
    private String claId;
    private String tcId;
    private LocalDate memoDate;
    private MemoCategory category;
    private String content;
    private Boolean isImportant;
    private String useYn;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void updateMemo(LocalDate memoDate, MemoCategory category,
                           String content, Boolean isImportant) {
        if (memoDate != null) {
            this.memoDate = memoDate;
        }
        if (category != null) {
            this.category = category;
        }
        if (content != null && !content.isBlank()) {
            this.content = content;
        }
        if (isImportant != null) {
            this.isImportant = isImportant;
        }
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.useYn = "N";
        this.updatedAt = LocalDateTime.now();
    }
}
