package com.vs.meta.domain;

import com.vs.meta.domain.enums.CounselingStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounselingInfo {

    private Long id;
    private String claId;
    private String tcId;
    private LocalDateTime scheduledAt;
    private Integer duration;
    private String types;
    private String areas;
    private String methods;
    private CounselingStatus status;
    private String reason;
    private String summary;
    private String nextSteps;
    private String useYn;
    private Long createdBy;
    private Long updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<CounselingStudent> students = new ArrayList<>();

    public void updateCounseling(LocalDateTime scheduledAt, Integer duration,
                                  String types, String areas, String methods,
                                  CounselingStatus status, String reason,
                                  String summary, String nextSteps) {
        if (scheduledAt != null) this.scheduledAt = scheduledAt;
        if (duration != null) this.duration = duration;
        if (types != null && !types.equals("[]")) this.types = types;
        if (areas != null && !areas.equals("[]")) this.areas = areas;
        if (methods != null && !methods.equals("[]")) this.methods = methods;
        if (status != null) this.status = status;
        if (reason != null) this.reason = reason;
        if (summary != null) this.summary = summary;
        if (nextSteps != null) this.nextSteps = nextSteps;
        this.updatedAt = LocalDateTime.now();
    }

    public void complete(Integer duration, String summary, String nextSteps) {
        this.status = CounselingStatus.completed;
        this.duration = duration;
        this.summary = summary;
        if (nextSteps != null) this.nextSteps = nextSteps;
        this.updatedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = CounselingStatus.cancelled;
        this.updatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.useYn = "N";
        this.updatedAt = LocalDateTime.now();
    }
}
